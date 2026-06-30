import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('user-id');
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    await dbConnect();
    let user = await User.findById(userId, 'name email referralCode');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (!user.referralCode) {
      let code: string;
      let exists = true;
      // Generate a unique 8-char code
      while (exists) {
        code = crypto.randomBytes(4).toString('hex').toUpperCase();
        exists = !!(await User.findOne({ referralCode: code }));
      }
      user = await User.findByIdAndUpdate(userId, { referralCode: code! }, { new: true }).select('name email referralCode');
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'https://maidsforcare.com';
    return NextResponse.json({
      referralCode: user!.referralCode,
      referralLink: `${baseUrl}/services?ref=${user!.referralCode}`,
    });
  } catch (error) {
    console.error('Get referral code error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
