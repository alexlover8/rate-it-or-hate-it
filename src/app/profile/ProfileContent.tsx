'use client';

import DemographicForm, { Demographics } from './DemographicForm';
import ProfileCompletionBanner from './ProfileCompletionBanner';
import { UserPlus, Award } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { ThumbsUp, ThumbsDown, Meh, Settings, User, Edit, Upload, ChevronDown, Activity, BarChart2, X, Loader2, AlertCircle, Trash2, RefreshCw, Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/toast';
import Link from 'next/link';
import { getDoc, updateDoc, collection, query, where, orderBy, limit, getDocs, startAfter, DocumentData, QueryDocumentSnapshot, doc as firestoreDoc, Firestore, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadToR2, generateSecureFilename } from '@/lib/r2';
import { UserVote, Item } from '@/lib/data';
import { UserLevelBadge } from './UserLevel';
import { UserBadgesList } from './UserBadge';
import { ProfileGamificationSection } from './ProfileGamificationSection';

// Define page size for pagination
const VOTES_PER_PAGE = 10;
const POSTS_PER_PAGE = 6;

export default function ProfileContent() {
  const { user, userProfile, updateUserProfile, updateUserDemographics } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for user data
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'votes' | 'stats' | 'settings' | 'posts' | 'demographics' | 'gamification'>('votes');
  
  // States for vote history
  const [voteHistory, setVoteHistory] = useState<UserVote[]>([]);
  const [lastVoteDoc, setLastVoteDoc] = useState<any>(null);
  const [hasMoreVotes, setHasMoreVotes] = useState(false);
  const [isLoadingMoreVotes, setIsLoadingMoreVotes] = useState(false);
  
  // Add state for calculated vote counts
  const [calculatedVoteCounts, setCalculatedVoteCounts] = useState({
    rate: 0,
    meh: 0,
    hate: 0,
    total: 0
  });
  
  // States for user posts
  const [userPosts, setUserPosts] = useState<Item[]>([]);
  const [lastPostDoc, setLastPostDoc] = useState<any>(null);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // States for profile form
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const categories = [
    { id: 'electronics', name: 'Electronics' },
    { id: 'apparel', name: 'Apparel' },
    { id: 'home-kitchen', name: 'Home & Kitchen' },
    { id: 'beauty-personal-care', name: 'Beauty & Personal Care' },
    { id: 'sports-outdoors', name: 'Sports & Outdoors' },
    { id: 'automotive', name: 'Automotive' },
    { id: 'books', name: 'Books' },
    { id: 'movies', name: 'Movies' },
    { id: 'tv-shows', name: 'TV Shows' },
    { id: 'video-games', name: 'Video Games' },
    { id: 'tech-apps', name: 'Tech & Apps' },
    { id: 'companies', name: 'Companies & Brands' },
    { id: 'food-restaurants', name: 'Food & Restaurants' },
  ];

  // Initialize form data from user profile
  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.displayName || '');
      setEmail(userProfile.email || '');
      setBio(userProfile.bio || '');
      setIsLoading(false);
    }
  }, [userProfile]);

  // Calculate vote counts from vote history
  useEffect(() => {
    // Calculate vote counts from vote history
    const countVotes = () => {
      let rateCount = 0;
      let mehCount = 0;
      let hateCount = 0;
      
      voteHistory.forEach(vote => {
        if (vote.vote === 'rate') rateCount++;
        else if (vote.vote === 'meh') mehCount++;
        else if (vote.vote === 'hate') hateCount++;
      });
      
      const totalCount = rateCount + mehCount + hateCount;
      
      setCalculatedVoteCounts({
        rate: rateCount,
        meh: mehCount,
        hate: hateCount,
        total: totalCount
      });
    };
    
    // Only run if we have vote history
    if (voteHistory.length > 0) {
      countVotes();
    }
  }, [voteHistory]);

  // Fetch initial vote history
  useEffect(() => {
    const fetchVoteHistory = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const votesQuery = query(
          collection(db, 'users', user.uid, 'votes'),
          orderBy('timestamp', 'desc'),
          limit(VOTES_PER_PAGE)
        );
        
        const votesSnapshot = await getDocs(votesQuery);
        
        // Get the last document for pagination
        const lastVisible = votesSnapshot.docs[votesSnapshot.docs.length - 1];
        setLastVoteDoc(lastVisible);
        
        // Check if there are more votes to load
        setHasMoreVotes(votesSnapshot.docs.length === VOTES_PER_PAGE);
        
        // Map the votes to our data structure
        const votes = await Promise.all(votesSnapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data() as Record<string, any>;
          
          // Get item details
          let itemName = data.itemName || 'Unknown Item';
          let category = data.category || 'Unknown';
          
          // If itemName is not in the vote document, try to fetch it
          if (!data.itemName) {
            try {
              const itemDocRef = firestoreDoc(db, 'items', data.itemId as string);
              const itemDoc = await getDoc(itemDocRef);
              if (itemDoc.exists()) {
                const itemData = itemDoc.data() as Record<string, any>;
                itemName = itemData.name || 'Unknown Item';
                category = itemData.category || 'Unknown';
              }
            } catch (err) {
              console.error('Error fetching item details:', err);
            }
          }
          
          return {
            itemId: data.itemId,
            itemName,
            vote: data.voteType,
            timestamp: data.timestamp?.toDate?.() ? data.timestamp.toDate() : new Date(),
            category
          };
        }));
        
        setVoteHistory(votes);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching vote history:', err);
        setError('Failed to load vote history. Please try again later.');
        setIsLoading(false);
      }
    };
    
    fetchVoteHistory();
  }, [user]);
  
  // Fetch user posts
  const fetchUserPosts = useCallback(async (isInitial = true) => {
    if (!user) return;
    
    try {
      if (isInitial) {
        setIsLoadingPosts(true);
      } else {
        setIsLoadingMorePosts(true);
      }
      
      // Create a query to get posts created by the user
      let postsQuery;
      
      if (isInitial) {
        postsQuery = query(
          collection(db, 'items'),
          where('creatorId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(POSTS_PER_PAGE)
        );
      } else if (lastPostDoc) {
        postsQuery = query(
          collection(db, 'items'),
          where('creatorId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          startAfter(lastPostDoc),
          limit(POSTS_PER_PAGE)
        );
      } else {
        return; // No more posts to load
      }
      
      const postsSnapshot = await getDocs(postsQuery);
      
      // Get the last document for pagination
      const lastVisible = postsSnapshot.docs[postsSnapshot.docs.length - 1];
      setLastPostDoc(lastVisible);
      
      // Check if there are more posts to load
      setHasMorePosts(postsSnapshot.docs.length === POSTS_PER_PAGE);
      
      // Map the posts to our data structure
      const posts = postsSnapshot.docs.map(doc => {
        const data = doc.data() as Record<string, any>;
        const totalVotes = (data.rateCount || 0) + (data.mehCount || 0) + (data.hateCount || 0);
        
        return {
          id: doc.id,
          name: data.name || 'Unnamed Item',
          description: data.description || 'No description available',
          category: data.category || 'uncategorized',
          dateAdded: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          imageUrl: data.imageUrl || null,
          rateCount: data.rateCount || 0,
          mehCount: data.mehCount || 0,
          hateCount: data.hateCount || 0,
          totalVotes,
          commentCount: data.commentCount || 0,
          comments: [],
          creatorId: data.creatorId || null,
          creatorName: data.creatorName || 'Unknown',
          ratePercentage: totalVotes > 0 ? Math.round(((data.rateCount || 0) / totalVotes) * 100) : 0,
          mehPercentage: totalVotes > 0 ? Math.round(((data.mehCount || 0) / totalVotes) * 100) : 0,
          hatePercentage: totalVotes > 0 ? Math.round(((data.hateCount || 0) / totalVotes) * 100) : 0
        };
      });
      
      if (isInitial) {
        setUserPosts(posts);
      } else {
        setUserPosts(currentPosts => [...currentPosts, ...posts]);
      }
    } catch (err) {
      console.error('Error fetching user posts:', err);
      setError('Failed to load your posts. Please try again later.');
    } finally {
      if (isInitial) {
        setIsLoadingPosts(false);
      } else {
        setIsLoadingMorePosts(false);
      }
    }
  }, [user, lastPostDoc]);
  
  // Handle loading more posts
  const loadMorePosts = () => {
    fetchUserPosts(false);
  };

  // Load more votes handler
  const loadMoreVotes = async () => {
    if (!user || !lastVoteDoc || isLoadingMoreVotes) return;
    
    try {
      setIsLoadingMoreVotes(true);
      
      const votesQuery = query(
        collection(db, 'users', user.uid, 'votes'),
        orderBy('timestamp', 'desc'),
        startAfter(lastVoteDoc),
        limit(VOTES_PER_PAGE)
      );
      
      const votesSnapshot = await getDocs(votesQuery);
      
      // Get the last document for pagination
      const lastVisible = votesSnapshot.docs.length > 0 ? votesSnapshot.docs[votesSnapshot.docs.length - 1] : null;
      setLastVoteDoc(lastVisible);
      
      // Check if there are more votes to load
      setHasMoreVotes(votesSnapshot.docs.length === VOTES_PER_PAGE);
      
      // Map the votes to our data structure
      const newVotes = await Promise.all(votesSnapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data() as Record<string, any>;
        
        // Get item details
        let itemName = data.itemName || 'Unknown Item';
        let category = data.category || 'Unknown';
        
        // If itemName is not in the vote document, try to fetch it
        if (!data.itemName) {
          try {
            const itemDocRef = firestoreDoc(db, 'items', data.itemId);
            const itemDoc = await getDoc(itemDocRef);
            if (itemDoc.exists()) {
              const itemData = itemDoc.data() as Record<string, any>;
              itemName = itemData.name || 'Unknown Item';
              category = itemData.category || 'Unknown';
            }
          } catch (err) {
            console.error('Error fetching item details:', err);
          }
        }
        
        return {
          itemId: data.itemId,
          itemName,
          vote: data.voteType,
          timestamp: data.timestamp?.toDate?.() ? data.timestamp.toDate() : new Date(),
          category
        };
      }));
      
      setVoteHistory(prev => [...prev, ...newVotes]);
      setIsLoadingMoreVotes(false);
    } catch (err) {
      console.error('Error loading more votes:', err);
      toast({
        title: "Error",
        description: "Failed to load more votes. Please try again.",
        type: "error"
      });
      setIsLoadingMoreVotes(false);
    }
  };

  // Handle delete post
  const handleDeletePost = async (postId: string) => {
    if (!user || !postId) return;
    
    try {
      setIsDeleting(postId);
      
      // Delete the item document from Firestore
      await deleteDoc(firestoreDoc(db, 'items', postId));
      
      // Update state to remove the deleted post
      setUserPosts(currentPosts => currentPosts.filter(post => post.id !== postId));
      
      toast({
        title: "Success",
        description: "Your post has been deleted successfully",
        type: "success"
      });
      
      // Hide the confirmation dialog
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting post:', err);
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        type: "error"
      });
    } finally {
      setIsDeleting(null);
    }
  };
  // Handle profile image selection
  const handleImageSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle profile image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          type: "error"
        });
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 5MB.",
          type: "error"
        });
        return;
      }
      
      setIsUploading(true);
      
      // Generate a secure filename
      const filename = generateSecureFilename(file.name, `users/${user.uid}/profile/`);
      console.log('Generated filename:', filename);
      
      // Create FormData and upload directly to API route
      const formData = new FormData();
      formData.append('file', file);
      formData.append('filename', filename);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const data = await response.json();
      
      if (!data.url) {
        throw new Error('No URL returned from upload service');
      }
      
      console.log('Received URL after upload:', data.url);
      
      // Update user profile
      await updateUserProfile({ photoURL: data.url });
      
      toast({
        title: "Success",
        description: "Profile picture updated successfully",
        type: "success"
      });
    } catch (err) {
      console.error('Error uploading image:', err);
      toast({
        title: "Upload failed",
        description: `Could not upload profile picture: ${err instanceof Error ? err.message : 'Unknown error'}`,
        type: "error"
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setIsSaving(true);
      
      await updateUserProfile({
        displayName: username,
        bio
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
        type: "success"
      });
    } catch (err) {
      console.error('Error updating profile:', err);
      toast({
        title: "Update failed",
        description: "Could not update profile. Please try again.",
        type: "error"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get color for vote type
  const getVoteColor = (voteType: string) => {
    switch (voteType) {
      case 'rate': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400';
      case 'meh': return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400';
      case 'hate': return 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  // Get icon for vote type
  const getVoteIcon = (voteType: string) => {
    switch (voteType) {
      case 'rate': return <ThumbsUp size={18} className="text-blue-500 dark:text-blue-400" />;
      case 'meh': return <Meh size={18} className="text-yellow-500 dark:text-yellow-400" />;
      case 'hate': return <ThumbsDown size={18} className="text-red-500 dark:text-red-400" />;
      default: return null;
    }
  };
  // If user is not logged in, show a login prompt
  if (!user && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10">
        <div className="container mx-auto px-4 max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <User className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sign in required</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">You need to be logged in to view your profile.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/login?redirectTo=/profile"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg font-medium text-center transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/register?redirectTo=/profile"
                className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2.5 px-4 rounded-lg font-medium text-center transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If loading, show a loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Error display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}
        
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6 border border-gray-200 dark:border-gray-700">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-32 relative">
            {/* Edit cover photo button */}
            <button 
              className="absolute right-4 bottom-4 bg-white dark:bg-gray-800 bg-opacity-80 rounded-full p-2 hover:bg-opacity-100 transition-all"
              aria-label="Edit cover"
            >
              <Edit size={16} className="text-gray-700 dark:text-gray-300" />
            </button>
          </div>
          
          <div className="px-6 pb-6 relative">
            {/* Profile picture with upload functionality */}
            <div className="relative -mt-16 mb-4 inline-block">
              <div className="h-32 w-32 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden bg-gray-200 dark:bg-gray-700 relative">
                {userProfile?.photoURL ? (
                  <Image
                    src={userProfile.photoURL}
                    alt="Profile Picture"
                    fill
                    sizes="128px"
                    className="object-cover"
                    onError={(e) => {
                      // Fallback for broken images
                      const target = e.target as HTMLImageElement;
                      target.src = '/profile-placeholder.png';
                    }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-500 dark:text-blue-400">
                    <User size={48} />
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  </div>
                )}
              </div>
              <button 
                onClick={handleImageSelect}
                className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-md transition-colors"
                aria-label="Upload profile picture"
              >
                <Upload size={16} />
              </button>
              
              {/* Hidden file input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*"
              />
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{userProfile?.displayName || 'User'}</h1>
                  {userProfile?.gamification?.level && (
                    <UserLevelBadge level={userProfile.gamification.level} size="sm" />
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-400">{userProfile?.email}</p>
                {userProfile?.gamification?.badges && userProfile.gamification.badges.length > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <UserBadgesList 
                      badges={userProfile.gamification.badges} 
                      size="sm" 
                      maxDisplay={3}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {userProfile.gamification.badges.length} {userProfile.gamification.badges.length === 1 ? 'badge' : 'badges'}
                    </span>
                  </div>
                )}
                <p className="text-gray-500 dark:text-gray-500 text-sm">
                  Member since {userProfile?.joinDate 
                    ? (userProfile.joinDate instanceof Date 
                        ? userProfile.joinDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'function' in Object(userProfile.joinDate) && typeof userProfile.joinDate.toDate === 'function'
                          ? userProfile.joinDate.toDate().toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : new Date().toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                      ) 
                    : 'Unknown'}
                </p>
              </div>
              
              <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-2">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-2 py-1 text-sm flex items-center">
                  <ThumbsUp size={14} className="text-blue-500 dark:text-blue-400 mr-1" />
                  <span className="text-blue-600 dark:text-blue-400 font-medium">{calculatedVoteCounts.rate}</span>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg px-2 py-1 text-sm flex items-center">
                  <Meh size={14} className="text-yellow-500 dark:text-yellow-400 mr-1" />
                  <span className="text-yellow-600 dark:text-yellow-400 font-medium">{calculatedVoteCounts.meh}</span>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg px-2 py-1 text-sm flex items-center">
                  <ThumbsDown size={14} className="text-red-500 dark:text-red-400 mr-1" />
                  <span className="text-red-600 dark:text-red-400 font-medium">{calculatedVoteCounts.hate}</span>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1 text-sm flex items-center">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{calculatedVoteCounts.total}</span>
                  <span className="ml-1 text-gray-500 dark:text-gray-400">total</span>
                </div>
              </div>
            </div>
            
            {userProfile?.bio && (
              <p className="mt-4 text-gray-700 dark:text-gray-300">{userProfile.bio}</p>
            )}
          </div>
        </div>
        
        {/* Profile Completion Banner */}
        {user && userProfile && (
          <ProfileCompletionBanner
            completion={userProfile?.demographics?.profile_completion || 0}
            onStartCompletion={() => setActiveTab('demographics')}
          />
        )}
        
        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            <button
              onClick={() => setActiveTab('votes')}
              className={`px-4 py-3 font-medium flex items-center whitespace-nowrap ${
                activeTab === 'votes' 
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <Activity size={16} className={`mr-2 ${activeTab === 'votes' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
              Vote History
            </button>
            <button
              onClick={() => {
                setActiveTab('posts');
                if (userPosts.length === 0) {
                  fetchUserPosts(true);
                }
              }}
              className={`px-4 py-3 font-medium flex items-center whitespace-nowrap ${
                activeTab === 'posts' 
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <Plus size={16} className={`mr-2 ${activeTab === 'posts' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
              My Posts
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-3 font-medium flex items-center whitespace-nowrap ${
                activeTab === 'stats' 
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <BarChart2 size={16} className={`mr-2 ${activeTab === 'stats' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
              MEHtrics
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-3 font-medium flex items-center whitespace-nowrap ${
                activeTab === 'settings' 
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <Settings size={16} className={`mr-2 ${activeTab === 'settings' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
              Account Settings
            </button>

            <button
              onClick={() => setActiveTab('demographics')}
              className={`px-4 py-3 font-medium flex items-center whitespace-nowrap ${
                activeTab === 'demographics' 
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <UserPlus size={16} className={`mr-2 ${activeTab === 'demographics' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
              Demographics
            </button>
            
            <button
              onClick={() => setActiveTab('gamification')}
              className={`px-4 py-3 font-medium flex items-center whitespace-nowrap ${
                activeTab === 'gamification' 
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <Award size={16} className={`mr-2 ${activeTab === 'gamification' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
              Gamification
            </button>
          </div>
                    
          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'votes' && (
              <div>
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Your Vote History</h2>
                {voteHistory.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {voteHistory.map((vote, index) => (
                        <div key={`${vote.itemId}-${index}`} className="py-3 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="mr-3">
                            {getVoteIcon(vote.vote)}
                          </div>
                          <div>
                            <Link href={`/item/${vote.itemId}`} className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400">
                              {vote.itemName}
                            </Link>
                            <div className="flex text-xs text-gray-500 dark:text-gray-400 space-x-2">
                              <span>{formatDate(vote.timestamp)}</span>
                              {vote.category && (
                                <>
                                  <span>•</span>
                                  <Link href={`/category/${vote.category.toLowerCase()}`} className="hover:text-blue-500 dark:hover:text-blue-400">
                                    {vote.category}
                                  </Link>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVoteColor(vote.vote)}`}>
                          {vote.vote === 'rate' ? 'Rate It' : vote.vote === 'meh' ? 'Meh' : 'Hate It'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 px-6">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                      <Activity className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">You haven't voted on anything yet.</p>
                      <Link href="/category/all" className="mt-3 inline-block text-blue-500 dark:text-blue-400 hover:underline">
                        Discover items to rate
                      </Link>
                    </div>
                  </div>
                )}
                
                {/* Load more votes button */}
                {hasMoreVotes && voteHistory.length > 0 && (
                  <div className="mt-6 text-center">
                    <button 
                      onClick={loadMoreVotes}
                      disabled={isLoadingMoreVotes}
                      className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoadingMoreVotes ? (
                        <>
                          <Loader2 size={16} className="mr-2 animate-spin" />
                          <span>Loading more...</span>
                        </>
                      ) : (
                        <>
                          <span>View more votes</span>
                          <ChevronDown size={16} className="ml-1" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
            {/* My Posts Tab */}
            {activeTab === 'posts' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Posts</h2>
                  <Link 
                    href="/add-item" 
                    className="inline-flex items-center px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Plus size={16} className="mr-1.5" />
                    Add New Item
                  </Link>
                </div>
                
                {isLoadingPosts ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                    <span className="ml-2 text-gray-600 dark:text-gray-400">Loading your posts...</span>
                  </div>
                ) : userPosts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userPosts.map((post) => (
                      <div 
                        key={post.id} 
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow relative group"
                      >
                        {/* Delete confirmation overlay */}
                        {showDeleteConfirm === post.id && (
                          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10 p-4">
                            <p className="text-white text-center mb-4">Are you sure you want to delete this item?</p>
                            <div className="flex space-x-3">
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                disabled={isDeleting === post.id}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-70"
                              >
                                {isDeleting === post.id ? (
                                  <span className="flex items-center">
                                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                    Deleting...
                                  </span>
                                ) : (
                                  'Yes, Delete'
                                )}
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* Item image */}
                        <div className="relative h-40 bg-gray-200 dark:bg-gray-700">
                          {post.imageUrl ? (
                            <Image 
                              src={post.imageUrl}
                              alt={post.name}
                              fill
                              sizes="(max-width: 768px) 100vw, 50vw"
                              className="object-cover" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-gray-400 dark:text-gray-500">No image</span>
                            </div>
                          )}
                          
                          {/* Category badge */}
                          <div className="absolute top-2 left-2">
                            <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                              {post.category}
                            </span>
                          </div>
                          
                          {/* Delete button - only visible on hover */}
                          <button
                            onClick={() => setShowDeleteConfirm(post.id)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Delete post"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        
                        {/* Item content */}
                        <div className="p-4">
                          <Link href={`/item/${post.id}`} className="block">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                              {post.name}
                            </h3>
                          </Link>
                          
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                            {post.description}
                          </p>
                          
                          {/* Vote stats */}
                          <div className="flex items-center space-x-2 mb-3">
                            <div className="flex items-center space-x-1">
                              <ThumbsUp size={14} className="text-blue-500" />
                              <span className="text-xs text-gray-600 dark:text-gray-400">{post.ratePercentage}%</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Meh size={14} className="text-yellow-500" />
                              <span className="text-xs text-gray-600 dark:text-gray-400">{post.mehPercentage}%</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <ThumbsDown size={14} className="text-red-500" />
                              <span className="text-xs text-gray-600 dark:text-gray-400">{post.hatePercentage}%</span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              ({post.totalVotes} votes)
                            </span>
                          </div>
                          
                          {/* Date and actions */}
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              {new Date(post.dateAdded).toLocaleDateString()}
                            </span>
                            <div className="flex space-x-2">
                              <Link 
                                href={`/item/${post.id}`}
                                className="text-xs text-blue-500 dark:text-blue-400 hover:underline"
                              >
                                View
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 px-6">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                      <Plus className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">You haven't created any items yet.</p>
                      <Link href="/add-item" className="mt-3 inline-block text-blue-500 dark:text-blue-400 hover:underline">
                        Add your first item
                      </Link>
                    </div>
                  </div>
                )}
                
                {/* Load more posts button */}
                {hasMorePosts && userPosts.length > 0 && (
                  <div className="mt-6 text-center">
                    <button 
                      onClick={loadMorePosts}
                      disabled={isLoadingMorePosts}
                      className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoadingMorePosts ? (
                        <>
                          <Loader2 size={16} className="mr-2 animate-spin" />
                          <span>Loading more...</span>
                        </>
                      ) : (
                        <>
                          <span>View more posts</span>
                          <ChevronDown size={16} className="ml-1" />
                        </>
                      )}
                    </button>
                  </div>
                )}
                
                {/* Refresh button */}
                {!isLoadingPosts && userPosts.length > 0 && (
                  <div className="mt-4 text-center">
                    <button 
                      onClick={() => fetchUserPosts(true)}
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 flex items-center mx-auto"
                    >
                      <RefreshCw size={14} className="mr-1.5" />
                      <span>Refresh list</span>
                    </button>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'stats' && (
              <div>
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Your MEHtrics</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300">Rate It</h3>
                      <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{calculatedVoteCounts.rate}</span>
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      {calculatedVoteCounts.total ? Math.round((calculatedVoteCounts.rate / calculatedVoteCounts.total) * 100) : 0}% of your votes
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-100 dark:border-yellow-800">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Meh</h3>
                      <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{calculatedVoteCounts.meh}</span>
                    </div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-400">
                      {calculatedVoteCounts.total ? Math.round((calculatedVoteCounts.meh / calculatedVoteCounts.total) * 100) : 0}% of your votes
                    </div>
                  </div>
                  
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-100 dark:border-red-800">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-red-700 dark:text-red-300">Hate It</h3>
                      <span className="text-xl font-bold text-red-600 dark:text-red-400">{calculatedVoteCounts.hate}</span>
                    </div>
                    <div className="text-xs text-red-600 dark:text-red-400">
                      {calculatedVoteCounts.total ? Math.round((calculatedVoteCounts.hate / calculatedVoteCounts.total) * 100) : 0}% of your votes
                    </div>
                  </div>
                </div>
                
                {calculatedVoteCounts.total > 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
                    <h3 className="text-gray-700 dark:text-gray-300 font-medium mb-3">Vote Distribution</h3>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="flex h-full">
                        <div 
                          className="bg-blue-500 h-full" 
                          style={{ width: `${calculatedVoteCounts.total ? (calculatedVoteCounts.rate / calculatedVoteCounts.total) * 100 : 0}%` }}
                        ></div>
                        <div 
                          className="bg-yellow-500 h-full" 
                          style={{ width: `${calculatedVoteCounts.total ? (calculatedVoteCounts.meh / calculatedVoteCounts.total) * 100 : 0}%` }}
                        ></div>
                        <div 
                          className="bg-red-500 h-full" 
                          style={{ width: `${calculatedVoteCounts.total ? (calculatedVoteCounts.hate / calculatedVoteCounts.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-sm mr-1"></div>
                        <span>Rate It</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded-sm mr-1"></div>
                        <span>Meh</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-sm mr-1"></div>
                        <span>Hate It</span>
                      </div>
                    </div>
                  </div>
                ) : null}
                
                {/* Content stats - shows user's posts data */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
                  <h3 className="text-gray-700 dark:text-gray-300 font-medium mb-3">Content Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 border border-indigo-100 dark:border-indigo-800">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Your Posts</h4>
                        <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                          {userPosts.length}
                        </span>
                      </div>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-100 dark:border-emerald-800">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Total Votes Received</h4>
                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {userPosts.reduce((sum, post) => sum + (post.totalVotes || 0), 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400">
                  <p>Your MEHtrics show how you tend to vote across different items. This helps us understand your preferences and improve recommendations.</p>
                  
                  {!calculatedVoteCounts.total && (
                    <div className="mt-3 flex items-center text-blue-600 dark:text-blue-400">
                      <Link href="/category/all" className="flex items-center text-blue-500 dark:text-blue-400 hover:underline">
                        <ThumbsUp size={14} className="mr-1.5" />
                        Start rating items to build your MEHtrics
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'settings' && (
              <div>
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Account Settings</h2>
                <form className="space-y-4" onSubmit={handleProfileUpdate}>
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-600"
                      value={email}
                      readOnly
                      disabled
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Email cannot be changed. Contact support if you need to update your email.
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      maxLength={200}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {bio.length}/200 characters
                    </p>
                  </div>
                  
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <span className="flex items-center">
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                          Saving...
                        </span>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Account Security</h3>
                  <div className="space-y-3">
                    <Link 
                      href="/reset-password"
                      className="block px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-gray-800 dark:text-gray-200 transition-colors"
                    >
                      Change Password
                    </Link>
                    <Link 
                    href="/delete-account"
                    className="block px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md text-red-600 dark:text-red-400 transition-colors"
                  >
                    Delete Account
                  </Link>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'demographics' && (
            <div>
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Your Demographics</h2>
              
              <DemographicForm
                currentDemographics={userProfile?.demographics || null}
                onSave={async (demographics) => {
                  if (!user) return;
                  await updateUserDemographics(demographics);
                }}
                categories={categories}
                isLoading={isLoading}
              />
              
              <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                <p className="mb-2">
                  <strong>Why complete your demographic information?</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Get more personalized recommendations for items to rate</li>
                  <li>Help us understand what different user groups like and dislike</li>
                  <li>Contribute to platform improvements and new features</li>
                </ul>
                <p className="mt-3 text-blue-500 dark:text-blue-400">
                  Your information is never shared individually - we only use demographics in anonymized, aggregated form.
                </p>
              </div>
            </div>
          )}
          
          {activeTab === 'gamification' && (
            <ProfileGamificationSection userProfile={userProfile} />
          )}
        </div>
      </div>
    </div>
  </div>
);
}
