// Server-side data functions for Next.js server components
import { adminDb } from './firebase-admin';

// Types (copied from data.ts to ensure consistency)
export type VoteType = 'rate' | 'meh' | 'hate';

export type Item = {
  id: string;
  name: string;
  description: string;
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
};

export type SortOption = 'newest' | 'oldest' | 'mostRated' | 'mostHated' | 'mostMeh' | 'mostVotes' | 'mostComments' | 'mostControversial';
export type FilterOption = 'all' | 'rated' | 'meh' | 'hated';

// Helper function to calculate vote percentages
function calculateVotePercentages(item: Partial<Item>): Item {
  const rateCount = item.rateCount || 0;
  const mehCount = item.mehCount || 0;
  const hateCount = item.hateCount || 0;
  const totalVotes = rateCount + mehCount + hateCount;
  
  return {
    id: item.id || '',
    name: item.name || '',
    description: item.description || '',
    rateCount,
    mehCount,
    hateCount,
    category: item.category || '',
    dateAdded: item.dateAdded || new Date().toISOString(),
    imageUrl: item.imageUrl || null,
    commentCount: item.commentCount || 0,
    comments: item.comments || [],
    creatorId: item.creatorId || null,
    creatorName: item.creatorName || '',
    tags: item.tags || [],
    lastUpdated: item.lastUpdated || new Date().toISOString(),
    totalVotes,
    votes: totalVotes, // For compatibility with old code
    ratePercentage: totalVotes > 0 ? Math.round((rateCount / totalVotes) * 100) : 0,
    mehPercentage: totalVotes > 0 ? Math.round((mehCount / totalVotes) * 100) : 0,
    hatePercentage: totalVotes > 0 ? Math.round((hateCount / totalVotes) * 100) : 0
  };
}

// Get all categories
export async function getCategories(): Promise<Category[]> {
  try {
    const categoriesSnapshot = await adminDb.collection('categories').get();
    
    if (categoriesSnapshot.empty) {
      return [];
    }
    
    const categories: Category[] = [];
    
    // Process each category document
    for (const doc of categoriesSnapshot.docs) {
      const data = doc.data();
      
      // Get item count for this category
      let itemCount = data?.itemCount || 0;
      
      categories.push({
        id: doc.id,
        name: data?.name || 'Unknown Category',
        slug: doc.id,
        description: data?.description || 'No description available.',
        itemCount: itemCount,
        imageUrl: data?.imageUrl || null,
        icon: data?.icon || '🔍' // Default icon if none is specified
      });
    }
    
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// Get category by ID (slug)
export async function getCategoryById(categoryId: string): Promise<Category | null> {
  try {
    const categoryDoc = await adminDb.collection('categories').doc(categoryId).get();
    
    if (!categoryDoc.exists) {
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
  lastDoc?: any, 
  itemsPerPage: number = 20,
  sortOption: SortOption = 'newest',
  filterOption: FilterOption = 'all'
): Promise<{items: Item[], lastDoc: any}> {
  try {
    // Create base query
    let itemsQuery = adminDb.collection('items').where('category', '==', categoryId);
    
    // Apply filter
    if (filterOption !== 'all') {
      switch(filterOption) {
        case 'rated':
          itemsQuery = itemsQuery.where('rateCount', '>', 0);
          break;
        case 'meh':
          itemsQuery = itemsQuery.where('mehCount', '>', 0);
          break;
        case 'hated':
          itemsQuery = itemsQuery.where('hateCount', '>', 0);
          break;
      }
    }
    
    // Apply sort
    switch(sortOption) {
      case 'newest':
        itemsQuery = itemsQuery.orderBy('createdAt', 'desc');
        break;
      case 'oldest':
        itemsQuery = itemsQuery.orderBy('createdAt', 'asc');
        break;
      case 'mostRated':
        itemsQuery = itemsQuery.orderBy('rateCount', 'desc');
        break;
      case 'mostMeh':
        itemsQuery = itemsQuery.orderBy('mehCount', 'desc');
        break;
      case 'mostHated':
        itemsQuery = itemsQuery.orderBy('hateCount', 'desc');
        break;
      case 'mostVotes':
        itemsQuery = itemsQuery.orderBy('totalVotes', 'desc');
        break;
      case 'mostComments':
        itemsQuery = itemsQuery.orderBy('commentCount', 'desc');
        break;
      case 'mostControversial':
        // Default to last updated for now
        itemsQuery = itemsQuery.orderBy('lastUpdated', 'desc');
        break;
      default:
        itemsQuery = itemsQuery.orderBy('createdAt', 'desc');
        break;
    }
    
    // Apply pagination
    if (lastDoc) {
      itemsQuery = itemsQuery.startAfter(lastDoc);
    }
    
    // Apply limit
    itemsQuery = itemsQuery.limit(itemsPerPage);
    
    // Execute query
    const itemsSnapshot = await itemsQuery.get();
    
    // Map results to Items
    const items: Item[] = itemsSnapshot.docs.map(doc => {
      const data = doc.data();
      
      const item: Partial<Item> = {
        id: doc.id,
        name: data?.name || 'Unnamed Item',
        description: data?.description || 'No description available.',
        rateCount: data?.rateCount || 0,
        mehCount: data?.mehCount || 0,
        hateCount: data?.hateCount || 0,
        category: data?.category || categoryId,
        dateAdded: data?.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        lastUpdated: data?.lastUpdated?.toDate()?.toISOString() || data?.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        imageUrl: data?.imageUrl || null,
        commentCount: data?.commentCount || 0,
        comments: [],
        creatorId: data?.creatorId || null,
        creatorName: data?.creatorName || 'Unknown User',
        tags: data?.tags || []
      };
      
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

// Get item by ID
export async function getItemById(itemId: string): Promise<Item | null> {
  try {
    const itemDoc = await adminDb.collection('items').doc(itemId).get();
    
    if (!itemDoc.exists) {
      return null;
    }
    
    const data = itemDoc.data();
    
    // Get comments
    const commentsSnapshot = await adminDb
      .collection('comments')
      .where('itemId', '==', itemId)
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();
      
    const comments: Comment[] = commentsSnapshot.docs.map(doc => ({
      id: doc.id,
      text: doc.data()?.text || '',
      userId: doc.data()?.userId || '',
      userName: doc.data()?.userName || '',
      userPhotoURL: doc.data()?.userPhotoURL,
      sentiment: doc.data()?.sentiment || null,
      timestamp: doc.data()?.timestamp?.toDate() || new Date(),
    }));
    
    const item: Partial<Item> = {
      id: itemDoc.id,
      name: data?.name || `Item ${itemId}`,
      description: data?.description || 'No description available.',
      rateCount: data?.rateCount || 0,
      mehCount: data?.mehCount || 0,
      hateCount: data?.hateCount || 0,
      category: data?.category || 'uncategorized',
      dateAdded: data?.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
      lastUpdated: data?.lastUpdated?.toDate()?.toISOString() || data?.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
      imageUrl: data?.imageUrl || null,
      commentCount: data?.commentCount || comments.length,
      comments,
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

// Get related items by category
export async function getRelatedItemsByCategory(category: string, currentItemId: string, limit = 3): Promise<RelatedItem[]> {
  try {
    const itemsSnapshot = await adminDb
      .collection('items')
      .where('category', '==', category)
      .limit(limit + 1)
      .get();
      
    const relatedItems = itemsSnapshot.docs
      .filter(doc => doc.id !== currentItemId)
      .slice(0, limit)
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

// Get featured categories (with highest item counts)
export async function getFeaturedCategories(limitNum: number = 4): Promise<Category[]> {
  try {
    const categoriesSnapshot = await adminDb
      .collection('categories')
      .orderBy('itemCount', 'desc')
      .limit(limitNum)
      .get();
    
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

// Get trending items with customizable time period
export async function getTrendingItems(limitNum: number = 10, days: number = 7): Promise<Item[]> {
  try {
    // Get items from the specified number of days ago
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const itemsSnapshot = await adminDb
      .collection('items')
      .where('lastUpdated', '>=', startDate)
      .orderBy('lastUpdated', 'desc')
      .orderBy('totalVotes', 'desc')
      .limit(limitNum)
      .get();
    
    const items = itemsSnapshot.docs.map(doc => {
      const data = doc.data();
      
      const item: Partial<Item> = {
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
      
      return calculateVotePercentages(item);
    });
    
    return items;
  } catch (error) {
    console.error('Error fetching trending items:', error);
    return [];
  }
}

// Export all types and functions to maintain compatibility with the client-side data.ts
export * from './data';
// Get controversial items (similar rate and hate counts with high total votes)
export async function getControversialItems(limitNum: number = 10): Promise<Item[]> {
    try {
      // First get items with high comment counts (using existing index)
      const itemsSnapshot = await adminDb
        .collection('items')
        .orderBy('commentCount', 'desc')
        .limit(limitNum * 3)
        .get();
      
      let items = itemsSnapshot.docs.map(doc => {
        const data = doc.data();
        
        const item: Partial<Item> = {
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
  // Get recent items
export async function getRecentItems(limitNum: number = 16): Promise<Item[]> {
    try {
      const recentQuery = await adminDb
        .collection('items')
        .orderBy('createdAt', 'desc')
        .limit(limitNum)
        .get();
      
      const items = recentQuery.docs.map(doc => {
        const data = doc.data();
        
        const item: Partial<Item> = {
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
        
        return calculateVotePercentages(item);
      });
      
      return items;
    } catch (error) {
      console.error('Error fetching recent items:', error);
      return [];
    }
  }