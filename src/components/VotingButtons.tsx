'use client';

import { useState, useEffect } from 'react';
import { Heart, HeartOff, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

type VotingButtonsProps = {
  itemId: string;
  initialVote?: 'rate' | 'hate' | null;
  initialLoveCount?: number;
  initialHateCount?: number;
  onVoteSubmit?: (type: 'rate' | 'hate', itemId: string) => void;
  allowChangeVote?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  animated?: boolean;
};

export default function VotingButtons({
  itemId,
  initialVote = null,
  initialLoveCount = 0,
  initialHateCount = 0,
  onVoteSubmit,
  allowChangeVote = true,
  size = 'md',
  showCount = true,
  animated = true,
}: VotingButtonsProps) {
  const router = useRouter();
  const [userVote, setUserVote] = useState<'rate' | 'hate' | null>(initialVote);
  const [loveCount, setLoveCount] = useState(initialLoveCount);
  const [hateCount, setHateCount] = useState(initialHateCount);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [animationClass, setAnimationClass] = useState('');

  // Button size classes
  const sizeClasses = {
    sm: {
      button: 'px-3 py-1.5 text-sm',
      icon: 'h-4 w-4 mr-1',
    },
    md: {
      button: 'px-4 py-2 text-base',
      icon: 'h-5 w-5 mr-2',
    },
    lg: {
      button: 'px-6 py-3 text-lg',
      icon: 'h-6 w-6 mr-2',
    },
  };

  // Check if user is logged in (mock implementation)
  const isLoggedIn = false; // Replace with actual auth check

  // Reset animation class after animation completes
  useEffect(() => {
    if (animationClass) {
      const timer = setTimeout(() => {
        setAnimationClass('');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [animationClass]);

  // Handle vote submission
  const handleVote = async (voteType: 'rate' | 'hate') => {
    // Reset error state
    setError(null);
    
    // Check if user is logged in
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    
    // If user already voted and changing vote is not allowed
    if (userVote !== null && !allowChangeVote) {
      setError("You've already voted on this item");
      return;
    }
    
    // If user is voting the same as current vote
    if (userVote === voteType) {
      return;
    }
    
    // Set submitting state and trigger animation
    setIsSubmitting(true);
    
    if (animated) {
      setAnimationClass(voteType === 'rate' ? 'vote-love-animation' : 'vote-hate-animation');
    }
    
    try {
      // Simulate API call to submit vote
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Update counts
      if (userVote === null) {
        // First vote
        if (voteType === 'rate') {
          setLoveCount(prev => prev + 1);
        } else {
          setHateCount(prev => prev + 1);
        }
      } else if (userVote === 'rate' && voteType === 'hate') {
        // Change from rate to hate
        setLoveCount(prev => prev - 1);
        setHateCount(prev => prev + 1);
      } else if (userVote === 'hate' && voteType === 'rate') {
        // Change from hate to rate
        setHateCount(prev => prev - 1);
        setLoveCount(prev => prev + 1);
      }
      
      // Set user vote
      setUserVote(voteType);
      
      // Call onVoteSubmit callback if provided
      if (onVoteSubmit) {
        onVoteSubmit(voteType, itemId);
      }
      
      // Force a refresh of the page data
      router.refresh();
    } catch (err) {
      setError('Failed to submit your vote. Please try again.');
      console.error('Vote submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect to login page
  const handleLoginPrompt = () => {
    router.push('/login');
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-3">
        {/* Rate It Button */}
        <button
          onClick={() => handleVote('rate')}
          disabled={isSubmitting || (userVote === 'rate' && !allowChangeVote)}
          className={`
            flex items-center justify-center rounded-full font-medium transition-all
            ${sizeClasses[size].button}
            ${userVote === 'rate' 
              ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200' 
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 hover:text-green-600'
            }
            ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}
            ${animationClass === 'vote-love-animation' ? 'animate-pulse ring-2 ring-green-400' : ''}
          `}
        >
          <Heart 
            className={`
              ${sizeClasses[size].icon}
              ${userVote === 'rate' ? 'text-green-600 fill-green-600' : 'text-gray-500'}
            `} 
          />
          <span>Rate It</span>
          {showCount && (
            <span className="ml-2 bg-white bg-opacity-70 px-1.5 py-0.5 rounded-full text-sm">
              {loveCount}
            </span>
          )}
        </button>
        
        {/* Hate It Button */}
        <button
          onClick={() => handleVote('hate')}
          disabled={isSubmitting || (userVote === 'hate' && !allowChangeVote)}
          className={`
            flex items-center justify-center rounded-full font-medium transition-all
            ${sizeClasses[size].button}
            ${userVote === 'hate' 
              ? 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200' 
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 hover:text-red-600'
            }
            ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}
            ${animationClass === 'vote-hate-animation' ? 'animate-pulse ring-2 ring-red-400' : ''}
          `}
        >
          <HeartOff 
            className={`
              ${sizeClasses[size].icon}
              ${userVote === 'hate' ? 'text-red-600' : 'text-gray-500'}
            `} 
          />
          <span>Hate It</span>
          {showCount && (
            <span className="ml-2 bg-white bg-opacity-70 px-1.5 py-0.5 rounded-full text-sm">
              {hateCount}
            </span>
          )}
        </button>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="flex items-center text-red-600 text-sm mt-1">
          <AlertCircle className="h-4 w-4 mr-1" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Login Prompt */}
      {showLoginPrompt && (
        <div className="mt-2 p-3 bg-blue-50 text-blue-800 rounded-md text-sm">
          <p className="mb-2">Sign in to rate this item</p>
          <button 
            onClick={handleLoginPrompt}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
          >
            Sign In / Register
          </button>
        </div>
      )}
      
      {/* Add these styles to your globals.css */}
      <style jsx>{`
        @keyframes pulse-green {
          0%, 100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(74, 222, 128, 0); }
        }
        
        @keyframes pulse-red {
          0%, 100% { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(248, 113, 113, 0); }
        }
        
        .vote-love-animation {
          animation: pulse-green 1s;
        }
        
        .vote-hate-animation {
          animation: pulse-red 1s;
        }
      `}</style>
    </div>
  );
}