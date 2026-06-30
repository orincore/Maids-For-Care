import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import { getAdminFromRequest, requirePermission } from '@/lib/adminAuth';
import { logActivity } from '@/lib/activityLogger';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const adminData = getAdminFromRequest(request.headers.get('authorization'));
    if (!adminData || !requirePermission(adminData, 'view_reviews')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { adminResponse } = await request.json();

    const review = await Review.findByIdAndUpdate(
      id,
      {
        adminResponse: {
          message: adminResponse,
          respondedAt: new Date(),
          respondedBy: adminData.id,
        },
      },
      { new: true }
    ).populate('user', 'name profileImage')
     .populate('serviceProvider', 'name')
     .populate('service', 'name category');

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    await logActivity(adminData, 'RESPOND_TO_REVIEW', 'review', id, { adminResponse }, request);

    return NextResponse.json({ message: 'Admin response added successfully', review });
  } catch (error) {
    console.error('Review update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const adminData = getAdminFromRequest(request.headers.get('authorization'));
    if (!adminData || !requirePermission(adminData, 'delete_reviews')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const review = await Review.findByIdAndDelete(id);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    await logActivity(adminData, 'DELETE_REVIEW', 'review', id, {}, request);

    return NextResponse.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Review deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
