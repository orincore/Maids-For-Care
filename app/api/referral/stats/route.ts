import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Referral from '@/models/Referral';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('user-id');
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    await dbConnect();

    const referrals = await Referral.find({ referrerId: userId })
      .populate('referredUserId', 'name email')
      .populate('bookingId', 'totalAmount createdAt')
      .sort({ createdAt: -1 });

    const totalEarned = referrals.filter(r => r.status === 'paid').reduce((s, r) => s + r.commissionAmount, 0);
    const pendingAmount = referrals.filter(r => r.status === 'pending').reduce((s, r) => s + r.commissionAmount, 0);
    const totalReferrals = referrals.length;
    const paidReferrals = referrals.filter(r => r.status === 'paid').length;
    const pendingReferrals = referrals.filter(r => r.status === 'pending').length;

    return NextResponse.json({
      stats: { totalEarned, pendingAmount, totalReferrals, paidReferrals, pendingReferrals },
      referrals: referrals.map(r => ({
        _id: r._id,
        referredUser: r.referredUserId,
        bookingAmount: r.bookingAmount,
        commissionRate: r.commissionRate,
        commissionAmount: r.commissionAmount,
        status: r.status,
        paidAt: r.paidAt,
        transactionId: r.transactionId,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error('Referral stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
