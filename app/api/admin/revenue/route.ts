import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Booking from '@/models/Booking';
import '@/models/Service';
import { getAdminFromRequest, requirePermission } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request.headers.get('authorization'));
    if (!admin || !requirePermission(admin, 'view_revenue')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOf12MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // All paid bookings
    const paidBookings = await Booking.find({ paymentStatus: 'paid' })
      .populate('service', 'name category')
      .populate('services', 'name category')
      .select('totalAmount createdAt service services status paymentStatus')
      .sort({ createdAt: -1 });

    // Summary stats
    const totalRevenue = paidBookings.reduce((s, b) => s + b.totalAmount, 0);
    const todayRevenue = paidBookings.filter(b => new Date(b.createdAt) >= startOfToday).reduce((s, b) => s + b.totalAmount, 0);
    const weekRevenue = paidBookings.filter(b => new Date(b.createdAt) >= startOfWeek).reduce((s, b) => s + b.totalAmount, 0);
    const monthRevenue = paidBookings.filter(b => new Date(b.createdAt) >= startOfMonth).reduce((s, b) => s + b.totalAmount, 0);

    // Payment status breakdown (all bookings)
    const allBookings = await Booking.find({}).select('paymentStatus totalAmount');
    const paymentBreakdown = {
      paid: { count: 0, amount: 0 },
      pending: { count: 0, amount: 0 },
      failed: { count: 0, amount: 0 },
      refunded: { count: 0, amount: 0 },
    };
    for (const b of allBookings) {
      const key = b.paymentStatus as keyof typeof paymentBreakdown;
      if (paymentBreakdown[key]) {
        paymentBreakdown[key].count++;
        paymentBreakdown[key].amount += b.totalAmount;
      }
    }

    // Monthly revenue — last 12 months
    const monthlyMap: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = 0;
    }
    for (const b of paidBookings) {
      const d = new Date(b.createdAt);
      if (d >= startOf12MonthsAgo) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyMap[key] !== undefined) monthlyMap[key] += b.totalAmount;
      }
    }
    const monthlyRevenue = Object.entries(monthlyMap).map(([month, amount]) => ({
      month,
      label: new Date(month + '-01').toLocaleString('default', { month: 'short', year: '2-digit' }),
      amount,
    }));

    // Revenue by category
    const categoryMap: Record<string, { amount: number; count: number }> = {};
    for (const b of paidBookings) {
      const services: Array<{ name: string; category: string }> = [];
      if (b.service && (b.service as any).category) services.push(b.service as any);
      if (b.services?.length) services.push(...(b.services as any[]));
      const cats = services.length > 0 ? [...new Set(services.map((s: any) => s.category || 'Uncategorised'))] : ['Uncategorised'];
      for (const cat of cats) {
        if (!categoryMap[cat]) categoryMap[cat] = { amount: 0, count: 0 };
        categoryMap[cat].amount += b.totalAmount / cats.length;
        categoryMap[cat].count++;
      }
    }
    const revenueByCategory = Object.entries(categoryMap)
      .map(([category, { amount, count }]) => ({ category, amount: Math.round(amount), count }))
      .sort((a, b) => b.amount - a.amount);

    // Recent 10 paid transactions
    const recentTransactions = paidBookings.slice(0, 10).map((b: any) => ({
      _id: b._id,
      amount: b.totalAmount,
      serviceName: b.service?.name || b.services?.[0]?.name || '—',
      status: b.status,
      createdAt: b.createdAt,
    }));

    return NextResponse.json({
      summary: { totalRevenue, todayRevenue, weekRevenue, monthRevenue, totalPaidBookings: paidBookings.length },
      paymentBreakdown,
      monthlyRevenue,
      revenueByCategory,
      recentTransactions,
    });
  } catch (error) {
    console.error('Revenue fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
