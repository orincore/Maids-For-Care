import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import Booking from '@/models/Booking';
import ServiceProvider from '@/models/ServiceProvider';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const serviceProviderId = searchParams.get('serviceProvider');
    const serviceId = searchParams.get('service');
    const userId = searchParams.get('user');
    
    let query: any = {};
    if (serviceProviderId) query.serviceProvider = serviceProviderId;
    if (serviceId) query.service = serviceId;
    if (userId) query.user = userId;

    const reviews = await Review.find(query)
      .populate('user', 'name profileImage')
      .populate('serviceProvider', 'name profileImage')
      .populate('service', 'name category')
      .populate('booking', 'scheduledDate')
      .sort({ createdAt: -1 });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Reviews fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get user ID from header (set by NextAuth session)
    const userId = request.headers.get('user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { bookingId, rating, comment, aspects } = await request.json();

    // Verify booking exists and belongs to user
    const booking = await Booking.findOne({
      _id: bookingId,
      user: userId,
      status: 'completed',
    }).populate('serviceProvider service');

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found or not completed' },
        { status: 404 }
      );
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return NextResponse.json(
        { error: 'Review already submitted for this booking' },
        { status: 400 }
      );
    }

    // Create review
    const review = await Review.create({
      booking: bookingId,
      user: userId,
      serviceProvider: (booking.serviceProvider as any)?._id ?? booking.serviceProvider,
      service: (booking.service as any)?._id ?? booking.service,
      rating,
      comment,
      aspects,
    });

    // Update booking to mark review as submitted
    await Booking.findByIdAndUpdate(bookingId, {
      isReviewSubmitted: true,
    });

    // Update service provider rating
    await updateServiceProviderRating((booking.serviceProvider as any)?._id ?? booking.serviceProvider);

    const populatedReview = await Review.findById(review._id)
      .populate('user', 'name profileImage')
      .populate('serviceProvider', 'name')
      .populate('service', 'name category');

    return NextResponse.json(
      { message: 'Review submitted successfully', review: populatedReview },
      { status: 201 }
    );
  } catch (error) {
    console.error('Review creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function updateServiceProviderRating(serviceProviderId: string) {
  const reviews = await Review.find({ serviceProvider: serviceProviderId });
  
  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    await ServiceProvider.findByIdAndUpdate(serviceProviderId, {
      rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      totalReviews: reviews.length,
    });
  }
}