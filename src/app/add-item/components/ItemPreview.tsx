'use client';

import { ArrowLeft, ThumbsUp, Meh, ThumbsDown, Loader2, Share2 } from 'lucide-react';
import { FormData } from '../page';
import { User } from 'firebase/auth';

interface ItemPreviewProps {
  formData: FormData;
  onBack: () => void;
  onSubmit: () => void;
  onSubmitAndShare: () => void;
  isSubmitting: boolean;
  user: User;
}

// Categories array for lookup
const categories = [
  { id: 'electronics', name: 'Electronics' },
  { id: 'apparel', name: 'Apparel' },
  { id: 'home-kitchen', name: 'Home & Kitchen' },
  { id: 'beauty-personal-care', name: 'Beauty & Personal Care' },
  { id: 'sports-outdoors', name: 'Sports & Outdoors' },
  { id: 'automotive', name: 'Automotive' },
  { id: 'books', name: 'Books' },
  { id: 'movies', name: 'Movies' },
  { id: 'tv-shows', name: 'TV Shows' },
  { id: 'video-games', name: 'Video Games' },
  { id: 'tech-apps', name: 'Tech & Apps' },
  { id: 'companies', name: 'Companies & Brands' },
  { id: 'food-restaurants', name: 'Food & Restaurants' },
];

export default function ItemPreview({ formData, onBack, onSubmit, onSubmitAndShare, isSubmitting, user }: ItemPreviewProps) {
  // Find category and subcategory names for display
  const categoryName = categories.find((cat) => cat.id === formData.category)?.name || '';
  
  return (
    <div>
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Edit
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Item Preview</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            This is how your item will appear when published.
          </p>

          <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="relative h-64 bg-gray-100 dark:bg-gray-700">
              {formData.imageSource === 'upload' && formData.imagePreview ? (
                <img src={formData.imagePreview} alt={formData.name} className="w-full h-full object-contain" />
              ) : formData.imageSource === 'url' && formData.imageUrl ? (
                <img 
                  src={formData.imageUrl} 
                  alt={formData.name} 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Invalid+Image+URL';
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400 dark:text-gray-500">No image provided</p>
                </div>
              )}
              <div className="absolute top-4 right-4 flex flex-col gap-1 items-end">
                <div className="bg-gray-900/70 text-white text-xs font-medium px-2 py-1 rounded-full">
                  {categoryName}
                </div>
                {formData.subcategory && (
                  <div className="bg-gray-900/50 text-white text-xs font-medium px-2 py-1 rounded-full">
                    {formData.subcategory}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{formData.name}</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-3">{formData.description}</p>
              
              <div className="mb-6 border-l-4 border-blue-400 dark:border-blue-600 pl-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-r-md">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Review by {user.displayName || 'Anonymous User'}:
                </h4>
                <p className="text-gray-700 dark:text-gray-300 text-sm italic">{formData.userReview}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">MEHtrics</h3>

                <div className="grid grid-cols-3 gap-4">
                  <div className={`flex flex-col items-center rounded-lg p-3 ${
                    formData.userRating === 'rate' 
                      ? 'bg-blue-100 dark:bg-blue-900/30' 
                      : 'bg-white dark:bg-gray-800'
                  }`}>
                    <ThumbsUp className={`h-6 w-6 mb-2 ${
                      formData.userRating === 'rate' 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-blue-500'
                    }`} />
                    <span className="text-lg font-semibold">{formData.userRating === 'rate' ? '100%' : '0%'}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">Rate It</span>
                  </div>

                  <div className={`flex flex-col items-center rounded-lg p-3 ${
                    formData.userRating === 'meh' 
                      ? 'bg-yellow-100 dark:bg-yellow-900/30' 
                      : 'bg-white dark:bg-gray-800'
                    }`}>
                    <Meh className={`h-6 w-6 mb-2 ${
                      formData.userRating === 'meh' 
                        ? 'text-yellow-600 dark:text-yellow-400' 
                        : 'text-yellow-500'
                    }`} />
                    <span className="text-lg font-semibold">{formData.userRating === 'meh' ? '100%' : '0%'}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">Meh</span>
                  </div>

                  <div className={`flex flex-col items-center rounded-lg p-3 ${
                    formData.userRating === 'hate' 
                      ? 'bg-red-100 dark:bg-red-900/30' 
                      : 'bg-white dark:bg-gray-800'
                    }`}>
                    <ThumbsDown className={`h-6 w-6 mb-2 ${
                      formData.userRating === 'hate' 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-red-500'
                    }`} />
                    <span className="text-lg font-semibold">{formData.userRating === 'hate' ? '100%' : '0%'}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">Hate It</span>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-500 dark:text-gray-400">
                Added by {user.displayName || 'Anonymous User'} • Just now
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onBack}
            className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2.5 px-4 rounded-lg transition-colors"
          >
            Continue Editing
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Publishing...
              </>
            ) : (
              'Publish Item'
            )}
          </button>
          <button
            onClick={onSubmitAndShare}
            disabled={isSubmitting}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Share2 className="h-5 w-5 mr-2" />
                Publish & Share
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}