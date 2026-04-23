'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, User, Mail, Phone, MapPin, Calendar, Star,
  RefreshCw, Clock, CheckCircle, XCircle, AlertCircle, History
} from 'lucide-react';

interface UserDetail {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  address?: { street?: string; city?: string; state?: string; zipCode?: string };
  profileImage?: string;
  createdAt: string;
}

interface AssignmentEntry {
  serviceProvider?: { _id: string; name: string; phone: string; email: string; isVerified: boolean };
  providerName: string;
  assignedAt: string;
  removedAt?: string;
  reason?: string;
  comment?: string;
  assignedBy?: string;
}

interface Booking {
  _id: string;
  service?: { name: string; category: string };
  services?: { name: string; category: string }[];
  serviceProvider?: { _id: string; name: string; phone: string; email: string; isVerified: boolean; rating: number };
  scheduledDate: string;
  scheduledTime: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  address?: { street?: string; city?: string; state?: string; zipCode?: string };
  specialInstructions?: string;
  createdAt: string;
  maidsAssignmentHistory?: AssignmentEntry[];
}

interface ServiceProviderOption {
  _id: string;
  name: string;
  phone: string;
  email: string;
  isVerified: boolean;
  rating: number;
  experience: number;
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [userData, setUserData] = useState<UserDetail | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [providers, setProviders] = useState<ServiceProviderOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [reassignForm, setReassignForm] = useState({ newProviderId: '', reason: '', comment: '' });
  const [reassigning, setReassigning] = useState(false);
  const [error, setError] = useState('');

  const getToken = () => localStorage.getItem('adminToken') || localStorage.getItem('token');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = getToken();
    if (!token) { router.replace('/auth/admin'); return; }
    fetchUserData();
    fetchProviders();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const token = getToken();
      const res = await fetch(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { router.replace('/admin'); return; }
      const data = await res.json();
      setUserData(data.user);
      setBookings(data.bookings);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/admin/service-providers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openReassign = (booking: Booking) => {
    setSelectedBooking(booking);
    setReassignForm({ newProviderId: '', reason: '', comment: '' });
    setError('');
    setShowReassignModal(true);
  };

  const openHistory = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowHistoryModal(true);
  };

  const handleReassign = async () => {
    if (!reassignForm.newProviderId || !reassignForm.reason.trim()) {
      setError('Please select a maid and provide a reason.');
      return;
    }
    setReassigning(true);
    setError('');
    try {
      const token = getToken();
      const res = await fetch(`/api/admin/bookings/${selectedBooking!._id}/reassign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(reassignForm),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Reassignment failed'); return; }
      setShowReassignModal(false);
      fetchUserData();
    } catch (e) {
      setError('Network error');
    } finally {
      setReassigning(false);
    }
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-purple-100 text-purple-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  const paymentColor = (s: string) =>
    s === 'paid' ? 'bg-green-100 text-green-800' :
    s === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!userData) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <button onClick={() => router.push('/admin')} className="text-gray-500 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">User Details</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {userData.profileImage
                ? <img src={userData.profileImage} alt={userData.name} className="w-full h-full object-cover" />
                : <User className="w-8 h-8 text-gray-400" />
              }
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Name</p>
                <p className="font-semibold text-gray-900">{userData.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email</p>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-900">{userData.email}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Phone</p>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-900">{userData.phone || '—'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Role</p>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                  userData.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>{userData.role}</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Joined</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-900">{new Date(userData.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              {userData.address?.city && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Address</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">
                      {[userData.address.street, userData.address.city, userData.address.state, userData.address.zipCode]
                        .filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bookings */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Bookings <span className="text-gray-400 font-normal">({bookings.length})</span>
          </h2>

          {bookings.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No bookings found for this user.
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking._id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">

                    {/* Left: booking info */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Service</p>
                        <p className="text-sm font-medium text-gray-900">
                          {booking.services && booking.services.length > 1
                            ? booking.services.map(s => s.name).join(', ')
                            : booking.service?.name || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Scheduled</p>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <p className="text-sm text-gray-900">
                            {new Date(booking.scheduledDate).toLocaleDateString()} {booking.scheduledTime}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Amount</p>
                        <p className="text-sm font-semibold text-gray-900">₹{booking.totalAmount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${statusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Payment</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${paymentColor(booking.paymentStatus)}`}>
                          {booking.paymentStatus}
                        </span>
                      </div>
                      {booking.address?.city && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Address</p>
                          <p className="text-sm text-gray-900">
                            {[booking.address.street, booking.address.city, booking.address.state].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right: maid + actions */}
                    <div className="lg:w-64 flex-shrink-0 space-y-3">
                      <div className="border rounded-lg p-3 bg-gray-50">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Assigned Maid</p>
                        {booking.serviceProvider ? (
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-semibold text-gray-900">{booking.serviceProvider.name}</p>
                              {booking.serviceProvider.isVerified && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{booking.serviceProvider.phone}</p>
                            <p className="text-xs text-gray-500">{booking.serviceProvider.email}</p>
                            {booking.serviceProvider.rating > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="w-3 h-3 text-yellow-400" />
                                <span className="text-xs text-gray-600">{booking.serviceProvider.rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-yellow-700">
                            <AlertCircle className="w-4 h-4" />
                            <p className="text-sm">Not Assigned</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => openReassign(booking)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" />
                          {booking.serviceProvider ? 'Reassign' : 'Assign'} Maid
                        </button>
                        {booking.maidsAssignmentHistory && booking.maidsAssignmentHistory.length > 0 && (
                          <button
                            onClick={() => openHistory(booking)}
                            className="flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <History className="w-3 h-3" />
                            History
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {booking.specialInstructions && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Special Instructions</p>
                      <p className="text-sm text-gray-700">{booking.specialInstructions}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reassign Modal */}
      {showReassignModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-bold text-gray-900">
                {selectedBooking.serviceProvider ? 'Reassign Maid' : 'Assign Maid'}
              </h3>
              <button onClick={() => setShowReassignModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {selectedBooking.serviceProvider && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                  Currently assigned: <strong>{selectedBooking.serviceProvider.name}</strong>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select New Maid *</label>
                <select
                  value={reassignForm.newProviderId}
                  onChange={(e) => setReassignForm(f => ({ ...f, newProviderId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="">— Choose a service provider —</option>
                  {providers
                    .filter(p => p._id !== selectedBooking.serviceProvider?._id)
                    .map(p => (
                      <option key={p._id} value={p._id}>
                        {p.name} — {p.phone} {p.isVerified ? '✓' : ''} | ⭐ {p.rating.toFixed(1)} | {p.experience}yr exp
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for change *</label>
                <input
                  type="text"
                  value={reassignForm.reason}
                  onChange={(e) => setReassignForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="e.g. Provider unavailable, Customer request..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional comment</label>
                <textarea
                  value={reassignForm.comment}
                  onChange={(e) => setReassignForm(f => ({ ...f, comment: e.target.value }))}
                  rows={3}
                  placeholder="Optional details about why this change was made..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
              )}
            </div>
            <div className="flex gap-3 p-6 border-t">
              <button
                onClick={() => setShowReassignModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReassign}
                disabled={reassigning}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
              >
                {reassigning ? 'Saving...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Maid Assignment History</h3>
                <p className="text-sm text-gray-500">
                  {selectedBooking.service?.name || selectedBooking.services?.[0]?.name}
                </p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4">
              {selectedBooking.maidsAssignmentHistory?.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No history available.</p>
              ) : (
                selectedBooking.maidsAssignmentHistory?.map((entry, idx) => (
                  <div key={idx} className="relative pl-6 border-l-2 border-gray-200 pb-4 last:pb-0">
                    <div className={`absolute -left-1.5 top-0 w-3 h-3 rounded-full ${entry.removedAt ? 'bg-gray-400' : 'bg-green-500'}`} />
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {entry.serviceProvider?.name || entry.providerName}
                        </p>
                        {!entry.removedAt && (
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">Current</span>
                        )}
                      </div>
                      {entry.serviceProvider && (
                        <p className="text-xs text-gray-500 mb-1">{entry.serviceProvider.phone} · {entry.serviceProvider.email}</p>
                      )}
                      <div className="text-xs text-gray-500 space-y-0.5">
                        <p>Assigned: {new Date(entry.assignedAt).toLocaleString()}</p>
                        {entry.removedAt && <p>Removed: {new Date(entry.removedAt).toLocaleString()}</p>}
                      </div>
                      {entry.reason && entry.reason !== 'New assignment' && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-600">Reason: {entry.reason}</p>
                          {entry.comment && <p className="text-xs text-gray-500 mt-0.5">{entry.comment}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-6 border-t">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
