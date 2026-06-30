'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, Star, CheckCircle, XCircle, MapPin, Phone, Mail, Calendar,
  Briefcase, Clock, FileText, User, Edit, Upload, Eye, X, ShieldCheck,
  ShieldOff, ToggleLeft, ToggleRight, Plus, Loader2, IndianRupee,
  CalendarCheck, TrendingUp, BadgeCheck, AlertCircle,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Provider {
  _id: string;
  name: string;
  email: string;
  phone: string;
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  isActive: boolean;
  experience: number;
  createdAt: string;
  bio?: string;
  languages?: string[];
  specializations?: string[];
  profileImage?: string;
  price?: number;
  discountedPrice?: number;
  address?: { street?: string; city?: string; state?: string; zipCode?: string };
  availability?: Record<string, { start?: string; end?: string; available?: boolean }>;
  documents?: { aadharCard?: string; panCard?: string; experienceCertificate?: string };
  documentsVerified?: { aadharCard?: boolean; panCard?: boolean; experienceCertificate?: boolean };
  services: Array<{ _id: string; name: string; category: string }>;
}

interface ServiceOption { _id: string; name: string; category: string; isActive: boolean }

interface Booking {
  _id: string;
  user?: { name: string; email: string };
  service?: { name: string; category: string };
  services?: Array<{ name: string }>;
  scheduledDate: string;
  scheduledTime: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_LABELS: Record<string,string> = { monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat', sunday:'Sun' };

const STATUS_COLOR: Record<string, string> = {
  confirmed: 'bg-emerald-50 text-emerald-700',
  pending:   'bg-amber-50 text-amber-700',
  completed: 'bg-blue-50 text-blue-700',
  cancelled: 'bg-red-50 text-red-700',
  assigned:  'bg-violet-50 text-violet-700',
  'in-progress': 'bg-indigo-50 text-indigo-700',
};
const PAY_COLOR: Record<string, string> = {
  paid:    'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  failed:  'bg-red-50 text-red-700',
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function MaidManagementPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [provider, setProvider] = useState<Provider | null>(null);
  const [allServices, setAllServices] = useState<ServiceOption[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingTotal, setBookingTotal] = useState(0);
  const [bookingPages, setBookingPages] = useState(1);
  const [bookingPage, setBookingPage] = useState(1);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [assigningService, setAssigningService] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [editAvailability, setEditAvailability] = useState(false);
  const [availDraft, setAvailDraft] = useState<Provider['availability']>({});
  const [savingAvail, setSavingAvail] = useState(false);
  const [editingDocVerify, setEditingDocVerify] = useState(false);
  const [docVerifyDraft, setDocVerifyDraft] = useState<Provider['documentsVerified']>({});
  const [savingDocVerify, setSavingDocVerify] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null);
  const [createServiceOpen, setCreateServiceOpen] = useState(false);
  const [newSvc, setNewSvc] = useState({ name:'', description:'', price:'', discountedPrice:'', duration:'1', category:'cleaning', isActive:true });
  const [creatingSvc, setCreatingSvc] = useState(false);

  const token = () => localStorage.getItem('adminToken') || '';

  // ── Fetch helpers ────────────────────────────────────────────────────────────
  const fetchProvider = useCallback(async () => {
    const res = await fetch(`/api/admin/service-providers/${id}`, { headers: { Authorization: `Bearer ${token()}` } });
    if (!res.ok) { router.replace('/admin'); return; }
    const data = await res.json();
    setProvider(data.provider);
  }, [id, router]);

  const fetchAllServices = useCallback(async () => {
    const res = await fetch('/api/services');
    if (res.ok) { const d = await res.json(); setAllServices(d.services || []); }
  }, []);

  const fetchBookings = useCallback(async (page = 1) => {
    setBookingsLoading(true);
    try {
      const res = await fetch(`/api/admin/service-providers/${id}/bookings?page=${page}`, { headers: { Authorization: `Bearer ${token()}` } });
      if (res.ok) {
        const d = await res.json();
        setBookings(d.bookings || []);
        setBookingTotal(d.total || 0);
        setBookingPages(d.totalPages || 1);
        setTotalRevenue(d.totalRevenue || 0);
      }
    } finally { setBookingsLoading(false); }
  }, [id]);

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { router.replace('/auth/admin'); return; }
    Promise.all([fetchProvider(), fetchAllServices(), fetchBookings(1)]).finally(() => setLoading(false));
  }, [fetchProvider, fetchAllServices, fetchBookings, router]);

  // ── Quick-toggle helpers ─────────────────────────────────────────────────────
  const patchProvider = async (body: Record<string, unknown>) => {
    await fetch(`/api/admin/service-providers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify(body),
    });
    await fetchProvider();
  };

  const toggleField = (field: 'isVerified' | 'isActive') =>
    provider && patchProvider({ [field]: !provider[field] });

  // ── Service assignment ───────────────────────────────────────────────────────
  const toggleService = async (svcId: string) => {
    if (!provider || assigningService) return;
    setAssigningService(svcId);
    const current = provider.services.map(s => s._id);
    const next = current.includes(svcId) ? current.filter(i => i !== svcId) : [...current, svcId];
    await patchProvider({ services: next });
    setAssigningService(null);
  };

  // ── Document upload ──────────────────────────────────────────────────────────
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>, docKey: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(docKey);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'maid-documents');
    try {
      const up = await fetch('/api/upload', { method: 'POST', body: fd });
      if (up.ok) {
        const { url } = await up.json();
        await patchProvider({ [`documents.${docKey}`]: url });
      }
    } finally { setUploadingDoc(null); }
  };

  // ── Availability ─────────────────────────────────────────────────────────────
  const startAvailEdit = () => { setAvailDraft({ ...provider?.availability }); setEditAvailability(true); };
  const saveAvailability = async () => {
    setSavingAvail(true);
    await patchProvider({ availability: availDraft });
    setSavingAvail(false);
    setEditAvailability(false);
  };

  // ── Document verification ────────────────────────────────────────────────────
  const startDocVerify = () => { setDocVerifyDraft({ ...provider?.documentsVerified }); setEditingDocVerify(true); };
  const saveDocVerify = async () => {
    setSavingDocVerify(true);
    await patchProvider({ documentsVerified: docVerifyDraft });
    setSavingDocVerify(false);
    setEditingDocVerify(false);
  };

  // ── Create service ───────────────────────────────────────────────────────────
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingSvc(true);
    try {
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          ...newSvc,
          price: parseInt(newSvc.price) || 0,
          discountedPrice: newSvc.discountedPrice ? parseInt(newSvc.discountedPrice) : null,
          duration: parseInt(newSvc.duration) || 1,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setCreateServiceOpen(false);
        setNewSvc({ name:'', description:'', price:'', discountedPrice:'', duration:'1', category:'cleaning', isActive:true });
        await fetchAllServices();
        if (d.service?._id) await patchProvider({ services: [...(provider?.services.map(s=>s._id)||[]), d.service._id] });
      }
    } finally { setCreatingSvc(false); }
  };

  // ── Booking pagination ───────────────────────────────────────────────────────
  const goBookingPage = (p: number) => { setBookingPage(p); fetchBookings(p); };

  // ── Loading / not found ──────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
    </div>
  );
  if (!provider) return null;

  const assignedIds = provider.services.map(s => s._id);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Sticky Header ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button onClick={() => router.push('/admin')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-base font-bold text-gray-900 truncate">{provider.name}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => toggleField('isVerified')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${provider.isVerified ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
            >
              {provider.isVerified ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{provider.isVerified ? 'Unverify' : 'Verify'}</span>
            </button>
            <button
              onClick={() => toggleField('isActive')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${provider.isActive ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100' : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
            >
              {provider.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{provider.isActive ? 'Deactivate' : 'Activate'}</span>
            </button>
            <button
              onClick={() => router.push(`/admin/maids/${id}/edit`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit Profile</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-900 to-gray-700 h-20 sm:h-28" />
          <div className="px-5 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-14">
              {/* Avatar */}
              <div className="relative group self-start flex-shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white bg-gray-100 flex items-center justify-center overflow-hidden shadow-md">
                  {provider.profileImage
                    ? <img src={provider.profileImage} alt={provider.name} className="w-full h-full object-cover" />
                    : <User className="w-8 h-8 text-gray-400" />}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <Upload className="w-4 h-4 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={async e => {
                    const f = e.target.files?.[0]; if (!f) return;
                    const fd = new FormData(); fd.append('file', f); fd.append('folder', 'maid-profiles');
                    const up = await fetch('/api/upload', { method: 'POST', body: fd });
                    if (up.ok) { const { url } = await up.json(); await patchProvider({ profileImage: url }); }
                  }} />
                </label>
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0 pt-1 sm:pb-1">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h2 className="text-xl font-bold text-gray-900">{provider.name}</h2>
                  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${provider.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {provider.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${provider.isVerified ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                    {provider.isVerified ? '✓ Verified' : 'Unverified'}
                  </span>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {provider.totalReviews > 0 ? (
                    <>
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-semibold text-gray-900">{provider.rating.toFixed(1)}</span>
                      <span className="text-xs text-gray-500">({provider.totalReviews} reviews)</span>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 italic">No reviews yet</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{provider.email}</span>
                  <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{provider.phone}</span>
                  {provider.address?.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{provider.address.city}{provider.address.state ? `, ${provider.address.state}` : ''}</span>}
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Joined {new Date(provider.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats row ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Bookings', value: bookingTotal, icon: CalendarCheck, color: 'blue' },
            { label: 'Total Earned', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'emerald' },
            { label: 'Rating', value: provider.totalReviews > 0 ? `${provider.rating.toFixed(1)} ★` : 'No reviews', icon: Star, color: 'amber' },
            { label: 'Experience', value: `${provider.experience} yr${provider.experience !== 1 ? 's' : ''}`, icon: Briefcase, color: 'violet' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-4 flex items-center gap-3`}>
              <div className={`h-10 w-10 rounded-full bg-${color}-100 flex items-center justify-center flex-shrink-0`}>
                <Icon className={`h-5 w-5 text-${color}-600`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">{label}</p>
                <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Service Assignment ────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="font-semibold text-gray-900">Service Assignment</h3>
              <p className="text-xs text-gray-500 mt-0.5">Toggle services to assign or remove from this maid · {assignedIds.length} assigned</p>
            </div>
            <button
              onClick={() => setCreateServiceOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Service
            </button>
          </div>
          <div className="px-5 py-4">
            {allServices.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No services created yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allServices.map(svc => {
                  const on = assignedIds.includes(svc._id);
                  const busy = assigningService === svc._id;
                  return (
                    <button
                      key={svc._id}
                      onClick={() => toggleService(svc._id)}
                      disabled={!!assigningService}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all disabled:opacity-60 ${
                        on ? 'bg-violet-600 text-white border-violet-600 shadow-sm' : 'bg-white text-gray-600 border-gray-300 hover:border-violet-400 hover:text-violet-600'
                      }`}
                    >
                      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : on ? <CheckCircle className="w-3.5 h-3.5" /> : null}
                      {svc.name}
                      {!svc.isActive && <span className="text-xs opacity-60">(inactive)</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Booking History ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="font-semibold text-gray-900">Booking History</h3>
              <p className="text-xs text-gray-500 mt-0.5">{bookingTotal} booking{bookingTotal !== 1 ? 's' : ''} total</p>
            </div>
          </div>

          {bookingsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarCheck className="mx-auto w-10 h-10 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No bookings yet</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Customer','Service','Date & Time','Amount','Status','Payment'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {bookings.map(b => (
                      <tr key={b._id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <p className="text-sm font-medium text-gray-900">{b.user?.name || '—'}</p>
                          <p className="text-xs text-gray-400">{b.user?.email}</p>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-700">
                          {b.services && b.services.length > 1 ? `${b.services.length} services` : b.service?.name || '—'}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <p className="text-sm text-gray-700">{new Date(b.scheduledDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>
                          <p className="text-xs text-gray-400">{b.scheduledTime}</p>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm font-semibold text-gray-900">₹{b.totalAmount}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-lg ${STATUS_COLOR[b.status] || 'bg-gray-100 text-gray-600'}`}>{b.status}</span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-lg ${PAY_COLOR[b.paymentStatus] || 'bg-gray-100 text-gray-600'}`}>{b.paymentStatus}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {bookingPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/60">
                  <p className="text-xs text-gray-500">Page {bookingPage} of {bookingPages}</p>
                  <div className="flex gap-1">
                    <button disabled={bookingPage <= 1} onClick={() => goBookingPage(bookingPage - 1)}
                      className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40">Prev</button>
                    <button disabled={bookingPage >= bookingPages} onClick={() => goBookingPage(bookingPage + 1)}
                      className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40">Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Documents + Availability row ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Documents */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-50 rounded-lg"><FileText className="w-4 h-4 text-purple-600" /></div>
                <h3 className="font-semibold text-gray-900">Documents</h3>
              </div>
              {editingDocVerify ? (
                <div className="flex gap-2">
                  <button onClick={() => setEditingDocVerify(false)} className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                    <X className="w-3.5 h-3.5 inline mr-0.5" />Cancel
                  </button>
                  <button onClick={saveDocVerify} disabled={savingDocVerify} className="px-2.5 py-1 text-xs bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50">
                    {savingDocVerify ? 'Saving…' : 'Save'}
                  </button>
                </div>
              ) : (
                <button onClick={startDocVerify} className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">Verify Docs</button>
              )}
            </div>
            <div className="px-5 py-4 space-y-3">
              {([
                { key: 'aadharCard', label: 'Aadhar Card' },
                { key: 'panCard', label: 'PAN Card' },
                { key: 'experienceCertificate', label: 'Experience Certificate' },
              ] as const).map(({ key, label }) => {
                const url = provider.documents?.[key];
                const verified = provider.documentsVerified?.[key];
                const draftVerified = docVerifyDraft?.[key];
                return (
                  <div key={key} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {url && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(url)
                        ? <img src={url} alt={label} className="w-full h-full object-cover" />
                        : <FileText className={`w-5 h-5 ${url ? 'text-blue-500' : 'text-gray-300'}`} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-sm font-medium text-gray-900">{label}</span>
                        {verified && !editingDocVerify && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                            <BadgeCheck className="w-3 h-3" />Verified
                          </span>
                        )}
                      </div>
                      {editingDocVerify && url && (
                        <label className="flex items-center gap-1.5 cursor-pointer mb-1">
                          <input type="checkbox" checked={draftVerified || false}
                            onChange={e => setDocVerifyDraft(prev => ({ ...prev, [key]: e.target.checked }))}
                            className="w-3.5 h-3.5 accent-emerald-600" />
                          <span className="text-xs text-gray-600">Mark as verified</span>
                        </label>
                      )}
                      <div className="flex items-center gap-2">
                        {url
                          ? <button onClick={() => setPreviewDoc({ url, name: label })} className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"><Eye className="w-3.5 h-3.5" />View</button>
                          : <span className="text-xs text-gray-400">Not uploaded</span>}
                        <label className="cursor-pointer">
                          <span className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-2 py-0.5 bg-white inline-flex items-center gap-0.5">
                            <Upload className="w-3 h-3" />{uploadingDoc === key ? 'Uploading…' : url ? 'Replace' : 'Upload'}
                          </span>
                          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden"
                            onChange={e => handleDocUpload(e, key)} />
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Availability */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 rounded-lg"><Clock className="w-4 h-4 text-blue-600" /></div>
                <h3 className="font-semibold text-gray-900">Availability</h3>
              </div>
              {editAvailability ? (
                <div className="flex gap-2">
                  <button onClick={() => setEditAvailability(false)} className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                    <X className="w-3.5 h-3.5 inline mr-0.5" />Cancel
                  </button>
                  <button onClick={saveAvailability} disabled={savingAvail} className="px-2.5 py-1 text-xs bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50">
                    {savingAvail ? 'Saving…' : 'Save'}
                  </button>
                </div>
              ) : (
                <button onClick={startAvailEdit} className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                  <Edit className="w-3.5 h-3.5 inline mr-0.5" />Edit
                </button>
              )}
            </div>
            <div className="px-5 py-2">
              {DAYS.map(day => {
                const src = editAvailability ? availDraft : provider.availability;
                const d = src?.[day];
                return (
                  <div key={day} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 gap-2">
                    <span className="text-sm font-medium text-gray-700 w-10 flex-shrink-0">{DAY_LABELS[day]}</span>
                    {editAvailability ? (
                      <div className="flex items-center gap-2 flex-wrap justify-end flex-1">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={d?.available || false}
                            onChange={e => setAvailDraft(prev => ({ ...prev, [day]: { ...prev?.[day], available: e.target.checked } }))}
                            className="w-3.5 h-3.5 accent-blue-600" />
                          <span className="text-xs text-gray-600">Available</span>
                        </label>
                        {d?.available && (
                          <div className="flex items-center gap-1">
                            <input type="time" value={d?.start || '09:00'}
                              onChange={e => setAvailDraft(prev => ({ ...prev, [day]: { ...prev?.[day], start: e.target.value } }))}
                              className="px-1.5 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                            <span className="text-gray-400 text-xs">–</span>
                            <input type="time" value={d?.end || '17:00'}
                              onChange={e => setAvailDraft(prev => ({ ...prev, [day]: { ...prev?.[day], end: e.target.value } }))}
                              className="px-1.5 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                          </div>
                        )}
                      </div>
                    ) : d?.available ? (
                      <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">{d.start} – {d.end}</span>
                    ) : (
                      <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">Off</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bio + Languages + Specializations */}
        {(provider.bio || (provider.languages?.length ?? 0) > 0 || (provider.specializations?.length ?? 0) > 0) && (
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">About</h3>
            {provider.bio && <p className="text-sm text-gray-600 leading-relaxed mb-3">{provider.bio}</p>}
            {(provider.specializations?.length ?? 0) > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Specializations</p>
                <div className="flex flex-wrap gap-1.5">
                  {provider.specializations!.map(s => <span key={s} className="px-2.5 py-0.5 text-xs bg-violet-50 text-violet-700 border border-violet-200 rounded-full">{s}</span>)}
                </div>
              </div>
            )}
            {(provider.languages?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Languages</p>
                <div className="flex flex-wrap gap-1.5">
                  {provider.languages!.map(l => <span key={l} className="px-2.5 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">{l}</span>)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Create Service Modal ──────────────────────────────────────────────── */}
      <Modal isOpen={createServiceOpen} onClose={() => setCreateServiceOpen(false)} title="Create New Service" size="md">
        <form onSubmit={handleCreateService} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
            <input required type="text" value={newSvc.name} onChange={e => setNewSvc(p => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" placeholder="e.g. Deep Cleaning" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
            <textarea required rows={2} value={newSvc.description} onChange={e => setNewSvc(p => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) <span className="text-red-500">*</span></label>
              <input required type="number" min="0" value={newSvc.price} onChange={e => setNewSvc(p => ({ ...p, price: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discounted (₹)</label>
              <input type="number" min="0" value={newSvc.discountedPrice} onChange={e => setNewSvc(p => ({ ...p, discountedPrice: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration <span className="text-red-500">*</span></label>
              <select value={newSvc.duration} onChange={e => setNewSvc(p => ({ ...p, duration: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white">
                {[1,2,3,4,5,6,8].map(h => <option key={h} value={h}>{h} hour{h>1?'s':''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
              <select value={newSvc.category} onChange={e => setNewSvc(p => ({ ...p, category: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white">
                {['cleaning','cooking','laundry','childcare','eldercare','general'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setCreateServiceOpen(false)} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={creatingSvc || !newSvc.name || !newSvc.price}
              className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2">
              {creatingSvc && <Loader2 className="w-4 h-4 animate-spin" />}
              {creatingSvc ? 'Creating…' : 'Create & Assign'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Document Preview Modal ────────────────────────────────────────────── */}
      <Modal isOpen={!!previewDoc} onClose={() => setPreviewDoc(null)} title={previewDoc?.name || ''} size="xl">
        {previewDoc && (
          <div className="flex flex-col items-center">
            {/\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(previewDoc.url)
              ? <img src={previewDoc.url} alt={previewDoc.name} className="max-w-full max-h-[70vh] object-contain rounded-lg" />
              : /\.pdf(\?|$)/i.test(previewDoc.url)
                ? <iframe src={previewDoc.url} className="w-full h-[70vh] border-0 rounded-lg" title={previewDoc.name} />
                : (
                  <div className="text-center py-10">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <a href={previewDoc.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">Open document</a>
                  </div>
                )}
          </div>
        )}
      </Modal>
    </div>
  );
}
