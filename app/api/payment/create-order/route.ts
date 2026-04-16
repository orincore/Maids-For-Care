import { NextRequest, NextResponse } from 'next/server';
import razorpay from '@/lib/razorpay';
import dbConnect from '@/lib/mongodb';
import Booking from '@/models/Booking';

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

    const { bookingId } = await request.json();

    // Find booking
    const booking = await Booking.findById(bookingId);
    if (!booking || booking.user.toString() !== userId) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: booking.totalAmount * 100, // Amount in paise
      currency: 'INR',
      receipt: `booking_${bookingId}`,
    });

    // Update booking with order ID
    await Booking.findByIdAndUpdate(bookingId, {
      orderId: order.id,
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Payment order creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}