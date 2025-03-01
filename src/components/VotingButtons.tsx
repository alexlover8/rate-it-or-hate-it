'use client';

import { useState, useEffect, useCallback } from 'react';
import { Heart, HeartOff, AlertCircle, Info, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { generateFingerprint } from '@/utils/deviceFingerprint';
import { AnimatePresence, motion } from 'framer-motion';

type VotingButtonsProps = {
  itemId: string;
  initialRateCount?: number;
  initialHateCount?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTotalVotes?: boolean;
  showPercentage?: boolean;
  showCounts?: boolean;
  animated?: boolean;
  onVoteSuccess?: (type: 'rate' | 'hate') => void;
  onVoteError?: (error: string) => void;
};

export default function VotingButtons({
  itemId,
  initialRateCount = 0,
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
  const { user } = useAuth();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [rateCount, setRateCount] = useState(initialRateCount);
  const [hateCount, setHateCount] = useState(initialHateCount);
  const [userVote, setUserVote] = useState<'rate' | 'hate' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Button size classes based on size prop
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

  // Check for previous votes - moved to a useCallback to resolve dependency issues
  const checkPreviousVote = useCallback(async (deviceFingerprint: string) => {
    try {
      if (user) {
        // Check authenticated user's vote
        const voteRef = doc(db, 'users', user.uid, 'votes', itemId);
        const voteDoc = await getDoc(voteRef);
        
        if (voteDoc.exists()) {
          setUserVote(voteDoc.data().voteType);
        }
      } else if (deviceFingerprint) {
        // Check anonymous vote
        const anonVoteRef = doc(db, 'anonymousVotes', `${deviceFingerprint}_${itemId}`);
        const anonVoteDoc = await getDoc(anonVoteRef);
        
        if (anonVoteDoc.exists()) {
          setUserVote(anonVoteDoc.data().voteType);
        }
      }
    } catch (err) {
      console.error("Error checking previous vote:", err);
    }
  }, [user, itemId]);

  // Generate device fingerprint on component mount
  useEffect(() => {
    const getDeviceId = async () => {
      if (!deviceId) {
        try {
          const fingerprint = await generateFingerprint();
          setDeviceId(fingerprint);
          
          // Check if user has already voted on this item
          await checkPreviousVote(fingerprint);
        } catch (err) {
          console.error("Error generating device fingerprint:", err);
        }
      }
    };
    
    getDeviceId();
  }, [deviceId, checkPreviousVote]);

  // Handle vote click
  const handleVote = async (voteType: 'rate' | 'hate') => {
    // Reset states
    setError(null);
    setShowSuccess(false);
    setShowLoginPrompt(false);
    
    // Prevent voting again on same option or while submitting
    if (userVote === voteType || isSubmitting) return;
    
    // If not logged in, show anonymous vote disclaimer after a certain number of votes
    if (!user && totalVotes > 10 && Math.random() > 0.7) {
      setShowLoginPrompt(true);
      setTimeout(() => setShowLoginPrompt(false), 5000);
    }
    
    // Ensure we have a device ID for anonymous voting
    if (!user && !deviceId) {
      setError("Unable to process your vote. Please try again.");
      if (onVoteError) onVoteError("Unable to process your vote. Please try again.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Determine if this is a new vote or changing an existing vote
      const isChangingVote = userVote !== null;
      
      // Calculate new vote counts
      let newRateCount = rateCount;
      let newHateCount = hateCount;
      
      if (isChangingVote) {
        // Remove previous vote
        if (userVote === 'rate') {
          newRateCount -= 1;
        } else {
          newHateCount -= 1;
        }
      }
      
      // Add new vote
      if (voteType === 'rate') {
        newRateCount += 1;
      } else {
        newHateCount += 1;
      }
      
      // Update local state immediately for a responsive UI
      setRateCount(newRateCount);
      setHateCount(newHateCount);
      setUserVote(voteType);
      
      // Record vote in Firestore
      const itemRef = doc(db, 'items', itemId);
      const itemDoc = await getDoc(itemRef);
      
      // Item batch update
      if (itemDoc.exists()) {
        // Item exists, update it
        await updateDoc(itemRef, {
          [`${voteType}Count`]: increment(1),
          ...(isChangingVote ? { [`${userVote}Count`]: increment(-1) } : {}),
          totalVotes: isChangingVote ? increment(0) : increment(1),
          lastUpdated: serverTimestamp()
        });
      } else {
        // Item doesn't exist, create it
        await setDoc(itemRef, {
          id: itemId,
          rateCount: voteType === 'rate' ? 1 : 0,
          hateCount: voteType === 'hate' ? 1 : 0,
          totalVotes: 1,
          created: serverTimestamp(),
          lastUpdated: serverTimestamp()
        });
      }
      
      // Record user's vote based on authentication state
      if (user) {
        // Authenticated vote
        const voteRef = doc(db, 'users', user.uid, 'votes', itemId);
        await setDoc(voteRef, {
          itemId,
          voteType,
          timestamp: serverTimestamp(),
          previousVote: isChangingVote ? userVote : null
        });
        
        // Update user's vote count
        const userRef = doc(db, 'users', user.uid);
        if (!isChangingVote) {
          await updateDoc(userRef, {
            voteCount: increment(1)
          });
        }
      } else if (deviceId) {
        // Anonymous vote
        const anonVoteRef = doc(db, 'anonymousVotes', `${deviceId}_${itemId}`);
        await setDoc(anonVoteRef, {
          deviceId,
          itemId,
          voteType,
          timestamp: serverTimestamp(),
          previousVote: isChangingVote ? userVote : null
        });
      }
      
      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      
      // Trigger callback if provided
      if (onVoteSuccess) {
        onVoteSuccess(voteType);
      }
      
    } catch (err) {
      console.error("Error submitting vote:", err);
      const errorMessage = "Failed to record your vote. Please try again.";
      setError(errorMessage);
      
      if (onVoteError) onVoteError(errorMessage);
      
      // Revert UI state on error
      if (userVote) {
        // If changing vote, revert to previous state
        setRateCount(initialRateCount);
        setHateCount(initialHateCount);
        setUserVote(userVote);
      } else {
        // If new vote, remove the vote
        if (voteType === 'rate') {
          setRateCount(prev => prev - 1);
        } else {
          setHateCount(prev => prev - 1);
        }
        setUserVote(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Calculate percentages
  const totalVotes = rateCount + hateCount;
  const ratePercentage = totalVotes > 0 ? Math.round((rateCount / totalVotes) * 100) : 50;
  const hatePercentage = 100 - ratePercentage;

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
    </div>
  );
}