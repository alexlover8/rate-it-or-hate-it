// This file is for server-side use only.
if (typeof window !== 'undefined') {
  throw new Error("firebase-admin.ts should only be used on the server side.");
}

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin for server-side operations
function initializeFirebaseAdmin() {
  if (!getApps().length) {
    try {
      // For production deployments, we'll use a service account
      if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        initializeApp({
          credential: cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
        });
        console.log('Initialized Firebase Admin with service account credentials');
      } 
      // For local development without service account (or for Vercel preview deployments)
      else if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
        console.log('Initialized Firebase Admin with application default credentials');
      } else {
        throw new Error('Missing Firebase configuration. Please check your environment variables.');
      }
    } catch (error) {
      console.error('Error initializing Firebase Admin:', error);
      throw error;
    }
  }
  return getFirestore();
}

// Export initialized Firestore admin instance
export const adminDb = initializeFirebaseAdmin();

// Helper function to get an item by ID (for server components)
export async function getItemById(itemId: string) {
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

    const comments = commentsSnapshot.docs.map(doc => ({
      id: doc.id,
      text: doc.data().text,
      userId: doc.data().userId,
      userName: doc.data().userName,
      userPhotoURL: doc.data().userPhotoURL,
      sentiment: doc.data().sentiment || null,
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    }));

    const totalVotes = (data?.rateCount || 0) + (data?.mehCount || 0) + (data?.hateCount || 0);

    return {
      id: itemDoc.id,
      name: data?.name || `Item ${itemId}`,
      description: data?.description || 'No description available.',
      rateCount: data?.rateCount || 0,
      mehCount: data?.mehCount || 0,
      hateCount: data?.hateCount || 0,
      totalVotes,
      ratePercentage: totalVotes > 0 ? Math.round(((data?.rateCount || 0) / totalVotes) * 100) : 0,
      mehPercentage: totalVotes > 0 ? Math.round(((data?.mehCount || 0) / totalVotes) * 100) : 0,
      hatePercentage: totalVotes > 0 ? Math.round(((data?.hateCount || 0) / totalVotes) * 100) : 0,
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
  } catch (error) {
    console.error('Error fetching item:', error);
    return null;
  }
}

// Helper function to get related items by category (for server components)
export async function getRelatedItemsByCategory(category: string, currentItemId: string, limit = 3) {
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
        const rateCount = data.rateCount || 0;
        const mehCount = data.mehCount || 0;
        const hateCount = data.hateCount || 0;
        const totalVotes = rateCount + mehCount + hateCount;

        return {
          id: doc.id,
          name: data.name || 'Unknown Item',
          imageUrl: data.imageUrl || null,
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
