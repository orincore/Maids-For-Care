import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Referral from '@/models/Referral';
import User from '@/models/User';
import { getAdminFromRequest, requirePermission } from '@/lib/adminAuth';
import { logActivity } from '@/lib/activityLogger';
import { sendReferralPayoutEmail } from '@/lib/emailService';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = getAdminFromRequest(request.headers.get('authorization'));
    if (!admin || !requirePermission(admin, 'manage_referrals')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;
    const { transactionId, status } = await request.json();

    if (status === 'paid' && !transactionId?.trim()) {
      return NextResponse.json({ error: 'Transaction ID is required to mark as paid' }, { status: 400 });
    }

    const referral = await Referral.findById(id)
      .populate('referrerId', 'name email')
      .populate('referredUserId', 'name email')
      .populate('bookingId', 'totalAmount service')
      .populate({ path: 'bookingId', populate: { path: 'service', select: 'name' } });

    if (!referral) return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
    if (referral.status === 'paid') return NextResponse.json({ error: 'Already marked as paid' }, { status: 400 });

    const update: Record<string, unknown> = { status };
    if (status === 'paid') {
      update.paidAt = new Date();
      update.transactionId = transactionId.trim();
      update.paidBy = admin.id;
    }

    await Referral.findByIdAndUpdate(id, update);

    // Send email to referrer (non-blocking)
    if (status === 'paid') {
      try {
        const referrer = referral.referrerId as any;
        const referred = referral.referredUserId as any;
        const booking = referral.bookingId as any;
        sendReferralPayoutEmail({
          referrerName: referrer.name,
          referrerEmail: referrer.email,
          commissionAmount: referral.commissionAmount,
          transactionId: transactionId.trim(),
          referredUserName: referred.name,
          serviceName: booking?.service?.name || 'Service',
          bookingAmount: referral.bookingAmount,
          commissionRate: referral.commissionRate,
        });
      } catch (emailErr) {
        console.error('[Email] referral payout error:', emailErr);
      }
    }

    await logActivity(admin, 'MARK_REFERRAL_PAID', 'referral', id, { transactionId, commissionAmount: referral.commissionAmount }, request);

    return NextResponse.json({ message: 'Referral updated successfully' });
  } catch (error) {
    console.error('Mark referral paid error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
