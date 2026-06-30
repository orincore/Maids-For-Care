import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Booking from '@/models/Booking';
import MaidReport from '@/models/MaidReport';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('user-id');
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    await dbConnect();
    const { id } = await params;
    const { category, description } = await request.json();

    if (!category || !description?.trim()) return NextResponse.json({ error: 'Category and description are required' }, { status: 400 });

    const booking = await Booking.findOne({ _id: id, user: userId });
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (!booking.serviceProvider) return NextResponse.json({ error: 'No maid assigned to this booking' }, { status: 400 });

    const report = await MaidReport.create({
      bookingId: id,
      userId,
      maidId: booking.serviceProvider,
      category,
      description: description.trim(),
    });

    return NextResponse.json({ success: true, report }, { status: 201 });
  } catch (error) {
    console.error('Report maid error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
