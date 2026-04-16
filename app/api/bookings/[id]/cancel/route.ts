import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Booking from '@/models/Booking';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { reason } = await request.json();

    // Find booking and verify ownership
    const booking = await Booking.findOne({
      _id: params.id,
      user: userId,
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if booking can be cancelled
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Booking cannot be cancelled' },
        { status: 400 }
      );
    }

    // Check cancellation policy (e.g., can't cancel within 2 hours of scheduled time)
    const scheduledDateTime = new Date(`${booking.scheduledDate.toISOString().split('T')[0]}T${booking.scheduledTime}`);
    const now = new Date();
    const timeDifference = scheduledDateTime.getTime() - now.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);

    if (hoursDifference < 2) {
      return NextResponse.json(
        { error: 'Booking cannot be cancelled within 2 hours of scheduled time' },
        { status: 400 }
      );
    }

    // Update booking status
    const updatedBooking = await Booking.findByIdAndUpdate(
      params.id,
      {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason,
        // If payment was made, mark for refund
        ...(booking.paymentStatus === 'paid' && { paymentStatus: 'refunded' }),
      },
      { new: true }
    ).populate('service');

    // TODO: Process refund if payment was made
    // TODO: Send notification to service provider
    // TODO: Send confirmation email to user

    return NextResponse.json({
      message: 'Booking cancelled successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Booking cancellation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}