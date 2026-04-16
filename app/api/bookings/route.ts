import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Booking from '@/models/Booking';
import '@/models/ServiceProvider'; // Ensure model registered for populate

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

    const {
      service,
      services,
      serviceProvider,
      scheduledDate,
      scheduledTime,
      duration,
      totalAmount,
      address,
      specialInstructions,
    } = await request.json();

    const booking = await Booking.create({
      user: userId,
      service,
      ...(services && services.length > 0 ? { services } : {}),
      ...(serviceProvider ? { serviceProvider } : {}),
      scheduledDate,
      scheduledTime,
      ...(duration !== undefined ? { duration } : {}),
      totalAmount,
      address,
      specialInstructions,
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('service')
      .populate('services')
      .populate('user', '-password');

    return NextResponse.json(
      { message: 'Booking created successfully', booking: populatedBooking },
      { status: 201 }
    );
  } catch (error) {
    console.error('Booking creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

    const bookings = await Booking.find({ user: userId })
      .populate('service')
      .populate('services')
      .populate('serviceProvider', 'name profileImage rating')
      .sort({ createdAt: -1 });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Bookings fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}