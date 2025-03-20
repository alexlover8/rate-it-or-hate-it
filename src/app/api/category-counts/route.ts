import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Get all items to count occurrences of each category
    const itemsSnapshot = await adminDb.collection('items').get();
    
    // Create a map to count items per category
    const categoryCounts: Record<string, number> = {};
    
    // Count items in each category
    itemsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const category = data.category;
      
      if (category) {
        if (categoryCounts[category]) {
          categoryCounts[category]++;
        } else {
          categoryCounts[category] = 1;
        }
      }
    });
    
    // Optional: Update the category documents with the counts
    const batch = adminDb.batch();
    const categories = Object.keys(categoryCounts);
    
    for (const categoryId of categories) {
      const categoryRef = adminDb.collection('categories').doc(categoryId);
      batch.update(categoryRef, { itemCount: categoryCounts[categoryId] });
    }
    
    await batch.commit();
    
    return NextResponse.json({ categories: categoryCounts });
  } catch (error) {
    console.error('Error fetching category counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category counts' },
      { status: 500 }
    );
  }
}