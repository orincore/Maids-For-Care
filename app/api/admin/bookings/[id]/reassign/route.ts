import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Booking from '@/models/Booking';
import ServiceProvider from '@/models/ServiceProvider';
import { verifyAdminToken } from '@/lib/adminAuth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

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

    const booking = await Booking.findById(params.id).populate('serviceProvider', 'name');
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const newProvider = await ServiceProvider.findById(newProviderId);
    if (!newProvider) {
      return NextResponse.json({ error: 'Service provider not found' }, { status: 404 });
    }

    const now = new Date();

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
          providerName: (booking.serviceProvider as any).name || 'Unknown',
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
    booking.status = 'assigned';

    await booking.save();

    const updated = await Booking.findById(params.id)
      .populate('serviceProvider', 'name phone email profileImage isVerified rating')
      .populate('maidsAssignmentHistory.serviceProvider', 'name phone email profileImage isVerified');

    return NextResponse.json({ message: 'Maid reassigned successfully', booking: updated });
  } catch (error) {
    console.error('Reassign maid error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
