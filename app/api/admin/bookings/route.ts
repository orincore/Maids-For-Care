import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Booking from '@/models/Booking';
import '@/models/ServiceProvider';
import { getAdminFromRequest, requirePermission } from '@/lib/adminAuth';
import { logActivity } from '@/lib/activityLogger';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const adminData = getAdminFromRequest(request.headers.get('authorization'));
    if (!adminData || !requirePermission(adminData, 'view_bookings')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const bookings = await Booking.find({})
      .populate('user', 'name email phone')
      .populate('service', 'name category')
      .populate('services', 'name category')
      .populate('serviceProvider', 'name phone profileImage isVerified')
      .sort({ createdAt: -1 });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Admin bookings fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();

    const adminData = getAdminFromRequest(request.headers.get('authorization'));
    if (!adminData || !requirePermission(adminData, 'update_booking_status')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { bookingId, status, paymentStatus } = await request.json();

    const updateData: Record<string, string> = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const booking = await Booking.findByIdAndUpdate(bookingId, updateData, { new: true })
      .populate('user', 'name email')
      .populate('service', 'name');

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    await logActivity(adminData, 'UPDATE_BOOKING_STATUS', 'booking', bookingId, { status, paymentStatus }, request);

    return NextResponse.json({ message: 'Booking updated successfully', booking });
  } catch (error) {
    console.error('Admin booking update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
