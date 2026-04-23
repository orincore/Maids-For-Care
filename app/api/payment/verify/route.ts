import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import Booking from '@/models/Booking';
import ServiceProvider from '@/models/ServiceProvider';
import User from '@/models/User';
import { sendPaymentConfirmedEmail } from '@/lib/emailService';

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

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = await request.json();

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Update booking payment status
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        paymentStatus: 'paid',
        paymentId: razorpay_payment_id,
        status: 'confirmed',
      },
      { new: true }
    ).populate('service').populate('services').populate('serviceProvider', 'name phone email profileImage');

    // Mark the provider as inactive — hidden from listings, allocated to this booking
    if (booking?.serviceProvider) {
      await ServiceProvider.findByIdAndUpdate(
        (booking.serviceProvider as any)._id || booking.serviceProvider,
        { isActive: false }
      );
    }

    // Fire email (non-blocking)
    try {
      const user = await User.findById((booking as any).user?._id || (booking as any).user, 'name email');
      const b = booking as any;
      const serviceName = b?.service?.name ||
        (b?.services?.length ? b.services.map((s: any) => s.name).join(', ') : 'Service');
      const provider = b?.serviceProvider;
      if (user) {
        sendPaymentConfirmedEmail({
          userName: user.name,
          userEmail: user.email,
          bookingId: bookingId,
          serviceName,
          scheduledDate: new Date(b.scheduledDate).toLocaleDateString('en-IN'),
          scheduledTime: b.scheduledTime,
          totalAmount: b.totalAmount,
          paymentId: razorpay_payment_id,
          address: b.address
            ? [b.address.street, b.address.city, b.address.state].filter(Boolean).join(', ')
            : '',
          providerName: provider?.name,
          providerPhone: provider?.phone,
          providerEmail: provider?.email,
        });
      }
    } catch (emailErr) {
      console.error('[Email] payment.confirmed error:', emailErr);
    }

    return NextResponse.json({
      message: 'Payment verified successfully',
      booking,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}