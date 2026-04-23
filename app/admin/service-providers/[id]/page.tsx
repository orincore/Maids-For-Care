'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Star, 
  CheckCircle, 
  XCircle, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  Briefcase,
  Award,
  Clock,
  FileText,
  User,
  Edit,
  Save,
  Upload,
  Eye,
  X,
  Tag,
  TrendingDown,
  ShieldCheck,
  ShieldOff,
  ToggleLeft,
  ToggleRight,
  Plus,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

interface ServiceProvider {
  _id: string;
  name: string;
  email: string;
  phone: string;
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  isActive: boolean;
  services: Array<{
    _id: string;
    name: string;
    category: string;
    price?: number;
    discountedPrice?: number;
    duration?: number;
  }>;
  experience: number;
  createdAt: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  bio?: string;
  languages?: string[];
  specializations?: string[];
  availability?: {
    monday?: { start?: string; end?: string; available?: boolean };
    tuesday?: { start?: string; end?: string; available?: boolean };
    wednesday?: { start?: string; end?: string; available?: boolean };
    thursday?: { start?: string; end?: string; available?: boolean };
    friday?: { start?: string; end?: string; available?: boolean };
    saturday?: { start?: string; end?: string; available?: boolean };
    sunday?: { start?: string; end?: string; available?: boolean };
  };
  documents?: {
    aadharCard?: string;
    panCard?: string;
    experienceCertificate?: string;
  };
  price?: number;
  discountedPrice?: number;
  profileImage?: string;
  documentsVerified?: {
    aadharCard?: boolean;
    panCard?: boolean;
    experienceCertificate?: boolean;
  };
}

interface AllService {
  _id: string;
  name: string;
  category: string;
  price: number;
  discountedPrice?: number;
  duration: number;
}

export default function ServiceProviderDetailPage() {
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedProvider, setEditedProvider] = useState<Partial<ServiceProvider>>({});
  const [previewDoc, setPreviewDoc] = useState<{url: string, name: string} | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [allServices, setAllServices] = useState<AllService[]>([]);
  const [editingPricing, setEditingPricing] = useState(false);
  const [priceInput, setPriceInput] = useState(0);
  const [discountedPriceInput, setDiscountedPriceInput] = useState(0);
  const [savingPricing, setSavingPricing] = useState(false);
  const [assigningServices, setAssigningServices] = useState(false);
  const [isCreateServiceModalOpen, setIsCreateServiceModalOpen] = useState(false);
  const [creatingService, setCreatingService] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    price: '',
    discountedPrice: '',
    duration: '1',
    category: 'cleaning',
    isActive: true,
  });
  const router = useRouter();
  const params = useParams();
  const providerId = params.id as string;

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      router.push('/auth/admin');
      return;
    }
    fetchProviderDetails();
    fetchAllServices();
  }, [providerId]);

  const fetchAllServices = async () => {
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      if (res.ok) setAllServices(data.services || []);
    } catch (e) {
      console.error('Failed to fetch services', e);
    }
  };

  const fetchProviderDetails = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`/api/service-providers/${providerId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setProvider(data.serviceProvider);
      } else {
        alert('Failed to fetch provider details');
        router.push('/admin/service-providers');
      }
    } catch (error) {
      console.error('Error fetching provider details:', error);
      alert('Error fetching provider details');
      router.push('/admin/service-providers');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!provider) return;
    
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`/api/service-providers/${providerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ isActive: !provider.isActive }),
      });

      if (response.ok) {
        await fetchProviderDetails();
        alert(`Service provider ${!provider.isActive ? 'activated' : 'deactivated'} successfully`);
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const handleVerificationToggle = async () => {
    if (!provider) return;
    
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`/api/service-providers/${providerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ isVerified: !provider.isVerified }),
      });

      if (response.ok) {
        await fetchProviderDetails();
        alert(`Service provider ${!provider.isVerified ? 'verified' : 'unverified'} successfully`);
      } else {
        alert('Failed to update verification status');
      }
    } catch (error) {
      console.error('Error updating verification:', error);
      alert('Error updating verification status');
    }
  };

  const startEditing = (section: string) => {
    setEditingSection(section);
    setEditedProvider({ ...provider });
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setEditedProvider({});
  };

  const saveChanges = async (section: string) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      let updateData: any = {};

      switch (section) {
        case 'availability':
          updateData = { availability: editedProvider.availability };
          break;
        case 'bio':
          updateData = { 
            bio: editedProvider.bio,
            experience: editedProvider.experience,
            languages: editedProvider.languages
          };
          break;
        case 'address':
          updateData = { address: editedProvider.address };
          break;
        case 'documentsVerified':
          updateData = { documentsVerified: editedProvider.documentsVerified };
          break;
        case 'services':
          // Update each service's pricing individually via separate API calls
          for (const svc of editedProvider.services || []) {
            await fetch(`/api/admin/services/${svc._id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
              },
              body: JSON.stringify({
                price: svc.price,
                discountedPrice: svc.discountedPrice,
              }),
            });
          }
          await fetchProviderDetails();
          setEditingSection(null);
          setEditedProvider({});
          alert('Service pricing updated successfully');
          return;
      }

      const response = await fetch(`/api/service-providers/${providerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        await fetchProviderDetails();
        setEditingSection(null);
        setEditedProvider({});
        alert('Changes saved successfully');
      } else {
        alert('Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Error saving changes');
    }
  };

  const handleAvailabilityChange = (day: string, field: string, value: any) => {
    setEditedProvider(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability?.[day as keyof typeof prev.availability],
          [field]: value
        }
      }
    }));
  };

  const handleDocumentVerification = (docType: string, verified: boolean) => {
    setEditedProvider(prev => ({
      ...prev,
      documentsVerified: {
        ...prev.documentsVerified,
        [docType]: verified
      }
    }));
  };

  const isServiceAssigned = (serviceId: string) =>
    provider?.services.some(s => s._id === serviceId) ?? false;

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingService(true);
    const adminToken = localStorage.getItem('adminToken');
    try {
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({
          ...newService,
          price: parseInt(newService.price) || 0,
          discountedPrice: newService.discountedPrice ? parseInt(newService.discountedPrice) : null,
          duration: parseInt(newService.duration) || 1,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsCreateServiceModalOpen(false);
        setNewService({
          name: '',
          description: '',
          price: '',
          discountedPrice: '',
          duration: '1',
          category: 'cleaning',
          isActive: true,
        });
        await fetchAllServices();
        // Auto-assign the new service to this provider
        if (data.service?._id) {
          await toggleServiceAssignment(data.service._id);
        }
        alert('Service created and assigned successfully');
      } else {
        alert('Failed to create service');
      }
    } catch (e) {
      alert('Error creating service');
    } finally {
      setCreatingService(false);
    }
  };

  const toggleServiceAssignment = async (serviceId: string) => {
    if (!provider) return;
    setAssigningServices(true);
    const adminToken = localStorage.getItem('adminToken');
    const currentIds = provider.services.map(s => s._id);
    const newIds = currentIds.includes(serviceId)
      ? currentIds.filter(id => id !== serviceId)
      : [...currentIds, serviceId];

    try {
      const res = await fetch(`/api/service-providers/${providerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({ services: newIds }),
      });
      if (res.ok) {
        await fetchProviderDetails();
      } else {
        alert('Failed to update services');
      }
    } catch (e) {
      alert('Error updating services');
    } finally {
      setAssigningServices(false);
    }
  };

  const startEditingPricing = () => {
    if (!provider) return;
    setPriceInput(provider.price || 0);
    setDiscountedPriceInput(provider.discountedPrice || 0);
    setEditingPricing(true);
  };

  const savePricing = async () => {
    setSavingPricing(true);
    const adminToken = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`/api/service-providers/${providerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({
          price: priceInput,
          discountedPrice: discountedPriceInput > 0 ? discountedPriceInput : null,
        }),
      });
      if (res.ok) {
        await fetchProviderDetails();
        setEditingPricing(false);
      } else {
        alert('Failed to save pricing');
      }
    } catch (e) {
      alert('Error saving pricing');
    } finally {
      setSavingPricing(false);
    }
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const adminToken = localStorage.getItem('adminToken');
      // Upload to cloudinary
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
        body: formData,
      });

      if (uploadRes.ok) {
        const { url } = await uploadRes.json();
        
        // Update provider profile image
        const updateRes = await fetch(`/api/service-providers/${providerId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ profileImage: url }),
        });

        if (updateRes.ok) {
          await fetchProviderDetails();
          alert('Profile photo updated successfully');
        }
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Error uploading photo');
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(docType);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const adminToken = localStorage.getItem('adminToken');
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
        body: formData,
      });

      if (uploadRes.ok) {
        const { url } = await uploadRes.json();
        
        const updateData: any = {};
        updateData[`documents.${docType}`] = url;

        const updateRes = await fetch(`/api/service-providers/${providerId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`,
          },
          body: JSON.stringify(updateData),
        });

        if (updateRes.ok) {
          await fetchProviderDetails();
          alert('Document uploaded successfully');
        }
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Error uploading document');
    } finally {
      setUploadingDoc(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Provider Not Found</h2>
          <Button onClick={() => router.push('/admin/service-providers')}>
            Back to List
          </Button>
        </div>
      </div>
    );
  }

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-between items-center gap-3 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/admin/service-providers')}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Providers</span>
              </button>
              <span className="text-gray-300 hidden sm:inline">|</span>
              <h1 className="text-lg font-bold text-gray-900 truncate">{provider.name}</h1>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleVerificationToggle}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                  provider.isVerified
                    ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                    : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                {provider.isVerified ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                <span className="hidden sm:inline">{provider.isVerified ? 'Unverify' : 'Verify'}</span>
              </button>
              <button
                onClick={handleStatusToggle}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                  provider.isActive
                    ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                    : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                {provider.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                <span className="hidden sm:inline">{provider.isActive ? 'Deactivate' : 'Activate'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Provider Profile Hero Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-900 to-gray-700 h-24 sm:h-32" />
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-16">
              {/* Avatar */}
              <div className="relative group self-start">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white bg-gray-200 flex items-center justify-center overflow-hidden shadow-md flex-shrink-0">
                  {provider.profileImage ? (
                    <img src={provider.profileImage} alt={provider.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-gray-400" />
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-2xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <Upload className="w-5 h-5 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleProfilePhotoUpload} />
                </label>
              </div>
              {/* Name + meta */}
              <div className="flex-1 min-w-0 pt-2 sm:pt-0 sm:pb-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{provider.name}</h2>
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${provider.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {provider.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${provider.isVerified ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {provider.isVerified ? '✓ Verified' : 'Unverified'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mb-3">
                  <Star className="w-4 h-4 fill-current text-yellow-500" />
                  <span className="text-sm font-semibold text-gray-900">{provider.rating.toFixed(1)}</span>
                  <span className="text-sm text-gray-500">({provider.totalReviews} reviews)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" /><span className="truncate">{provider.email}</span></div>
                  <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" />{provider.phone}</div>
                  <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" />Joined {new Date(provider.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Skills + Pricing Card (FULL WIDTH) ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">

            {/* LEFT: Skills (assign services as tags) */}
            <div>
              <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
                <div className="p-2 bg-violet-50 rounded-lg">
                  <Briefcase className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Skills / Services</h3>
                  <p className="text-xs text-gray-500">Toggle to assign services to this provider</p>
                </div>
              </div>
              <div className="px-6 py-5">
                <div className="flex flex-wrap gap-2 mb-4">
                  {allServices.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No services found.</p>
                  ) : (
                    allServices.map(svc => {
                      const assigned = isServiceAssigned(svc._id);
                      return (
                        <button
                          key={svc._id}
                          onClick={() => toggleServiceAssignment(svc._id)}
                          disabled={assigningServices}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all disabled:opacity-50 ${
                            assigned
                              ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-violet-400 hover:text-violet-600'
                          }`}
                        >
                          {assigned && <CheckCircle className="w-3.5 h-3.5" />}
                          {svc.name}
                        </button>
                      );
                    })
                  )}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  {provider.services.length > 0 && (
                    <p className="text-xs text-gray-500">{provider.services.length} service{provider.services.length !== 1 ? 's' : ''} assigned</p>
                  )}
                  <button
                    onClick={() => setIsCreateServiceModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Service
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT: Single pricing */}
            <div>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <Tag className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Pricing</h3>
                    <p className="text-xs text-gray-500">Single price for booking this provider</p>
                  </div>
                </div>
                {editingPricing ? (
                  <div className="flex gap-2">
                    <button onClick={() => setEditingPricing(false)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                      <X className="w-3.5 h-3.5 inline mr-1" />Cancel
                    </button>
                    <button onClick={savePricing} disabled={savingPricing}
                      className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 font-medium">
                      <Save className="w-3.5 h-3.5 inline mr-1" />{savingPricing ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                ) : (
                  <button onClick={startEditingPricing}
                    className="px-3 py-1.5 text-sm border border-indigo-200 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium">
                    <Edit className="w-3.5 h-3.5 inline mr-1" />Edit
                  </button>
                )}
              </div>

              <div className="px-6 py-5">
                {editingPricing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Normal Price (₹) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                        <input
                          type="number" min="0"
                          value={priceInput || ''}
                          onChange={e => setPriceInput(parseInt(e.target.value) || 0)}
                          className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          placeholder="e.g. 500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                        <TrendingDown className="w-3.5 h-3.5 text-green-500" />
                        Discounted Price (₹) <span className="text-gray-400 font-normal text-xs">— optional</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                        <input
                          type="number" min="0"
                          value={discountedPriceInput || ''}
                          onChange={e => setDiscountedPriceInput(parseInt(e.target.value) || 0)}
                          className={`w-full pl-8 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                            discountedPriceInput > 0 && discountedPriceInput >= priceInput
                              ? 'border-red-300 focus:ring-red-400'
                              : 'border-gray-300 focus:ring-green-400'
                          }`}
                          placeholder="Leave empty for no discount"
                        />
                      </div>
                      {discountedPriceInput > 0 && discountedPriceInput < priceInput && (
                        <p className="text-xs text-green-600 mt-1.5 font-medium">
                          Customer saves ₹{priceInput - discountedPriceInput} ({Math.round(((priceInput - discountedPriceInput) / priceInput) * 100)}% off)
                        </p>
                      )}
                      {discountedPriceInput > 0 && discountedPriceInput >= priceInput && (
                        <p className="text-xs text-red-500 mt-1.5">Discounted price must be less than ₹{priceInput}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    {(provider.price || 0) > 0 ? (
                      <div className="flex items-end gap-3">
                        <div>
                          {provider.discountedPrice && provider.discountedPrice > 0 && provider.discountedPrice < provider.price! ? (
                            <>
                              <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-gray-900">₹{provider.discountedPrice}</span>
                                <span className="text-lg text-gray-400 line-through">₹{provider.price}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full">
                                  {Math.round(((provider.price! - provider.discountedPrice) / provider.price!) * 100)}% off
                                </span>
                                <span className="text-sm text-green-600">Save ₹{provider.price! - provider.discountedPrice}</span>
                              </div>
                            </>
                          ) : (
                            <span className="text-3xl font-bold text-gray-900">₹{provider.price}</span>
                          )}
                          <p className="text-xs text-gray-400 mt-2">per booking</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-start gap-2">
                        <span className="text-sm text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                          ⚠ No price set yet
                        </span>
                        <button onClick={startEditingPricing} className="text-xs text-indigo-600 underline">
                          Set price now
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── 3-column grid for details ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left col: Experience + Address */}
          <div className="space-y-6">
            {/* Experience & Bio */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-50 rounded-lg"><Award className="w-4 h-4 text-amber-600" /></div>
                  <h3 className="font-semibold text-gray-900">Experience & Bio</h3>
                </div>
                {editingSection === 'bio' ? (
                  <div className="flex gap-2">
                    <button onClick={cancelEditing} className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"><X className="w-3.5 h-3.5 inline mr-0.5" />Cancel</button>
                    <button onClick={() => saveChanges('bio')} className="px-2.5 py-1 text-xs bg-gray-900 text-white rounded-lg hover:bg-gray-700"><Save className="w-3.5 h-3.5 inline mr-0.5" />Save</button>
                  </div>
                ) : (
                  <button onClick={() => startEditing('bio')} className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"><Edit className="w-3.5 h-3.5 inline mr-0.5" />Edit</button>
                )}
              </div>
              <div className="px-6 py-4 space-y-4">
                {editingSection === 'bio' ? (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Experience (years)</label>
                      <input type="number" value={editedProvider.experience || 0}
                        onChange={(e) => setEditedProvider(prev => ({ ...prev, experience: parseInt(e.target.value) || 0 }))}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Bio</label>
                      <textarea value={editedProvider.bio || ''}
                        onChange={(e) => setEditedProvider(prev => ({ ...prev, bio: e.target.value }))}
                        rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Languages (comma separated)</label>
                      <input value={editedProvider.languages?.join(', ') || ''}
                        onChange={(e) => setEditedProvider(prev => ({ ...prev, languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                        placeholder="Hindi, English, Marathi"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold text-gray-900">{provider.experience} yrs</span>
                      <span className="text-gray-500 text-sm">experience</span>
                    </div>
                    {provider.bio && <p className="text-sm text-gray-600 leading-relaxed">{provider.bio}</p>}
                    {provider.languages && provider.languages.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">LANGUAGES</p>
                        <div className="flex flex-wrap gap-1.5">
                          {provider.languages.map(lang => <span key={lang} className="px-2.5 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">{lang}</span>)}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-rose-50 rounded-lg"><MapPin className="w-4 h-4 text-rose-500" /></div>
                  <h3 className="font-semibold text-gray-900">Address</h3>
                </div>
                {editingSection === 'address' ? (
                  <div className="flex gap-2">
                    <button onClick={cancelEditing} className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"><X className="w-3.5 h-3.5 inline mr-0.5" />Cancel</button>
                    <button onClick={() => saveChanges('address')} className="px-2.5 py-1 text-xs bg-gray-900 text-white rounded-lg hover:bg-gray-700"><Save className="w-3.5 h-3.5 inline mr-0.5" />Save</button>
                  </div>
                ) : (
                  <button onClick={() => startEditing('address')} className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"><Edit className="w-3.5 h-3.5 inline mr-0.5" />Edit</button>
                )}
              </div>
              <div className="px-6 py-4 space-y-3">
                {editingSection === 'address' ? (
                  <>
                    {[
                      { label: 'Street', key: 'street', placeholder: 'Street address' },
                      { label: 'City', key: 'city', placeholder: 'City' },
                      { label: 'State', key: 'state', placeholder: 'State' },
                      { label: 'PIN Code', key: 'zipCode', placeholder: 'PIN Code' },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                        <input
                          value={(editedProvider.address as any)?.[key] || ''}
                          onChange={(e) => setEditedProvider(prev => ({ ...prev, address: { ...prev.address, [key]: e.target.value } }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                          placeholder={placeholder}
                        />
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-sm text-gray-600 space-y-1">
                    {provider.address?.street && <p>{provider.address.street}</p>}
                    {(provider.address?.city || provider.address?.state) && (
                      <p>{[provider.address?.city, provider.address?.state].filter(Boolean).join(', ')}</p>
                    )}
                    {provider.address?.zipCode && <p>PIN: {provider.address.zipCode}</p>}
                    {!provider.address?.street && !provider.address?.city && !provider.address?.state && !provider.address?.zipCode && (
                      <p className="text-gray-400 italic">No address provided</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Middle col: Availability */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 rounded-lg"><Clock className="w-4 h-4 text-blue-600" /></div>
                  <h3 className="font-semibold text-gray-900">Availability</h3>
                </div>
                {editingSection === 'availability' ? (
                  <div className="flex gap-2">
                    <button onClick={cancelEditing} className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"><X className="w-3.5 h-3.5 inline mr-0.5" />Cancel</button>
                    <button onClick={() => saveChanges('availability')} className="px-2.5 py-1 text-xs bg-gray-900 text-white rounded-lg hover:bg-gray-700"><Save className="w-3.5 h-3.5 inline mr-0.5" />Save</button>
                  </div>
                ) : (
                  <button onClick={() => startEditing('availability')} className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"><Edit className="w-3.5 h-3.5 inline mr-0.5" />Edit</button>
                )}
              </div>
              <div className="px-6 py-2">
                {daysOfWeek.map(({ key, label }) => {
                  const displayDay = provider.availability?.[key as keyof typeof provider.availability];
                  const editDay = editedProvider.availability?.[key as keyof typeof editedProvider.availability];
                  const day = editingSection === 'availability' ? editDay : displayDay;
                  const isEdit = editingSection === 'availability';

                  return (
                    <div key={key} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 gap-2">
                      <span className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">{label}</span>
                      {isEdit ? (
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={day?.available || false}
                              onChange={(e) => handleAvailabilityChange(key, 'available', e.target.checked)}
                              className="w-4 h-4 accent-indigo-600"
                            />
                            <span className="text-xs text-gray-600">Available</span>
                          </label>
                          {day?.available && (
                            <div className="flex items-center gap-1">
                              <input type="time" value={day?.start || '09:00'}
                                onChange={(e) => handleAvailabilityChange(key, 'start', e.target.value)}
                                className="px-1.5 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                              />
                              <span className="text-gray-400 text-xs">–</span>
                              <input type="time" value={day?.end || '17:00'}
                                onChange={(e) => handleAvailabilityChange(key, 'end', e.target.value)}
                                className="px-1.5 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                              />
                            </div>
                          )}
                        </div>
                      ) : day?.available ? (
                        <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">{day.start} – {day.end}</span>
                      ) : (
                        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">Off</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right col: Documents */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-50 rounded-lg"><FileText className="w-4 h-4 text-purple-600" /></div>
                  <h3 className="font-semibold text-gray-900">Documents</h3>
                </div>
                {editingSection === 'documents' ? (
                  <div className="flex gap-2">
                    <button onClick={cancelEditing} className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"><X className="w-3.5 h-3.5 inline mr-0.5" />Cancel</button>
                    <button onClick={() => saveChanges('documentsVerified')} className="px-2.5 py-1 text-xs bg-gray-900 text-white rounded-lg hover:bg-gray-700"><Save className="w-3.5 h-3.5 inline mr-0.5" />Save</button>
                  </div>
                ) : (
                  <button onClick={() => startEditing('documents')} className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"><Edit className="w-3.5 h-3.5 inline mr-0.5" />Verify Docs</button>
                )}
              </div>
              <div className="px-6 py-4 space-y-3">
                {[
                  { label: 'Aadhar Card', key: 'aadharCard', docKey: 'aadharCard' as const },
                  { label: 'PAN Card', key: 'panCard', docKey: 'panCard' as const },
                  { label: 'Experience Cert.', key: 'experienceCertificate', docKey: 'experienceCertificate' as const },
                ].map(({ label, key, docKey }) => {
                  const docUrl = provider.documents?.[docKey];
                  const isVerified = provider.documentsVerified?.[docKey];
                  const editVerified = editedProvider.documentsVerified?.[docKey];

                  return (
                    <div key={key} className="p-3 border border-gray-100 rounded-xl bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">{label}</span>
                          {!editingSection && isVerified && (
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">✓ Verified</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {docUrl ? (
                            <button
                              onClick={() => setPreviewDoc({ url: docUrl, name: label })}
                              className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 underline"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>
                          ) : null}
                          <label className="cursor-pointer">
                            <span className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-2 py-0.5 bg-white">
                              <Upload className="w-3 h-3" />
                              {uploadingDoc === key ? 'Uploading…' : docUrl ? 'Replace' : 'Upload'}
                            </span>
                            <input type="file" className="hidden" onChange={(e) => handleDocumentUpload(e, docKey)} />
                          </label>
                        </div>
                      </div>
                      {editingSection === 'documents' && docUrl && (
                        <label className="flex items-center gap-2 cursor-pointer mt-1">
                          <input type="checkbox"
                            checked={editVerified || false}
                            onChange={(e) => handleDocumentVerification(docKey, e.target.checked)}
                            className="w-4 h-4 accent-green-600"
                          />
                          <span className="text-xs text-gray-600">Mark as verified</span>
                          {editVerified && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">✓ Verified</span>}
                        </label>
                      )}
                      {!docUrl && (
                        <p className="text-xs text-gray-400 mt-1">Not uploaded yet</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Service Modal */}
      <Modal isOpen={isCreateServiceModalOpen} onClose={() => setIsCreateServiceModalOpen(false)} title="Create New Service" size="md">
        <form onSubmit={handleCreateService} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={newService.name}
              onChange={e => setNewService(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              placeholder="e.g., Deep Cleaning"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
            <textarea
              required
              value={newService.description}
              onChange={e => setNewService(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
              placeholder="Describe the service..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) <span className="text-red-500">*</span></label>
              <input
                type="number"
                required
                min="0"
                value={newService.price}
                onChange={e => setNewService(prev => ({ ...prev, price: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                placeholder="500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discounted Price (₹)</label>
              <input
                type="number"
                min="0"
                value={newService.discountedPrice}
                onChange={e => setNewService(prev => ({ ...prev, discountedPrice: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (hours) <span className="text-red-500">*</span></label>
              <select
                value={newService.duration}
                onChange={e => setNewService(prev => ({ ...prev, duration: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                <option value="1">1 hour</option>
                <option value="2">2 hours</option>
                <option value="3">3 hours</option>
                <option value="4">4 hours</option>
                <option value="5">5 hours</option>
                <option value="6">6 hours</option>
                <option value="8">8 hours</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
              <select
                value={newService.category}
                onChange={e => setNewService(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                <option value="cleaning">Cleaning</option>
                <option value="cooking">Cooking</option>
                <option value="laundry">Laundry</option>
                <option value="childcare">Childcare</option>
                <option value="eldercare">Eldercare</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={newService.isActive}
              onChange={e => setNewService(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 accent-violet-600"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsCreateServiceModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingService || !newService.name || !newService.description || !newService.price}
              className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {creatingService && <Loader2 className="w-4 h-4 animate-spin" />}
              {creatingService ? 'Creating...' : 'Create & Assign'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Document Preview Modal */}
      <Modal isOpen={!!previewDoc} onClose={() => setPreviewDoc(null)} title={previewDoc?.name || 'Document Preview'} size="xl">
        {previewDoc && (
          <div className="flex flex-col items-center">
            {previewDoc.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img src={previewDoc.url} alt={previewDoc.name} className="max-w-full max-h-[70vh] object-contain rounded-lg" />
            ) : previewDoc.url.match(/\.pdf$/i) ? (
              <div className="w-full h-[70vh]">
                <iframe src={previewDoc.url} className="w-full h-full border-0 rounded-lg" title={previewDoc.name} />
                <div className="text-center mt-3">
                  <a href={previewDoc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1 text-sm">
                    <Eye className="w-4 h-4" /> Open in New Tab
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <FileText className="w-14 h-14 mx-auto mb-4 text-gray-300" />
                <p className="mb-1 text-gray-700 font-medium">{previewDoc.name}</p>
                <p className="mb-5 text-sm text-gray-400">This file type cannot be previewed</p>
                <a href={previewDoc.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium">
                  <Upload className="w-4 h-4" /> Download Document
                </a>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
