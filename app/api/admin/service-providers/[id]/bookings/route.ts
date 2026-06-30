import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Booking from '@/models/Booking';
import '@/models/User';
import '@/models/Service';
import { getAdminFromRequest, requirePermission } from '@/lib/adminAuth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const adminData = getAdminFromRequest(request.headers.get('authorization'));
    if (!adminData || !requirePermission(adminData, 'view_bookings')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = 15;
    const skip = (page - 1) * limit;

    const filter = { serviceProvider: id };

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('user', 'name email phone')
        .populate('service', 'name category')
        .populate('services', 'name category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Booking.countDocuments(filter),
    ]);

    const totalRevenue = await Booking.aggregate([
      { $match: { serviceProvider: filter.serviceProvider, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    return NextResponse.json({
      success: true,
      bookings,
      total,
      totalPages: Math.ceil(total / limit),
      page,
      totalRevenue: totalRevenue[0]?.total || 0,
    });
  } catch (error) {
    console.error('Error fetching provider bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}
