import { NextRequest, NextResponse } from 'next/server';
import { getTrendingItems } from '@/lib/server-data';

export async function GET(request: NextRequest) {
  try {
    // Extract query params
    const searchParams = request.nextUrl.searchParams;
    const startAfter = searchParams.get('startAfter');
    
    // Convert startAfter to a number if it exists
    const startIdx = startAfter ? parseInt(startAfter) : 0;
    
    // Fetch more items, limit to 16 items per page
    const items = await getTrendingItems(32); // Get more items to support pagination
    
    // Simulate pagination by slicing the result
    // In a real implementation, you would use the lastDoc from your previous query
    const paginatedItems = items.slice(startIdx, startIdx + 16);
    
    return NextResponse.json(paginatedItems);
  } catch (error) {
    console.error('Error in /api/trending:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending items' },
      { status: 500 }
    );
  }
}