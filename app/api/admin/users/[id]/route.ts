import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Booking from '@/models/Booking';
import '@/models/ServiceProvider';
import '@/models/Service';
import { verifyAdminToken } from '@/lib/adminAuth';

export async function GET(
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
