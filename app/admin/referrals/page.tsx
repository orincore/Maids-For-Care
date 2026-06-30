'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Search, X, RefreshCw, Gift, IndianRupee, Clock,
  CheckCircle, Users, Settings2, ChevronLeft, ChevronRight,
  AlertCircle, Check, Save,
} from 'lucide-react';

interface Referral {
  _id: string;
  referrerId: { name: string; email: string; referralCode: string } | null;
  referredUserId: { name: string; email: string } | null;
  bookingId: { totalAmount: number; createdAt: string } | null;
  bookingAmount: number;
  commissionRate: number;
  commissionAmount: number;
  referralCode: string;
  status: 'pending' | 'paid' | 'cancelled';
  paidAt: string | null;
  transactionId: string | null;
  createdAt: string;
}

interface Summary {
  totalPending: number;
  totalPaid: number;
  countPending: number;
  countPaid: number;
  countTotal: number;
}

const VALID_ADMIN_ROLES = ['super_admin', 'admin', 'support_agent'];

export default function AdminReferralsPage() {
  const router = useRouter();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Settings
  const [commissionRate, setCommissionRate] = useState<number>(10);
  const [isEnabled, setIsEnabled] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Pay modal
  const [payModal, setPayModal] = useState<Referral | null>(null);
  const [txnId, setTxnId] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');

  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);

  // Auth
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const t = localStorage.getItem('adminToken') || '';
    const u = localStorage.getItem('adminUser');
    if (!t || !u) { router.replace('/auth/admin'); return; }
    try {
      const parsed = JSON.parse(u);
      if (!VALID_ADMIN_ROLES.includes(parsed.role)) { router.replace('/dashboard'); return; }
      setToken(t);
      setUser(parsed);
    } catch { router.replace('/auth/admin'); }
  }, [router]);

  useEffect(() => {
    if (token) {
      fetchReferrals();
      fetchSettings();
    }
  }, [token, statusFilter, page]);

  useEffect(() => {
    if (token) {
      setPage(1);
      fetchReferrals(1);
    }
  }, [search]);

  const headers = () => ({ 'Authorization': `Bearer ${token}` });

  const fetchReferrals = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: statusFilter, search, page: String(p) });
      const res = await fetch(`/api/admin/referrals?${params}`, { headers: headers() });
      if (res.ok) {
        const d = await res.json();
        setReferrals(d.referrals || []);
        setSummary(d.summary || null);
        setPages(d.pages || 1);
        setTotal(d.total || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    const res = await fetch('/api/admin/referral-settings', { headers: headers() });
    if (res.ok) {
      const d = await res.json();
      setCommissionRate(d.settings?.commissionRate ?? 10);
      setIsEnabled(d.settings?.isEnabled ?? true);
    }
  };

  const saveSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch('/api/admin/referral-settings', {
        method: 'PATCH',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionRate, isEnabled }),
      });
      if (res.ok) {
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 2000);
      }
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!payModal) return;
    if (!txnId.trim()) { setPayError('Please enter a transaction ID'); return; }
    setPayLoading(true);
    setPayError('');
    try {
      const res = await fetch(`/api/admin/referrals/${payModal._id}`, {
        method: 'PATCH',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid', transactionId: txnId.trim() }),
      });
      if (res.ok) {
        setPayModal(null);
        setTxnId('');
        fetchReferrals();
      } else {
        const d = await res.json();
        setPayError(d.error || 'Failed to update');
      }
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <button onClick={() => router.push('/admin')} className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-white" />
              <h1 className="text-lg font-bold text-white">Referral Management</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Referrals', value: summary?.countTotal ?? 0, icon: Users, color: 'blue' },
            { label: 'Pending Payout', value: `₹${(summary?.totalPending ?? 0).toLocaleString('en-IN')}`, icon: Clock, color: 'amber', sub: `${summary?.countPending ?? 0} referrals` },
            { label: 'Total Paid Out', value: `₹${(summary?.totalPaid ?? 0).toLocaleString('en-IN')}`, icon: CheckCircle, color: 'emerald', sub: `${summary?.countPaid ?? 0} referrals` },
            { label: 'Commission Rate', value: `${commissionRate}%`, icon: IndianRupee, color: 'purple', sub: isEnabled ? 'Active' : 'Disabled' },
          ].map(({ label, value, icon: Icon, color, sub }) => (
            <div key={label} className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-4 sm:p-5">
              <div className={`inline-flex h-8 w-8 rounded-lg bg-${color}-100 items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 text-${color}-600`} />
              </div>
              <p className="text-xs text-gray-500 mb-0.5">{label}</p>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            </div>
          ))}
        </div>

        {/* Settings */}
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="w-4 h-4 text-gray-600" />
            <h3 className="text-base font-semibold text-gray-900">Referral Settings</h3>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={commissionRate}
                onChange={e => setCommissionRate(Number(e.target.value))}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">% of booking amount paid to the referrer</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEnabled(!isEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isEnabled ? 'bg-gray-900' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm text-gray-600">{isEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
            <button
              onClick={saveSettings}
              disabled={settingsLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${settingsSaved ? 'bg-emerald-500 text-white' : 'bg-gray-900 text-white hover:bg-gray-700'} disabled:opacity-50`}
            >
              {settingsSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {settingsSaved ? 'Saved!' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Filters + Table */}
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">{total} Referral{total !== 1 ? 's' : ''}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status filter */}
              <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden text-xs font-semibold">
                {['all', 'pending', 'paid'].map(s => (
                  <button
                    key={s}
                    onClick={() => { setStatusFilter(s); setPage(1); }}
                    className={`px-3 py-2 capitalize transition-colors ${statusFilter === s ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    {s === 'all' ? 'All' : s}
                  </button>
                ))}
              </div>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search name, email…"
                  className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-900 w-44"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button onClick={() => fetchReferrals()} className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Referrer', 'Referred User', 'Code', 'Booking Amt', 'Commission', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} className={`px-4 sm:px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {loading ? (
                  <tr><td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                      <p className="text-sm text-gray-400">Loading…</p>
                    </div>
                  </td></tr>
                ) : referrals.length === 0 ? (
                  <tr><td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Gift className="w-10 h-10 text-gray-300" />
                      <p className="text-sm text-gray-400">No referrals found.</p>
                    </div>
                  </td></tr>
                ) : referrals.map(r => (
                  <tr key={r._id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 sm:px-5 py-3 whitespace-nowrap">
                      <p className="text-sm font-semibold text-gray-900">{r.referrerId?.name || '—'}</p>
                      <p className="text-xs text-gray-400">{r.referrerId?.email || ''}</p>
                    </td>
                    <td className="px-4 sm:px-5 py-3 whitespace-nowrap">
                      <p className="text-sm text-gray-800">{r.referredUserId?.name || '—'}</p>
                      <p className="text-xs text-gray-400">{r.referredUserId?.email || ''}</p>
                    </td>
                    <td className="px-4 sm:px-5 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700">{r.referralCode}</span>
                    </td>
                    <td className="px-4 sm:px-5 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ₹{r.bookingAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 sm:px-5 py-3 whitespace-nowrap">
                      <p className="text-sm font-bold text-emerald-700">₹{r.commissionAmount.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-gray-400">{r.commissionRate}%</p>
                    </td>
                    <td className="px-4 sm:px-5 py-3 whitespace-nowrap">
                      <div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-lg ${r.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : r.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                          {r.status === 'paid' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {r.status}
                        </span>
                        {r.transactionId && (
                          <p className="text-xs text-gray-400 font-mono mt-0.5">{r.transactionId}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 sm:px-5 py-3 whitespace-nowrap text-sm text-gray-500">
                      {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 sm:px-5 py-3 whitespace-nowrap text-right">
                      {r.status === 'pending' ? (
                        <button
                          onClick={() => { setPayModal(r); setTxnId(''); setPayError(''); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          <IndianRupee className="w-3.5 h-3.5" />
                          Mark Paid
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Paid {r.paidAt ? new Date(r.paidAt).toLocaleDateString('en-IN') : ''}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50/60">
              <p className="text-sm text-gray-500 hidden sm:block">Page <span className="font-medium">{page}</span> of <span className="font-medium">{pages}</span></p>
              <div className="flex items-center gap-1 mx-auto sm:mx-0">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mark as Paid Modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Mark as Paid</h3>
              <button onClick={() => setPayModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Summary */}
              <div className="bg-emerald-50 rounded-xl p-4">
                <p className="text-xs text-emerald-600 font-semibold mb-1">Commission Amount</p>
                <p className="text-2xl font-bold text-emerald-700">₹{payModal.commissionAmount.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-500 mt-1">
                  to {payModal.referrerId?.name} ({payModal.referrerId?.email})
                </p>
              </div>

              {payError && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2.5 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {payError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Transaction ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={txnId}
                  onChange={e => setTxnId(e.target.value)}
                  placeholder="UPI / Bank Ref / UTR number"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">An email will be sent to the referrer confirming the payment.</p>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setPayModal(null)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkPaid}
                  disabled={payLoading}
                  className="flex-1 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {payLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {payLoading ? 'Processing…' : 'Confirm Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
