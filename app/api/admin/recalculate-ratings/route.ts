import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import ServiceProvider from '@/models/ServiceProvider';
import { getAdminFromRequest, requirePermission } from '@/lib/adminAuth';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const adminData = getAdminFromRequest(request.headers.get('authorization'));
    if (!adminData || !requirePermission(adminData, 'manage_providers')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Aggregate real ratings from reviews grouped by provider
    const ratings = await Review.aggregate([
      {
        $group: {
          _id: '$serviceProvider',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Build a map for quick lookup
    const ratingMap = new Map(ratings.map(r => [String(r._id), { avg: r.avgRating, count: r.count }]));

    // Get all providers
    const providers = await ServiceProvider.find({}, '_id');
    let updated = 0;

    for (const p of providers) {
      const real = ratingMap.get(String(p._id));
      const newRating = real ? Math.round(real.avg * 10) / 10 : 0;
      const newCount  = real ? real.count : 0;
      await ServiceProvider.findByIdAndUpdate(p._id, { rating: newRating, totalReviews: newCount });
      updated++;
    }

    return NextResponse.json({ success: true, updated, ratingsSynced: ratings.length });
  } catch (error) {
    console.error('Recalculate ratings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
