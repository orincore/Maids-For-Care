'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, MessageSquare, Trash2, Reply } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { colors } from '@/lib/colors';
import { ReviewCard } from '@/components/ReviewCard';

interface Review {
  _id: string;
  user: {
    name: string;
    profileImage?: string;
  };
  serviceProvider: {
    name: string;
  };
  service: {
    name: string;
    category: string;
  };
  rating: number;
  comment: string;
  aspects: {
    punctuality?: number;
    quality?: number;
    professionalism?: number;
    communication?: number;
  };
  createdAt: string;
  isVerified: boolean;
  adminResponse?: {
    message: string;
    respondedAt: string;
  };
}

export default function ReviewsManagementPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      router.push('/auth/admin');
      return;
    }
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews');
      const data = await response.json();
      if (response.ok) {
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminResponse = async () => {
    if (!selectedReview || !adminResponse.trim()) return;

    setSubmitting(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`/api/reviews/${selectedReview._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ adminResponse: adminResponse.trim() }),
      });

      if (response.ok) {
        await fetchReviews();
        setShowResponseModal(false);
        setSelectedReview(null);
        setAdminResponse('');
        alert('Admin response added successfully');
      } else {
        alert('Failed to add admin response');
      }
    } catch (error) {
      console.error('Error adding admin response:', error);
      alert('Error adding admin response');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (response.ok) {
        await fetchReviews();
        alert('Review deleted successfully');
      } else {
        alert('Failed to delete review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Error deleting review');
    }
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.serviceProvider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.comment.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRating = ratingFilter === 'all' ||
                         (ratingFilter === '5' && review.rating === 5) ||
                         (ratingFilter === '4' && review.rating === 4) ||
                         (ratingFilter === '3' && review.rating === 3) ||
                         (ratingFilter === '2' && review.rating === 2) ||
                         (ratingFilter === '1' && review.rating === 1) ||
                         (ratingFilter === 'low' && review.rating <= 2);

    return matchesSearch && matchesRating;
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
            <h1 className="text-2xl font-bold text-gray-900">Reviews Management</h1>
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
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reviews.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">5 Stars</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {reviews.filter(r => r.rating === 5).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">4 Stars</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {reviews.filter(r => r.rating === 4).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Low Ratings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {reviews.filter(r => r.rating <= 2).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Avg Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {reviews.length > 0 
                  ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
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
                    placeholder="Search reviews..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                  <option value="low">Low Ratings (≤2)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reviews List */}
        <div className="space-y-6">
          {filteredReviews.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No reviews found.
              </CardContent>
            </Card>
          ) : (
            filteredReviews.map((review) => (
              <div key={review._id} className="relative">
                <ReviewCard review={review} showServiceInfo />
                <div className="absolute top-4 right-4 flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedReview(review);
                      setShowResponseModal(true);
                    }}
                  >
                    <Reply className="w-4 h-4 mr-1" />
                    {review.adminResponse ? 'Update Response' : 'Respond'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteReview(review._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Admin Response Modal */}
      <Modal
        isOpen={showResponseModal}
        onClose={() => setShowResponseModal(false)}
        title="Admin Response"
        size="lg"
      >
        {selectedReview && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Review by {selectedReview.user.name}</h3>
              <p className="text-gray-700 mb-2">{selectedReview.comment}</p>
              <div className="text-sm text-gray-500">
                Service: {selectedReview.service.name} • Rating: {selectedReview.rating}/5
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Response
              </label>
              <textarea
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: colors.background.primary,
                  color: colors.text.primary,
                  borderColor: colors.border.medium,
                }}
                placeholder="Write your response to this review..."
                maxLength={500}
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {adminResponse.length}/500 characters
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowResponseModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAdminResponse}
                disabled={submitting || !adminResponse.trim()}
              >
                {submitting ? 'Submitting...' : 'Submit Response'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}