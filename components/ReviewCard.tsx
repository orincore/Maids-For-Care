'use client';

import { formatDate } from '@/lib/utils';
import { Rating } from '@/components/ui/Rating';
import { Badge } from '@/components/ui/Badge';

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

interface ReviewCardProps {
  review: Review;
  showServiceInfo?: boolean;
}

export function ReviewCard({ review, showServiceInfo = false }: ReviewCardProps) {
  return (
    <div className="bg-white border rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            {review.user.profileImage ? (
              <img
                src={review.user.profileImage}
                alt={review.user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium text-gray-600">
                {review.user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{review.user.name}</h4>
            <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Rating rating={review.rating} size="sm" />
          {review.isVerified && (
            <Badge variant="success" className="text-xs">
              Verified
            </Badge>
          )}
        </div>
      </div>

      {/* Service Info */}
      {showServiceInfo && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">{review.service.name}</span>
          <span className="mx-2">•</span>
          <span>by {review.serviceProvider.name}</span>
        </div>
      )}

      {/* Comment */}
      <p className="text-gray-700">{review.comment}</p>

      {/* Aspect Ratings */}
      {Object.keys(review.aspects).length > 0 && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          {Object.entries(review.aspects).map(([aspect, rating]) => (
            rating && (
              <div key={aspect} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">
                  {aspect}
                </span>
                <Rating rating={rating} size="sm" />
              </div>
            )
          ))}
        </div>
      )}

      {/* Admin Response */}
      {review.adminResponse && (
        <div className="bg-gray-50 rounded-lg p-4 mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">
              Response from Maids For Care
            </span>
            <span className="text-xs text-gray-500">
              {formatDate(review.adminResponse.respondedAt)}
            </span>
          </div>
          <p className="text-sm text-gray-700">{review.adminResponse.message}</p>
        </div>
      )}
    </div>
  );
}