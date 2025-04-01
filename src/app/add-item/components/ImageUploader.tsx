'use client';

import { useRef } from 'react';
import { Upload, X, LinkIcon } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { FormData } from '../page';

interface ImageUploaderProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

export default function ImageUploader({ formData, setFormData }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Handle image source change
  const handleImageSourceChange = (source: 'upload' | 'url') => {
    setFormData(prev => ({ ...prev, imageSource: source }));
  };

  // Handle image URL change
  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, imageUrl: e.target.value }));
  };

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        type: "error",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB.",
        type: "error",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({
        ...prev,
        imageFile: file,
        imagePreview: reader.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          type: "error",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 5MB.",
          type: "error",
        });
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({
          ...prev,
          imageFile: file,
          imagePreview: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove image
  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      imageFile: null,
      imagePreview: null,
      imageUrl: ''
    }));
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Image Source
        </label>
        <div className="flex space-x-2 mb-3">
          <button
            type="button"
            onClick={() => handleImageSourceChange('upload')}
            className={`px-3 py-1.5 rounded text-sm ${
              formData.imageSource === 'upload' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
            }`}
          >
            <Upload className="h-4 w-4 inline mr-1" />
            Upload Image
          </button>
          <button
            type="button"
            onClick={() => handleImageSourceChange('url')}
            className={`px-3 py-1.5 rounded text-sm ${
              formData.imageSource === 'url' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
            }`}
          >
            <LinkIcon className="h-4 w-4 inline mr-1" />
            Image URL
          </button>
        </div>
      </div>

      {/* Conditional Image Input */}
      {formData.imageSource === 'upload' ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Image Upload (Optional)
          </label>
          <div 
            className="flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {formData.imagePreview ? (
              <div className="relative w-full h-60">
                <img
                  src={formData.imagePreview}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage();
                  }}
                  className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            ) : (
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                  <label
                    htmlFor="image-upload"
                    className="relative cursor-pointer font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 focus-within:outline-none"
                  >
                    <span>Upload an image</span>
                    <input
                      id="image-upload"
                      name="image-upload"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF up to 5MB</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <label htmlFor="image-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Image URL (Optional)
          </label>
          <input
            type="url"
            id="image-url"
            value={formData.imageUrl}
            onChange={handleImageUrlChange}
            placeholder="https://example.com/image.jpg"
            className="block w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
          />
          {formData.imageUrl && (
            <div className="mt-3 relative border rounded-lg overflow-hidden">
              <img
                src={formData.imageUrl}
                alt="Preview"
                className="w-full h-60 object-contain"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Invalid+Image+URL';
                }}
              />
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}