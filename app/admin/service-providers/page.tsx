'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, Star, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
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
  }>;
  experience: number;
  createdAt: string;
}

export default function ServiceProvidersPage() {
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      router.push('/auth/admin');
      return;
    }
    fetchServiceProviders();
  }, []);

  const fetchServiceProviders = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch('/api/service-providers', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setServiceProviders(data.serviceProviders || []);
      }
    } catch (error) {
      console.error('Error fetching service providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (providerId: string, currentStatus: boolean) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`/api/service-providers/${providerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        await fetchServiceProviders();
        alert(`Service provider ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      } else {
        alert('Failed to update service provider status');
      }
    } catch (error) {
      console.error('Error updating service provider status:', error);
      alert('Error updating service provider status');
    }
  };

  const handleVerificationToggle = async (providerId: string, currentStatus: boolean) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`/api/service-providers/${providerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ isVerified: !currentStatus }),
      });

      if (response.ok) {
        await fetchServiceProviders();
        alert(`Service provider ${!currentStatus ? 'verified' : 'unverified'} successfully`);
      } else {
        alert('Failed to update verification status');
      }
    } catch (error) {
      console.error('Error updating verification status:', error);
      alert('Error updating verification status');
    }
  };

  const filteredProviders = serviceProviders.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && provider.isActive) ||
                         (statusFilter === 'inactive' && !provider.isActive) ||
                         (statusFilter === 'verified' && provider.isVerified) ||
                         (statusFilter === 'unverified' && !provider.isVerified);

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Service Providers</h1>
            <div className="flex items-center space-x-4">
              <Button onClick={() => router.push('/admin')}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Providers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{serviceProviders.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {serviceProviders.filter(p => p.isActive).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Verified</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {serviceProviders.filter(p => p.isVerified).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Avg Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {serviceProviders.length > 0 
                  ? (serviceProviders.reduce((sum, p) => sum + p.rating, 0) / serviceProviders.length).toFixed(1)
                  : '0.0'
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Providers List */}
        <Card>
          <CardHeader>
            <CardTitle>Service Providers ({filteredProviders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredProviders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No service providers found.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProviders.map((provider) => (
                  <div key={provider._id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
                        <p className="text-gray-600">{provider.email}</p>
                        <p className="text-gray-600">{provider.phone}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={provider.isActive ? 'success' : 'destructive'}>
                          {provider.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant={provider.isVerified ? 'success' : 'warning'}>
                          {provider.isVerified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-2 text-yellow-400" />
                        {provider.rating.toFixed(1)} ({provider.totalReviews} reviews)
                      </div>
                      <div>
                        Experience: {provider.experience} years
                      </div>
                      <div>
                        Services: {provider.services.length}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        Joined {new Date(provider.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/service-providers/${provider._id}`)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                        <Button
                          variant={provider.isVerified ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => handleVerificationToggle(provider._id, provider.isVerified)}
                        >
                          {provider.isVerified ? (
                            <>
                              <XCircle className="w-4 h-4 mr-1" />
                              Unverify
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Verify
                            </>
                          )}
                        </Button>
                        <Button
                          variant={provider.isActive ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => handleStatusToggle(provider._id, provider.isActive)}
                        >
                          {provider.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Provider Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Service Provider Details"
        size="xl"
      >
        {selectedProvider && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="space-y-2">
                  <p><strong>Name:</strong> {selectedProvider.name}</p>
                  <p><strong>Email:</strong> {selectedProvider.email}</p>
                  <p><strong>Phone:</strong> {selectedProvider.phone}</p>
                  <p><strong>Experience:</strong> {selectedProvider.experience} years</p>
                  <p><strong>Rating:</strong> {selectedProvider.rating.toFixed(1)} ({selectedProvider.totalReviews} reviews)</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="mr-2">Active:</span>
                    <Badge variant={selectedProvider.isActive ? 'success' : 'destructive'}>
                      {selectedProvider.isActive ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">Verified:</span>
                    <Badge variant={selectedProvider.isVerified ? 'success' : 'warning'}>
                      {selectedProvider.isVerified ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <p><strong>Joined:</strong> {new Date(selectedProvider.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Services Offered</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {selectedProvider.services.map((service) => (
                  <Badge key={service._id} variant="outline">
                    {service.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}