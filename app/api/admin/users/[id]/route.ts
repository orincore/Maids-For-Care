import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Booking from '@/models/Booking';
import '@/models/ServiceProvider';
import '@/models/Service';
import { getAdminFromRequest, requirePermission } from '@/lib/adminAuth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const adminData = getAdminFromRequest(request.headers.get('authorization'));
    if (!adminData || !requirePermission(adminData, 'view_users')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const user = await User.findById(id, '-password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const bookings = await Booking.find({ user: id })
      .populate('service', 'name category')
      .populate('services', 'name category')
      .populate('serviceProvider', 'name phone email profileImage isVerified rating')
      .populate('maidsAssignmentHistory.serviceProvider', 'name phone email profileImage isVerified')
      .sort({ createdAt: -1 });

    return NextResponse.json({ user, bookings });
  } catch (error) {
    console.error('Admin user detail fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
