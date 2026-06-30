import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Booking from '@/models/Booking';
import MaidChangeRequest from '@/models/MaidChangeRequest';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('user-id');
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    await dbConnect();
    const { id } = await params;
    const { reason } = await request.json();

    if (!reason?.trim()) return NextResponse.json({ error: 'Reason is required' }, { status: 400 });

    const booking = await Booking.findOne({ _id: id, user: userId });
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (!booking.serviceProvider) return NextResponse.json({ error: 'No maid assigned to this booking' }, { status: 400 });

    // Prevent duplicate pending requests for same booking
    const existing = await MaidChangeRequest.findOne({ bookingId: id, status: 'pending' });
    if (existing) return NextResponse.json({ error: 'A change request is already pending for this booking' }, { status: 409 });

    const changeRequest = await MaidChangeRequest.create({
      bookingId: id,
      userId,
      maidId: booking.serviceProvider,
      reason: reason.trim(),
    });

    return NextResponse.json({ success: true, changeRequest }, { status: 201 });
  } catch (error) {
    console.error('Change maid request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
