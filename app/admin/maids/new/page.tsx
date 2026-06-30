'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Upload, X, CheckCircle, AlertCircle, FileText,
  User, MapPin, Briefcase, Settings2, ShieldCheck, Image as ImageIcon,
} from 'lucide-react';

interface Service {
  _id: string;
  name: string;
  category: string;
  isActive: boolean;
}

interface DocumentField {
  key: 'aadharCard' | 'panCard' | 'experienceCertificate';
  label: string;
  hint: string;
}

const DOCUMENT_FIELDS: DocumentField[] = [
  { key: 'aadharCard', label: 'Aadhar Card', hint: 'Front + back (JPG, PNG or PDF, max 5 MB)' },
  { key: 'panCard', label: 'PAN Card', hint: 'Clear copy (JPG, PNG or PDF, max 5 MB)' },
  { key: 'experienceCertificate', label: 'Experience Certificate', hint: 'If available (JPG, PNG or PDF, max 5 MB)' },
];

const SECTION = 'font-semibold text-gray-900 text-sm uppercase tracking-wider mb-4 flex items-center gap-2';
const INPUT = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors';
const LABEL = 'block text-sm font-medium text-gray-700 mb-1';

export default function OnboardMaidPage() {
  const router = useRouter();
  const profileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [services, setServices] = useState<Service[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [experience, setExperience] = useState(0);
  const [bio, setBio] = useState('');
  const [specializationsRaw, setSpecializationsRaw] = useState('');
  const [languagesRaw, setLanguagesRaw] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [price, setPrice] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Document / profile upload state
  const [profileImage, setProfileImage] = useState('');
  const [profileUploading, setProfileUploading] = useState(false);
  const [docs, setDocs] = useState<Record<string, string>>({ aadharCard: '', panCard: '', experienceCertificate: '' });
  const [docUploading, setDocUploading] = useState<Record<string, boolean>>({ aadharCard: false, panCard: false, experienceCertificate: false });
  const [docErrors, setDocErrors] = useState<Record<string, string>>({ aadharCard: '', panCard: '', experienceCertificate: '' });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) { router.replace('/auth/admin'); return; }
    fetchServices(token);
  }, [router]);

  const fetchServices = async (token: string) => {
    const res = await fetch('/api/admin/services', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setServices((data.services || []).filter((s: Service) => s.isActive));
    }
  };

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', folder);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.url;
  };

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return setError('Profile photo must be JPG, PNG or WebP.');
    }
    setProfileUploading(true);
    try {
      const url = await uploadFile(file, 'maid-profiles');
      setProfileImage(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Profile upload failed');
    } finally {
      setProfileUploading(false);
    }
  };

  const handleDocUpload = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocUploading(prev => ({ ...prev, [key]: true }));
    setDocErrors(prev => ({ ...prev, [key]: '' }));
    try {
      const url = await uploadFile(file, 'maid-documents');
      setDocs(prev => ({ ...prev, [key]: url }));
    } catch (err: unknown) {
      setDocErrors(prev => ({ ...prev, [key]: err instanceof Error ? err.message : 'Upload failed' }));
    } finally {
      setDocUploading(prev => ({ ...prev, [key]: false }));
    }
  };

  const toggleService = (id: string) => {
    setSelectedServices(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('Name, email, and phone are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken') || '';
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: { street: street.trim(), city: city.trim(), state: state.trim(), zipCode: zipCode.trim() },
        experience: Number(experience),
        bio: bio.trim(),
        specializations: specializationsRaw.split(',').map(s => s.trim()).filter(Boolean),
        languages: languagesRaw.split(',').map(s => s.trim()).filter(Boolean),
        services: selectedServices,
        price: price !== '' ? Number(price) : 0,
        discountedPrice: discountedPrice !== '' ? Number(discountedPrice) : null,
        isVerified,
        isActive,
        profileImage: profileImage || undefined,
        documents: {
          aadharCard: docs.aadharCard || undefined,
          panCard: docs.panCard || undefined,
          experienceCertificate: docs.experienceCertificate || undefined,
        },
      };

      const res = await fetch('/api/admin/service-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        router.push('/admin?tab=providers');
      } else {
        setError(data.error || 'Failed to onboard maid');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isImageUrl = (url: string) => /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 leading-tight truncate">Onboard New Maid</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Fill in all details to register a new maid</p>
            </div>
          </div>
          <button
            type="submit"
            form="maid-form"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors flex-shrink-0"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Onboard Maid
              </>
            )}
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form id="maid-form" onSubmit={handleSubmit} className="space-y-8">

          {/* ── Profile Photo ────────────────────────────────────────────── */}
          <section className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6">
            <h2 className={SECTION}>
              <ImageIcon className="w-4 h-4 text-gray-400" />
              Profile Photo
            </h2>
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <input ref={profileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleProfileUpload} />
                <button
                  type="button"
                  onClick={() => profileInputRef.current?.click()}
                  disabled={profileUploading}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  {profileUploading ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {profileUploading ? 'Uploading…' : profileImage ? 'Change Photo' : 'Upload Photo'}
                </button>
                {profileImage && (
                  <button type="button" onClick={() => setProfileImage('')} className="ml-2 text-sm text-red-500 hover:text-red-700">
                    Remove
                  </button>
                )}
                <p className="text-xs text-gray-400 mt-1.5">JPG, PNG or WebP · Max 5 MB · Optional</p>
              </div>
            </div>
          </section>

          {/* ── Personal Information ─────────────────────────────────────── */}
          <section className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6">
            <h2 className={SECTION}>
              <User className="w-4 h-4 text-gray-400" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className={LABEL}>Full Name <span className="text-red-500">*</span></label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className={INPUT} placeholder="e.g. Priya Sharma" />
              </div>
              <div>
                <label className={LABEL}>Email Address <span className="text-red-500">*</span></label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={INPUT} placeholder="priya@example.com" />
              </div>
              <div>
                <label className={LABEL}>Phone Number <span className="text-red-500">*</span></label>
                <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className={INPUT} placeholder="+91 98765 43210" />
              </div>
            </div>
          </section>

          {/* ── Address ─────────────────────────────────────────────────── */}
          <section className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6">
            <h2 className={SECTION}>
              <MapPin className="w-4 h-4 text-gray-400" />
              Address
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className={LABEL}>Street</label>
                <input type="text" value={street} onChange={e => setStreet(e.target.value)} className={INPUT} placeholder="123 MG Road" />
              </div>
              <div>
                <label className={LABEL}>City</label>
                <input type="text" value={city} onChange={e => setCity(e.target.value)} className={INPUT} placeholder="Bengaluru" />
              </div>
              <div>
                <label className={LABEL}>State</label>
                <input type="text" value={state} onChange={e => setState(e.target.value)} className={INPUT} placeholder="Karnataka" />
              </div>
              <div>
                <label className={LABEL}>Pin Code</label>
                <input type="text" value={zipCode} onChange={e => setZipCode(e.target.value)} className={INPUT} placeholder="560001" />
              </div>
            </div>
          </section>

          {/* ── Professional Details ─────────────────────────────────────── */}
          <section className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6">
            <h2 className={SECTION}>
              <Briefcase className="w-4 h-4 text-gray-400" />
              Professional Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={LABEL}>Experience (years)</label>
                <input type="number" min={0} max={50} value={experience} onChange={e => setExperience(Number(e.target.value))} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Hourly Rate (₹)</label>
                <input type="number" min={0} value={price} onChange={e => setPrice(e.target.value)} className={INPUT} placeholder="500" />
              </div>
              <div>
                <label className={LABEL}>Discounted Rate (₹) <span className="text-gray-400 font-normal text-xs">optional</span></label>
                <input type="number" min={0} value={discountedPrice} onChange={e => setDiscountedPrice(e.target.value)} className={INPUT} placeholder="Leave blank if no discount" />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL}>Bio</label>
                <textarea rows={3} value={bio} onChange={e => setBio(e.target.value)} className={INPUT + ' resize-none'} placeholder="Brief introduction about the maid's skills and personality…" />
              </div>
              <div>
                <label className={LABEL}>Specializations</label>
                <input type="text" value={specializationsRaw} onChange={e => setSpecializationsRaw(e.target.value)} className={INPUT} placeholder="Cleaning, Cooking, Laundry" />
                <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
              </div>
              <div>
                <label className={LABEL}>Languages Spoken</label>
                <input type="text" value={languagesRaw} onChange={e => setLanguagesRaw(e.target.value)} className={INPUT} placeholder="Hindi, Kannada, English" />
                <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
              </div>
            </div>
          </section>

          {/* ── Services ─────────────────────────────────────────────────── */}
          {services.length > 0 && (
            <section className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6">
              <h2 className={SECTION}>
                <Settings2 className="w-4 h-4 text-gray-400" />
                Assign Services
                <span className="ml-auto text-xs font-normal text-gray-400 normal-case tracking-normal">
                  {selectedServices.length} selected
                </span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {services.map(svc => {
                  const on = selectedServices.includes(svc._id);
                  return (
                    <button
                      key={svc._id}
                      type="button"
                      onClick={() => toggleService(svc._id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                        on ? 'bg-gray-900 text-white border-gray-900 shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border-2 transition-colors ${on ? 'bg-white border-white' : 'border-gray-300'}`}>
                        {on && <CheckCircle className="w-3 h-3 text-gray-900 fill-none stroke-gray-900" strokeWidth={2.5} />}
                      </div>
                      <span className="truncate">{svc.name}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Documents ────────────────────────────────────────────────── */}
          <section className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6">
            <h2 className={SECTION}>
              <FileText className="w-4 h-4 text-gray-400" />
              Documents
            </h2>
            <div className="space-y-5">
              {DOCUMENT_FIELDS.map(({ key, label, hint }) => (
                <DocumentUploadRow
                  key={key}
                  label={label}
                  hint={hint}
                  url={docs[key]}
                  uploading={docUploading[key]}
                  error={docErrors[key]}
                  isImage={isImageUrl(docs[key])}
                  onChange={e => handleDocUpload(key, e)}
                  onRemove={() => setDocs(prev => ({ ...prev, [key]: '' }))}
                />
              ))}
            </div>
          </section>

          {/* ── Status ───────────────────────────────────────────────────── */}
          <section className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6">
            <h2 className={SECTION}>
              <ShieldCheck className="w-4 h-4 text-gray-400" />
              Status &amp; Verification
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Toggle
                label="Mark as Verified"
                description="Documents checked and approved"
                enabled={isVerified}
                color="emerald"
                onChange={() => setIsVerified(p => !p)}
              />
              <Toggle
                label="Set as Active"
                description="Visible to customers for booking"
                enabled={isActive}
                color="blue"
                onChange={() => setIsActive(p => !p)}
              />
            </div>
          </section>

          {/* ── Bottom submit (for small screens) ───────────────────────── */}
          <div className="flex justify-end gap-3 pb-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : 'Onboard Maid'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function DocumentUploadRow({
  label, hint, url, uploading, error, isImage, onChange, onRemove,
}: {
  label: string; hint: string; url: string; uploading: boolean;
  error: string; isImage: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50/50">
      {/* Preview / placeholder */}
      <div className="w-16 h-16 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {url ? (
          isImage ? (
            <img src={url} alt={label} className="w-full h-full object-cover" />
          ) : (
            <FileText className="w-7 h-7 text-blue-500" />
          )
        ) : (
          <FileText className="w-7 h-7 text-gray-300" />
        )}
      </div>

      {/* Info + controls */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-400 mb-2">{hint}</p>
        {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
        <div className="flex items-center gap-2 flex-wrap">
          <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={onChange} />
          <button
            type="button"
            onClick={() => ref.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {uploading ? (
              <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            {uploading ? 'Uploading…' : url ? 'Replace' : 'Upload'}
          </button>
          {url && !uploading && (
            <>
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                View
              </a>
              <button type="button" onClick={onRemove} className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
                <X className="w-3.5 h-3.5" /> Remove
              </button>
            </>
          )}
        </div>
        {url && !uploading && (
          <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1.5">
            <CheckCircle className="w-3.5 h-3.5" /> Uploaded successfully
          </p>
        )}
      </div>
    </div>
  );
}

function Toggle({ label, description, enabled, color, onChange }: {
  label: string; description: string; enabled: boolean;
  color: 'emerald' | 'blue'; onChange: () => void;
}) {
  const track = enabled
    ? color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500'
    : 'bg-gray-200';
  return (
    <div className="flex items-center justify-between gap-4 bg-gray-50 rounded-xl px-4 py-3.5 border border-gray-200">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 ${enabled ? `focus:ring-${color}-500` : 'focus:ring-gray-300'} ${track}`}
      >
        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}
