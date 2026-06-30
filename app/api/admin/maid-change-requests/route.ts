import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MaidChangeRequest from '@/models/MaidChangeRequest';
import '@/models/Booking';
import '@/models/User';
import '@/models/ServiceProvider';
import { getAdminFromRequest, requirePermission } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const adminData = getAdminFromRequest(request.headers.get('authorization'));
    if (!adminData || !requirePermission(adminData, 'view_bookings')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const requests = await MaidChangeRequest.find(filter)
      .populate('bookingId', 'scheduledDate scheduledTime status')
      .populate('userId', 'name email phone')
      .populate('maidId', 'name profileImage rating')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error('Fetch change requests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
