'use client';

import { ThumbsUp, Meh, ThumbsDown } from 'lucide-react';
import { FormData } from '../page';

interface RatingSelectorProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

export default function RatingSelector({ formData, setFormData }: RatingSelectorProps) {
  // Handle rating selection
  const handleRatingSelect = (rating: 'rate' | 'meh' | 'hate') => {
    setFormData(prev => ({ ...prev, userRating: rating }));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Your Rating *
      </label>
      <div className="flex space-x-3">
        <button
          type="button"
          onClick={() => handleRatingSelect('rate')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center ${
            formData.userRating === 'rate'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-800'
              : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
          }`}
        >
          <ThumbsUp className={`h-5 w-5 mr-2 ${
            formData.userRating === 'rate'
              ? 'text-blue-500 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400'
          }`} />
          <span>Rate It</span>
        </button>
        
        <button
          type="button"
          onClick={() => handleRatingSelect('meh')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center ${
            formData.userRating === 'meh'
              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800'
              : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
          }`}
        >
          <Meh className={`h-5 w-5 mr-2 ${
            formData.userRating === 'meh'
              ? 'text-yellow-500 dark:text-yellow-400'
              : 'text-gray-500 dark:text-gray-400'
          }`} />
          <span>Meh</span>
        </button>
        
        <button
          type="button"
          onClick={() => handleRatingSelect('hate')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center ${
            formData.userRating === 'hate'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800'
              : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
          }`}
        >
          <ThumbsDown className={`h-5 w-5 mr-2 ${
            formData.userRating === 'hate'
              ? 'text-red-500 dark:text-red-400'
              : 'text-gray-500 dark:text-gray-400'
          }`} />
          <span>Hate It</span>
        </button>
      </div>
      {!formData.userRating && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          * You must select a rating before submitting
        </p>
      )}
    </div>
  );
}