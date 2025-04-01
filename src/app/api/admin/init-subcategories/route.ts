import { NextResponse } from 'next/server';
import { initializeSubcategoriesFromData } from '@/lib/server-data';

export async function GET() {
  try {
    await initializeSubcategoriesFromData();
    return NextResponse.json({ 
      success: true, 
      message: 'Subcategories initialized successfully' 
    });
  } catch (error) {
    console.error('Error initializing subcategories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initialize subcategories' },
      { status: 500 }
    );
  }
}