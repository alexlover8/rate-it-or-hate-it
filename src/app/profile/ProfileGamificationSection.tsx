'use client';

import React, { useState } from 'react';
import { UserLevel, UserLevelBadge } from './UserLevel';
import { UserBadge, UserBadgesList } from './UserBadge';
import { getUserBadgesByCategory, getAvailableBadges, getBadgeProgress } from '@/lib/gamification';
import { BADGES } from '@/lib/gamification';
import { Award, Star, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import Link from 'next/link';

interface ProfileGamificationSectionProps {
  userProfile: any; // Replace with your actual UserProfile type
}

export const ProfileGamificationSection = ({ userProfile }: ProfileGamificationSectionProps) => {
  const [showAllBadges, setShowAllBadges] = useState(false);
  
  // Extract gamification data from user profile
  const { gamification } = userProfile || { gamification: { points: 0, level: 1, badges: [] } };
  const { points = 0, level = 1, badges = [] } = gamification || {};
  
  // Group badges by category
  const badgesByCategory = getUserBadgesByCategory(badges);
  
  // Get badges user can earn next
  const availableBadges = getAvailableBadges(badges);
  
  return (
    <div className="space-y-6">
      {/* Level progress card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
            Your Level
          </h2>
          
          <UserLevelBadge level={level} size="md" />
        </div>
        
        <UserLevel points={points} size="lg" showProgress={true} showNextLevel={true} />
      </div>
      
      {/* Badges section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Award className="mr-2 h-5 w-5 text-indigo-500" />
              Your Badges
            </h2>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {badges.length} earned
            </div>
          </div>
          
          {badges.length > 0 ? (
            <div className="space-y-6">
              {/* Activity badges */}
              {badgesByCategory.activity && badgesByCategory.activity.length > 0 && (
                <div>
                  <h3 className="text-sm uppercase tracking-wider font-medium text-gray-500 dark:text-gray-400 mb-3">
                    Activity Badges
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {badgesByCategory.activity.slice(0, showAllBadges ? undefined : 4).map(badge => (
                      <div 
                        key={badge.id} 
                        className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 flex flex-col items-center text-center"
                      >
                        <UserBadge badgeId={badge.id} size="lg" showLabel={false} />
                        <div className="mt-2 font-medium text-gray-800 dark:text-white text-sm">
                          {badge.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {badge.description}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {badgesByCategory.activity.length > 4 && !showAllBadges && (
                    <div className="text-center mt-2">
                      <button 
                        onClick={() => setShowAllBadges(true)}
                        className="text-blue-500 dark:text-blue-400 text-sm font-medium hover:underline inline-flex items-center"
                      >
                        <span>Show all activity badges</span>
                        <ChevronDown className="ml-1 h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Quality badges */}
              {badgesByCategory.quality && badgesByCategory.quality.length > 0 && (
                <div>
                  <h3 className="text-sm uppercase tracking-wider font-medium text-gray-500 dark:text-gray-400 mb-3">
                    Quality Badges
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {badgesByCategory.quality.map(badge => (
                      <div 
                        key={badge.id} 
                        className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 flex flex-col items-center text-center"
                      >
                        <UserBadge badgeId={badge.id} size="lg" showLabel={false} />
                        <div className="mt-2 font-medium text-gray-800 dark:text-white text-sm">
                          {badge.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {badge.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Category expert badges */}
              {badgesByCategory.category_expert && badgesByCategory.category_expert.length > 0 && (
                <div>
                  <h3 className="text-sm uppercase tracking-wider font-medium text-gray-500 dark:text-gray-400 mb-3">
                    Category Expert Badges
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {badgesByCategory.category_expert.map(badge => (
                      <div 
                        key={badge.id} 
                        className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 flex flex-col items-center text-center"
                      >
                        <UserBadge badgeId={badge.id} size="lg" showLabel={false} />
                        <div className="mt-2 font-medium text-gray-800 dark:text-white text-sm">
                          {badge.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {badge.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {showAllBadges && (
                <div className="text-center mt-4">
                  <button 
                    onClick={() => setShowAllBadges(false)}
                    className="text-blue-500 dark:text-blue-400 text-sm font-medium hover:underline inline-flex items-center"
                  >
                    <span>Show less</span>
                    <ChevronUp className="ml-1 h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="inline-block p-3 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                <Award className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                No badges yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Start participating by voting, commenting, and submitting items to earn your first badge!
              </p>
            </div>
          )}
        </div>
        
        {/* Next badges to earn */}
        {availableBadges.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Up Next: Badges to Earn
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {availableBadges.slice(0, 3).map(badge => {
                // Use badgeProgress from user if available
                const progress = gamification?.badgeProgress?.[badge.id] || 0;
                const progressPercent = getBadgeProgress(badge.id, progress);
                
                return (
                  <div 
                    key={badge.id} 
                    className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-100 dark:border-gray-600 flex items-center gap-3"
                  >
                    <div className="opacity-50">
                      <UserBadge badgeId={badge.id} size="md" showLabel={false} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 dark:text-white text-sm truncate">
                        {badge.name}
                      </div>
                      <div className="w-full mt-1">
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 dark:bg-blue-600 rounded-full"
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-right mt-0.5 text-gray-500 dark:text-gray-400">
                          {progressPercent}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Tips for earning more points */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Star className="mr-2 h-5 w-5 text-amber-500" />
          Ways to Earn Points
        </h2>
        
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <li className="flex items-start">
            <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-2 mt-0.5">1</div>
            <div>
              <span className="font-medium">Vote on items</span> - Every vote gives you 1 point
            </div>
          </li>
          <li className="flex items-start">
            <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-2 mt-0.5">2</div>
            <div>
              <span className="font-medium">Leave comments</span> - Each comment earns 2 points
            </div>
          </li>
          <li className="flex items-start">
            <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-2 mt-0.5">5</div>
            <div>
              <span className="font-medium">Submit new items</span> - Add an item and get 5 points
            </div>
          </li>
          <li className="flex items-start">
            <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-2 mt-0.5">5</div>
            <div>
              <span className="font-medium">Log in consistently</span> - 5 points for a 3-day streak, 15 for a week
            </div>
          </li>
        </ul>
        
        <div className="mt-4 text-center">
          <Link
            href="/add-item"
            className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Add an Item
          </Link>
        </div>
      </div>
    </div>
  );
};