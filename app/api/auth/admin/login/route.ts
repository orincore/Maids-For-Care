import { NextRequest, NextResponse } from 'next/server';

// Hardcoded admin credentials
const ADMIN_CREDENTIALS = {
  email: process.env.ADMIN_EMAIL || 'admin@Maids For Care.com',
  password: process.env.ADMIN_PASSWORD || 'Admin@123456',
  name: 'System Administrator',
  role: 'admin',
  id: 'admin_hardcoded_id',
};

export async function POST(request: NextRequest) {
  try {
    const { email, password, secretKey } = await request.json();

    // Verify admin secret key
    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Invalid admin access key' },
        { status: 401 }
      );
    }

    // Check email
    if (email !== ADMIN_CREDENTIALS.email) {
      return NextResponse.json(
        { error: 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    // Check password
    if (password !== ADMIN_CREDENTIALS.password) {
      return NextResponse.json(
        { error: 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    // Generate admin token with special payload
    const adminToken = JSON.stringify({
      id: ADMIN_CREDENTIALS.id,
      email: ADMIN_CREDENTIALS.email,
      role: ADMIN_CREDENTIALS.role,
      isHardcodedAdmin: true,
      timestamp: Date.now(),
    });

    // Return admin user data (without password)
    const adminUser = {
      id: ADMIN_CREDENTIALS.id,
      name: ADMIN_CREDENTIALS.name,
      email: ADMIN_CREDENTIALS.email,
      role: ADMIN_CREDENTIALS.role,
      isHardcodedAdmin: true,
    };

    return NextResponse.json({
      message: 'Admin login successful',
      user: adminUser,
      token: adminToken,
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}