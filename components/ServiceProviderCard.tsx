'use client';

import { Star, MapPin, Clock, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Rating } from '@/components/ui/Rating';

interface ServiceProvider {
  _id: string;
  name: string;
  profileImage?: string;
  rating: number;
  totalReviews: number;
  experience: number;
  isVerified: boolean;
  services: Array<{
    name: string;
    category: string;
  }>;
  bio?: string;
  languages?: string[];
}

interface ServiceProviderCardProps {
  provider: ServiceProvider;
  onSelect?: (provider: ServiceProvider) => void;
  showSelectButton?: boolean;
}

export function ServiceProviderCard({ 
  provider, 
  onSelect, 
  showSelectButton = false 
}: ServiceProviderCardProps) {
  return (
    <div className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start space-x-4 mb-4">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
          {provider.profileImage ? (
            <img
              src={provider.profileImage}
              alt={provider.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xl font-medium text-gray-600">
              {provider.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
            {provider.isVerified && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Rating rating={provider.rating} size="sm" />
              <span className="ml-1">
                {provider.rating.toFixed(1)} ({provider.totalReviews} reviews)
              </span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {provider.experience} years exp.
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      {provider.bio && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{provider.bio}</p>
      )}

      {/* Services */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Services:</h4>
        <div className="flex flex-wrap gap-1">
          {provider.services.slice(0, 3).map((service, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {service.name}
            </Badge>
          ))}
          {provider.services.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{provider.services.length - 3} more
            </Badge>
          )}
        </div>
      </div>

      {/* Languages */}
      {provider.languages && provider.languages.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Languages:</h4>
          <div className="flex flex-wrap gap-1">
            {provider.languages.map((language, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {language}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Action Button */}
      {showSelectButton && onSelect && (
        <Button
          onClick={() => onSelect(provider)}
          className="w-full"
          size="sm"
        >
          Select Provider
        </Button>
      )}
    </div>
  );
}