'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Rating } from '@/components/ui/Rating';
import { colors } from '@/lib/colors';

interface ReviewFormProps {
  bookingId: string;
  serviceName: string;
  serviceProviderName: string;
  onSubmit: (reviewData: any) => void;
  onCancel: () => void;
}

export function ReviewForm({ 
  bookingId, 
  serviceName, 
  serviceProviderName, 
  onSubmit, 
  onCancel 
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [aspects, setAspects] = useState({
    punctuality: 0,
    quality: 0,
    professionalism: 0,
    communication: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Please provide an overall rating');
      return;
    }

    if (!comment.trim()) {
      alert('Please write a review comment');
      return;
    }

    setSubmitting(true);
    
    try {
      await onSubmit({
        bookingId,
        rating,
        comment: comment.trim(),
        aspects,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAspectRating = (aspect: string, value: number) => {
    setAspects(prev => ({
      ...prev,
      [aspect]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Rate Your Experience
        </h3>
        <p className="text-gray-600">
          Service: {serviceName} by {serviceProviderName}
        </p>
      </div>

      {/* Overall Rating */}
      <div className="text-center">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Overall Rating
        </label>
        <div className="flex justify-center">
          <Rating
            rating={rating}
            size="lg"
            interactive
            onRatingChange={setRating}
          />
        </div>
      </div>

      {/* Aspect Ratings */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700">Rate Specific Aspects</h4>
        
        {Object.entries({
          punctuality: 'Punctuality',
          quality: 'Quality of Work',
          professionalism: 'Professionalism',
          communication: 'Communication',
        }).map(([key, label]) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{label}</span>
            <Rating
              rating={aspects[key as keyof typeof aspects]}
              interactive
              onRatingChange={(value) => handleAspectRating(key, value)}
            />
          </div>
        ))}
      </div>

      {/* Comment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Review
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{
            backgroundColor: colors.background.primary,
            color: colors.text.primary,
            borderColor: colors.border.medium,
          }}
          placeholder="Share your experience with this service..."
          maxLength={1000}
          required
        />
        <div className="text-right text-xs text-gray-500 mt-1">
          {comment.length}/1000 characters
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </div>
    </form>
  );
}