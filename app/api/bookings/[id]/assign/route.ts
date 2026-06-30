import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Booking from '@/models/Booking';
import ServiceProvider from '@/models/ServiceProvider';
import Notification from '@/models/Notification';
import { getAdminFromRequest, requirePermission } from '@/lib/adminAuth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const adminData = getAdminFromRequest(request.headers.get('authorization'));
    if (!adminData || !requirePermission(adminData, 'assign_provider')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { serviceProviderId, autoAssign } = await request.json();

    const booking = await Booking.findById(id).populate('service user');
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    let assignedServiceProvider;

    if (autoAssign) {
      assignedServiceProvider = await findBestServiceProvider(
        (booking.service as any)._id,
        booking.scheduledDate,
        booking.scheduledTime,
        booking.address
      );
      if (!assignedServiceProvider) {
        return NextResponse.json({ error: 'No available service provider found' }, { status: 404 });
      }
    } else {
      assignedServiceProvider = await ServiceProvider.findById(serviceProviderId);
      if (!assignedServiceProvider) {
        return NextResponse.json({ error: 'Service provider not found' }, { status: 404 });
      }
      if (!assignedServiceProvider.services.includes((booking.service as any)._id)) {
        return NextResponse.json({ error: 'Service provider does not offer this service' }, { status: 400 });
      }
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      { serviceProvider: assignedServiceProvider._id, status: 'assigned', assignedAt: new Date() },
      { new: true }
    ).populate('service user serviceProvider');

    await Notification.create({
      recipient: booking.user._id,
      recipientType: 'User',
      title: 'Service Provider Assigned',
      message: `${assignedServiceProvider.name} has been assigned to your ${(booking.service as any).name} booking.`,
      type: 'booking_assigned',
      relatedId: booking._id,
    });

    return NextResponse.json({ message: 'Service provider assigned successfully', booking: updatedBooking });
  } catch (error) {
    console.error('Service provider assignment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function findBestServiceProvider(
  serviceId: string,
  scheduledDate: Date,
  scheduledTime: string,
  address: unknown
) {
  const serviceProviders = await ServiceProvider.find({ services: serviceId, isActive: true, isVerified: true });
  if (serviceProviders.length === 0) return null;
  return serviceProviders.sort((a, b) => b.rating !== a.rating ? b.rating - a.rating : b.totalReviews - a.totalReviews)[0];
}
