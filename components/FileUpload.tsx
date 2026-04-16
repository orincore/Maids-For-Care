'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface FileUploadProps {
  onUpload: (url: string) => void;
  folder?: string;
  accept?: string;
  maxSize?: number; // in MB
  multiple?: boolean;
}

export function FileUpload({ 
  onUpload, 
  folder = 'Maids For Care', 
  accept = 'image/*,application/pdf',
  maxSize = 5,
  multiple = false 
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Store file type
    setFileType(file.type);
    
    // Create preview only for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview('file'); // Non-image files don't get preview
    }

    // Upload file
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        onUpload(data.url);
      } else {
        alert(data.error || 'Upload failed');
        setPreview(null);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    setFileType('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
      />

      {!preview ? (
        <div
          onClick={(e) => {
            e.preventDefault();
            fileInputRef.current?.click();
          }}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-2">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-gray-500">
            {accept.includes('pdf') ? 'PNG, JPG, WebP, PDF' : 'PNG, JPG, WebP'} up to {maxSize}MB
          </p>
        </div>
      ) : (
        <div className="relative">
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                {fileType === 'application/pdf' ? (
                  <FileText className="h-5 w-5 text-red-500 mr-2" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-gray-400 mr-2" />
                )}
                <span className="text-sm text-gray-600">
                  {uploading ? 'Uploading...' : 'Upload complete'}
                  {fileType === 'application/pdf' && ' (PDF)'}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearPreview}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {preview && preview !== 'file' ? (
              <img
                src={preview}
                alt="Preview"
                className="max-w-full h-32 object-cover rounded"
              />
            ) : (
              <div className="flex items-center justify-center h-32 bg-gray-100 rounded">
                <FileText className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}