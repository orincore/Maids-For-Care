'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  User, Phone, Mail, MapPin, Edit, Save, X, Bell,
  Calendar, Copy, Check, ShieldCheck,
} from 'lucide-react';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
  referralCode?: string;
  isEmailVerified?: boolean;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  role: string;
  createdAt: string;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

function formatAddress(addr?: UserProfile['address']) {
  if (!addr) return null;
  const line1 = addr.street?.trim() || '';
  const parts2 = [addr.city?.trim(), addr.state?.trim(), addr.zipCode?.trim()].filter(Boolean);
  const line2 = parts2.join(', ');
  if (!line1 && !line2) return null;
  return { line1, line2 };
}

function Avatar({ name, image, size = 'lg' }: { name: string; image?: string; size?: 'sm' | 'lg' }) {
  const dim = size === 'lg' ? 'h-20 w-20 text-3xl' : 'h-10 w-10 text-base';
  const initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  if (image) return <img src={image} alt={name} className={`${dim} rounded-full object-cover ring-4 ring-white`} />;
  return (
    <div className={`${dim} rounded-full bg-gray-900 text-white font-bold flex items-center justify-center ring-4 ring-white flex-shrink-0`}>
      {initials}
    </div>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    address: { street: '', city: '', state: '', zipCode: '' },
  });
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const VALID_TABS = ['profile', 'notifications'];
  const tabParam = searchParams.get('tab') ?? '';
  const [activeTab, setActiveTab] = useState(VALID_TABS.includes(tabParam) ? tabParam : 'profile');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) { router.push('/auth/login'); return; }
    fetchUserProfile();
    fetchNotifications();
  }, [session, status, router]);

  useEffect(() => {
    const t = searchParams.get('tab') ?? '';
    if (VALID_TABS.includes(t)) setActiveTab(t);
  }, [searchParams]);

  const fetchUserProfile = async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch('/api/user/profile', {
        headers: { 'Content-Type': 'application/json', 'user-id': session.user.id },
      });
      if (res.ok) {
        const data = await res.json();
        const u = data.user;
        setUser(u);
        setEditForm({
          name: u.name || '',
          phone: u.phone || '',
          address: {
            street: u.address?.street || '',
            city: u.address?.city || '',
            state: u.address?.state || '',
            zipCode: u.address?.zipCode || '',
          },
        });
      }
    } catch (e) {
      console.error('Error fetching profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch('/api/user/notifications', {
        headers: { 'Content-Type': 'application/json', 'user-id': session.user.id },
      });
      if (res.ok) { const d = await res.json(); setNotifications(d.notifications || []); }
    } catch (e) { console.error(e); }
  };

  const handleSaveProfile = async () => {
    if (!session?.user?.id) return;
    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'user-id': session.user.id },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setIsEditing(false);
      } else {
        alert('Failed to update profile');
      }
    } catch (e) {
      console.error(e);
      alert('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const markRead = async (id: string) => {
    if (!session?.user?.id) return;
    try {
      await fetch(`/api/user/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'user-id': session.user.id },
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (e) { console.error(e); }
  };

  const copyReferral = async () => {
    if (!user?.referralCode) return;
    await navigator.clipboard.writeText(user.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }
  if (!session) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Hero card */}
        {user && (
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-900 to-gray-700 h-24" />
            <div className="px-6 pb-6">
              <div className="-mt-10 mb-3">
                <Avatar name={user.name} image={user.profileImage} size="lg" />
              </div>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 leading-tight">{user.name}</h2>
                <p className="text-sm text-gray-500 capitalize">{user.role}</p>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" />{user.email}</span>
                {user.phone
                  ? <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" />{user.phone}</span>
                  : <span className="flex items-center gap-1.5 text-gray-400 italic"><Phone className="w-4 h-4" />No phone added</span>}
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />Joined {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
                {user.isEmailVerified && <span className="flex items-center gap-1 text-emerald-600 font-medium"><ShieldCheck className="w-4 h-4" />Verified</span>}
              </div>

              {/* Referral code */}
              {user.referralCode && (
                <div className="mt-4 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 w-fit">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Referral Code</span>
                  <span className="text-sm font-mono font-bold text-gray-900">{user.referralCode}</span>
                  <button onClick={copyReferral} className="ml-1 p-1 rounded hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-900">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200">
          <nav className="flex border-b border-gray-100 px-4">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
            ].map(({ id, label, icon: Icon, badge }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`relative flex items-center gap-1.5 py-3.5 px-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === id
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
                {badge ? (
                  <span className="absolute -top-0.5 right-0.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {badge > 9 ? '9+' : badge}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>

          {/* ── Profile tab ────────────────────────────────────────────────── */}
          {activeTab === 'profile' && user && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-semibold text-gray-900">Profile Information</h3>
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
                    <Edit className="w-4 h-4" />Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex items-center gap-1 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />{saving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditForm({
                          name: user.name || '',
                          phone: user.phone || '',
                          address: {
                            street: user.address?.street || '',
                            city: user.address?.city || '',
                            state: user.address?.state || '',
                            zipCode: user.address?.zipCode || '',
                          },
                        });
                      }}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                    >
                      <X className="w-4 h-4" />Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-5">
                {/* Name */}
                <Field label="Full Name" icon={<User className="w-4 h-4" />}>
                  {isEditing
                    ? <TextInput value={editForm.name} onChange={v => setEditForm(p => ({ ...p, name: v }))} placeholder="Your full name" />
                    : <Value>{user.name}</Value>}
                </Field>

                {/* Email */}
                <Field label="Email Address" icon={<Mail className="w-4 h-4" />}>
                  <Value>{user.email}</Value>
                  <p className="text-xs text-gray-400 mt-0.5">Email cannot be changed</p>
                </Field>

                {/* Phone */}
                <Field label="Phone Number" icon={<Phone className="w-4 h-4" />}>
                  {isEditing
                    ? <TextInput type="tel" value={editForm.phone} onChange={v => setEditForm(p => ({ ...p, phone: v }))} placeholder="+91 XXXXX XXXXX" />
                    : user.phone
                      ? <Value>{user.phone}</Value>
                      : <Empty>No phone number added</Empty>}
                </Field>

                {/* Address */}
                <Field label="Address" icon={<MapPin className="w-4 h-4" />}>
                  {isEditing ? (
                    <div className="space-y-2.5">
                      <TextInput value={editForm.address.street} onChange={v => setEditForm(p => ({ ...p, address: { ...p.address, street: v } }))} placeholder="Street address" />
                      <div className="grid grid-cols-2 gap-2.5">
                        <TextInput value={editForm.address.city} onChange={v => setEditForm(p => ({ ...p, address: { ...p.address, city: v } }))} placeholder="City" />
                        <TextInput value={editForm.address.state} onChange={v => setEditForm(p => ({ ...p, address: { ...p.address, state: v } }))} placeholder="State" />
                      </div>
                      <TextInput value={editForm.address.zipCode} onChange={v => setEditForm(p => ({ ...p, address: { ...p.address, zipCode: v } }))} placeholder="PIN Code" />
                    </div>
                  ) : (() => {
                    const addr = formatAddress(user.address);
                    return addr
                      ? <div className="text-gray-900 space-y-0.5 text-sm">{addr.line1 && <p>{addr.line1}</p>}{addr.line2 && <p>{addr.line2}</p>}</div>
                      : <Empty>No address added</Empty>;
                  })()}
                </Field>

                {/* Account info */}
                <div className="grid grid-cols-2 gap-5 pt-4 border-t border-gray-100">
                  <Field label="Account Type" icon={null}>
                    <Value className="capitalize">{user.role}</Value>
                  </Field>
                  <Field label="Member Since" icon={null}>
                    <Value>{new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Value>
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* ── Notifications tab ──────────────────────────────────────────── */}
          {activeTab === 'notifications' && (
            <div className="divide-y divide-gray-100">
              {notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <Bell className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-500">No notifications yet</p>
                </div>
              ) : notifications.map(n => (
                <div
                  key={n._id}
                  onClick={() => !n.isRead && markRead(n._id)}
                  className={`px-6 py-4 flex gap-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-blue-50/60' : ''}`}
                >
                  <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${!n.isRead ? 'bg-blue-500' : 'bg-transparent'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${!n.isRead ? 'text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// Small helper components to keep the JSX clean
function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {icon}{label}
      </label>
      {children}
    </div>
  );
}
function Value({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm text-gray-900 ${className}`}>{children}</p>;
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-400 italic">{children}</p>;
}
function TextInput({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
    />
  );
}
