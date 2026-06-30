import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { generateAdminToken } from '@/lib/adminAuth';
import { logActivity } from '@/lib/activityLogger';

const HARDCODED = {
  email: (process.env.ADMIN_EMAIL || 'admin@maidease.com').toLowerCase(),
  password: process.env.ADMIN_PASSWORD || 'Admin@123456',
  secretKey: process.env.ADMIN_SECRET_KEY || '',
};

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ── Hardcoded super admin path ──────────────────────────────────────────
    if (normalizedEmail === HARDCODED.email) {
      if (password !== HARDCODED.password) {
        return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
      }

      const payload = {
        id: 'super_admin_hardcoded',
        email: HARDCODED.email,
        name: 'System Administrator',
        role: 'super_admin' as const,
        isHardcoded: true,
      };
      const token = generateAdminToken(payload);

      await logActivity(payload, 'ADMIN_LOGIN', 'auth', null, { method: 'hardcoded' }, request);

      return NextResponse.json({
        message: 'Admin login successful',
        token,
        user: { id: payload.id, name: payload.name, email: payload.email, role: payload.role },
      });
    }

    // ── DB admin path ────────────────────────────────────────────────────────
    await dbConnect();
    const admin = await Admin.findOne({ email: normalizedEmail, isActive: true });
    if (!admin) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    const passwordOk = await bcrypt.compare(password, admin.password);
    if (!passwordOk) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    const payload = {
      id: String(admin._id),
      email: admin.email,
      name: admin.name,
      role: admin.role as 'super_admin' | 'admin' | 'support_agent',
    };
    const token = generateAdminToken(payload);

    await logActivity(payload, 'ADMIN_LOGIN', 'auth', String(admin._id), { method: 'db' }, request);

    return NextResponse.json({
      message: 'Admin login successful',
      token,
      user: { id: payload.id, name: payload.name, email: payload.email, role: payload.role },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
