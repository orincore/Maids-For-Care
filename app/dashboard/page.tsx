'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Calendar, Clock, MapPin, CreditCard, MessageSquare } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ReviewForm } from '@/components/ReviewForm';
import { UserAvatar } from '@/components/ui/UserAvatar';

interface Booking {
  _id: string;
  service: {
    name: string;
    category: string;
  };
  services?: Array<{ name: string; category: string }>;
  serviceProvider?: {
    name: string;
    rating: number;
    profileImage?: string;
  };
  scheduledDate: string;
  scheduledTime: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  createdAt: string;
  isReviewSubmitted: boolean;
}

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleData, setRescheduleData] = useState({
    scheduledDate: '',
    scheduledTime: '',
    reason: '',
  });
  const [actionLoading, setActionLoading] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }

    fetchBookings();
  }, [session, status, router]);

  const fetchBookings = async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch('/api/bookings', {
        headers: {
          'Content-Type': 'application/json',
          'user-id': session.user.id,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleReviewSubmit = async (reviewData: any) => {
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': session!.user.id,
        },
        body: JSON.stringify(reviewData),
      });

      if (response.ok) {
        await fetchBookings(); // Refresh bookings
        setShowReviewModal(false);
        setSelectedBooking(null);
        alert('Review submitted successfully');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Error submitting review');
    }
  };

  const canReview = (booking: Booking) => {
    return booking.status === 'completed' && !booking.isReviewSubmitted;
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking || !cancelReason.trim() || !session?.user?.id) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/bookings/${selectedBooking._id}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'user-id': session.user.id,
        },
        body: JSON.stringify({ reason: cancelReason }),
      });

      if (response.ok) {
        await fetchBookings(); // Refresh bookings
        setShowCancelModal(false);
        setSelectedBooking(null);
        setCancelReason('');
        alert('Booking cancelled successfully');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Error cancelling booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRescheduleBooking = async () => {
    if (!selectedBooking || !rescheduleData.scheduledDate || !rescheduleData.scheduledTime || !session?.user?.id) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/bookings/${selectedBooking._id}/reschedule`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'user-id': session.user.id,
        },
        body: JSON.stringify(rescheduleData),
      });

      if (response.ok) {
        await fetchBookings(); // Refresh bookings
        setShowRescheduleModal(false);
        setSelectedBooking(null);
        setRescheduleData({ scheduledDate: '', scheduledTime: '', reason: '' });
        alert('Booking rescheduled successfully');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to reschedule booking');
      }
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      alert('Error rescheduling booking');
    } finally {
      setActionLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {session.user?.name}</p>
        </div>
        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/services')}
              className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Book New Service
            </button>
          </div>
        </div>

        {/* Bookings */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Bookings</h2>
          
          {bookings.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600 mb-4">You haven't made any bookings yet.</p>
              <button
                onClick={() => router.push('/services')}
                className="bg-gray-900 text-white px-6 py-2 rounded-md hover:bg-gray-800"
              >
                Book Your First Service
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking._id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      {booking.services && booking.services.length > 1 ? (
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {booking.services.length} Services
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {booking.services.map((s) => s.name).join(', ')}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {booking.service?.name}
                          </h3>
                          <p className="text-gray-600 capitalize">{booking.service?.category}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.paymentStatus)}`}>
                        {booking.paymentStatus}
                      </span>
                    </div>
                  </div>
                  
                  {/* Maid assigned */}
                  {booking.serviceProvider && (
                    <div className="mb-3 flex items-center gap-2">
                      <UserAvatar
                        src={booking.serviceProvider.profileImage}
                        name={booking.serviceProvider.name}
                        size="sm"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {booking.serviceProvider.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Maid Assigned
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(booking.scheduledDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {booking.scheduledTime}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {booking.address.city}, {booking.address.state}
                    </div>
                    <div className="flex items-center">
                      <CreditCard className="w-4 h-4 mr-2" />
                      ₹{booking.totalAmount}
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      Booked on {new Date(booking.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      {canReview(booking) && (
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowReviewModal(true);
                          }}
                          className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Write Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Write a Review"
        size="lg"
      >
        {selectedBooking && (
          <ReviewForm
            bookingId={selectedBooking._id}
            serviceName={
              selectedBooking.services && selectedBooking.services.length > 1
                ? `${selectedBooking.services.length} Services`
                : selectedBooking.service?.name || 'Service'
            }
            serviceProviderName={selectedBooking.serviceProvider?.name || 'Service Provider'}
            onSubmit={handleReviewSubmit}
            onCancel={() => setShowReviewModal(false)}
          />
        )}
      </Modal>
    </div>
  );
}