import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MaidReport from '@/models/MaidReport';
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

    const reports = await MaidReport.find(filter)
      .populate('bookingId', 'scheduledDate scheduledTime status')
      .populate('userId', 'name email phone')
      .populate('maidId', 'name profileImage rating')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, reports });
  } catch (error) {
    console.error('Fetch maid reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
