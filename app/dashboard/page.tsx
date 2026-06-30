'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Calendar, Clock, MapPin, MessageSquare, Share2,
  Plus, CheckCircle2, Loader2, Star, RefreshCw, Flag,
  IndianRupee, CalendarCheck, Sparkles, AlertCircle, Gift, ChevronRight,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ReviewForm } from '@/components/ReviewForm';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { ShareMaidModal } from '@/components/ShareMaidModal';

interface Booking {
  _id: string;
  service: { name: string; category: string };
  services?: Array<{ name: string; category: string }>;
  serviceProvider?: {
    _id: string;
    name: string;
    rating: number;
    totalReviews?: number;
    profileImage?: string;
    specializations?: string[];
    experience?: number;
  };
  scheduledDate: string;
  scheduledTime: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  address: { street: string; city: string; state: string; zipCode: string };
  createdAt: string;
  isReviewSubmitted: boolean;
}

const STATUS_META: Record<string, { label: string; bg: string; dot: string }> = {
  confirmed:   { label: 'Confirmed',   bg: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', dot: 'bg-emerald-500' },
  pending:     { label: 'Pending',     bg: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',       dot: 'bg-amber-400' },
  completed:   { label: 'Completed',   bg: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',           dot: 'bg-blue-500' },
  cancelled:   { label: 'Cancelled',   bg: 'bg-red-50 text-red-700 ring-1 ring-red-200',             dot: 'bg-red-500' },
  assigned:    { label: 'Assigned',    bg: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',    dot: 'bg-violet-500' },
  'in-progress': { label: 'In Progress', bg: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200', dot: 'bg-indigo-500' },
};
const PAY_META: Record<string, { label: string; bg: string }> = {
  paid:    { label: 'Paid',    bg: 'bg-emerald-50 text-emerald-700' },
  pending: { label: 'Unpaid',  bg: 'bg-amber-50 text-amber-700' },
  failed:  { label: 'Failed',  bg: 'bg-red-50 text-red-700' },
};

const TABS = ['All', 'Upcoming', 'Completed', 'Cancelled'] as const;
type Tab = typeof TABS[number];

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('All');

  // Modals
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [shareMaid, setShareMaid] = useState<Booking['serviceProvider'] | null>(null);
  const [changeReqBooking, setChangeReqBooking] = useState<Booking | null>(null);
  const [reportBooking, setReportBooking] = useState<Booking | null>(null);

  const [rescheduleData, setRescheduleData] = useState({ scheduledDate: '', scheduledTime: '', reason: '' });
  const [changeReqReason, setChangeReqReason] = useState('');
  const [reportData, setReportData] = useState({ category: 'behaviour', description: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) { router.push('/auth/login'); return; }
    fetchBookings();
  }, [session, status, router]);

  const fetchBookings = async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch('/api/bookings', { headers: { 'Content-Type': 'application/json', 'user-id': session.user.id } });
      if (res.ok) { const d = await res.json(); setBookings(d.bookings || []); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // Stats derived from bookings
  const stats = useMemo(() => ({
    total: bookings.length,
    upcoming: bookings.filter(b => ['confirmed', 'pending', 'assigned'].includes(b.status)).length,
    completed: bookings.filter(b => b.status === 'completed').length,
    spent: bookings.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.totalAmount, 0),
  }), [bookings]);

  // Filtered list
  const filtered = useMemo(() => {
    if (activeTab === 'All') return bookings;
    if (activeTab === 'Upcoming') return bookings.filter(b => ['confirmed', 'pending', 'assigned', 'in-progress'].includes(b.status));
    if (activeTab === 'Completed') return bookings.filter(b => b.status === 'completed');
    if (activeTab === 'Cancelled') return bookings.filter(b => b.status === 'cancelled');
    return bookings;
  }, [bookings, activeTab]);

  const handleReschedule = async () => {
    if (!rescheduleBooking || !rescheduleData.scheduledDate || !rescheduleData.scheduledTime || !session?.user?.id) return;
    setActionLoading(true); setActionError('');
    try {
      const res = await fetch(`/api/bookings/${rescheduleBooking._id}/reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'user-id': session.user.id },
        body: JSON.stringify(rescheduleData),
      });
      if (res.ok) { await fetchBookings(); setRescheduleBooking(null); setRescheduleData({ scheduledDate: '', scheduledTime: '', reason: '' }); }
      else { const d = await res.json(); setActionError(d.error || 'Failed to reschedule'); }
    } catch { setActionError('Something went wrong'); }
    finally { setActionLoading(false); }
  };

  const handleReviewSubmit = async (reviewData: Record<string, unknown>) => {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'user-id': session!.user.id },
      body: JSON.stringify(reviewData),
    });
    if (res.ok) { await fetchBookings(); setReviewBooking(null); }
    else { const d = await res.json(); alert(d.error || 'Failed to submit review'); }
  };

  const handleChangeMaidRequest = async () => {
    if (!changeReqBooking || !changeReqReason.trim() || !session?.user?.id) return;
    setActionLoading(true); setActionError(''); setActionSuccess('');
    try {
      const res = await fetch(`/api/bookings/${changeReqBooking._id}/change-maid-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'user-id': session.user.id },
        body: JSON.stringify({ reason: changeReqReason }),
      });
      const d = await res.json();
      if (res.ok) { setActionSuccess('Request submitted! Admin will review and assign a new maid.'); setChangeReqReason(''); }
      else setActionError(d.error || 'Failed to submit request');
    } catch { setActionError('Something went wrong'); }
    finally { setActionLoading(false); }
  };

  const handleReportMaid = async () => {
    if (!reportBooking || !reportData.description.trim() || !session?.user?.id) return;
    setActionLoading(true); setActionError(''); setActionSuccess('');
    try {
      const res = await fetch(`/api/bookings/${reportBooking._id}/report-maid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'user-id': session.user.id },
        body: JSON.stringify(reportData),
      });
      const d = await res.json();
      if (res.ok) { setActionSuccess('Report submitted. We will investigate and get back to you.'); setReportData({ category: 'behaviour', description: '' }); }
      else setActionError(d.error || 'Failed to submit report');
    } catch { setActionError('Something went wrong'); }
    finally { setActionLoading(false); }
  };

  const isPast24h = (b: Booking) => Date.now() - new Date(b.createdAt).getTime() > 24 * 60 * 60 * 1000;
  const canReschedule = (b: Booking) => ['confirmed', 'pending'].includes(b.status) && !isPast24h(b);
  const canRateMaid = (b: Booking) => !b.isReviewSubmitted && !!b.serviceProvider && (b.status === 'completed' || isPast24h(b));
  const canChangeMaid = (b: Booking) => !!b.serviceProvider && ['confirmed', 'assigned', 'in-progress'].includes(b.status);
  const canReportMaid = (b: Booking) => !!b.serviceProvider;

  const serviceName = (b: Booking) =>
    b.services && b.services.length > 1
      ? `${b.services.length} Services`
      : b.service?.name || 'Service';

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
      </div>
    );
  }
  if (!session) return null;

  const firstName = session.user?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{greeting},</p>
            <h1 className="text-2xl font-bold text-gray-900">{firstName} 👋</h1>
          </div>
          <button
            onClick={() => router.push('/services')}
            className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Book Service
          </button>
        </div>

        {/* ── Stats row ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Bookings', value: stats.total, icon: CalendarCheck, color: 'text-blue-600 bg-blue-50' },
            { label: 'Upcoming',       value: stats.upcoming, icon: Clock,        color: 'text-amber-600 bg-amber-50' },
            { label: 'Completed',      value: stats.completed, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Total Spent',    value: `₹${stats.spent.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-violet-600 bg-violet-50' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-gray-200 flex flex-col gap-2">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Refer & Earn banner ────────────────────────────────────────────── */}
        <button
          onClick={() => router.push('/referrals')}
          className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all hover:shadow-md active:scale-[0.99]"
          style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)' }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(124,58,237,0.3)', border: '1px solid rgba(124,58,237,0.5)' }}>
            <Gift className="w-5 h-5" style={{ color: '#a78bfa' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Refer &amp; Earn</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Share a maid, earn commission on every booking</p>
          </div>
          <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
        </button>

        {/* ── Bookings section ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {TABS.map(tab => {
              const count = tab === 'All' ? bookings.length
                : tab === 'Upcoming' ? stats.upcoming
                : tab === 'Completed' ? stats.completed
                : bookings.filter(b => b.status === 'cancelled').length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                  {count > 0 && (
                    <span className={`px-1.5 py-0.5 text-xs font-bold rounded-full ${activeTab === tab ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Empty state */}
          {filtered.length === 0 ? (
            <div className="py-16 text-center px-6">
              <Sparkles className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-600 mb-1">
                {activeTab === 'All' ? 'No bookings yet' : `No ${activeTab.toLowerCase()} bookings`}
              </p>
              <p className="text-xs text-gray-400 mb-4">Book a service to get started</p>
              <button
                onClick={() => router.push('/services')}
                className="bg-gray-900 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors"
              >
                Browse Services
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map(b => {
                const sm = STATUS_META[b.status] || { label: b.status, bg: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
                const pm = PAY_META[b.paymentStatus] || { label: b.paymentStatus, bg: 'bg-gray-100 text-gray-600' };
                const name = serviceName(b);
                return (
                  <div key={b._id} className="p-5 hover:bg-gray-50/60 transition-colors">

                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
                        {b.services && b.services.length > 1 && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{b.services.map(s => s.name).join(' · ')}</p>
                        )}
                        {b.service?.category && b.services?.length !== 1 && (
                          <p className="text-xs text-gray-400 capitalize mt-0.5">{b.service.category}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${sm.bg}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${sm.dot}`} />
                          {sm.label}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${pm.bg}`}>{pm.label}</span>
                      </div>
                    </div>

                    {/* Maid row */}
                    {b.serviceProvider && (
                      <div className="flex items-center justify-between mb-3 px-3 py-2.5 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar src={b.serviceProvider.profileImage} name={b.serviceProvider.name} size="sm" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{b.serviceProvider.name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              {(b.serviceProvider.totalReviews ?? 0) > 0 ? (
                                <>
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  <span className="text-xs text-gray-500">{b.serviceProvider.rating.toFixed(1)} ({b.serviceProvider.totalReviews})</span>
                                </>
                              ) : (
                                <span className="text-xs text-gray-400 italic">No reviews yet</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setShareMaid(b.serviceProvider!)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          Share &amp; Earn
                        </button>
                      </div>
                    )}

                    {/* Detail pills */}
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(b.scheduledDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <span className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1">
                        <Clock className="w-3.5 h-3.5" />{b.scheduledTime}
                      </span>
                      {b.address?.city && (
                        <span className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1">
                          <MapPin className="w-3.5 h-3.5" />{b.address.city}{b.address.state ? `, ${b.address.state}` : ''}
                        </span>
                      )}
                      <span className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1 font-semibold text-gray-700">
                        <IndianRupee className="w-3.5 h-3.5" />₹{b.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Action footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 gap-2 flex-wrap">
                      <span className="text-xs text-gray-400">
                        Booked {new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {canRateMaid(b) && (
                          <button
                            onClick={() => setReviewBooking(b)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                          >
                            <Star className="w-3.5 h-3.5" />Rate Maid
                          </button>
                        )}
                        {canReschedule(b) && (
                          <button
                            onClick={() => { setRescheduleBooking(b); setActionError(''); }}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            <Calendar className="w-3.5 h-3.5" />Reschedule
                          </button>
                        )}
                        {canChangeMaid(b) && (
                          <button
                            onClick={() => { setChangeReqBooking(b); setActionError(''); setActionSuccess(''); }}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />Change Maid
                          </button>
                        )}
                        {canReportMaid(b) && (
                          <button
                            onClick={() => { setReportBooking(b); setActionError(''); setActionSuccess(''); }}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <Flag className="w-3.5 h-3.5" />Report
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Reschedule Modal ──────────────────────────────────────────────────── */}
      <Modal isOpen={!!rescheduleBooking} onClose={() => setRescheduleBooking(null)} title="Reschedule Booking" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Rescheduling <span className="font-semibold">{rescheduleBooking && serviceName(rescheduleBooking)}</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">New Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={rescheduleData.scheduledDate}
                onChange={e => setRescheduleData(p => ({ ...p, scheduledDate: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Time <span className="text-red-500">*</span></label>
              <input
                type="time"
                value={rescheduleData.scheduledTime}
                onChange={e => setRescheduleData(p => ({ ...p, scheduledTime: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Reason (optional)</label>
            <textarea
              rows={2}
              value={rescheduleData.reason}
              onChange={e => setRescheduleData(p => ({ ...p, reason: e.target.value }))}
              placeholder="Why are you rescheduling?"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
            />
          </div>
          {actionError && <p className="flex items-center gap-1.5 text-sm text-red-600"><AlertCircle className="w-4 h-4" />{actionError}</p>}
          <div className="flex gap-2 pt-1">
            <button onClick={() => setRescheduleBooking(null)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button
              onClick={handleReschedule}
              disabled={actionLoading || !rescheduleData.scheduledDate || !rescheduleData.scheduledTime}
              className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {actionLoading ? 'Saving…' : 'Confirm'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Review Modal ──────────────────────────────────────────────────────── */}
      <Modal isOpen={!!reviewBooking} onClose={() => setReviewBooking(null)} title="Write a Review" size="lg">
        {reviewBooking && (
          <ReviewForm
            bookingId={reviewBooking._id}
            serviceName={serviceName(reviewBooking)}
            serviceProviderName={reviewBooking.serviceProvider?.name || 'Your Maid'}
            onSubmit={handleReviewSubmit}
            onCancel={() => setReviewBooking(null)}
          />
        )}
      </Modal>

      {/* ── Change Maid Modal ─────────────────────────────────────────────────── */}
      <Modal isOpen={!!changeReqBooking} onClose={() => { setChangeReqBooking(null); setActionSuccess(''); }} title="Request Change of Maid" size="sm">
        <div className="space-y-4">
          {actionSuccess ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-900">Request Submitted</p>
              <p className="text-xs text-gray-500 mt-1">{actionSuccess}</p>
              <button onClick={() => { setChangeReqBooking(null); setActionSuccess(''); }} className="mt-4 px-5 py-2 bg-gray-900 text-white text-sm rounded-xl hover:bg-gray-700">Done</button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Currently assigned: <span className="font-semibold">{changeReqBooking?.serviceProvider?.name}</span>
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Reason for change <span className="text-red-500">*</span></label>
                <textarea
                  rows={3}
                  value={changeReqReason}
                  onChange={e => setChangeReqReason(e.target.value)}
                  placeholder="Please explain why you'd like a different maid…"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
                />
              </div>
              {actionError && <p className="flex items-center gap-1.5 text-sm text-red-600"><AlertCircle className="w-4 h-4" />{actionError}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setChangeReqBooking(null)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button
                  onClick={handleChangeMaidRequest}
                  disabled={actionLoading || !changeReqReason.trim()}
                  className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {actionLoading ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* ── Report Maid Modal ─────────────────────────────────────────────────── */}
      <Modal isOpen={!!reportBooking} onClose={() => { setReportBooking(null); setActionSuccess(''); }} title="Report Maid" size="sm">
        <div className="space-y-4">
          {actionSuccess ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-900">Report Submitted</p>
              <p className="text-xs text-gray-500 mt-1">{actionSuccess}</p>
              <button onClick={() => { setReportBooking(null); setActionSuccess(''); }} className="mt-4 px-5 py-2 bg-gray-900 text-white text-sm rounded-xl hover:bg-gray-700">Done</button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Reporting: <span className="font-semibold">{reportBooking?.serviceProvider?.name}</span>
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Category <span className="text-red-500">*</span></label>
                <select
                  value={reportData.category}
                  onChange={e => setReportData(p => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white"
                >
                  <option value="behaviour">Unprofessional Behaviour</option>
                  <option value="quality">Poor Work Quality</option>
                  <option value="theft">Theft / Missing Items</option>
                  <option value="no_show">No Show / Late Arrival</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description <span className="text-red-500">*</span></label>
                <textarea
                  rows={4}
                  value={reportData.description}
                  onChange={e => setReportData(p => ({ ...p, description: e.target.value }))}
                  placeholder="Describe what happened in detail…"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
                />
              </div>
              {actionError && <p className="flex items-center gap-1.5 text-sm text-red-600"><AlertCircle className="w-4 h-4" />{actionError}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setReportBooking(null)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button
                  onClick={handleReportMaid}
                  disabled={actionLoading || !reportData.description.trim()}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {actionLoading ? 'Submitting…' : 'Submit Report'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* ── Share Maid Modal ──────────────────────────────────────────────────── */}
      {shareMaid && (
        <ShareMaidModal
          isOpen={!!shareMaid}
          onClose={() => setShareMaid(null)}
          maid={shareMaid}
          userId={session.user?.id || ''}
        />
      )}
    </div>
  );
}
