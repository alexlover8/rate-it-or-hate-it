'use client';

import { useState, useEffect, useCallback } from 'react';
import { generateFingerprint } from '@/utils/deviceFingerprint';
import { db } from '@/lib/firebase';
import { 
  doc, setDoc, getDoc, updateDoc, 
  increment, serverTimestamp, collection, query,
  where, getDocs, limit, orderBy, deleteDoc,
  writeBatch, Timestamp
} from 'firebase/firestore';
import { useAuth } from '@/lib/auth';
// Import gamification functions
import { awardPoints, checkForNewBadges } from '@/lib/gamification';

// Rate limits for anonymous users
const ANONYMOUS_LIMITS = {
  hourly: 30,   // Increased from 20
  daily: 75,    // Increased from 50
  cooldown: 500 // Reduced from 1000ms to 500ms
};

// Rate limits for authenticated users
const AUTHENTICATED_LIMITS = {
  hourly: 100,
  daily: 300,
  cooldown: 200 // 200ms between votes
};

export interface VoteLimits {
  hourly: number;
  daily: number;
  lastVoteTime: Date | null;
}

export interface VoteDetails {
  itemId: string;
  voteType: 'rate' | 'meh' | 'hate';
  timestamp: Date;
  previousVote?: 'rate' | 'meh' | 'hate' | null;
}

export interface VoteResult {
  success: boolean;
  error?: string;
  newRateCount?: number;
  newMehCount?: number;
  newHateCount?: number;
}

export function useVoteManager() {
  const { user, userProfile, awardVotePoints } = useAuth();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [votingLimits, setVotingLimits] = useState<VoteLimits>({
    hourly: 0,
    daily: 0,
    lastVoteTime: null
  });
  const [isReady, setIsReady] = useState(false);
  
  // Generate device fingerprint on component mount
  useEffect(() => {
    const getDeviceId = async () => {
      if (!deviceId) {
        try {
          const fingerprint = await generateFingerprint();
          setDeviceId(fingerprint);
          
          // Load voting limits for this device
          await loadAnonymousVotingLimits(fingerprint);
          setIsReady(true);
        } catch (error) {
          console.error("Error generating device fingerprint:", error);
        }
      }
    };
    
    getDeviceId();
  }, [deviceId]);
  
  // Reset hourly vote limits every hour
  useEffect(() => {
    const resetHourlyLimits = async () => {
      if (!deviceId) return;
      
      try {
        const now = new Date();
        const deviceRef = doc(db, 'devices', deviceId);
        const deviceDoc = await getDoc(deviceRef);
        
        if (deviceDoc.exists()) {
          const data = deviceDoc.data();
          const lastVoteTime = data.lastVoteTime?.toDate();
          
          if (lastVoteTime && (now.getTime() - lastVoteTime.getTime() > 3600000)) {
            // Reset hourly votes if it's been more than an hour
            await updateDoc(deviceRef, {
              hourlyVotes: 0
            });
            
            setVotingLimits(prev => ({
              ...prev,
              hourly: 0
            }));
          }
        }
      } catch (error) {
        console.error("Error resetting hourly limits:", error);
      }
    };
    
    // Check once on mount and then every 10 minutes
    resetHourlyLimits();
    const interval = setInterval(resetHourlyLimits, 600000);
    
    return () => clearInterval(interval);
  }, [deviceId]);
  
  // Reset daily vote limits at midnight
  useEffect(() => {
    const resetDailyLimits = async () => {
      if (!deviceId) return;
      
      try {
        const now = new Date();
        const deviceRef = doc(db, 'devices', deviceId);
        const deviceDoc = await getDoc(deviceRef);
        
        if (deviceDoc.exists()) {
          const data = deviceDoc.data();
          const lastVoteTime = data.lastVoteTime?.toDate();
          
          if (lastVoteTime) {
            const lastVoteDate = new Date(lastVoteTime);
            // Check if the dates are different
            if (lastVoteDate.getDate() !== now.getDate() || 
                lastVoteDate.getMonth() !== now.getMonth() || 
                lastVoteDate.getFullYear() !== now.getFullYear()) {
              // Reset daily votes if it's a new day
              await updateDoc(deviceRef, {
                dailyVotes: 0
              });
              
              setVotingLimits(prev => ({
                ...prev,
                daily: 0
              }));
            }
          }
        }
      } catch (error) {
        console.error("Error resetting daily limits:", error);
      }
    };
    
    // Calculate time until midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    // Reset once on mount
    resetDailyLimits();
    
    // Set a timeout for midnight reset
    const timeout = setTimeout(resetDailyLimits, timeUntilMidnight);
    
    return () => clearTimeout(timeout);
  }, [deviceId]);
  
  // Load anonymous voting limits
  const loadAnonymousVotingLimits = async (deviceId: string) => {
    try {
      const deviceRef = doc(db, 'devices', deviceId);
      const deviceDoc = await getDoc(deviceRef);
      
      if (deviceDoc.exists()) {
        const data = deviceDoc.data();
        
        // Reset hourly votes if it's been more than an hour
        const now = new Date();
        const lastVoteTime = data.lastVoteTime?.toDate();
        let hourlyVotes = data.hourlyVotes || 0;
        
        if (lastVoteTime && (now.getTime() - lastVoteTime.getTime() > 3600000)) {
          hourlyVotes = 0;
          await updateDoc(deviceRef, { hourlyVotes: 0 });
        }
        
        // Reset daily votes if it's a new day
        let dailyVotes = data.dailyVotes || 0;
        if (lastVoteTime) {
          const lastVoteDate = new Date(lastVoteTime);
          if (lastVoteDate.getDate() !== now.getDate() || 
              lastVoteDate.getMonth() !== now.getMonth() || 
              lastVoteDate.getFullYear() !== now.getFullYear()) {
            dailyVotes = 0;
            await updateDoc(deviceRef, { dailyVotes: 0 });
          }
        }
        
        setVotingLimits({
          hourly: hourlyVotes,
          daily: dailyVotes,
          lastVoteTime: lastVoteTime || null
        });
      } else {
        // Create new device record
        await setDoc(deviceRef, {
          created: serverTimestamp(),
          hourlyVotes: 0,
          dailyVotes: 0,
          lastVoteTime: null
        });
        
        setVotingLimits({
          hourly: 0,
          daily: 0,
          lastVoteTime: null
        });
      }
    } catch (error) {
      console.error("Error loading device limits:", error);
    }
  };
  
  // Check if the current user/device can vote
  const checkVotingEligibility = useCallback(async (itemId: string): Promise<{ canVote: boolean; reason?: string }> => {
    // If user is authenticated, use their profile limits
    if (user && userProfile) {
      // Check if they've already voted on this item
      const voteRef = doc(db, 'users', user.uid, 'votes', itemId);
      const voteDoc = await getDoc(voteRef);
      
      if (voteDoc.exists() && !voteDoc.data().canChange) {
        return { canVote: false, reason: 'You have already voted on this item' };
      }
      
      // Check rate limits - authenticated users get higher limits
      const now = new Date();
      if (userProfile.rateLimit?.votes?.lastVoteTime) {
        const lastVoteTime = userProfile.rateLimit.votes.lastVoteTime instanceof Timestamp 
          ? userProfile.rateLimit.votes.lastVoteTime.toDate() 
          : userProfile.rateLimit.votes.lastVoteTime;
          
        const timeSinceLastVote = now.getTime() - lastVoteTime.getTime();
        
        if (timeSinceLastVote < AUTHENTICATED_LIMITS.cooldown) {
          return { 
            canVote: false, 
            reason: `Please wait a moment before voting again` 
          };
        }
        
        // Check hourly limit
        if (userProfile.rateLimit.votes.hourly >= AUTHENTICATED_LIMITS.hourly) {
          return { 
            canVote: false, 
            reason: `You've reached your hourly voting limit. Please try again later.` 
          };
        }
        
        // Check daily limit
        if (userProfile.rateLimit.votes.daily >= AUTHENTICATED_LIMITS.daily) {
          return { 
            canVote: false, 
            reason: `You've reached your daily voting limit. Please try again tomorrow.` 
          };
        }
      }
    } 
    // Anonymous voting - use device fingerprint
    else if (deviceId) {
      // Check if device has already voted on this item
      const votesQuery = query(
        collection(db, 'anonymousVotes'),
        where('deviceId', '==', deviceId),
        where('itemId', '==', itemId),
        limit(1)
      );
      
      const voteDocs = await getDocs(votesQuery);
      if (!voteDocs.empty) {
        const voteData = voteDocs.docs[0].data();
        
        // Check if vote change is allowed (within 5 minutes)
        const voteTime = voteData.timestamp instanceof Timestamp 
          ? voteData.timestamp.toDate() 
          : voteData.timestamp;
        
        const now = new Date();
        const voteAge = now.getTime() - voteTime.getTime();
        const canChangeVote = voteAge < 300000; // 5 minutes
        
        if (!canChangeVote) {
          return { canVote: false, reason: 'You have already voted on this item' };
        }
        
        // Allow changing vote if within time window
        return { canVote: true };
      }
      
      // Check rate limits for anonymous users
      const now = new Date();
      if (votingLimits.lastVoteTime) {
        const timeSinceLastVote = now.getTime() - votingLimits.lastVoteTime.getTime();
        
        if (timeSinceLastVote < ANONYMOUS_LIMITS.cooldown) {
          return { 
            canVote: false, 
            reason: `Please wait a moment before voting again` 
          };
        }
      }
      
      if (votingLimits.hourly >= ANONYMOUS_LIMITS.hourly) {
        return { 
          canVote: false, 
          reason: `You've reached your hourly voting limit. Create an account for more votes!` 
        };
      }
      
      if (votingLimits.daily >= ANONYMOUS_LIMITS.daily) {
        return { 
          canVote: false, 
          reason: `You've reached your daily voting limit. Create an account for more votes!` 
        };
      }
    } else {
      return { canVote: false, reason: 'Unable to verify device. Please refresh the page.' };
    }
    
    return { canVote: true };
  }, [user, userProfile, deviceId, votingLimits]);
  
  // Get user's previous vote on an item
  const getUserVote = useCallback(async (itemId: string): Promise<'rate' | 'meh' | 'hate' | null> => {
    try {
      if (user) {
        // Check authenticated user's vote
        const voteRef = doc(db, 'users', user.uid, 'votes', itemId);
        const voteDoc = await getDoc(voteRef);
        
        if (voteDoc.exists()) {
          return voteDoc.data().voteType;
        }
      } else if (deviceId) {
        // Check anonymous vote
        const anonVoteRef = doc(db, 'anonymousVotes', `${deviceId}_${itemId}`);
        const anonVoteDoc = await getDoc(anonVoteRef);
        
        if (anonVoteDoc.exists()) {
          return anonVoteDoc.data().voteType;
        }
      }
      return null;
    } catch (error) {
      console.error("Error getting user vote:", error);
      return null;
    }
  }, [user, deviceId]);

  // Record a vote
  const recordVote = useCallback(async (
    itemId: string, 
    voteType: 'rate' | 'meh' | 'hate',
    options: { 
      preventDuplicates?: boolean,
      maxRetries?: number 
    } = {}
  ): Promise<VoteResult> => {
    const { preventDuplicates = true, maxRetries = 3 } = options;
    
    // Check if the user is eligible to vote
    if (preventDuplicates) {
      const eligibility = await checkVotingEligibility(itemId);
      if (!eligibility.canVote) {
        return { 
          success: false,
          error: eligibility.reason || 'You are not eligible to vote at this time'
        };
      }
    }
    
    try {
      const now = new Date();
      let retryCount = 0;
      let success = false;
      let newRateCount = 0;
      let newMehCount = 0;
      let newHateCount = 0;
      
      // Get current item data
      const itemRef = doc(db, 'items', itemId);
      const itemDoc = await getDoc(itemRef);
      const itemExists = itemDoc.exists();
      const currentData = itemExists ? itemDoc.data() : null;
      
      // Get previous vote if it exists
      const previousVote = await getUserVote(itemId);
      const isChangingVote = previousVote !== null && previousVote !== voteType;
      
      // Get item category for gamification
      let categoryId = '';
      if (itemExists && currentData) {
        categoryId = currentData.category || '';
      }
      
      while (!success && retryCount <= maxRetries) {
        try {
          // If authenticated
          if (user) {
            // Update user's vote record
            const voteRef = doc(db, 'users', user.uid, 'votes', itemId);
            await setDoc(voteRef, {
              itemId,
              voteType,
              timestamp: serverTimestamp(),
              previousVote: isChangingVote ? previousVote : null,
              canChange: true // Allow changing votes for authenticated users
            });
            
            // Update user's rate limits
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
              'rateLimit.votes.hourly': increment(1),
              'rateLimit.votes.daily': increment(1),
              'rateLimit.votes.lastVoteTime': serverTimestamp(),
              'voteCount': isChangingVote ? increment(0) : increment(1)
            });
            
            // Award points for voting - gamification
            if (!isChangingVote) {
              // Only award points for new votes, not changed votes
              if (awardVotePoints) {
                await awardVotePoints(user.uid, itemId, categoryId);
              } else {
                // Fallback if awardVotePoints is not available
                await awardPoints(user.uid, 'vote', itemId, undefined, categoryId);
              }
              
              // Check for badge eligibility
              await checkForNewBadges(user.uid, 'vote', categoryId);
            }
          } 
          // If anonymous
          else if (deviceId) {
            // Record or update anonymous vote
            const voteId = `${deviceId}_${itemId}`;
            const anonVoteRef = doc(db, 'anonymousVotes', voteId);
            
            // Check if changing an existing vote
            if (isChangingVote) {
              // Update existing vote
              await updateDoc(anonVoteRef, {
                voteType,
                timestamp: serverTimestamp(),
                previousVote
              });
            } else {
              // Create new vote
              await setDoc(anonVoteRef, {
                deviceId,
                itemId,
                voteType,
                timestamp: serverTimestamp(),
                previousVote: null
              });
            }
            
            // Update device rate limits
            const deviceRef = doc(db, 'devices', deviceId);
            await updateDoc(deviceRef, {
              hourlyVotes: increment(1),
              dailyVotes: increment(1),
              lastVoteTime: serverTimestamp()
            });
            
            // Update local state
            setVotingLimits({
              hourly: votingLimits.hourly + 1,
              daily: votingLimits.daily + 1,
              lastVoteTime: now
            });
          } else {
            return { 
              success: false, 
              error: 'No user or device identification available'
            };
          }
          
          // Update item's vote counts
          if (itemExists) {
            // Calculate the vote count changes
            const updates: Record<string, any> = {
              [`${voteType}Count`]: increment(1),
              lastUpdated: serverTimestamp()
            };
            
            // If changing vote, decrement the previous vote count
            if (isChangingVote) {
              updates[`${previousVote}Count`] = increment(-1);
            } else {
              // Only increment totalVotes for new votes, not changed votes
              updates.totalVotes = increment(1);
            }
            
            await updateDoc(itemRef, updates);
            
            // Calculate new vote counts for return value
            newRateCount = currentData ? currentData.rateCount || 0 : 0;
            newMehCount = currentData ? currentData.mehCount || 0 : 0;
            newHateCount = currentData ? currentData.hateCount || 0 : 0;
            
            if (voteType === 'rate') {
              newRateCount++;
            } else if (voteType === 'meh') {
              newMehCount++;
            } else {
              newHateCount++;
            }
            
            if (isChangingVote) {
              if (previousVote === 'rate') {
                newRateCount--;
              } else if (previousVote === 'meh') {
                newMehCount--;
              } else {
                newHateCount--;
              }
            }
          } else {
            // Create item if it doesn't exist
            await setDoc(itemRef, {
              id: itemId,
              rateCount: voteType === 'rate' ? 1 : 0,
              mehCount: voteType === 'meh' ? 1 : 0,
              hateCount: voteType === 'hate' ? 1 : 0,
              totalVotes: 1,
              created: serverTimestamp(),
              lastUpdated: serverTimestamp()
            });
            
            newRateCount = voteType === 'rate' ? 1 : 0;
            newMehCount = voteType === 'meh' ? 1 : 0;
            newHateCount = voteType === 'hate' ? 1 : 0;
          }
          
          success = true;
        } catch (error) {
          console.error(`Attempt ${retryCount + 1} failed:`, error);
          retryCount++;
          
          if (retryCount <= maxRetries) {
            // Exponential backoff for retries
            await new Promise(resolve => setTimeout(resolve, 300 * retryCount));
          } else {
            throw error;
          }
        }
      }
      
      return { 
        success: true, 
        newRateCount,
        newMehCount,
        newHateCount
      };
    } catch (error) {
      console.error("Error recording vote:", error);
      return { 
        success: false, 
        error: 'Failed to record vote. Please try again.'
      };
    }
  }, [user, deviceId, votingLimits, checkVotingEligibility, getUserVote, awardVotePoints]);

  // Delete a vote (for admins or users within the change window)
  const deleteVote = useCallback(async (itemId: string): Promise<boolean> => {
    try {
      const previousVote = await getUserVote(itemId);
      
      if (!previousVote) {
        return false; // No vote to delete
      }
      
      // Create a batch for atomic operations
      const batch = writeBatch(db);
      
      // Delete the vote record
      if (user) {
        const voteRef = doc(db, 'users', user.uid, 'votes', itemId);
        batch.delete(voteRef);
        
        // Decrement user's vote count
        const userRef = doc(db, 'users', user.uid);
        batch.update(userRef, {
          'voteCount': increment(-1)
        });
      } else if (deviceId) {
        const voteId = `${deviceId}_${itemId}`;
        const anonVoteRef = doc(db, 'anonymousVotes', voteId);
        batch.delete(anonVoteRef);
      } else {
        return false;
      }
      
      // Update item's vote counts
      const itemRef = doc(db, 'items', itemId);
      batch.update(itemRef, {
        [`${previousVote}Count`]: increment(-1),
        totalVotes: increment(-1),
        lastUpdated: serverTimestamp()
      });
      
      // Commit the batch
      await batch.commit();
      return true;
    } catch (error) {
      console.error("Error deleting vote:", error);
      return false;
    }
  }, [user, deviceId, getUserVote]);

  // Get vote statistics for an item
  const getVoteStats = useCallback(async (itemId: string): Promise<{
    rateCount: number;
    mehCount: number;
    hateCount: number;
    totalVotes: number;
    ratePercentage: number;
    mehPercentage: number;
    hatePercentage: number;
    userVote: 'rate' | 'meh' | 'hate' | null;
  }> => {
    try {
      // Get item data
      const itemRef = doc(db, 'items', itemId);
      const itemDoc = await getDoc(itemRef);
      
      // Get user's vote
      const userVote = await getUserVote(itemId);
      
      if (itemDoc.exists()) {
        const data = itemDoc.data();
        const rateCount = data.rateCount || 0;
        const mehCount = data.mehCount || 0;
        const hateCount = data.hateCount || 0;
        const totalVotes = data.totalVotes || (rateCount + mehCount + hateCount);
        
        // Calculate percentages
        const ratePercentage = totalVotes > 0 
          ? Math.round((rateCount / totalVotes) * 100) 
          : 0;
        const mehPercentage = totalVotes > 0 
          ? Math.round((mehCount / totalVotes) * 100)
          : 0;
        const hatePercentage = totalVotes > 0 
          ? Math.round((hateCount / totalVotes) * 100)
          : 0;
        
        return {
          rateCount,
          mehCount,
          hateCount,
          totalVotes,
          ratePercentage,
          mehPercentage,
          hatePercentage,
          userVote
        };
      }
      
      // Return default values if item doesn't exist
      return {
        rateCount: 0,
        mehCount: 0,
        hateCount: 0,
        totalVotes: 0,
        ratePercentage: 0,
        mehPercentage: 0,
        hatePercentage: 0,
        userVote
      };
    } catch (error) {
      console.error("Error getting vote stats:", error);
      // Return fallback values on error
      return {
        rateCount: 0,
        mehCount: 0,
        hateCount: 0,
        totalVotes: 0,
        ratePercentage: 0,
        mehPercentage: 0,
        hatePercentage: 0,
        userVote: null
      };
    }
  }, [getUserVote]);

  return {
    user,
    deviceId,
    isReady,
    votingLimits,
    checkVotingEligibility,
    getUserVote,
    recordVote,
    deleteVote,
    getVoteStats
  };
}