// Production-ready data functions for Firestore database operations
import { db } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  limit as firestoreLimit, // Renamed to avoid conflicts
  orderBy,
  startAfter,
  DocumentSnapshot,
  Timestamp,
  QueryConstraint,
  DocumentData
} from 'firebase/firestore';

// Vote type definition
export type VoteType = 'rate' | 'meh' | 'hate';

// Types
export type Item = {
  id: string;
  name: string;
  description: string;
  userReview: string;
  rateCount: number;
  mehCount: number;
  hateCount: number;
  category: string;
  dateAdded: string;
  imageUrl: string | null;
  commentCount: number;
  comments: Comment[];
  creatorId: string | null;
  creatorName: string;
  tags?: string[];
  lastUpdated?: string;
  totalVotes?: number;
  ratePercentage?: number;
  mehPercentage?: number;
  hatePercentage?: number;
  votes?: number; // For compatibility with old code
};

export type Comment = {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  timestamp: Date;
  sentiment?: VoteType | null;
};

export type RelatedItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  rateCount: number;
  mehCount: number;
  hateCount: number;
  ratePercentage: number;
  mehPercentage: number;
  hatePercentage: number;
  totalVotes: number;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  itemCount?: number;
  imageUrl?: string | null;
  icon?: string;
  parentCategory?: string | null; // Parent category ID for subcategories
  subcategories?: string[]; // Array of subcategory IDs
  style?: {
    primaryColor: string;
    secondaryColor?: string;
    headerStyle?: 'default' | 'overlay' | 'minimal' | 'featured';
    bannerImage?: string;
    backgroundPattern?: string;
  };
  defaultLayout?: 'grid' | 'list';
  specialFeatures?: string[];
  featuredItems?: string[];
};

// Gamification user data structure
export interface UserGamification {
  points: number;
  level: number;
  badges: string[];
  streakDays: number;
  lastLogin: Date | null;
  pointsHistory: PointActivity[];
  badgeProgress: Record<string, number>; // Tracks progress toward badges
  categoryActivity: Record<string, number>; // Tracks activity in different categories
}

// Point activity record
export interface PointActivity {
  action: 'vote' | 'comment' | 'item_submission' | 'comment_like' | 'login_streak' | 'community_contribution';
  points: number;
  timestamp: Date;
  itemId?: string;
  commentId?: string;
  categoryId?: string;
}

// User level definition
export interface UserLevel {
  level: number;
  name: string;
  minPoints: number;
  maxPoints: number;
}

// Badge definition
export interface Badge {
  id: string;
  name: string;
  description: string;
  category: 'activity' | 'quality' | 'category_expert';
  icon: string;
  bgColor: string;
  criteria: {
    type: string;
    threshold: number;
    categoryId?: string;
  };
}

// Updated UserProfile type with gamification
export type UserProfile = {
  id: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  bio: string | null;
  joinDate: string;
  voteCount: {
    total: number;
    rate: number;
    meh: number;
    hate: number;
  };
  commentCount: number;
  lastActive: string;
  
  // Add the gamification field
  gamification?: UserGamification;
  
  // Add demographics field if you have it
  demographics?: Demographics; 
};

// Demographics type (if you have this in your app)
export interface Demographics {
  profile_completion?: number;
  age_range?: string;
  gender?: string;
  country?: string;
  interests?: string[];
  // Add other demographic fields you might have
}

export type UserVote = {
  itemId: string;
  itemName: string;
  vote: VoteType;
  timestamp: Date;
  category?: string;
};

export type SortOption = 'newest' | 'oldest' | 'mostRated' | 'mostHated' | 'mostMeh' | 'mostVotes' | 'mostComments' | 'mostControversial';

export type FilterOption = 'all' | 'rated' | 'meh' | 'hated';

// You may already have a FirestoreTimestamp type, if not add this
export interface FirestoreTimestamp {
  toDate: () => Date;
}

// Level definitions (constants)
export const USER_LEVELS: UserLevel[] = [
  { level: 1, name: "Rookie Reviewer", minPoints: 0, maxPoints: 50 },
  { level: 2, name: "Opinion Maker", minPoints: 51, maxPoints: 150 },
  { level: 3, name: "Trend Spotter", minPoints: 151, maxPoints: 300 },
  { level: 4, name: "Rating Guru", minPoints: 301, maxPoints: 500 },
  { level: 5, name: "Sentiment Master", minPoints: 501, maxPoints: 1000 },
  { level: 6, name: "Taste Authority", minPoints: 1001, maxPoints: 2000 },
  { level: 7, name: "Rating Royalty", minPoints: 2001, maxPoints: 3500 },
  { level: 8, name: "Feedback Sage", minPoints: 3501, maxPoints: 5000 },
  { level: 9, name: "Opinion Oracle", minPoints: 5001, maxPoints: 7500 },
  { level: 10, name: "MEH Mastermind", minPoints: 7501, maxPoints: Infinity }
];

// Calculate percentages and add them to the item
function calculateVotePercentages(item: Item): Item {
  const totalVotes = item.rateCount + item.mehCount + item.hateCount;
  
  return {
    ...item,
    totalVotes,
    votes: totalVotes, // For compatibility with old code
    ratePercentage: totalVotes > 0 ? Math.round((item.rateCount / totalVotes) * 100) : 0,
    mehPercentage: totalVotes > 0 ? Math.round((item.mehCount / totalVotes) * 100) : 0,
    hatePercentage: totalVotes > 0 ? Math.round((item.hateCount / totalVotes) * 100) : 0
  };
}

// Create a query with sort option
function createSortedQuery(
  baseQuery: QueryConstraint[], 
  sortOption: SortOption = 'newest'
): QueryConstraint[] {
  switch(sortOption) {
    case 'newest':
      return [...baseQuery, orderBy('createdAt', 'desc')];
    case 'oldest':
      return [...baseQuery, orderBy('createdAt', 'asc')];
    case 'mostRated':
      return [...baseQuery, orderBy('rateCount', 'desc')];
    case 'mostMeh':
      return [...baseQuery, orderBy('mehCount', 'desc')];
    case 'mostHated':
      return [...baseQuery, orderBy('hateCount', 'desc')];
    case 'mostVotes':
      return [...baseQuery, orderBy('totalVotes', 'desc')];
    case 'mostComments':
      return [...baseQuery, orderBy('commentCount', 'desc')];
    case 'mostControversial':
      // For controversial, we might want items with similar rate and hate counts
      // This is a simplified approach - you might want a more sophisticated algorithm
      return [...baseQuery, orderBy('lastUpdated', 'desc')];
    default:
      return [...baseQuery, orderBy('createdAt', 'desc')];
  }
}

// Helper function to safely extract data from Firestore documents
function extractItemData(doc: DocumentSnapshot): Item {
  const data = doc.data() as DocumentData; // Type assertion
  return {
    id: doc.id,
    name: data?.name || 'Unnamed Item',
    description: data?.description || 'No description available.',
    rateCount: data?.rateCount || 0,
    mehCount: data?.mehCount || 0,
    hateCount: data?.hateCount || 0,
    category: data?.category || 'uncategorized',
    dateAdded: data?.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
    lastUpdated: data?.lastUpdated?.toDate()?.toISOString() || data?.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
    imageUrl: data?.imageUrl || null,
    commentCount: data?.commentCount || 0,
    comments: [],
    creatorId: data?.creatorId || null,
    creatorName: data?.creatorName || 'Unknown User',
    tags: data?.tags || []
  };
}

// Get all items with pagination, sorting, and filtering
export async function getAllItems(
  lastDoc?: DocumentSnapshot, 
  itemsPerPage: number = 20,
  sortOption: SortOption = 'newest',
  filterOption: FilterOption = 'all'
): Promise<{items: Item[], lastDoc: DocumentSnapshot | null}> {
  try {
    let baseQuery: QueryConstraint[] = [];
    
    // Apply filter
    if (filterOption !== 'all') {
      switch(filterOption) {
        case 'rated':
          baseQuery.push(where('rateCount', '>', 0));
          break;
        case 'meh':
          baseQuery.push(where('mehCount', '>', 0));
          break;
        case 'hated':
          baseQuery.push(where('hateCount', '>', 0));
          break;
      }
    }
    
    // Apply sort
    const queryConstraints = createSortedQuery(baseQuery, sortOption);
    
    // Apply pagination
    let itemsQuery;
    if (lastDoc) {
      itemsQuery = query(
        collection(db, 'items'),
        ...queryConstraints,
        startAfter(lastDoc),
        firestoreLimit(itemsPerPage)
      );
    } else {
      itemsQuery = query(
        collection(db, 'items'),
        ...queryConstraints,
        firestoreLimit(itemsPerPage)
      );
    }
    
    const itemsSnapshot = await getDocs(itemsQuery);
    
    const items = itemsSnapshot.docs.map(doc => {
      const item = extractItemData(doc);
      return calculateVotePercentages(item);
    });
    
    const lastVisible = itemsSnapshot.docs.length > 0 ? itemsSnapshot.docs[itemsSnapshot.docs.length - 1] : null;
    
    return {
      items,
      lastDoc: lastVisible
    };
  } catch (error) {
    console.error('Error fetching items:', error);
    return {
      items: [],
      lastDoc: null
    };
  }
}

// Get trending items with customizable time period
export async function getTrendingItems(limitNum: number = 10, days: number = 7): Promise<Item[]> {
  try {
    // Get items from the specified number of days ago
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const trendingQuery = query(
      collection(db, 'items'),
      where('lastUpdated', '>=', Timestamp.fromDate(startDate)),
      orderBy('lastUpdated', 'desc'),
      orderBy('totalVotes', 'desc'),
      firestoreLimit(limitNum)
    );
    
    const trendingSnapshot = await getDocs(trendingQuery);
    
    const items = trendingSnapshot.docs.map(doc => {
      const item = extractItemData(doc);
      return calculateVotePercentages(item);
    });
    
    return items;
  } catch (error) {
    console.error('Error fetching trending items:', error);
    return [];
  }
}

// Get recent items
export async function getRecentItems(limitNum: number = 4): Promise<Item[]> {
  try {
    const recentQuery = query(
      collection(db, 'items'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limitNum)
    );
    
    const recentSnapshot = await getDocs(recentQuery);
    
    const items = recentSnapshot.docs.map(doc => {
      const item = extractItemData(doc);
      return calculateVotePercentages(item);
    });
    
    return items;
  } catch (error) {
    console.error('Error fetching recent items:', error);
    return [];
  }
}

// Get controversial items (similar rate and hate counts with high total votes)
export async function getControversialItems(limitNum: number = 10): Promise<Item[]> {
  try {
    // First get items with high vote counts
    const itemsQuery = query(
      collection(db, 'items'),
      orderBy('commentCount', 'desc'),
      firestoreLimit(limitNum * 3)
    );
    
    const itemsSnapshot = await getDocs(itemsQuery);
    
    let items = itemsSnapshot.docs.map(doc => {
      const item = extractItemData(doc);
      return calculateVotePercentages(item);
    });
    
    // Filter and sort by controversy score (how close rate and hate percentages are)
    items = items
      .filter(item => (item.totalVotes || 0) > 10)
      .map(item => {
        const controversyScore = 100 - Math.abs((item.ratePercentage || 0) - (item.hatePercentage || 0));
        return { ...item, controversyScore };
      })
      .sort((a: any, b: any) => (b.controversyScore || 0) - (a.controversyScore || 0))
      .slice(0, limitNum);
    
    return items;
  } catch (error) {
    console.error('Error fetching controversial items:', error);
    return [];
  }
}

// Get item by ID
export async function getItemById(id: string): Promise<Item | null> {
  try {
    const itemRef = doc(db, 'items', id);
    const itemDoc = await getDoc(itemRef);
    
    if (!itemDoc.exists()) {
      return null;
    }
    
    const data = itemDoc.data();
    
    // Get comments
    const commentsQuery = query(
      collection(db, 'comments'),
      where('itemId', '==', id),
      orderBy('timestamp', 'desc'),
      firestoreLimit(20)
    );
    const commentsSnapshot = await getDocs(commentsQuery);
    const comments = commentsSnapshot.docs.map(doc => {
      const commentData = doc.data();
      return {
        id: doc.id,
        text: commentData?.text || '',
        userId: commentData?.userId || '',
        userName: commentData?.userName || '',
        userPhotoURL: commentData?.userPhotoURL,
        sentiment: commentData?.sentiment || null,
        timestamp: commentData?.timestamp?.toDate() || new Date(),
      };
    });
    
    const item: Item = {
      id,
      name: data?.name || `Item ${id}`,
      description: data?.description || 'No description available.',
      rateCount: data?.rateCount || 0,
      mehCount: data?.mehCount || 0,
      hateCount: data?.hateCount || 0,
      category: data?.category || 'uncategorized',
      dateAdded: data?.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
      lastUpdated: data?.lastUpdated?.toDate()?.toISOString() || data?.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
      imageUrl: data?.imageUrl || null,
      commentCount: data?.commentCount || comments.length,
      comments: comments,
      creatorId: data?.creatorId || null,
      creatorName: data?.creatorName || 'Unknown',
      tags: data?.tags || []
    };
    
    return calculateVotePercentages(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    return null;
  }
}

// Get related items
export async function getRelatedItems(category: string, currentItemId: string, limitNum: number = 3): Promise<RelatedItem[]> {
  try {
    const relatedQuery = query(
      collection(db, 'items'),
      where('category', '==', category),
      firestoreLimit(limitNum + 1)
    );
    
    const relatedSnapshot = await getDocs(relatedQuery);
    const relatedItems = relatedSnapshot.docs
      .filter(doc => doc.id !== currentItemId) // Filter out the current item
      .slice(0, limitNum) // Limit to requested number
      .map(doc => {
        const data = doc.data();
        const rateCount = data?.rateCount || 0;
        const mehCount = data?.mehCount || 0;
        const hateCount = data?.hateCount || 0;
        const totalVotes = rateCount + mehCount + hateCount;
        
        return {
          id: doc.id,
          name: data?.name || 'Unknown Item',
          imageUrl: data?.imageUrl || null,
          rateCount,
          mehCount,
          hateCount,
          totalVotes,
          ratePercentage: totalVotes > 0 ? Math.round((rateCount / totalVotes) * 100) : 0,
          mehPercentage: totalVotes > 0 ? Math.round((mehCount / totalVotes) * 100) : 0,
          hatePercentage: totalVotes > 0 ? Math.round((hateCount / totalVotes) * 100) : 0
        };
      });
    
    return relatedItems;
  } catch (error) {
    console.error('Error fetching related items:', error);
    return [];
  }
}

// Get all categories
export async function getCategories(): Promise<Category[]> {
  try {
    const categoriesQuery = query(collection(db, 'categories'));
    const categoriesSnapshot = await getDocs(categoriesQuery);
    
    if (categoriesSnapshot.empty) {
      return [];
    }
    
    const categories = categoriesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data?.name || 'Unknown Category',
        slug: doc.id,
        description: data?.description || 'No description available.',
        itemCount: data?.itemCount || 0,
        imageUrl: data?.imageUrl || null,
        icon: data?.icon || '🔍' // Default icon if none is specified
      };
    });
    
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// Get featured categories (with highest item counts)
export async function getFeaturedCategories(limitNum: number = 4): Promise<Category[]> {
  try {
    const categoriesQuery = query(
      collection(db, 'categories'),
      orderBy('itemCount', 'desc'),
      firestoreLimit(limitNum)
    );
    
    const categoriesSnapshot = await getDocs(categoriesQuery);
    
    if (categoriesSnapshot.empty) {
      return [];
    }
    
    const categories = categoriesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data?.name || 'Unknown Category',
        slug: doc.id,
        description: data?.description || 'No description available.',
        itemCount: data?.itemCount || 0,
        imageUrl: data?.imageUrl || null,
        icon: data?.icon || '🔍'
      };
    });
    
    return categories;
  } catch (error) {
    console.error('Error fetching featured categories:', error);
    return [];
  }
}

// Get category by ID (slug)
export async function getCategoryById(categoryId: string): Promise<Category | null> {
  try {
    const categoryRef = doc(db, 'categories', categoryId);
    const categoryDoc = await getDoc(categoryRef);
    
    if (!categoryDoc.exists()) {
      return null;
    }
    
    const data = categoryDoc.data();
    return {
      id: categoryDoc.id,
      name: data?.name || 'Unknown Category',
      slug: categoryDoc.id,
      description: data?.description || 'No description available.',
      itemCount: data?.itemCount || 0,
      imageUrl: data?.imageUrl || null,
      icon: data?.icon || '🔍'
    };
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}

// Get items by category with pagination, sorting, and filtering
export async function getItemsByCategory(
  categoryId: string, 
  lastDoc?: DocumentSnapshot, 
  itemsPerPage: number = 20,
  sortOption: SortOption = 'newest',
  filterOption: FilterOption = 'all'
): Promise<{items: Item[], lastDoc: DocumentSnapshot | null}> {
  try {
    let baseQuery: QueryConstraint[] = [where('category', '==', categoryId)];
    
    // Apply filter
    if (filterOption !== 'all') {
      switch(filterOption) {
        case 'rated':
          baseQuery.push(where('rateCount', '>', 0));
          break;
        case 'meh':
          baseQuery.push(where('mehCount', '>', 0));
          break;
        case 'hated':
          baseQuery.push(where('hateCount', '>', 0));
          break;
      }
    }
    
    // Apply sort
    const queryConstraints = createSortedQuery(baseQuery, sortOption);
    
    // Apply pagination
    let itemsQuery;
    if (lastDoc) {
      itemsQuery = query(
        collection(db, 'items'),
        ...queryConstraints,
        startAfter(lastDoc),
        firestoreLimit(itemsPerPage)
      );
    } else {
      itemsQuery = query(
        collection(db, 'items'),
        ...queryConstraints,
        firestoreLimit(itemsPerPage)
      );
    }
    
    const itemsSnapshot = await getDocs(itemsQuery);
    
    const items = itemsSnapshot.docs.map(doc => {
      const item = extractItemData(doc);
      return calculateVotePercentages(item);
    });
    
    const lastVisible = itemsSnapshot.docs.length > 0 ? itemsSnapshot.docs[itemsSnapshot.docs.length - 1] : null;
    
    return {
      items,
      lastDoc: lastVisible
    };
  } catch (error) {
    console.error('Error fetching items by category:', error);
    return {
      items: [],
      lastDoc: null
    };
  }
}

// Get user vote history
export async function getUserVotes(userId: string, limitNum: number = 20): Promise<UserVote[]> {
  try {
    const votesQuery = query(
      collection(db, 'users', userId, 'votes'),
      orderBy('timestamp', 'desc'),
      firestoreLimit(limitNum)
    );
    
    const votesSnapshot = await getDocs(votesQuery);
    
    const votes = votesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        itemId: doc.id,
        itemName: data?.itemName || 'Unknown Item',
        vote: data?.voteType as VoteType,
        timestamp: data?.timestamp?.toDate() || new Date(),
        category: data?.category
      };
    });
    
    return votes;
  } catch (error) {
    console.error('Error fetching user votes:', error);
    return [];
  }
}

// Get user profile
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const data = userDoc.data();
    
    // Get vote counts from the user's votes subcollection
    const userVotesSnapshot = await getDocs(collection(db, 'users', userId, 'votes'));
    let rateCount = 0;
    let mehCount = 0;
    let hateCount = 0;
    
    userVotesSnapshot.forEach(doc => {
      const vote = doc.data()?.voteType;
      if (vote === 'rate') rateCount++;
      else if (vote === 'meh') mehCount++;
      else if (vote === 'hate') hateCount++;
    });
    
    const totalVotes = rateCount + mehCount + hateCount;
    
    return {
      id: userId,
      displayName: data?.displayName || 'Anonymous User',
      email: data?.email || '',
      photoURL: data?.photoURL || null,
      bio: data?.bio || null,
      joinDate: data?.joinDate?.toDate()?.toISOString() || new Date().toISOString(),
      voteCount: {
        total: totalVotes,
        rate: rateCount,
        meh: mehCount,
        hate: hateCount
      },
      commentCount: data?.commentCount || 0,
      lastActive: data?.lastActive?.toDate()?.toISOString() || new Date().toISOString(),
      // Include gamification data if it exists
      gamification: data?.gamification as UserGamification | undefined,
      // Include demographics if it exists
      demographics: data?.demographics as Demographics | undefined
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

// Search items
export async function searchItems(
  queryStr: string, 
  limitNum: number = 20
): Promise<Item[]> {
  try {
    if (!queryStr.trim()) {
      return [];
    }
    
    // Convert the search query to lowercase for case-insensitive searching
    const searchTerm = queryStr.toLowerCase().trim();
    const searchTermEnd = searchTerm + '\uf8ff';
    
    // Create a Firestore query using the name_lower field
    const itemsQuery = query(
      collection(db, 'items'),
      where('name_lower', '>=', searchTerm),
      where('name_lower', '<=', searchTermEnd),
      orderBy('name_lower'),
      firestoreLimit(limitNum)
    );
    
    const itemsSnapshot = await getDocs(itemsQuery);
    
    const items = itemsSnapshot.docs.map(doc => {
      const data = doc.data();
      const item: Item = {
        id: doc.id,
        name: data?.name || 'Unnamed Item',
        description: data?.description || 'No description available.',
        rateCount: data?.rateCount || 0,
        mehCount: data?.mehCount || 0,
        hateCount: data?.hateCount || 0,
        category: data?.category || 'uncategorized',
        dateAdded: data?.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        imageUrl: data?.imageUrl || null,
        commentCount: data?.commentCount || 0,
        comments: [],
        creatorId: data?.creatorId || null,
        creatorName: data?.creatorName || 'Unknown User',
        tags: data?.tags || []
      };
      return calculateVotePercentages(item);
    });
    
    return items;
  } catch (error) {
    console.error('Error searching items:', error);
    return [];
  }
}