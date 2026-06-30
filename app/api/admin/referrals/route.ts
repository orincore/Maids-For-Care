import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Referral from '@/models/Referral';
import { getAdminFromRequest, requirePermission } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request.headers.get('authorization'));
    if (!admin || !requirePermission(admin, 'manage_referrals')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = 20;

    const filter: Record<string, unknown> = {};
    if (status && status !== 'all') filter.status = status;

    let referrals = await Referral.find(filter)
      .populate('referrerId', 'name email referralCode')
      .populate('referredUserId', 'name email')
      .populate('bookingId', 'totalAmount createdAt service')
      .sort({ createdAt: -1 });

    if (search) {
      const q = search.toLowerCase();
      referrals = referrals.filter(r => {
        const ref = r.referrerId as any;
        const referred = r.referredUserId as any;
        return (
          ref?.name?.toLowerCase().includes(q) ||
          ref?.email?.toLowerCase().includes(q) ||
          referred?.name?.toLowerCase().includes(q) ||
          referred?.email?.toLowerCase().includes(q) ||
          r.referralCode?.toLowerCase().includes(q)
        );
      });
    }

    const total = referrals.length;
    const paged = referrals.slice((page - 1) * limit, page * limit);

    const summary = {
      totalPending: referrals.filter(r => r.status === 'pending').reduce((s, r) => s + r.commissionAmount, 0),
      totalPaid: referrals.filter(r => r.status === 'paid').reduce((s, r) => s + r.commissionAmount, 0),
      countPending: referrals.filter(r => r.status === 'pending').length,
      countPaid: referrals.filter(r => r.status === 'paid').length,
      countTotal: total,
    };

    return NextResponse.json({ referrals: paged, total, pages: Math.ceil(total / limit), page, summary });
  } catch (error) {
    console.error('Admin referrals fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
