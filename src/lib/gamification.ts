// src/lib/gamification.ts

import { db } from './firebase';
import { doc, updateDoc, getDoc, arrayUnion, increment, serverTimestamp, runTransaction } from 'firebase/firestore';
import { UserLevel, UserGamification, PointActivity, USER_LEVELS, Badge } from './data';

// Point values for different actions
export const POINT_VALUES = {
  VOTE: 1,
  COMMENT: 2,
  ITEM_SUBMISSION: 5,
  COMMENT_LIKE_RECEIVED: 1,
  LOGIN_STREAK_3_DAYS: 5,
  LOGIN_STREAK_7_DAYS: 15,
  COMMUNITY_CONTRIBUTION_50_VOTES: 10
};

// Badge definitions - all our badge configurations
export const BADGES: Record<string, Badge> = {
  // Activity Badges
  first_vote: {
    id: 'first_vote',
    name: 'First Vote',
    description: 'Cast your first vote',
    category: 'activity',
    icon: '👍',
    bgColor: '#4299e1',
    criteria: { type: 'vote_count', threshold: 1 }
  },
  first_comment: {
    id: 'first_comment',
    name: 'First Comment',
    description: 'Posted your first comment',
    category: 'activity',
    icon: '💬',
    bgColor: '#4299e1',
    criteria: { type: 'comment_count', threshold: 1 }
  },
  item_submitter: {
    id: 'item_submitter',
    name: 'Contributor',
    description: 'Submitted your first item',
    category: 'activity',
    icon: '🌟',
    bgColor: '#4299e1',
    criteria: { type: 'item_count', threshold: 1 }
  },
  streak_7_days: {
    id: 'streak_7_days',
    name: 'Week Streak',
    description: 'Logged in for 7 consecutive days',
    category: 'activity',
    icon: '🔥',
    bgColor: '#f6ad55',
    criteria: { type: 'login_streak', threshold: 7 }
  },
  streak_30_days: {
    id: 'streak_30_days',
    name: 'Month Streak',
    description: 'Logged in for 30 consecutive days',
    category: 'activity',
    icon: '🔥🔥',
    bgColor: '#f6ad55',
    criteria: { type: 'login_streak', threshold: 30 }
  },
  power_voter_10: {
    id: 'power_voter_10',
    name: 'Power Voter',
    description: 'Cast 10 votes',
    category: 'activity',
    icon: '✅',
    bgColor: '#48bb78',
    criteria: { type: 'vote_count', threshold: 10 }
  },
  power_voter_50: {
    id: 'power_voter_50',
    name: 'Super Voter',
    description: 'Cast 50 votes',
    category: 'activity',
    icon: '✅✅',
    bgColor: '#48bb78',
    criteria: { type: 'vote_count', threshold: 50 }
  },
  
  // Quality Badges
  trendsetter: {
    id: 'trendsetter',
    name: 'Trendsetter',
    description: 'Submitted an item that became trending',
    category: 'quality',
    icon: '📈',
    bgColor: '#9f7aea',
    criteria: { type: 'trending_items', threshold: 1 }
  },
  community_voice: {
    id: 'community_voice',
    name: 'Community Voice',
    description: 'Received 10 likes on your comments',
    category: 'quality',
    icon: '💖',
    bgColor: '#ed64a6',
    criteria: { type: 'comment_likes', threshold: 10 }
  },
  
  // Category Expert Badges
  tech_guru: {
    id: 'tech_guru',
    name: 'Tech Guru',
    description: 'Active in technology categories',
    category: 'category_expert',
    icon: '💻',
    bgColor: '#3182ce',
    criteria: { type: 'category_activity', threshold: 10, categoryId: 'tech-apps' }
  },
  movie_buff: {
    id: 'movie_buff',
    name: 'Movie Buff',
    description: 'Active in movie categories',
    category: 'category_expert',
    icon: '🎬',
    bgColor: '#e53e3e',
    criteria: { type: 'category_activity', threshold: 10, categoryId: 'movies' }
  },
  foodie: {
    id: 'foodie',
    name: 'Foodie',
    description: 'Active in food categories',
    category: 'category_expert',
    icon: '🍕',
    bgColor: '#dd6b20',
    criteria: { type: 'category_activity', threshold: 10, categoryId: 'food-restaurants' }
  }
};

/**
 * Award points to a user for a specific action
 */
export async function awardPoints(
  userId: string, 
  action: PointActivity['action'], 
  itemId?: string, 
  commentId?: string,
  categoryId?: string
): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error(`User with ID ${userId} not found`);
      return false;
    }
    
    // Determine points based on action
    let points = 0;
    switch (action) {
      case 'vote':
        points = POINT_VALUES.VOTE;
        break;
      case 'comment':
        points = POINT_VALUES.COMMENT;
        break;
      case 'item_submission':
        points = POINT_VALUES.ITEM_SUBMISSION;
        break;
      case 'comment_like':
        points = POINT_VALUES.COMMENT_LIKE_RECEIVED;
        break;
      case 'login_streak':
        // Determine if it's a 3-day or 7-day streak
        const streakDays = userDoc.data()?.gamification?.streakDays || 0;
        if (streakDays === 3) {
          points = POINT_VALUES.LOGIN_STREAK_3_DAYS;
        } else if (streakDays === 7) {
          points = POINT_VALUES.LOGIN_STREAK_7_DAYS;
        }
        break;
      case 'community_contribution':
        points = POINT_VALUES.COMMUNITY_CONTRIBUTION_50_VOTES;
        break;
      default:
        points = 0;
    }
    
    if (points <= 0) return false;
    
    // Create the point activity record
    const pointActivity: PointActivity = {
      action,
      points,
      timestamp: new Date(),
      ...(itemId && { itemId }),
      ...(commentId && { commentId }),
      ...(categoryId && { categoryId })
    };
    
    // Update the user document in a transaction to ensure atomicity
    await runTransaction(db, async (transaction) => {
      // Get the latest user data in the transaction
      const latestUserDoc = await transaction.get(userRef);
      if (!latestUserDoc.exists()) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      const userData = latestUserDoc.data();
      const currentPoints = userData.gamification?.points || 0;
      const newPoints = currentPoints + points;
      
      // Calculate the new level based on points
      const currentLevel = userData.gamification?.level || 1;
      let newLevel = currentLevel;
      
      // Find the appropriate level based on total points
      for (const level of USER_LEVELS) {
        if (newPoints >= level.minPoints && newPoints <= level.maxPoints) {
          newLevel = level.level;
          break;
        }
      }
      
      // Ensure gamification object exists
      const gamification = userData.gamification || {
        points: 0,
        level: 1,
        badges: [],
        streakDays: 0,
        lastLogin: null,
        pointsHistory: [],
        badgeProgress: {},
        categoryActivity: {}
      };
      
      // Update category activity counter if a category is provided
      if (categoryId && action !== 'login_streak') {
        const currentCategoryActivity = gamification.categoryActivity?.[categoryId] || 0;
        if (!gamification.categoryActivity) {
          gamification.categoryActivity = {};
        }
        gamification.categoryActivity[categoryId] = currentCategoryActivity + 1;
      }
      
      // Prepare updates
      const updatedGamification = {
        ...gamification,
        points: newPoints,
        level: newLevel,
        pointsHistory: [...(gamification.pointsHistory || []), pointActivity]
      };
      
      // Update the user document
      transaction.update(userRef, {
        gamification: updatedGamification,
        lastUpdated: serverTimestamp()
      });
    });
    
    // Check for badge unlocks after awarding points
    await checkForNewBadges(userId, action, categoryId);
    
    return true;
  } catch (error) {
    console.error('Error awarding points:', error);
    return false;
  }
}

/**
 * Update user login streak
 */
export async function updateLoginStreak(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error(`User with ID ${userId} not found`);
      return;
    }
    
    const userData = userDoc.data();
    const lastLogin = userData.gamification?.lastLogin?.toDate?.() || null;
    const currentStreakDays = userData.gamification?.streakDays || 0;
    const now = new Date();
    
    // Check if the last login was yesterday (to continue the streak)
    let newStreakDays = 1; // Default to 1 if streak breaks or first login
    
    if (lastLogin) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Check if last login was yesterday (same day in streak terms)
      const lastLoginDate = lastLogin.toDateString();
      const yesterdayDate = yesterday.toDateString();
      
      if (lastLoginDate === yesterdayDate) {
        // Continue the streak
        newStreakDays = currentStreakDays + 1;
      } else if (lastLoginDate === now.toDateString()) {
        // Already logged in today, don't increment
        newStreakDays = currentStreakDays;
      }
    }
    
    // Ensure gamification object exists
    const gamification = userData.gamification || {
      points: 0,
      level: 1,
      badges: [],
      streakDays: 0,
      lastLogin: null,
      pointsHistory: [],
      badgeProgress: {},
      categoryActivity: {}
    };
    
    // Update streak information
    await updateDoc(userRef, {
      gamification: {
        ...gamification,
        streakDays: newStreakDays,
        lastLogin: now
      },
      lastUpdated: serverTimestamp()
    });
    
    // Award streak points if applicable
    if (newStreakDays === 3 || newStreakDays === 7 || newStreakDays === 30) {
      await awardPoints(userId, 'login_streak');
      
      // Check for streak badges
      if (newStreakDays === 7) {
        await checkForBadge(userId, 'streak_7_days');
      } else if (newStreakDays === 30) {
        await checkForBadge(userId, 'streak_30_days');
      }
    }
  } catch (error) {
    console.error('Error updating login streak:', error);
  }
}

/**
 * Check if a specific badge should be awarded
 */
async function checkForBadge(userId: string, badgeId: string): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) return false;
    
    const userData = userDoc.data();
    const userBadges = userData.gamification?.badges || [];
    
    // If user already has this badge, no need to check
    if (userBadges.includes(badgeId)) return false;
    
    const badge = BADGES[badgeId];
    if (!badge) return false;
    
    const badgeProgress = userData.gamification?.badgeProgress?.[badgeId] || 0;
    
    // Check if badge should be awarded
    if (badgeProgress >= badge.criteria.threshold) {
      // Update user's badges
      await updateDoc(userRef, {
        [`gamification.badges`]: arrayUnion(badgeId)
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error checking badge ${badgeId}:`, error);
    return false;
  }
}

/**
 * Check if user has earned new badges based on activity
 */
export async function checkForNewBadges(
  userId: string, 
  action: string, 
  categoryId?: string
): Promise<string[]> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error(`User with ID ${userId} not found`);
      return [];
    }
    
    const userData = userDoc.data();
    const userBadges = userData.gamification?.badges || [];
    const badgeProgress = userData.gamification?.badgeProgress || {};
    
    // Track which badges we need to check based on the action
    let badgesToCheck: Badge[] = [];
    
    switch (action) {
      case 'vote':
        badgesToCheck = Object.values(BADGES).filter(
          badge => badge.criteria.type === 'vote_count' || 
                  (badge.criteria.type === 'category_activity' && categoryId === badge.criteria.categoryId)
        );
        break;
      case 'comment':
        badgesToCheck = Object.values(BADGES).filter(
          badge => badge.criteria.type === 'comment_count' ||
                  (badge.criteria.type === 'category_activity' && categoryId === badge.criteria.categoryId)
        );
        break;
      case 'item_submission':
        badgesToCheck = Object.values(BADGES).filter(
          badge => badge.criteria.type === 'item_count' ||
                  (badge.criteria.type === 'category_activity' && categoryId === badge.criteria.categoryId)
        );
        break;
      case 'login_streak':
        badgesToCheck = Object.values(BADGES).filter(
          badge => badge.criteria.type === 'login_streak'
        );
        break;
      case 'trending_item':
        badgesToCheck = Object.values(BADGES).filter(
          badge => badge.criteria.type === 'trending_items'
        );
        break;
      case 'comment_like':
        badgesToCheck = Object.values(BADGES).filter(
          badge => badge.criteria.type === 'comment_likes'
        );
        break;
      default:
        badgesToCheck = [];
    }
    
    // Filter out badges user already has
    badgesToCheck = badgesToCheck.filter(badge => !userBadges.includes(badge.id));
    
    if (badgesToCheck.length === 0) return [];
    
    // Update badge progress for this action
    const badgeProgressUpdates: Record<string, number> = {};
    const newBadges: string[] = [];
    
    for (const badge of badgesToCheck) {
      // Get current progress for this badge
      let currentProgress = badgeProgress[badge.id] || 0;
      
      // Increment progress
      if (
        (badge.criteria.type === 'category_activity' && categoryId === badge.criteria.categoryId) ||
        badge.criteria.type.includes(action)
      ) {
        currentProgress += 1;
        badgeProgressUpdates[`gamification.badgeProgress.${badge.id}`] = currentProgress;
      }
      
      // Check if badge earned
      if (currentProgress >= badge.criteria.threshold) {
        newBadges.push(badge.id);
      }
    }
    
    // If we have updates or new badges, update user doc
    if (Object.keys(badgeProgressUpdates).length > 0 || newBadges.length > 0) {
      const updates: any = { ...badgeProgressUpdates };
      
      if (newBadges.length > 0) {
        // Add new badges to user's badges array
        newBadges.forEach(badgeId => {
          if (!userBadges.includes(badgeId)) {
            updates[`gamification.badges`] = arrayUnion(badgeId);
          }
        });
      }
      
      await updateDoc(userRef, updates);
    }
    
    return newBadges;
  } catch (error) {
    console.error('Error checking for new badges:', error);
    return [];
  }
}

/**
 * Get user's current level information
 */
export function getUserLevelInfo(points: number) {
  // Find current level
  const currentLevel = USER_LEVELS.find(
    level => points >= level.minPoints && points <= level.maxPoints
  ) || USER_LEVELS[0];
  
  // Find next level
  const nextLevelIndex = USER_LEVELS.findIndex(level => level.level === currentLevel.level) + 1;
  const nextLevel = nextLevelIndex < USER_LEVELS.length ? USER_LEVELS[nextLevelIndex] : null;
  
  // Calculate progress to next level
  let progressPercent = 0;
  if (nextLevel) {
    const pointsInCurrentLevel = points - currentLevel.minPoints;
    const pointsRequiredForNextLevel = nextLevel.minPoints - currentLevel.minPoints;
    progressPercent = Math.min(Math.round((pointsInCurrentLevel / pointsRequiredForNextLevel) * 100), 100);
  } else {
    // At max level
    progressPercent = 100;
  }
  
  return {
    currentLevel,
    nextLevel,
    points,
    pointsToNextLevel: nextLevel ? nextLevel.minPoints - points : 0,
    progressPercent
  };
}

/**
 * Get all badges for a user grouped by category
 */
export function getUserBadgesByCategory(userBadges: string[]) {
  const groupedBadges: Record<string, Badge[]> = {
    activity: [],
    quality: [],
    category_expert: []
  };
  
  userBadges.forEach(badgeId => {
    const badge = BADGES[badgeId];
    if (badge) {
      groupedBadges[badge.category].push(badge);
    }
  });
  
  return groupedBadges;
}

/**
 * Get all badges a user can earn (but doesn't have yet)
 */
export function getAvailableBadges(userBadges: string[]) {
  return Object.values(BADGES).filter(badge => !userBadges.includes(badge.id));
}

/**
 * Get badge progress for a user
 */
export function getBadgeProgress(badgeId: string, progress: number) {
  const badge = BADGES[badgeId];
  if (!badge) return 0;
  
  const percentage = Math.min(Math.round((progress / badge.criteria.threshold) * 100), 100);
  return percentage;
}

/**
 * Initialize gamification for a new user
 */
export function initializeUserGamification(): UserGamification {
  return {
    points: 0,
    level: 1,
    badges: [],
    streakDays: 0,
    lastLogin: new Date(),
    pointsHistory: [],
    badgeProgress: {},
    categoryActivity: {}
  };
}

/**
 * Mark item as trending and award badges
 */
export async function markItemAsTrending(itemId: string) {
  try {
    // Get the item
    const itemRef = doc(db, 'items', itemId);
    const itemDoc = await getDoc(itemRef);
    
    if (!itemDoc.exists()) return;
    
    const item = itemDoc.data();
    const creatorId = item.creatorId;
    
    if (!creatorId) return;
    
    // Update item as trending
    await updateDoc(itemRef, {
      isTrending: true,
      lastUpdated: serverTimestamp()
    });
    
    // Award badge to creator
    await checkForNewBadges(creatorId, 'trending_item');
  } catch (error) {
    console.error('Error marking item as trending:', error);
  }
}