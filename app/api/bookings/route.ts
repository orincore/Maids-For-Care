import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Booking from '@/models/Booking';
import User from '@/models/User';
import '@/models/ServiceProvider'; // Ensure model registered for populate
import { sendBookingCreatedEmail } from '@/lib/emailService';

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

    // Fire email event (non-blocking)
    try {
      const user = await User.findById(userId, 'name email');
      const svc = (populatedBooking as any);
      const serviceName = svc?.service?.name ||
        (svc?.services?.length ? svc.services.map((s: any) => s.name).join(', ') : 'Service');
      if (user) {
        sendBookingCreatedEmail({
          userName: user.name,
          userEmail: user.email,
          bookingId: booking._id.toString(),
          serviceName,
          scheduledDate: new Date(scheduledDate).toLocaleDateString('en-IN'),
          scheduledTime,
          totalAmount,
          address: address
            ? [address.street, address.city, address.state].filter(Boolean).join(', ')
            : '',
          specialInstructions,
        });
      }
    } catch (emailErr) {
      console.error('[Email] booking.created error:', emailErr);
    }

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