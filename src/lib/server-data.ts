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
  subcategory?: string | null; // Added subcategory support
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

export type SortOption = 'newest' | 'oldest' | 'mostRated' | 'mostHated' | 'mostMeh' | 'mostVotes' | 'mostComments' | 'mostControversial';
export type FilterOption = 'all' | 'rated' | 'meh' | 'hated';

// Import subcategories data
import { categories, subcategories, categoryThemes, getCategoryTheme } from './subcategories';

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
    subcategory: item.subcategory || null, // Include subcategory
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

// Helper function to build a query with sort, filter, pagination
function buildItemsQuery(
  baseQuery: any,
  sortOption: SortOption,
  filterOption: FilterOption,
  lastDoc?: any,
  limit?: number
) {
  // Apply filter
  if (filterOption !== 'all') {
    switch(filterOption) {
      case 'rated':
        baseQuery = baseQuery.where('rateCount', '>', 0);
        break;
      case 'meh':
        baseQuery = baseQuery.where('mehCount', '>', 0);
        break;
      case 'hated':
        baseQuery = baseQuery.where('hateCount', '>', 0);
        break;
    }
  }
  
  // Apply sort
  switch(sortOption) {
    case 'newest':
      baseQuery = baseQuery.orderBy('createdAt', 'desc');
      break;
    case 'oldest':
      baseQuery = baseQuery.orderBy('createdAt', 'asc');
      break;
    case 'mostRated':
      baseQuery = baseQuery.orderBy('rateCount', 'desc');
      break;
    case 'mostMeh':
      baseQuery = baseQuery.orderBy('mehCount', 'desc');
      break;
    case 'mostHated':
      baseQuery = baseQuery.orderBy('hateCount', 'desc');
      break;
    case 'mostVotes':
      baseQuery = baseQuery.orderBy('totalVotes', 'desc');
      break;
    case 'mostComments':
      baseQuery = baseQuery.orderBy('commentCount', 'desc');
      break;
    case 'mostControversial':
      // Use a more concrete sort field for controversy
      baseQuery = baseQuery.orderBy('commentCount', 'desc');
      baseQuery = baseQuery.orderBy('totalVotes', 'desc');
      break;
    default:
      baseQuery = baseQuery.orderBy('createdAt', 'desc');
      break;
  }
  
  // Apply pagination
  if (lastDoc) {
    baseQuery = baseQuery.startAfter(lastDoc);
  }
  
  // Apply limit
  if (limit) {
    baseQuery = baseQuery.limit(limit);
  }
  
  return baseQuery;
}

// Helper function to process items from a Firestore snapshot
function processItemsSnapshot(snapshot: any): Item[] {
  return snapshot.docs.map((doc: any) => {
    const data = doc.data();
    
    const item: Partial<Item> = {
      id: doc.id,
      name: data?.name || 'Unnamed Item',
      description: data?.description || 'No description available.',
      rateCount: data?.rateCount || 0,
      mehCount: data?.mehCount || 0,
      hateCount: data?.hateCount || 0,
      category: data?.category || 'uncategorized',
      subcategory: data?.subcategory || null,
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
        icon: data?.icon || '🔍', // Default icon if none is specified
        parentCategory: data?.parentCategory || null,
        subcategories: data?.subcategories || [],
        style: data?.style || {
          primaryColor: '#4a5568',
          secondaryColor: '#f7fafc',
          headerStyle: 'default'
        },
        defaultLayout: data?.defaultLayout || 'grid',
        specialFeatures: data?.specialFeatures || [],
        featuredItems: data?.featuredItems || []
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
    
    // Calculate the actual item count directly from the database
    let totalItemCount = 0;
    
    try {
      // Get items directly in this category (no subcategory)
      const mainCategoryItems = await adminDb
        .collection('items')
        .where('category', '==', categoryId)
        .get();
      
      totalItemCount = mainCategoryItems.size;
      
      // If this is a parent category with subcategories, get those counts too
      if (!data?.parentCategory && data?.subcategories && data.subcategories.length > 0) {
        const subcategoryQueries = data.subcategories.map(subId => 
          adminDb.collection('items')
            .where('subcategory', '==', subId)
            .get()
        );
        
        const subcategorySnapshots = await Promise.all(subcategoryQueries);
        
        // Add subcategory items
        totalItemCount += subcategorySnapshots.reduce((sum, snapshot) => sum + snapshot.size, 0);
      }
      
      // Update the item count in the database to keep it accurate
      await adminDb.collection('categories').doc(categoryId).update({
        itemCount: totalItemCount
      });
      
    } catch (countError) {
      console.error('Error calculating accurate item count:', countError);
      // Fall back to stored count if direct calculation fails
      totalItemCount = data?.itemCount || 0;
    }
    
    return {
      id: categoryDoc.id,
      name: data?.name || 'Unknown Category',
      slug: categoryDoc.id,
      description: data?.description || 'No description available.',
      itemCount: totalItemCount,
      imageUrl: data?.imageUrl || null,
      icon: data?.icon || '🔍',
      parentCategory: data?.parentCategory || null,
      subcategories: data?.subcategories || [],
      style: data?.style || {
        primaryColor: '#4a5568',
        secondaryColor: '#f7fafc',
        headerStyle: 'default'
      },
      defaultLayout: data?.defaultLayout || 'grid',
      specialFeatures: data?.specialFeatures || [],
      featuredItems: data?.featuredItems || []
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
    // Check if this is a subcategory or main category
    const categoryDoc = await adminDb.collection('categories').doc(categoryId).get();
    const categoryData = categoryDoc.exists ? categoryDoc.data() : null;
    
    // CASE 1: It's a subcategory - filter by subcategory field directly
    if (categoryData?.parentCategory) {
      const query = buildItemsQuery(
        adminDb.collection('items').where('subcategory', '==', categoryId),
        sortOption,
        filterOption,
        lastDoc,
        itemsPerPage
      );
      
      const snapshot = await query.get();
      const items = processItemsSnapshot(snapshot);
      const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
      
      return { items, lastDoc: lastVisible };
    } 
    
    // CASE 2: It's a main category
    // Instead of using separate queries, we'll use a more efficient approach
    // Create a query that gets items either with:
    // a) This category and null subcategory, OR
    // b) This category and any subcategory that belongs to this category
    
    // First, check if we even have subcategories
    if (!categoryData?.subcategories || categoryData.subcategories.length === 0) {
      // No subcategories, simple query
      const query = buildItemsQuery(
        adminDb.collection('items').where('category', '==', categoryId),
        sortOption,
        filterOption,
        lastDoc,
        itemsPerPage
      );
      
      const snapshot = await query.get();
      const items = processItemsSnapshot(snapshot);
      const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
      
      return { items, lastDoc: lastVisible };
    }
    
    // We have subcategories, and we need to handle them properly
    // Create a query that gets items with this category
    // Note: We can't directly filter on subcategory with OR conditions in Firestore
    // So we'll fetch with just the category filter and handle pagination carefully
    
    const query = buildItemsQuery(
      adminDb.collection('items').where('category', '==', categoryId),
      sortOption,
      filterOption,
      lastDoc,
      itemsPerPage * 2 // Fetch more to account for filtering
    );
    
    const snapshot = await query.get();
    const allItems = processItemsSnapshot(snapshot);
    const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
    
    // Apply pagination
    const items = allItems.slice(0, itemsPerPage);
    
    return { items, lastDoc: lastVisible };
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
      subcategory: data?.subcategory || null,
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

// Get related items by category and subcategory if applicable
export async function getRelatedItemsByCategory(category: string, currentItemId: string, limit = 3, subcategory?: string): Promise<RelatedItem[]> {
  try {
    let itemsQuery;
    
    if (subcategory) {
      // If subcategory is provided, try to get items from the same subcategory first
      itemsQuery = adminDb
        .collection('items')
        .where('subcategory', '==', subcategory)
        .limit(limit + 1);
    } else {
      // Otherwise, get items from the same main category
      itemsQuery = adminDb
        .collection('items')
        .where('category', '==', category)
        .limit(limit + 1);
    }
    
    let itemsSnapshot = await itemsQuery.get();
    
    // If we don't have enough items from the subcategory, fall back to the main category
    if (subcategory && itemsSnapshot.docs.length <= 1) {
      itemsQuery = adminDb
        .collection('items')
        .where('category', '==', category)
        .limit(limit + 1);
        
      itemsSnapshot = await itemsQuery.get();
    }
      
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
    // Only get parent categories for featured display
    const categoriesSnapshot = await adminDb
      .collection('categories')
      .where('parentCategory', '==', null)
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
        icon: data?.icon || '🔍',
        parentCategory: data?.parentCategory || null,
        subcategories: data?.subcategories || [],
        style: data?.style || {
          primaryColor: '#4a5568',
          secondaryColor: '#f7fafc',
          headerStyle: 'default'
        },
        defaultLayout: data?.defaultLayout || 'grid',
        specialFeatures: data?.specialFeatures || [],
        featuredItems: data?.featuredItems || []
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
    
    return processItemsSnapshot(itemsSnapshot);
  } catch (error) {
    console.error('Error fetching trending items:', error);
    return [];
  }
}

// Get controversial items (similar rate and hate counts with high total votes)
export async function getControversialItems(limitNum: number = 10): Promise<Item[]> {
  try {
    // First get items with high comment counts (using existing index)
    const itemsSnapshot = await adminDb
      .collection('items')
      .orderBy('commentCount', 'desc')
      .limit(limitNum * 3)
      .get();
    
    let items = processItemsSnapshot(itemsSnapshot);
    
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
    
    return processItemsSnapshot(recentQuery);
  } catch (error) {
    console.error('Error fetching recent items:', error);
    return [];
  }
}

// Helper function to initialize subcategories from the subcategories.ts file
export async function initializeSubcategoriesFromData(): Promise<void> {
  try {
    console.log('Starting subcategory initialization from data file...');
    
    const batch = adminDb.batch();
    const processedCategories = new Set();
    
    // Process each subcategory from the data file
    for (const subcat of subcategories) {
      const subcategoryId = subcat.id;
      const parentId = subcat.parentCategory;
      
      // Skip if already processed this parent
      if (processedCategories.has(parentId)) continue;
      
      // Get parent category doc
      const parentDoc = await adminDb.collection('categories').doc(parentId).get();
      
      if (!parentDoc.exists) {
        console.log(`Parent category ${parentId} does not exist, creating it...`);
        
        // Find the category data from the categories array
        const categoryData = categories.find(c => c.id === parentId);
        const theme = getCategoryTheme(parentId);
        
        if (categoryData) {
          // Create the parent category
          batch.set(parentDoc.ref, {
            name: categoryData.name,
            slug: parentId,
            description: `${categoryData.name} category`,
            icon: categoryData.icon || '🔍',
            itemCount: 0,
            style: {
              primaryColor: theme.primaryColor,
              secondaryColor: theme.secondaryColor,
              headerStyle: theme.headerStyle || 'default',
              gradient: theme.gradient
            },
            createdAt: new Date(),
            lastUpdated: new Date()
          });
        }
      }
      
      // Get subcategories for this parent
      const subcatsForParent = subcategories.filter(s => s.parentCategory === parentId);
      const subcatIds = [];
      
      // Create each subcategory
      for (const sub of subcatsForParent) {
        const subcatDoc = adminDb.collection('categories').doc(sub.id);
        subcatIds.push(sub.id);
        
        batch.set(subcatDoc, {
          name: sub.name,
          slug: sub.id,
          description: `${sub.name} - a subcategory of ${parentId}`,
          parentCategory: parentId,
          itemCount: 0,
          icon: '🔍', // Default icon
          createdAt: new Date(),
          lastUpdated: new Date()
        }, { merge: true });
      }
      
      // Update parent with subcategory references
      batch.update(adminDb.collection('categories').doc(parentId), {
        subcategories: subcatIds,
        lastUpdated: new Date()
      });
      
      // Mark as processed
      processedCategories.add(parentId);
    }
    
    // Commit all the changes
    await batch.commit();
    
    console.log(`Successfully initialized subcategories for ${processedCategories.size} parent categories`);
  } catch (error) {
    console.error('Error initializing subcategories from data:', error);
  }
}

// Helper function to initialize subcategories for a category if missing
export async function initializeSubcategoriesIfNeeded(categoryId: string): Promise<void> {
  try {
    const categoryDoc = await adminDb.collection('categories').doc(categoryId).get();
    
    if (!categoryDoc.exists) {
      console.error(`Category ${categoryId} does not exist`);
      return;
    }
    
    const data = categoryDoc.data();
    
    // Skip if this is already a subcategory or already has subcategories
    if (data?.parentCategory || (data?.subcategories && data.subcategories.length > 0)) {
      return;
    }
    
    // Define common subcategories by category ID
    const subcategoryMap: Record<string, { name: string, description: string, icon?: string }[]> = {
      'movies': [
        { name: 'Action', description: 'Action films with excitement and adventure', icon: '🔫' },
        { name: 'Comedy', description: 'Funny movies to make you laugh', icon: '😂' },
        { name: 'Drama', description: 'Serious stories with emotional themes', icon: '🎭' },
        { name: 'Horror', description: 'Scary movies designed to frighten', icon: '👻' },
        { name: 'Sci-Fi', description: 'Science fiction exploring futuristic concepts', icon: '🚀' },
        { name: 'Fantasy', description: 'Magical and mythical worlds', icon: '🧙‍♂️' },
        { name: 'Romance', description: 'Love stories and relationships', icon: '❤️' },
        { name: 'Thriller', description: 'Suspenseful and exciting stories', icon: '🔎' },
        { name: 'Documentary', description: 'Non-fiction educational films', icon: '📹' },
        { name: 'Animation', description: 'Animated films for all ages', icon: '🎬' }
      ],
      'tv-shows': [
        { name: 'Drama Series', description: 'Dramatic television series', icon: '📺' },
        { name: 'Comedy Series', description: 'Funny TV shows', icon: '🤣' },
        { name: 'Reality TV', description: 'Unscripted reality television', icon: '👥' },
        { name: 'Crime Shows', description: 'Detective and crime dramas', icon: '🕵️' },
        { name: 'Sci-Fi Series', description: 'Science fiction TV series', icon: '👽' },
        { name: 'Fantasy Series', description: 'Magical and mythical TV shows', icon: '🐉' },
        { name: 'Anime', description: 'Japanese animation series', icon: '🇯🇵' },
        { name: 'Documentary Series', description: 'Non-fiction television', icon: '🎥' }
      ],
      'music': [
        { name: 'Pop', description: 'Popular mainstream music', icon: '🎤' },
        { name: 'Rock', description: 'Rock and alternative music', icon: '🎸' },
        { name: 'Hip-Hop', description: 'Hip-hop and rap music', icon: '🎧' },
        { name: 'Electronic', description: 'Electronic and dance music', icon: '💿' },
        { name: 'R&B', description: 'Rhythm and blues music', icon: '🎹' },
        { name: 'Country', description: 'Country and folk music', icon: '🤠' },
        { name: 'Jazz', description: 'Jazz and blues music', icon: '🎺' },
        { name: 'Classical', description: 'Classical and orchestral music', icon: '🎻' },
        { name: 'K-Pop', description: 'Korean pop music', icon: '🇰🇷' }
      ],
      'food-restaurants': [
        { name: 'Fast Food', description: 'Quick service restaurant food', icon: '🍔' },
        { name: 'Italian Cuisine', description: 'Italian food and recipes', icon: '🍝' },
        { name: 'Asian Cuisine', description: 'Food from Asian countries', icon: '🍜' },
        { name: 'Mexican Cuisine', description: 'Mexican food and dishes', icon: '🌮' },
        { name: 'Desserts', description: 'Sweet treats and desserts', icon: '🍰' },
        { name: 'Beverages', description: 'Drinks and cocktails', icon: '🥤' },
        { name: 'Vegetarian', description: 'Vegetarian and vegan food', icon: '🥗' },
        { name: 'Home Cooking', description: 'Home-cooked meals and recipes', icon: '👨‍🍳' }
      ],
      'video-games': [
        { name: 'Action Games', description: 'Fast-paced action games', icon: '🎮' },
        { name: 'RPGs', description: 'Role-playing games', icon: '⚔️' },
        { name: 'FPS', description: 'First-person shooter games', icon: '🔫' },
        { name: 'Strategy', description: 'Strategy and simulation games', icon: '🧠' },
        { name: 'Sports Games', description: 'Sports and racing games', icon: '⚽' },
        { name: 'Adventure', description: 'Adventure and exploration games', icon: '🗺️' },
        { name: 'Indie Games', description: 'Independent developer games', icon: '🎲' },
        { name: 'Mobile Games', description: 'Games for mobile devices', icon: '📱' }
      ],
      'books': [
        { name: 'Fiction', description: 'Fiction and novels', icon: '📚' },
        { name: 'Non-Fiction', description: 'Non-fiction and educational books', icon: '📖' },
        { name: 'Science Fiction', description: 'Sci-fi and fantasy books', icon: '🛸' },
        { name: 'Mystery', description: 'Mystery and thriller books', icon: '🔍' },
        { name: 'Biography', description: 'Biographies and memoirs', icon: '👤' },
        { name: 'Self-Help', description: 'Self-improvement books', icon: '🧘‍♂️' },
        { name: 'Romance Novels', description: 'Romantic fiction books', icon: '💕' },
        { name: 'Children\'s Books', description: 'Books for children', icon: '🧸' }
      ],
      'home-kitchen': [
        { name: 'Furniture', description: 'Home furniture and decor', icon: '🪑' },
        { name: 'Kitchen Appliances', description: 'Appliances for cooking and food prep', icon: '🍳' },
        { name: 'Housewares', description: 'Household items and supplies', icon: '🧹' },
        { name: 'Bedding', description: 'Bedding and sleep products', icon: '🛏️' },
        { name: 'Home Decor', description: 'Decorative items for the home', icon: '🏠' },
        { name: 'Storage', description: 'Storage and organization solutions', icon: '📦' },
        { name: 'Smart Home', description: 'Smart home devices and technology', icon: '🤖' }
      ],
      'tech-apps': [
        { name: 'Smartphones', description: 'Mobile phones and accessories', icon: '📱' },
        { name: 'Computers', description: 'Desktop and laptop computers', icon: '💻' },
        { name: 'Audio', description: 'Headphones and speakers', icon: '🎧' },
        { name: 'Wearables', description: 'Smartwatches and fitness trackers', icon: '⌚' },
        { name: 'Cameras', description: 'Digital cameras and photography gear', icon: '📷' },
        { name: 'TVs', description: 'Television and home entertainment', icon: '📺' },
        { name: 'Gaming Hardware', description: 'Gaming consoles and accessories', icon: '🎮' }
      ],
      'beauty-personal-care': [
        { name: 'Skincare', description: 'Skin care products and routines', icon: '✨' },
        { name: 'Makeup', description: 'Cosmetics and makeup products', icon: '💄' },
        { name: 'Haircare', description: 'Hair care products and styling', icon: '💇‍♀️' },
        { name: 'Fragrances', description: 'Perfumes and colognes', icon: '🌸' },
        { name: 'Bath & Body', description: 'Bath and body care products', icon: '🛁' },
        { name: 'Men\'s Grooming', description: 'Grooming products for men', icon: '🧔' },
        { name: 'Oral Care', description: 'Dental and oral hygiene products', icon: '🦷' },
        { name: 'Beauty Tools', description: 'Beauty accessories and tools', icon: '🔧' }
      ]
    };
    
    // If we have predefined subcategories for this category
    if (subcategoryMap[categoryId]) {
      console.log(`Initializing subcategories for ${categoryId}`);
      
      const batch = adminDb.batch();
      const subcategoryIds: string[] = [];
      
      // Create each subcategory
      for (const subcat of subcategoryMap[categoryId]) {
        const slug = subcat.name.toLowerCase().replace(/\s+/g, '-');
        const subcategoryRef = adminDb.collection('categories').doc(`${categoryId}-${slug}`);
        
        // Add to batch
        batch.set(subcategoryRef, {
          name: subcat.name,
          description: subcat.description,
          icon: subcat.icon || '🔍',
          itemCount: 0,
          parentCategory: categoryId,
          createdAt: new Date(),
          lastUpdated: new Date()
        });
        
        subcategoryIds.push(subcategoryRef.id);
      }
      
      // Update the parent category with subcategory references
      const parentRef = adminDb.collection('categories').doc(categoryId);
      batch.update(parentRef, {
        subcategories: subcategoryIds,
        lastUpdated: new Date()
      });
      
      // Commit the batch
      await batch.commit();
      
      console.log(`Successfully initialized ${subcategoryIds.length} subcategories for ${categoryId}`);
    }
  } catch (error) {
    console.error('Error initializing subcategories:', error);
  }
}

// Helper function to initialize all main categories that need subcategories
export async function initializeAllSubcategories(): Promise<void> {
  try {
    const categoriesSnapshot = await adminDb.collection('categories').get();
    
    for (const doc of categoriesSnapshot.docs) {
      await initializeSubcategoriesIfNeeded(doc.id);
    }
    
    console.log('Subcategory initialization complete');
  } catch (error) {
    console.error('Error in subcategory initialization:', error);
  }
}

// Export other functions from data.ts if needed
export * from './data';