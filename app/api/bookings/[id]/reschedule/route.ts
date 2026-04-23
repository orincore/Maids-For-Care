import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Booking from '@/models/Booking';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    // Get user ID from header (set by NextAuth session)
    const userId = request.headers.get('user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { scheduledDate, scheduledTime, reason } = await request.json();

    // Find booking and verify ownership
    const booking = await Booking.findOne({
      _id: id,
      user: userId,
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if booking can be rescheduled
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Booking cannot be rescheduled' },
        { status: 400 }
      );
    }

    // Validate new date/time
    const newDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const now = new Date();

    if (newDateTime <= now) {
      return NextResponse.json(
        { error: 'New date/time must be in the future' },
        { status: 400 }
      );
    }

    // Check rescheduling policy (e.g., can't reschedule within 4 hours of scheduled time)
    const currentScheduledDateTime = new Date(`${booking.scheduledDate.toISOString().split('T')[0]}T${booking.scheduledTime}`);
    const timeDifference = currentScheduledDateTime.getTime() - now.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);

    if (hoursDifference < 4) {
      return NextResponse.json(
        { error: 'Booking cannot be rescheduled within 4 hours of scheduled time' },
        { status: 400 }
      );
    }

    // Update booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      {
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        // Reset status if it was assigned
        ...(booking.status === 'assigned' && { status: 'confirmed' }),
        // Add reschedule history
        $push: {
          rescheduleHistory: {
            oldDate: booking.scheduledDate,
            oldTime: booking.scheduledTime,
            newDate: scheduledDate,
            newTime: scheduledTime,
            reason,
            rescheduledAt: new Date(),
          }
        }
      },
      { new: true }
    ).populate('service');

    // TODO: Notify service provider about reschedule
    // TODO: Check service provider availability for new time
    // TODO: Send confirmation to user

    return NextResponse.json({
      message: 'Booking rescheduled successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Booking reschedule error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}