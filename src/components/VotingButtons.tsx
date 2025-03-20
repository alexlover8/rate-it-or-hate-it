'use client';

import { useState, useEffect } from 'react';
import { Heart, HeartOff, Meh, AlertCircle, Info, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useVoteManager } from '@/lib/voteManager';
import { useAuth } from '@/lib/auth';
import LoginPromptModal from './LoginPromptModal';

type VotingButtonsProps = {
  itemId: string;
  initialRateCount?: number;
  initialMehCount?: number;
  initialHateCount?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTotalVotes?: boolean;
  showPercentage?: boolean;
  showCounts?: boolean;
  animated?: boolean;
  onVoteSuccess?: (type: 'rate' | 'meh' | 'hate') => void;
  onVoteError?: (error: string) => void;
};

export default function VotingButtons({
  itemId,
  initialRateCount = 0,
  initialMehCount = 0,
  initialHateCount = 0,
  className = '',
  size = 'md',
  showTotalVotes = true,
  showPercentage = true,
  showCounts = true,
  animated = true,
  onVoteSuccess,
  onVoteError
}: VotingButtonsProps) {
  // Local UI state
  const [rateCount, setRateCount] = useState(initialRateCount);
  const [mehCount, setMehCount] = useState(initialMehCount);
  const [hateCount, setHateCount] = useState(initialHateCount);
  const [userVote, setUserVote] = useState<'rate' | 'meh' | 'hate' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingVoteType, setPendingVoteType] = useState<'rate' | 'meh' | 'hate' | null>(null);

  // Get auth state
  const { user } = useAuth();

  // Import voteManager functions and state
  const { recordVote, getVoteStats } = useVoteManager();

  // Button size classes
  const buttonSizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-2.5 text-lg'
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4 mr-1.5',
    md: 'h-5 w-5 mr-2',
    lg: 'h-6 w-6 mr-2'
  };

  // Fetch latest vote stats when component mounts or itemId changes
  useEffect(() => {
    async function fetchStats() {
      const stats = await getVoteStats(itemId);
      setRateCount(stats.rateCount);
      setMehCount(stats.mehCount);
      setHateCount(stats.hateCount);
      setUserVote(stats.userVote);
    }
    fetchStats();
  }, [itemId, getVoteStats]);

  // Handle vote click using recordVote from voteManager
  const handleVote = async (voteType: 'rate' | 'meh' | 'hate') => {
    // Reset messages
    setError(null);
    setShowSuccess(false);
    setShowLoginPrompt(false);

    // Prevent duplicate voting or if already submitting
    if (userVote === voteType || isSubmitting) return;

    // Check if user is authenticated
    if (!user) {
      // Save the pending vote type and show login modal
      setPendingVoteType(voteType);
      setShowLoginModal(true);
      return;
    }

    setIsSubmitting(true);

    const result = await recordVote(itemId, voteType);
    if (result.success) {
      // Update local state with new counts from voteManager response
      if (result.newRateCount !== undefined) setRateCount(result.newRateCount);
      if (result.newMehCount !== undefined) setMehCount(result.newMehCount);
      if (result.newHateCount !== undefined) setHateCount(result.newHateCount);
      setUserVote(voteType);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      if (onVoteSuccess) onVoteSuccess(voteType);
    } else {
      setError(result.error || 'Failed to record your vote. Please try again.');
      if (onVoteError) onVoteError(result.error || 'Failed to record your vote. Please try again.');
    }

    setIsSubmitting(false);
  };

  // Close login modal
  const handleCloseLoginModal = () => {
    setShowLoginModal(false);
    setPendingVoteType(null);
  };

  // Calculate total votes and percentages
  const totalVotes = rateCount + mehCount + hateCount;
  const ratePercentage = totalVotes > 0 ? Math.round((rateCount / totalVotes) * 100) : 33;
  const mehPercentage = totalVotes > 0 ? Math.round((mehCount / totalVotes) * 100) : 33;
  const hatePercentage = totalVotes > 0 ? Math.round((hateCount / totalVotes) * 100) : 34;

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center space-x-3">
        {/* Rate It Button */}
        <motion.button
          onClick={() => handleVote('rate')}
          disabled={isSubmitting}
          whileTap={animated ? { scale: 0.95 } : {}}
          className={`
            flex items-center justify-center rounded-full font-medium transition-all
            ${buttonSizeClasses[size]}
            ${userVote === 'rate' 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-800' 
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-green-600 dark:hover:text-green-400'
            }
            ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}
          `}
          type="button"
        >
          <Heart 
            className={`
              ${iconSizeClasses[size]}
              ${userVote === 'rate' 
                ? 'text-green-600 dark:text-green-400 fill-green-600 dark:fill-green-400' 
                : 'text-gray-500 dark:text-gray-400'
              }
            `}
          />
          <span>Rate It</span>
          {showCounts && (
            <span className="ml-2 bg-white dark:bg-gray-700 dark:text-gray-200 bg-opacity-70 px-1.5 py-0.5 rounded-full text-sm">
              {rateCount > 999 ? `${(rateCount/1000).toFixed(1)}k` : rateCount}
            </span>
          )}
        </motion.button>

        {/* Meh Button */}
        <motion.button
          onClick={() => handleVote('meh')}
          disabled={isSubmitting}
          whileTap={animated ? { scale: 0.95 } : {}}
          className={`
            flex items-center justify-center rounded-full font-medium transition-all
            ${buttonSizeClasses[size]}
            ${userVote === 'meh' 
              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-800' 
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-yellow-600 dark:hover:text-yellow-400'
            }
            ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}
          `}
          type="button"
        >
          <Meh 
            className={`
              ${iconSizeClasses[size]}
              ${userVote === 'meh' 
                ? 'text-yellow-600 dark:text-yellow-400' 
                : 'text-gray-500 dark:text-gray-400'
              }
            `}
          />
          <span>Meh</span>
          {showCounts && (
            <span className="ml-2 bg-white dark:bg-gray-700 dark:text-gray-200 bg-opacity-70 px-1.5 py-0.5 rounded-full text-sm">
              {mehCount > 999 ? `${(mehCount/1000).toFixed(1)}k` : mehCount}
            </span>
          )}
        </motion.button>
        
        {/* Hate It Button */}
        <motion.button
          onClick={() => handleVote('hate')}
          disabled={isSubmitting}
          whileTap={animated ? { scale: 0.95 } : {}}
          className={`
            flex items-center justify-center rounded-full font-medium transition-all
            ${buttonSizeClasses[size]}
            ${userVote === 'hate' 
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800' 
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400'
            }
            ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}
          `}
          type="button"
        >
          <HeartOff 
            className={`
              ${iconSizeClasses[size]}
              ${userVote === 'hate' 
                ? 'text-red-600 dark:text-red-400' 
                : 'text-gray-500 dark:text-gray-400'
              }
            `}
          />
          <span>Hate It</span>
          {showCounts && (
            <span className="ml-2 bg-white dark:bg-gray-700 dark:text-gray-200 bg-opacity-70 px-1.5 py-0.5 rounded-full text-sm">
              {hateCount > 999 ? `${(hateCount/1000).toFixed(1)}k` : hateCount}
            </span>
          )}
        </motion.button>
      </div>
      
      {/* Progress bars showing vote percentages */}
      {showPercentage && (
        <div className="mt-4 space-y-2">
          <div>
            <div className="flex justify-between mb-1 text-xs text-gray-500 dark:text-gray-400">
              <span>Rate It</span>
              <span>{ratePercentage}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div 
                className="h-2 bg-green-500 rounded-full"
                initial={{ width: `0%` }}
                animate={{ width: `${ratePercentage}%` }}
                transition={{ duration: animated ? 0.5 : 0 }}
              ></motion.div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1 text-xs text-gray-500 dark:text-gray-400">
              <span>Meh</span>
              <span>{mehPercentage}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div 
                className="h-2 bg-yellow-500 rounded-full"
                initial={{ width: `0%` }}
                animate={{ width: `${mehPercentage}%` }}
                transition={{ duration: animated ? 0.5 : 0 }}
              ></motion.div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1 text-xs text-gray-500 dark:text-gray-400">
              <span>Hate It</span>
              <span>{hatePercentage}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div 
                className="h-2 bg-red-500 rounded-full"
                initial={{ width: `0%` }}
                animate={{ width: `${hatePercentage}%` }}
                transition={{ duration: animated ? 0.5 : 0 }}
              ></motion.div>
            </div>
          </div>
          {showTotalVotes && (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {totalVotes.toLocaleString()} total {totalVotes === 1 ? 'vote' : 'votes'}
            </div>
          )}
        </div>
      )}
      
      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center text-red-600 dark:text-red-400 text-sm mt-2 bg-red-50 dark:bg-red-900/20 p-2 rounded-md"
          >
            <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center text-green-600 dark:text-green-400 text-sm mt-2 bg-green-50 dark:bg-green-900/20 p-2 rounded-md"
          >
            <Check className="h-4 w-4 mr-1 flex-shrink-0" />
            <span>Your vote has been recorded!</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Login Prompt for Anonymous Users */}
      <AnimatePresence>
        {showLoginPrompt && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center text-blue-600 dark:text-blue-400 text-sm mt-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md"
          >
            <Info className="h-4 w-4 mr-1 flex-shrink-0" />
            <span>Create an account to save your votes and get unlimited voting!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <LoginPromptModal
        isOpen={showLoginModal}
        onClose={handleCloseLoginModal}
        actionType="vote"
        returnUrl={window.location?.pathname}
      />
    </div>
  );
}