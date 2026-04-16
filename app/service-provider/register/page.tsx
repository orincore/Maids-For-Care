'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FileUpload } from '@/components/FileUpload';
import { Badge } from '@/components/ui/Badge';
import { colors } from '@/lib/colors';

const daysOfWeek = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export default function ServiceProviderRegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    experience: 0,
    bio: '',
    languages: [] as string[],
    specializations: [] as string[],
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
    availability: {
      monday: { start: '09:00', end: '18:00', available: true },
      tuesday: { start: '09:00', end: '18:00', available: true },
      wednesday: { start: '09:00', end: '18:00', available: true },
      thursday: { start: '09:00', end: '18:00', available: true },
      friday: { start: '09:00', end: '18:00', available: true },
      saturday: { start: '09:00', end: '18:00', available: true },
      sunday: { start: '09:00', end: '18:00', available: false },
    },
    documents: {
      aadharCard: '',
      panCard: '',
      experienceCertificate: '',
    },
    profileImage: '',
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [availableServices, setAvailableServices] = useState<Array<{_id: string; name: string}>>([]);
  const router = useRouter();

  useEffect(() => {
    // Fetch available services for specializations dropdown
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      const data = await response.json();
      if (data.services) {
        setAvailableServices(data.services);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleArrayInput = (field: 'languages' | 'specializations', value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()],
      }));
    }
  };

  const removeArrayItem = (field: 'languages' | 'specializations', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleAvailabilityChange = (day: string, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day as keyof typeof prev.availability],
          [field]: value,
        },
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only submit on step 4
    if (currentStep !== 4) {
      return;
    }
    
    // Validate required documents
    console.log('Documents before submit:', formData.documents);
    if (!formData.documents.aadharCard || !formData.documents.panCard) {
      alert('Please upload both Aadhar Card and PAN Card');
      return;
    }
    
    setSubmitting(true);

    try {
      // Submit to service provider registration API (public endpoint)
      const requestBody = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        experience: formData.experience,
        bio: formData.bio,
        languages: formData.languages,
        specializations: formData.specializations,
        address: formData.address,
        availability: formData.availability,
        documents: formData.documents,
        profileImage: formData.profileImage,
      };
      console.log('Submitting data:', requestBody);
      
      const response = await fetch('/api/service-providers/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Registration submitted successfully! We will review your application and get back to you.');
        router.push('/');
      } else {
        alert(data.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };
  const prevStep = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Become a Service Provider</h1>
          </div>
        </div>
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step < currentStep ? 'bg-gray-900' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Personal Info</span>
            <span>Professional Details</span>
            <span>Availability</span>
            <span>Documents</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <Input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Years of Experience *
                    </label>
                    <Input
                      type="number"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Image
                  </label>
                  <FileUpload
                    onUpload={(url) => setFormData(prev => ({ ...prev, profileImage: url }))}
                    folder="service-providers"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio / About Yourself
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{
                      backgroundColor: colors.background.primary,
                      color: colors.text.primary,
                      borderColor: colors.border.medium,
                    }}
                    placeholder="Tell us about yourself and your experience..."
                  />
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
                  <div className="space-y-4">
                    <Input
                      name="address.street"
                      placeholder="Street Address"
                      value={formData.address.street}
                      onChange={handleInputChange}
                    />
                    <div className="grid md:grid-cols-3 gap-4">
                      <Input
                        name="address.city"
                        placeholder="City"
                        value={formData.address.city}
                        onChange={handleInputChange}
                      />
                      <Input
                        name="address.state"
                        placeholder="State"
                        value={formData.address.state}
                        onChange={handleInputChange}
                      />
                      <Input
                        name="address.zipCode"
                        placeholder="ZIP Code"
                        value={formData.address.zipCode}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Professional Details */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Professional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Languages Spoken
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.languages.map((lang, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm flex items-center"
                      >
                        {lang}
                        <button
                          type="button"
                          onClick={() => removeArrayItem('languages', index)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex">
                    <Input
                      placeholder="Add a language"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleArrayInput('languages', e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specializations *
                  </label>
                  <p className="text-sm text-gray-500 mb-2">Select services you specialize in</p>
                  <div className="grid grid-cols-2 gap-2">
                    {availableServices.map((service) => (
                      <label
                        key={service._id}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.specializations.includes(service.name)
                            ? 'border-gray-900 bg-gray-50'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.specializations.includes(service.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                specializations: [...prev.specializations, service.name]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                specializations: prev.specializations.filter(s => s !== service.name)
                              }));
                            }
                          }}
                          className="w-4 h-4 mr-3"
                        />
                        <span className="text-sm">{service.name}</span>
                      </label>
                    ))}
                  </div>
                  {formData.specializations.length === 0 && (
                    <p className="text-red-500 text-sm mt-2">Please select at least one specialization</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Availability */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Availability Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Set your weekly availability. Check the days you're available and set your working hours.
                </p>
                <div className="space-y-4">
                  {daysOfWeek.map(({ key, label }) => {
                    const dayData = formData.availability[key as keyof typeof formData.availability];
                    return (
                      <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <input
                            type="checkbox"
                            checked={dayData.available}
                            onChange={(e) => handleAvailabilityChange(key, 'available', e.target.checked)}
                            className="w-5 h-5"
                          />
                          <span className="font-medium w-24">{label}</span>
                        </div>
                        {dayData.available ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              type="time"
                              value={dayData.start}
                              onChange={(e) => handleAvailabilityChange(key, 'start', e.target.value)}
                              className="w-24"
                            />
                            <span>to</span>
                            <Input
                              type="time"
                              value={dayData.end}
                              onChange={(e) => handleAvailabilityChange(key, 'end', e.target.value)}
                              className="w-24"
                            />
                          </div>
                        ) : (
                          <Badge variant="secondary">Not Available</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Documents */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Documents Upload</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium">Aadhar Card *</h3>
                      <p className="text-sm text-gray-500">Upload front and back of your Aadhar card</p>
                    </div>
                    {formData.documents.aadharCard && (
                      <Badge variant="success" className="flex items-center">
                        <Check className="w-3 h-3 mr-1" />
                        Uploaded
                      </Badge>
                    )}
                  </div>
                  <FileUpload
                    onUpload={(url) => setFormData(prev => ({ 
                      ...prev, 
                      documents: { ...prev.documents, aadharCard: url }
                    }))}
                    folder="service-providers/documents"
                  />
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium">PAN Card *</h3>
                      <p className="text-sm text-gray-500">Upload your PAN card</p>
                    </div>
                    {formData.documents.panCard && (
                      <Badge variant="success" className="flex items-center">
                        <Check className="w-3 h-3 mr-1" />
                        Uploaded
                      </Badge>
                    )}
                  </div>
                  <FileUpload
                    onUpload={(url) => setFormData(prev => ({ 
                      ...prev, 
                      documents: { ...prev.documents, panCard: url }
                    }))}
                    folder="service-providers/documents"
                  />
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium">Experience Certificate (Optional)</h3>
                      <p className="text-sm text-gray-500">Upload any work experience certificates</p>
                    </div>
                    {formData.documents.experienceCertificate && (
                      <Badge variant="success" className="flex items-center">
                        <Check className="w-3 h-3 mr-1" />
                        Uploaded
                      </Badge>
                    )}
                  </div>
                  <FileUpload
                    onUpload={(url) => setFormData(prev => ({ 
                      ...prev, 
                      documents: { ...prev.documents, experienceCertificate: url }
                    }))}
                    folder="service-providers/documents"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => prevStep(e)}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            {currentStep < 4 ? (
              <Button 
                type="button" 
                onClick={(e) => nextStep(e)}
              >
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}