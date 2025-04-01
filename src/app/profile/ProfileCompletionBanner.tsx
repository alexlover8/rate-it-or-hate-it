'use client';

import { useState } from 'react';
import { UserPlus, X, ChevronRight } from 'lucide-react';

interface ProfileCompletionBannerProps {
  completion: number;
  onStartCompletion: () => void;
}

export default function ProfileCompletionBanner({ 
  completion, 
  onStartCompletion 
}: ProfileCompletionBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  
  // Don't show if dismissed or profile is highly complete
  if (dismissed || completion >= 80) {
    return null;
  }
  
  // Determine status message and color
  let statusMessage = '';
  let statusColor = '';
  
  if (completion < 20) {
    statusMessage = 'Just getting started!';
    statusColor = 'text-red-500 dark:text-red-400';
  } else if (completion < 50) {
    statusMessage = 'Making progress!';
    statusColor = 'text-yellow-500 dark:text-yellow-400';
  } else if (completion < 80) {
    statusMessage = 'Almost there!';
    statusColor = 'text-blue-500 dark:text-blue-400';
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-indigo-100 dark:border-indigo-800 p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg mr-3">
            <UserPlus className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Complete Your Profile</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Personalize your experience and help us improve with more information about yourself.
            </p>
            
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Profile Completion
                </span>
                <span className={`text-xs font-medium ${statusColor}`}>
                  {completion}% • {statusMessage}
                </span>
              </div>
              
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    completion < 20 ? 'bg-red-500' : 
                    completion < 50 ? 'bg-yellow-500' : 
                    'bg-blue-500'
                  }`}
                  style={{ width: `${completion}%` }}
                ></div>
              </div>
            </div>
            
            <button
              onClick={onStartCompletion}
              className="mt-4 inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
            >
              Complete Now
              <ChevronRight className="ml-1 h-4 w-4" />
            </button>
          </div>
        </div>
        
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          aria-label="Dismiss"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
} 