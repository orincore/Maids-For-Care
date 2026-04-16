import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Booking from '@/models/Booking';
import ServiceProvider from '@/models/ServiceProvider';
import Notification from '@/models/Notification';
import { verifyAdminToken } from '@/lib/adminAuth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    // Verify admin token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const adminData = verifyAdminToken(token);
    if (!adminData || !adminData.isHardcodedAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { serviceProviderId, autoAssign } = await request.json();

    const booking = await Booking.findById(params.id)
      .populate('service user');

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    let assignedServiceProvider;

    if (autoAssign) {
      // Auto-assign logic: find best available service provider
      assignedServiceProvider = await findBestServiceProvider(
        booking.service._id,
        booking.scheduledDate,
        booking.scheduledTime,
        booking.address
      );

      if (!assignedServiceProvider) {
        return NextResponse.json(
          { error: 'No available service provider found' },
          { status: 404 }
        );
      }
    } else {
      // Manual assignment
      assignedServiceProvider = await ServiceProvider.findById(serviceProviderId);
      
      if (!assignedServiceProvider) {
        return NextResponse.json(
          { error: 'Service provider not found' },
          { status: 404 }
        );
      }

      // Check if service provider offers this service
      if (!assignedServiceProvider.services.includes(booking.service._id)) {
        return NextResponse.json(
          { error: 'Service provider does not offer this service' },
          { status: 400 }
        );
      }
    }

    // Update booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      params.id,
      {
        serviceProvider: assignedServiceProvider._id,
        status: 'assigned',
        assignedAt: new Date(),
      },
      { new: true }
    ).populate('service user serviceProvider');

    // Create notification for user
    await Notification.create({
      recipient: booking.user._id,
      recipientType: 'User',
      title: 'Service Provider Assigned',
      message: `${assignedServiceProvider.name} has been assigned to your ${booking.service.name} booking.`,
      type: 'booking_assigned',
      relatedId: booking._id,
    });

    return NextResponse.json({
      message: 'Service provider assigned successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Service provider assignment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function findBestServiceProvider(
  serviceId: string,
  scheduledDate: Date,
  scheduledTime: string,
  address: any
) {
  // Find service providers who offer this service and are active
  const serviceProviders = await ServiceProvider.find({
    services: serviceId,
    isActive: true,
    isVerified: true,
  });

  if (serviceProviders.length === 0) {
    return null;
  }

  // For now, simple logic: return the one with highest rating
  // In a real app, you'd consider location, availability, etc.
  const sortedProviders = serviceProviders.sort((a, b) => {
    // Primary sort: rating (descending)
    if (b.rating !== a.rating) {
      return b.rating - a.rating;
    }
    // Secondary sort: total reviews (descending)
    return b.totalReviews - a.totalReviews;
  });

  return sortedProviders[0];
}