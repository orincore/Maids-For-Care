'use client';

import { useState, useEffect } from 'react';
import {
  X, Copy, Check, Share2, Gift, Users, IndianRupee,
  Clock, TrendingUp, ExternalLink, WholeWord,
} from 'lucide-react';

interface ReferralStats {
  totalEarned: number;
  pendingAmount: number;
  totalReferrals: number;
  paidReferrals: number;
  pendingReferrals: number;
}

interface ReferralRecord {
  _id: string;
  referredUser: { name: string; email: string } | null;
  bookingAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'paid' | 'cancelled';
  paidAt: string | null;
  transactionId: string | null;
  createdAt: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function ReferralModal({ isOpen, onClose, userId }: Props) {
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [records, setRecords] = useState<ReferralRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [commissionRate, setCommissionRate] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && userId) loadData();
  }, [isOpen, userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [codeRes, statsRes] = await Promise.all([
        fetch('/api/referral/my-code', { headers: { 'user-id': userId } }),
        fetch('/api/referral/stats', { headers: { 'user-id': userId } }),
      ]);

      if (codeRes.ok) {
        const d = await codeRes.json();
        setReferralCode(d.referralCode);
        setReferralLink(d.referralLink);
      }
      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(d.stats);
        setRecords(d.referrals || []);
      }

      // Fetch commission rate from public endpoint (or fallback)
      try {
        const token = localStorage.getItem('adminToken');
        if (token) {
          const settingsRes = await fetch('/api/admin/referral-settings', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (settingsRes.ok) {
            const s = await settingsRes.json();
            setCommissionRate(s.settings?.commissionRate ?? 10);
          }
        }
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const shareWhatsApp = () => {
    const msg = encodeURIComponent(
      `Book professional home services on Maids For Care and get quality help at home! Use my referral link: ${referralLink}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Gift className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Refer &amp; Earn</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : (
            <div className="p-6 space-y-5">

              {/* Hero banner */}
              <div className="rounded-xl bg-gray-900 text-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-300 mb-1">Share &amp; earn</p>
                    <p className="text-2xl font-bold">
                      {commissionRate ?? '—'}% Commission
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      on every booking made by your referred friend
                    </p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-gray-600 flex-shrink-0" />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total Earned', value: `₹${(stats?.totalEarned ?? 0).toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-emerald-600 bg-emerald-50' },
                  { label: 'Pending', value: `₹${(stats?.pendingAmount ?? 0).toLocaleString('en-IN')}`, icon: Clock, color: 'text-amber-600 bg-amber-50' },
                  { label: 'Referrals', value: String(stats?.totalReferrals ?? 0), icon: Users, color: 'text-blue-600 bg-blue-50' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className={`inline-flex h-7 w-7 rounded-lg items-center justify-center mb-2 ${color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                    <p className="text-sm font-bold text-gray-900">{value}</p>
                  </div>
                ))}
              </div>

              {/* Referral code */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Referral Code</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                    <span className="text-xl font-mono font-bold tracking-widest text-gray-900">{referralCode}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(referralCode, 'code')}
                    className={`flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${copied === 'code' ? 'bg-emerald-500 text-white' : 'bg-gray-900 text-white hover:bg-gray-700'}`}
                  >
                    {copied === 'code' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied === 'code' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Referral link */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Referral Link</p>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                  <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-600 truncate flex-1">{referralLink}</span>
                  <button
                    onClick={() => copyToClipboard(referralLink, 'link')}
                    className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${copied === 'link' ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    {copied === 'link' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied === 'link' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Share buttons */}
              <div className="flex gap-2">
                <button
                  onClick={shareWhatsApp}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366] text-white text-sm font-semibold hover:bg-[#1ebe5d] transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Share on WhatsApp
                </button>
                <button
                  onClick={() => copyToClipboard(referralLink, 'link')}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
              </div>

              {/* How it works */}
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-3">How it works</p>
                <div className="space-y-2">
                  {[
                    'Share your referral link or code with friends',
                    'Friend clicks your link and books any service',
                    'Friend completes payment',
                    `You earn ${commissionRate ?? '—'}% commission — paid to your account`,
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                      <p className="text-sm text-blue-800">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Referral history */}
              {records.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Your Referrals</p>
                  <div className="space-y-2">
                    {records.map(r => (
                      <div key={r._id} className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{r.referredUser?.name || 'User'}</p>
                          <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">₹{r.commissionAmount.toLocaleString('en-IN')}</p>
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${r.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : r.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                            {r.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
