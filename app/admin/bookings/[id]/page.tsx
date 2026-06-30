'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  IndianRupee,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  RefreshCw,
  History,
  Star,
} from 'lucide-react';

interface BookingDetail {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  service?: {
    name: string;
    category: string;
    price: number;
  };
  services?: { _id: string; name: string; category: string; price: number }[];
  serviceProvider?: {
    _id: string;
    name: string;
    phone: string;
    email: string;
    profileImage?: string;
    isVerified: boolean;
    rating: number;
    totalReviews: number;
    experience: number;
  };
  scheduledDate: string;
  scheduledTime: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
  };
  specialInstructions?: string;
  createdAt: string;
  maidsAssignmentHistory?: Array<{
    serviceProvider?: { _id: string; name: string; phone: string; email: string };
    providerName: string;
    assignedAt: string;
    removedAt?: string;
    reason?: string;
    comment?: string;
    assignedBy?: string;
  }>;
}

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem('adminToken') || localStorage.getItem('token');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const token = getToken();
    if (!token) {
      router.replace('/auth/admin');
      return;
    }
    
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const token = getToken();
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        router.replace('/admin');
        return;
      }
      const data = await res.json();
      setBooking(data.booking);
    } catch (e) {
      console.error('Error fetching booking:', e);
      router.replace('/admin');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      confirmed: 'bg-emerald-100 text-emerald-800',
      pending: 'bg-amber-100 text-amber-800',
      assigned: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-purple-100 text-purple-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  const paymentColor = (s: string) =>
    s === 'paid' ? 'bg-emerald-100 text-emerald-800' :
    s === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <button onClick={() => router.push('/admin')} className="text-gray-500 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Booking Details</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Customer Info */}
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Name</p>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <p className="font-semibold text-gray-900">{booking.user.name}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email</p>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <p className="text-gray-900">{booking.user.email}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Phone</p>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <p className="text-gray-900">{booking.user.phone || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Info */}
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Service</p>
              <p className="font-semibold text-gray-900">
                {booking.services && booking.services.length > 1 
                  ? booking.services.map(s => s.name).join(', ')
                  : booking.service?.name || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Scheduled</p>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <p className="text-gray-900">{new Date(booking.scheduledDate).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <p className="text-gray-900">{booking.scheduledTime}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Amount</p>
              <div className="flex items-center gap-1">
                <IndianRupee className="w-4 h-4 text-gray-400" />
                <p className="font-semibold text-gray-900">₹{booking.totalAmount}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</p>
              <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg capitalize ${statusColor(booking.status)}`}>
                {booking.status}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Payment</p>
              <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg capitalize ${paymentColor(booking.paymentStatus)}`}>
                {booking.paymentStatus}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Booked On</p>
              <p className="text-gray-900">{new Date(booking.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Service Provider */}
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Provider</h2>
          {booking.serviceProvider ? (
            <div>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {booking.serviceProvider.profileImage ? (
                    <img 
                      src={booking.serviceProvider.profileImage} 
                      alt={booking.serviceProvider.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-gray-900">{booking.serviceProvider.name}</h3>
                    {booking.serviceProvider.isVerified && (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {booking.serviceProvider.totalReviews > 0 ? (
                      <>
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="font-medium">{booking.serviceProvider.rating.toFixed(1)}</span>
                        <span className="text-gray-500">({booking.serviceProvider.totalReviews} reviews · {booking.serviceProvider.experience} yrs exp)</span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-400 italic">{booking.serviceProvider.experience} yrs exp · No reviews yet</span>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {booking.serviceProvider.phone}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {booking.serviceProvider.email}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-700">
              <AlertCircle className="w-5 h-5" />
              <p className="font-medium">Not Assigned</p>
            </div>
          )}
        </div>

        {/* Assignment History */}
        {booking.maidsAssignmentHistory && booking.maidsAssignmentHistory.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignment History</h2>
            <div className="space-y-3">
              {booking.maidsAssignmentHistory.map((entry, idx) => (
                <div key={idx} className="border-l-2 border-gray-200 pl-4 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${entry.removedAt ? 'bg-gray-400' : 'bg-emerald-500'}`} />
                    <span className="font-semibold text-gray-900">
                      {entry.serviceProvider?.name || entry.providerName}
                    </span>
                    {!entry.removedAt && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <p>Assigned: {new Date(entry.assignedAt).toLocaleString()}</p>
                    {entry.removedAt && <p>Removed: {new Date(entry.removedAt).toLocaleString()}</p>}
                    {entry.reason && entry.reason !== 'New assignment' && (
                      <p>Reason: {entry.reason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Special Instructions */}
        {booking.specialInstructions && (
          <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Special Instructions</h2>
            <p className="text-gray-700">{booking.specialInstructions}</p>
          </div>
        )}

        {/* Address */}
        {booking.address && (booking.address.street || booking.address.city) && (
          <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Address</h2>
            <div className="text-gray-700">
              {booking.address.street && <p>{booking.address.street}</p>}
              {(booking.address.city || booking.address.state) && (
                <p>{[booking.address.city, booking.address.state].filter(Boolean).join(', ')}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}