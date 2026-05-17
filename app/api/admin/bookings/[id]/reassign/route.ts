import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Booking from '@/models/Booking';
import ServiceProvider from '@/models/ServiceProvider';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { verifyAdminToken } from '@/lib/adminAuth';
import { sendBookingReassignedEmail } from '@/lib/emailService';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const adminData = verifyAdminToken(token);
    if (!adminData || !adminData.isHardcodedAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { newProviderId, reason, comment } = await request.json();

    if (!newProviderId || !reason) {
      return NextResponse.json({ error: 'newProviderId and reason are required' }, { status: 400 });
    }

    const booking = await Booking.findById(id).populate('serviceProvider', 'name');
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const newProvider = await ServiceProvider.findById(newProviderId);
    if (!newProvider) {
      return NextResponse.json({ error: 'Service provider not found' }, { status: 404 });
    }

    const now = new Date();

    // Capture the old provider name BEFORE overwriting booking.serviceProvider
    const oldProviderName: string | undefined = booking.serviceProvider
      ? (booking.serviceProvider as any).name
      : undefined;

    // Close out the current assignment in history if there is one
    if (booking.serviceProvider) {
      const lastEntry = booking.maidsAssignmentHistory?.[booking.maidsAssignmentHistory.length - 1];
      if (lastEntry && !lastEntry.removedAt) {
        lastEntry.removedAt = now;
        lastEntry.reason = reason;
        lastEntry.comment = comment || '';
      } else {
        booking.maidsAssignmentHistory = booking.maidsAssignmentHistory || [];
        booking.maidsAssignmentHistory.push({
          serviceProvider: booking.serviceProvider,
          providerName: oldProviderName || 'Unknown',
          assignedAt: booking.assignedAt || booking.createdAt,
          removedAt: now,
          reason,
          comment: comment || '',
          assignedBy: 'admin',
        });
      }
    }

    // Add new assignment entry
    booking.maidsAssignmentHistory = booking.maidsAssignmentHistory || [];
    booking.maidsAssignmentHistory.push({
      serviceProvider: newProvider._id,
      providerName: newProvider.name,
      assignedAt: now,
      removedAt: undefined,
      reason: 'New assignment',
      comment: '',
      assignedBy: 'admin',
    });

    booking.serviceProvider = newProvider._id;
    booking.assignedAt = now;
    booking.status = 'confirmed';
    // Admin reassignments bypass payment — mark paid so the booking is never
    // stuck waiting for a payment that isn't required in this flow.
    if (booking.paymentStatus !== 'paid') {
      booking.paymentStatus = 'paid';
    }

    await booking.save();

    const updated = await Booking.findById(id)
      .populate('user', 'name email')
      .populate('service', 'name')
      .populate('services', 'name')
      .populate('serviceProvider', 'name phone email profileImage isVerified rating')
      .populate('maidsAssignmentHistory.serviceProvider', 'name phone email profileImage isVerified');

    const u = updated as any;
    const userDoc = u?.user;
    const serviceName = u?.service?.name ||
      (u?.services?.length ? u.services.map((s: any) => s.name).join(', ') : 'Service');

    // In-app notification for customer
    try {
      if (userDoc?._id) {
        await Notification.create({
          recipient: userDoc._id,
          recipientType: 'User',
          title: 'Your Maid Has Been Reassigned',
          message: `${newProvider.name} has been assigned to your ${serviceName} booking.`,
          type: 'booking_assigned',
          relatedId: booking._id,
        });
      }
    } catch (notifErr) {
      console.error('[Notification] reassign notification error:', notifErr);
    }

    // Email notification for customer (non-blocking)
    try {
      if (userDoc?.email) {
        sendBookingReassignedEmail({
          userName: userDoc.name,
          userEmail: userDoc.email,
          bookingId: id,
          serviceName,
          scheduledDate: new Date(u.scheduledDate).toLocaleDateString('en-IN'),
          scheduledTime: u.scheduledTime,
          totalAmount: u.totalAmount,
          oldProviderName,
          newProviderName: newProvider.name,
          newProviderPhone: newProvider.phone,
          reassignReason: reason,
          reassignComment: comment,
        });
      }
    } catch (emailErr) {
      console.error('[Email] booking.reassigned error:', emailErr);
    }

    return NextResponse.json({ message: 'Maid reassigned successfully', booking: updated });
  } catch (error) {
    console.error('Reassign maid error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
