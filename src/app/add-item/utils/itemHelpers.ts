// Types and utility functions for the AddItem page

// Type definition for subcategory selection
export type SubcategoryOption = {
    id: string;
    name: string;
    parentCategory: string;
  };
  
  // Type definition for suggested items
  export type SuggestedItem = {
    id: string;
    name: string;
    category: string;
    subcategory?: string;
    imageUrl: string | null;
    similarity: number;
  };
  
  /**
   * Calculate similarity between two strings (0-1 where 1 is exact match)
   * This helps with duplicate detection when users enter item names
   */
  export function calculateSimilarity(str1: string, str2: string): number {
    // Convert to lowercase for case-insensitive comparison
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    // Simple matching algorithm - can be improved with more sophisticated methods
    if (s1 === s2) return 1;
    if (s1.includes(s2) || s2.includes(s1)) {
      // One is a substring of the other
      const longerLength = Math.max(s1.length, s2.length);
      const shorterLength = Math.min(s1.length, s2.length);
      return shorterLength / longerLength;
    }
    
    // Count matching characters (simple approach)
    let matchCount = 0;
    for (let i = 0; i < s1.length && i < s2.length; i++) {
      if (s1[i] === s2[i]) matchCount++;
    }
    
    return matchCount / Math.max(s1.length, s2.length);
  }
  
  /**
   * Share an item to a social platform
   * @param platform Social platform to share to (facebook, twitter, whatsapp, copy)
   * @param itemId Item ID to generate URL
   * @param itemName Item name for share text
   * @returns Promise that resolves when share action is complete
   */
  export async function shareToSocial(platform: string, itemId: string, itemName: string): Promise<boolean> {
    try {
      // Generate the share URL
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const shareUrl = `${baseUrl}/item/${itemId}`;
      const shareText = `Check out "${itemName}" on Rate it or Hate it!`;
      
      switch(platform) {
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
          break;
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
          break;
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
          break;
        case 'copy':
          await navigator.clipboard.writeText(shareUrl);
          break;
        default:
          return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error sharing to social:', error);
      return false;
    }
  }
  
  /**
   * Validate an image file
   * @param file File to validate
   * @returns Object with validation result and error message if any
   */
  export function validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return { 
        valid: false, 
        error: 'Please select an image file.' 
      };
    }
  
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { 
        valid: false, 
        error: 'Image must be less than 5MB.' 
      };
    }
  
    return { valid: true };
  }
  
  /**
   * Generate a description for an item using AI
   * This function makes an API call to the backend
   * @param itemName Name of the item to generate description for
   * @returns Promise that resolves with the generated description or error
   */
  export async function generateItemDescription(itemName: string): Promise<{ description?: string; error?: string }> {
    try {
      if (!itemName || itemName.length < 3) {
        return { error: 'Item name is too short for description generation' };
      }
      
      // Make a request to your backend that will use a web search API
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: itemName }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate description');
      }
      
      const data = await response.json();
      
      if (data.description) {
        return { description: data.description };
      } else {
        return { error: 'No description was generated' };
      }
    } catch (error) {
      console.error('Error generating description:', error);
      return { error: 'Failed to generate description. Please try again or enter manually.' };
    }
  }
  
  /**
   * Categories array for the AddItem form
   */
  export const categories = [
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