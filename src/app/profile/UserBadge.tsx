'use client';

import React from 'react';
import { Badge } from '@/lib/data';
import { BADGES } from '@/lib/gamification';

interface UserBadgeProps {
  badgeId: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const UserBadge = ({ 
  badgeId, 
  size = 'md', 
  showLabel = false,
}: UserBadgeProps) => {
  const badgeConfig = BADGES[badgeId];
  
  if (!badgeConfig) {
    console.warn(`Badge with ID "${badgeId}" not found`);
    return null;
  }
  
  // Size mappings
  const sizeClasses = {
    sm: 'text-xs p-1',
    md: 'text-sm p-1.5',
    lg: 'text-base p-2'
  };
  
  const iconSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };
  
  return (
    <div 
      className={`inline-flex items-center gap-1 rounded-full ${sizeClasses[size]} ${showLabel ? 'px-3' : ''}`}
      style={{ 
        backgroundColor: `${badgeConfig.bgColor}20`, 
        color: badgeConfig.bgColor 
      }}
      title={badgeConfig.description}
    >
      <span className={`${iconSizes[size]}`}>{badgeConfig.icon}</span>
      {showLabel && (
        <span className={`font-medium ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'}`}>
          {badgeConfig.name}
        </span>
      )}
    </div>
  );
};

// For displaying multiple badges
interface UserBadgesListProps {
  badges: string[];
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  maxDisplay?: number;
}

export const UserBadgesList = ({
  badges,
  size = 'md',
  showLabels = false,
  maxDisplay
}: UserBadgesListProps) => {
  // Define sizeClasses here to fix the reference error
  const sizeClasses = {
    sm: 'text-xs p-1',
    md: 'text-sm p-1.5',
    lg: 'text-base p-2'
  };
  
  // Sort badges by category
  const sortedBadges = [...badges].sort((a, b) => {
    const badgeA = BADGES[a];
    const badgeB = BADGES[b];
    
    if (!badgeA || !badgeB) return 0;
    
    // Sort by category then by name
    if (badgeA.category !== badgeB.category) {
      return badgeA.category.localeCompare(badgeB.category);
    }
    
    return badgeA.name.localeCompare(badgeB.name);
  });
  
  // Limit display if maxDisplay is set
  const displayBadges = maxDisplay && sortedBadges.length > maxDisplay 
    ? sortedBadges.slice(0, maxDisplay)
    : sortedBadges;
  
  const remainingCount = maxDisplay && sortedBadges.length > maxDisplay
    ? sortedBadges.length - maxDisplay
    : 0;
  
  return (
    <div className="flex flex-wrap gap-2">
      {displayBadges.map(badgeId => (
        <UserBadge 
          key={badgeId} 
          badgeId={badgeId} 
          size={size}
          showLabel={showLabels}
        />
      ))}
      
      {remainingCount > 0 && (
        <div 
          className={`inline-flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 ${sizeClasses[size]}`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};