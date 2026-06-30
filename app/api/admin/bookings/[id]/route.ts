import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Booking from '@/models/Booking';
import { getAdminFromRequest, requirePermission } from '@/lib/adminAuth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    const adminData = getAdminFromRequest(request.headers.get('authorization'));
    if (!adminData || !requirePermission(adminData, 'view_bookings')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const booking = await Booking.findById(id)
      .populate('user', 'name email phone')
      .populate('service', 'name category price')
      .populate('services', 'name category price')
      .populate('serviceProvider', 'name phone email profileImage isVerified rating experience')
      .populate('maidsAssignmentHistory.serviceProvider', 'name phone email profileImage isVerified');

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error('Admin booking fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}