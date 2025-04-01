'use client';

import React from 'react';
import { getUserLevelInfo } from '@/lib/gamification';
import { USER_LEVELS } from '@/lib/data';

interface UserLevelProps {
  points: number;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  showNextLevel?: boolean;
}

export const UserLevel = ({
  points,
  size = 'md',
  showProgress = true,
  showNextLevel = true,
}: UserLevelProps) => {
  const levelInfo = getUserLevelInfo(points);
  
  // Size mappings
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  const labelSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  const progressSizes = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2'
  };
  
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className={`font-semibold ${textSizes[size]}`}>
            {levelInfo.currentLevel.name}
          </div>
          <div className={`bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded ${labelSizes[size]}`}>
            Level {levelInfo.currentLevel.level}
          </div>
        </div>
        <div className={`text-gray-500 dark:text-gray-400 ${labelSizes[size]}`}>
          {points} points
        </div>
      </div>
      
      {showProgress && (
        <div className="mb-1">
          <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${progressSizes[size]}`}>
            <div 
              className="bg-blue-500 dark:bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${levelInfo.progressPercent}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {showNextLevel && levelInfo.nextLevel && (
        <div className="flex justify-between items-center">
          <div className={`text-gray-500 dark:text-gray-400 ${labelSizes[size]}`}>
            {levelInfo.pointsToNextLevel} points to {levelInfo.nextLevel.name}
          </div>
          <div className={`text-gray-500 dark:text-gray-400 ${labelSizes[size]}`}>
            {levelInfo.progressPercent}%
          </div>
        </div>
      )}
    </div>
  );
};

// For compact display, just showing level badge
interface UserLevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
}

export const UserLevelBadge = ({ level, size = 'md' }: UserLevelBadgeProps) => {
  const levelData = USER_LEVELS.find(l => l.level === level) || USER_LEVELS[0];
  
  // Size mappings
  const sizesMap = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-2.5 py-1.5'
  };
  
  // Color based on level range
  const getColorByLevel = (level: number) => {
    if (level <= 2) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
    if (level <= 4) return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
    if (level <= 6) return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
    if (level <= 8) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
    return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
  };
  
  return (
    <div className={`inline-flex items-center rounded-full ${sizesMap[size]} ${getColorByLevel(level)}`}>
      <span className="font-medium">Lvl {level}</span>
    </div>
  );
};