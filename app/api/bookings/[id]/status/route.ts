import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Notification from '@/models/Notification';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    // This endpoint can be used by both service providers and admins
    // For now, we'll implement basic status updates
    const { status, workNotes, beforeImages, afterImages } = await request.json();

    const booking = await Booking.findById(params.id)
      .populate('user service serviceProvider');

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const updateData: any = { status };
    let notificationMessage = '';

    switch (status) {
      case 'in-progress':
        updateData.startedAt = new Date();
        if (beforeImages) updateData.beforeImages = beforeImages;
        notificationMessage = `Your ${booking.service.name} service has started.`;
        break;
      
      case 'completed':
        updateData.completedAt = new Date();
        updateData.actualCompletionTime = new Date();
        if (afterImages) updateData.afterImages = afterImages;
        if (workNotes) updateData.workNotes = workNotes;
        notificationMessage = `Your ${booking.service.name} service has been completed.`;
        break;
      
      case 'cancelled':
        updateData.cancelledAt = new Date();
        notificationMessage = `Your ${booking.service.name} service has been cancelled.`;
        break;
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    ).populate('user service serviceProvider');

    // Create notification for user
    if (notificationMessage) {
      await Notification.create({
        recipient: booking.user._id,
        recipientType: 'User',
        title: 'Booking Status Updated',
        message: notificationMessage,
        type: 'booking_status',
        relatedId: booking._id,
      });
    }

    return NextResponse.json({
      message: 'Booking status updated successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Booking status update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}