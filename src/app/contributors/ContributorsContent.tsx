'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, startAfter, getDocs, where, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import Image from 'next/image';
import Link from 'next/link';
import { 
  User, 
  Trophy, 
  Medal, 
  Award, 
  Star, 
  Plus, 
  ThumbsUp, 
  Clock, 
  Search, 
  ChevronDown, 
  Loader2, 
  Filter,
  Zap,
  BarChart2,
  UserPlus
} from 'lucide-react';
import { UserLevelBadge } from '@/app/profile/UserLevel';
import { UserBadgesList } from '@/app/profile/UserBadge';

// Number of contributors to load per page
const CONTRIBUTORS_PER_PAGE = 20;

interface Contributor {
  id: string;
  displayName: string;
  photoURL: string | null;
  level: number;
  points: number;
  badges: string[];
  badgeCount: number;
  submissions: number;
  joinDate: Date;
  streak: number;
  voteCount: number;
  commentCount: number;
}

// Filter options for contributors
type ContributorFilter = 'points' | 'submissions' | 'badges' | 'level' | 'recent';

export default function ContributorsContent() {
  const { user } = useAuth();
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [activeFilter, setActiveFilter] = useState<ContributorFilter>('points');
  const [userRank, setUserRank] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalContributors: 0,
    totalSubmissions: 0,
    totalVotes: 0,
    topCategory: 'Unknown'
  });

  // Fetch contributors based on active filter
  useEffect(() => {
    const fetchContributors = async () => {
      setIsLoading(true);
      try {
        // Create query based on filter
        let contributorsQuery;
        switch(activeFilter) {
          case 'submissions':
            contributorsQuery = query(
              collection(db, 'users'),
              orderBy('gamification.submissions', 'desc'),
              limit(CONTRIBUTORS_PER_PAGE)
            );
            break;
          case 'badges':
            contributorsQuery = query(
              collection(db, 'users'),
              orderBy('gamification.badges.length', 'desc'),
              limit(CONTRIBUTORS_PER_PAGE)
            );
            break;
          case 'level':
            contributorsQuery = query(
              collection(db, 'users'),
              orderBy('gamification.level', 'desc'),
              orderBy('gamification.points', 'desc'),
              limit(CONTRIBUTORS_PER_PAGE)
            );
            break;
          case 'recent':
            contributorsQuery = query(
              collection(db, 'users'),
              where('gamification.points', '>', 0),
              orderBy('gamification.points', 'desc'),
              orderBy('createdAt', 'desc'),
              limit(CONTRIBUTORS_PER_PAGE)
            );
            break;
          case 'points':
          default:
            contributorsQuery = query(
              collection(db, 'users'),
              orderBy('gamification.points', 'desc'),
              limit(CONTRIBUTORS_PER_PAGE)
            );
        }

        const snapshot = await getDocs(contributorsQuery);
        const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];
        setLastVisible(lastVisibleDoc);
        setHasMore(snapshot.docs.length === CONTRIBUTORS_PER_PAGE);

        const contributorsData = snapshot.docs.map((doc, index) => {
          const data = doc.data();
          return {
            id: doc.id,
            displayName: data.displayName || 'Anonymous User',
            photoURL: data.photoURL || null,
            level: data.gamification?.level || 1,
            points: data.gamification?.points || 0,
            badges: data.gamification?.badges || [],
            badgeCount: data.gamification?.badges?.length || 0,
            submissions: data.gamification?.submissions || 0,
            joinDate: data.createdAt?.toDate() || new Date(),
            streak: data.gamification?.streakDays || 0,
            voteCount: data.gamification?.voteCount || 0,
            commentCount: data.gamification?.commentCount || 0
          };
        });

        setContributors(contributorsData);

        // If user is logged in, find their rank
        if (user) {
          await fetchUserRank();
        }

        // Fetch platform stats
        await fetchPlatformStats();

      } catch (error) {
        console.error('Error fetching contributors:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContributors();
  }, [activeFilter, user]);

  // Fetch more contributors
  const loadMore = async () => {
    if (!lastVisible || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      // Create query based on filter and last visible document
      let nextQuery;
      switch(activeFilter) {
        case 'submissions':
          nextQuery = query(
            collection(db, 'users'),
            orderBy('gamification.submissions', 'desc'),
            startAfter(lastVisible),
            limit(CONTRIBUTORS_PER_PAGE)
          );
          break;
        case 'badges':
          nextQuery = query(
            collection(db, 'users'),
            orderBy('gamification.badges.length', 'desc'),
            startAfter(lastVisible),
            limit(CONTRIBUTORS_PER_PAGE)
          );
          break;
        case 'level':
          nextQuery = query(
            collection(db, 'users'),
            orderBy('gamification.level', 'desc'),
            orderBy('gamification.points', 'desc'),
            startAfter(lastVisible),
            limit(CONTRIBUTORS_PER_PAGE)
          );
          break;
        case 'recent':
          nextQuery = query(
            collection(db, 'users'),
            where('gamification.points', '>', 0),
            orderBy('gamification.points', 'desc'),
            orderBy('createdAt', 'desc'),
            startAfter(lastVisible),
            limit(CONTRIBUTORS_PER_PAGE)
          );
          break;
        case 'points':
        default:
          nextQuery = query(
            collection(db, 'users'),
            orderBy('gamification.points', 'desc'),
            startAfter(lastVisible),
            limit(CONTRIBUTORS_PER_PAGE)
          );
      }

      const snapshot = await getDocs(nextQuery);
      const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];
      setLastVisible(lastVisibleDoc);
      setHasMore(snapshot.docs.length === CONTRIBUTORS_PER_PAGE);

      const newContributors = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          displayName: data.displayName || 'Anonymous User',
          photoURL: data.photoURL || null,
          level: data.gamification?.level || 1,
          points: data.gamification?.points || 0,
          badges: data.gamification?.badges || [],
          badgeCount: data.gamification?.badges?.length || 0,
          submissions: data.gamification?.submissions || 0,
          joinDate: data.createdAt?.toDate() || new Date(),
          streak: data.gamification?.streakDays || 0,
          voteCount: data.gamification?.voteCount || 0,
          commentCount: data.gamification?.commentCount || 0
        };
      });

      setContributors(prevContributors => [...prevContributors, ...newContributors]);
    } catch (error) {
      console.error('Error loading more contributors:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Find user's rank in the leaderboard
  const fetchUserRank = async () => {
    if (!user) return null;

    try {
      // Get all users with more points than the current user
      const userDoc = await getDocs(query(
        collection(db, 'users'),
        where('gamification.points', '>', 0),
        orderBy('gamification.points', 'desc')
      ));

      // Find the index of the current user
      const userIndex = userDoc.docs.findIndex(doc => doc.id === user.uid);
      if (userIndex !== -1) {
        setUserRank(userIndex + 1);
      }
    } catch (error) {
      console.error('Error fetching user rank:', error);
    }
  };

  // Fetch platform stats
  const fetchPlatformStats = async () => {
    try {
      // Get total users with gamification points
      const usersQuery = query(
        collection(db, 'users'),
        where('gamification.points', '>', 0)
      );
      const usersSnapshot = await getDocs(usersQuery);
      
      // Get aggregate stats
      let totalSubmissions = 0;
      let totalVotes = 0;
      let categoryCounter: Record<string, number> = {};
      
      usersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        totalSubmissions += data.gamification?.submissions || 0;
        totalVotes += data.gamification?.voteCount || 0;
        
        // Count category activity
        const categoryActivity = data.gamification?.categoryActivity || {};
        Object.entries(categoryActivity).forEach(([category, count]) => {
          categoryCounter[category] = (categoryCounter[category] || 0) + (count as number);
        });
      });
      
      // Find top category
      let topCategory = 'Unknown';
      let topCount = 0;
      Object.entries(categoryCounter).forEach(([category, count]) => {
        if (count > topCount) {
          topCount = count as number;
          topCategory = category;
        }
      });
      
      setStats({
        totalContributors: usersSnapshot.size,
        totalSubmissions,
        totalVotes,
        topCategory: topCategory.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      });
    } catch (error) {
      console.error('Error fetching platform stats:', error);
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality if needed
  };

  // Reset search
  const resetSearch = () => {
    setSearchQuery('');
    // Reset to default view
  };

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
          <Trophy className="w-8 h-8 text-amber-500 mr-3" />
          Community Contributors
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
          Discover our most active community members who are adding items, voting, and sharing their opinions.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-4">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Contributors</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalContributors.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mr-4">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Items Submitted</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalSubmissions.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mr-4">
              <ThumbsUp className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Votes</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalVotes.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mr-4">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Top Category</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white truncate max-w-[180px]">
                {stats.topCategory}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User's Rank Card (if logged in) */}
      {user && userRank && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg p-4 mb-8 border border-blue-100 dark:border-blue-800">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-500 text-white font-bold">
              #{userRank}
            </div>
            <div className="ml-4">
              <div className="text-blue-600 dark:text-blue-400 font-medium">Your Current Rank</div>
              <div className="text-sm text-blue-500 dark:text-blue-300">
                Keep contributing to move up the leaderboard!
              </div>
            </div>
            <div className="ml-auto">
              <Link 
                href="/profile" 
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center"
              >
                <User className="w-4 h-4 mr-1" />
                View Profile
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
            <Filter className="w-4 h-4 mr-1" />
            Sort by:
          </div>
          
          <button 
            onClick={() => setActiveFilter('points')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeFilter === 'points' 
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-medium' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Points
          </button>
          
          <button 
            onClick={() => setActiveFilter('submissions')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeFilter === 'submissions' 
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-medium' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Submissions
          </button>
          
          <button 
            onClick={() => setActiveFilter('badges')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeFilter === 'badges' 
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-medium' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Badges
          </button>
          
          <button 
            onClick={() => setActiveFilter('level')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeFilter === 'level' 
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-medium' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Level
          </button>
          
          <button 
            onClick={() => setActiveFilter('recent')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeFilter === 'recent' 
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-medium' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Recently Active
          </button>
        </div>
        
        <form onSubmit={handleSearch} className="relative">
          <div className="flex">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contributors..."
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 w-full sm:w-64"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-r-lg transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>

      {/* Contributors List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading contributors...</span>
        </div>
      ) : contributors.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contributor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Badges
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Submissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {contributors.map((contributor, index) => (
                  <tr 
                    key={contributor.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full 
                        ${index < 3 
                          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        } font-bold text-sm`}
                      >
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mr-3">
                          {contributor.photoURL ? (
                            <Image
                              src={contributor.photoURL}
                              alt={contributor.displayName}
                              fill
                              sizes="40px"
                              className="object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/profile-placeholder.png';
                              }}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-500 dark:text-blue-400">
                              <User size={20} />
                            </div>
                          )}
                        </div>
                        <div>
                          <Link 
                            href={`/profile/${contributor.id}`} 
                            className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {contributor.displayName}
                          </Link>
                          {contributor.streak > 0 && (
                            <div className="text-xs text-orange-500 dark:text-orange-400 mt-0.5 flex items-center">
                              <Zap className="w-3 h-3 mr-1" />
                              {contributor.streak} day streak
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <UserLevelBadge level={contributor.level} size="sm" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contributor.badgeCount > 0 ? (
                        <div className="flex items-center">
                          <UserBadgesList badges={contributor.badges} size="xs" maxDisplay={3} />
                          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                            {contributor.badgeCount}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {contributor.submissions}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {contributor.points.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(contributor.joinDate)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Load More Button */}
          {hasMore && (
            <div className="px-6 py-4 text-center border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading more...
                  </>
                ) : (
                  <>
                    Load More
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center border border-gray-200 dark:border-gray-700">
          <Trophy className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
            No contributors found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            {searchQuery 
              ? `No results found for "${searchQuery}". Try a different search term.` 
              : 'Be the first to contribute by adding items and voting!'}
          </p>
          <div className="flex justify-center">
            {searchQuery ? (
              <button
                onClick={resetSearch}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Clear Search
              </button>
            ) : (
              <Link
                href="/add-item"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors inline-flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Link>
            )}
          </div>
        </div>
      )}
      
      {/* Call to Action */}
      <div className="mt-12 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg p-6 border border-blue-100 dark:border-blue-800 text-center">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            Want to climb the leaderboard?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-3xl mx-auto">
            Start participating by adding items, voting, and earning badges. The more you contribute, the higher you'll climb!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/add-item"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors inline-flex items-center justify-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add New Item
            </Link>
            
            <Link
              href="/category/all"
              className="px-4 py-2 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-600 rounded-lg border border-blue-200 dark:border-gray-600 transition-colors inline-flex items-center justify-center"
            >
              <ThumbsUp className="w-5 h-5 mr-2" />
              Vote on Items
            </Link>
            
            {!user && (
              <Link
                href="/register"
                className="px-4 py-2 bg-gray-800 dark:bg-gray-600 text-white hover:bg-gray-900 dark:hover:bg-gray-500 rounded-lg transition-colors inline-flex items-center justify-center"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Create Account
              </Link>
            )}
          </div>
        </div>
      
      {/* How Points are Earned Section */}
      <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <BarChart2 className="w-6 h-6 text-blue-500 mr-2" />
            How to Earn Points
          </h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-500 dark:text-blue-400 mr-3">
                  <ThumbsUp className="w-5 h-5" />
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white">Voting</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Earn 1 point for each vote you cast. Every opinion counts!
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/40 text-green-500 dark:text-green-400 mr-3">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white">Adding Items</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Earn 5 points for each new item you add to the community.
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-500 dark:text-amber-400 mr-3">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white">Login Streaks</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                5 points for a 3-day streak, 15 points for a 7-day streak!
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-500 dark:text-purple-400 mr-3">
                  <Medal className="w-5 h-5" />
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white">Earning Badges</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Complete activities to unlock badges and earn bonus points!
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <div className="p-2 rounded-full bg-pink-100 dark:bg-pink-900/40 text-pink-500 dark:text-pink-400 mr-3">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white">Quality Content</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get bonus points when your items become trending or popular!
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-500 dark:text-indigo-400 mr-3">
                  <Star className="w-5 h-5" />
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white">Levels</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Level up as you earn more points and unlock new features!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}