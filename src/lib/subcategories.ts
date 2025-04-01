// src/lib/subcategories.ts

// Main categories with emoji icons
export const categories = [
    { id: 'electronics', name: 'Electronics', icon: '📱' },
    { id: 'apparel', name: 'Apparel', icon: '👕' },
    { id: 'home-kitchen', name: 'Home & Kitchen', icon: '🏠' },
    { id: 'beauty-personal-care', name: 'Beauty & Personal Care', icon: '💄' },
    { id: 'sports-outdoors', name: 'Sports & Outdoors', icon: '⚽' },
    { id: 'automotive', name: 'Automotive', icon: '🚗' },
    { id: 'books', name: 'Books', icon: '📚' },
    { id: 'movies', name: 'Movies', icon: '🎬' },
    { id: 'tv-shows', name: 'TV Shows', icon: '📺' },
    { id: 'video-games', name: 'Video Games', icon: '🎮' },
    { id: 'tech-apps', name: 'Tech & Apps', icon: '💻' },
    { id: 'companies', name: 'Companies & Brands', icon: '🏢' },
    { id: 'food-restaurants', name: 'Food & Restaurants', icon: '🍔' },
  ];
  
  // Comprehensive subcategories
  export const subcategories = [
    // Electronics subcategories
    { id: 'smartphones', name: 'Smartphones', parentCategory: 'electronics' },
    { id: 'tablets', name: 'Tablets', parentCategory: 'electronics' },
    { id: 'laptops', name: 'Laptops & Computers', parentCategory: 'electronics' },
    { id: 'audio', name: 'Audio & Headphones', parentCategory: 'electronics' },
    { id: 'wearables', name: 'Wearable Tech', parentCategory: 'electronics' },
    { id: 'cameras', name: 'Cameras & Photography', parentCategory: 'electronics' },
    { id: 'tvs', name: 'TVs & Displays', parentCategory: 'electronics' },
    { id: 'smart-home', name: 'Smart Home Devices', parentCategory: 'electronics' },
    
    // Apparel subcategories
    { id: 'mens-clothing', name: 'Men\'s Clothing', parentCategory: 'apparel' },
    { id: 'womens-clothing', name: 'Women\'s Clothing', parentCategory: 'apparel' },
    { id: 'kids-clothing', name: 'Kids\' Clothing', parentCategory: 'apparel' },
    { id: 'footwear', name: 'Footwear', parentCategory: 'apparel' },
    { id: 'accessories', name: 'Accessories', parentCategory: 'apparel' },
    { id: 'athleisure', name: 'Athleisure', parentCategory: 'apparel' },
    { id: 'outerwear', name: 'Outerwear & Jackets', parentCategory: 'apparel' },
    { id: 'formal-wear', name: 'Formal Wear', parentCategory: 'apparel' },
    
    // Home & Kitchen subcategories
    { id: 'furniture', name: 'Furniture', parentCategory: 'home-kitchen' },
    { id: 'appliances', name: 'Appliances', parentCategory: 'home-kitchen' },
    { id: 'kitchenware', name: 'Kitchenware', parentCategory: 'home-kitchen' },
    { id: 'decor', name: 'Home Decor', parentCategory: 'home-kitchen' },
    { id: 'bedding', name: 'Bedding & Bath', parentCategory: 'home-kitchen' },
    { id: 'storage', name: 'Storage & Organization', parentCategory: 'home-kitchen' },
    { id: 'cleaning', name: 'Cleaning Supplies', parentCategory: 'home-kitchen' },
    { id: 'garden', name: 'Garden & Outdoor', parentCategory: 'home-kitchen' },
    
    // Beauty & Personal Care subcategories
    { id: 'skincare', name: 'Skincare', parentCategory: 'beauty-personal-care' },
    { id: 'makeup', name: 'Makeup', parentCategory: 'beauty-personal-care' },
    { id: 'haircare', name: 'Hair Care', parentCategory: 'beauty-personal-care' },
    { id: 'fragrances', name: 'Fragrances', parentCategory: 'beauty-personal-care' },
    { id: 'bath-body', name: 'Bath & Body', parentCategory: 'beauty-personal-care' },
    { id: 'shaving', name: 'Shaving & Grooming', parentCategory: 'beauty-personal-care' },
    { id: 'oral-care', name: 'Oral Care', parentCategory: 'beauty-personal-care' },
    { id: 'wellness', name: 'Health & Wellness', parentCategory: 'beauty-personal-care' },
    
    // Sports & Outdoors subcategories
    { id: 'fitness', name: 'Fitness Equipment', parentCategory: 'sports-outdoors' },
    { id: 'team-sports', name: 'Team Sports', parentCategory: 'sports-outdoors' },
    { id: 'outdoor-recreation', name: 'Outdoor Recreation', parentCategory: 'sports-outdoors' },
    { id: 'camping', name: 'Camping & Hiking', parentCategory: 'sports-outdoors' },
    { id: 'cycling', name: 'Cycling', parentCategory: 'sports-outdoors' },
    { id: 'water-sports', name: 'Water Sports', parentCategory: 'sports-outdoors' },
    { id: 'winter-sports', name: 'Winter Sports', parentCategory: 'sports-outdoors' },
    { id: 'athletic-clothing', name: 'Athletic Clothing', parentCategory: 'sports-outdoors' },
    
    // Automotive subcategories
    { id: 'cars', name: 'Cars & Trucks', parentCategory: 'automotive' },
    { id: 'motorcycles', name: 'Motorcycles', parentCategory: 'automotive' },
    { id: 'auto-parts', name: 'Auto Parts & Accessories', parentCategory: 'automotive' },
    { id: 'tools', name: 'Tools & Equipment', parentCategory: 'automotive' },
    { id: 'tires-wheels', name: 'Tires & Wheels', parentCategory: 'automotive' },
    { id: 'car-electronics', name: 'Car Electronics', parentCategory: 'automotive' },
    { id: 'car-care', name: 'Car Care', parentCategory: 'automotive' },
    { id: 'electric-vehicles', name: 'Electric Vehicles', parentCategory: 'automotive' },
    
    // Books subcategories
    { id: 'fiction', name: 'Fiction', parentCategory: 'books' },
    { id: 'nonfiction', name: 'Non-Fiction', parentCategory: 'books' },
    { id: 'sci-fi-fantasy', name: 'Sci-Fi & Fantasy', parentCategory: 'books' },
    { id: 'biography', name: 'Biography & Memoir', parentCategory: 'books' },
    { id: 'mystery-thriller', name: 'Mystery & Thriller', parentCategory: 'books' },
    { id: 'comic-graphic', name: 'Comics & Graphic Novels', parentCategory: 'books' },
    { id: 'romance', name: 'Romance', parentCategory: 'books' },
    { id: 'children-books', name: 'Children\'s Books', parentCategory: 'books' },
    
    // Movies subcategories
    { id: 'action-adventure', name: 'Action & Adventure', parentCategory: 'movies' },
    { id: 'comedy-movies', name: 'Comedy', parentCategory: 'movies' },
    { id: 'drama-movies', name: 'Drama', parentCategory: 'movies' },
    { id: 'sci-fi-movies', name: 'Sci-Fi & Fantasy', parentCategory: 'movies' },
    { id: 'horror', name: 'Horror & Thriller', parentCategory: 'movies' },
    { id: 'documentary', name: 'Documentary', parentCategory: 'movies' },
    { id: 'animation', name: 'Animation', parentCategory: 'movies' },
    { id: 'indie', name: 'Independent Films', parentCategory: 'movies' },
    
    // TV Shows subcategories
    { id: 'drama-shows', name: 'Drama', parentCategory: 'tv-shows' },
    { id: 'comedy-shows', name: 'Comedy', parentCategory: 'tv-shows' },
    { id: 'sci-fi-shows', name: 'Sci-Fi & Fantasy', parentCategory: 'tv-shows' },
    { id: 'reality', name: 'Reality TV', parentCategory: 'tv-shows' },
    { id: 'crime-shows', name: 'Crime & Mystery', parentCategory: 'tv-shows' },
    { id: 'anime', name: 'Anime', parentCategory: 'tv-shows' },
    { id: 'talk-shows', name: 'Talk Shows', parentCategory: 'tv-shows' },
    { id: 'docuseries', name: 'Docuseries', parentCategory: 'tv-shows' },
    
    // Video Games subcategories
    { id: 'action-games', name: 'Action', parentCategory: 'video-games' },
    { id: 'adventure-games', name: 'Adventure', parentCategory: 'video-games' },
    { id: 'rpg', name: 'RPG', parentCategory: 'video-games' },
    { id: 'strategy', name: 'Strategy', parentCategory: 'video-games' },
    { id: 'fps', name: 'FPS', parentCategory: 'video-games' },
    { id: 'sports-games', name: 'Sports', parentCategory: 'video-games' },
    { id: 'simulation', name: 'Simulation', parentCategory: 'video-games' },
    { id: 'indie-games', name: 'Indie Games', parentCategory: 'video-games' },
    
    // Tech & Apps subcategories
    { id: 'mobile-apps', name: 'Mobile Apps', parentCategory: 'tech-apps' },
    { id: 'productivity', name: 'Productivity Software', parentCategory: 'tech-apps' },
    { id: 'social-media', name: 'Social Media', parentCategory: 'tech-apps' },
    { id: 'streaming', name: 'Streaming Services', parentCategory: 'tech-apps' },
    { id: 'ai-tools', name: 'AI & Machine Learning', parentCategory: 'tech-apps' },
    { id: 'dev-tools', name: 'Developer Tools', parentCategory: 'tech-apps' },
    { id: 'cyber-security', name: 'Cybersecurity', parentCategory: 'tech-apps' },
    { id: 'cloud-services', name: 'Cloud Services', parentCategory: 'tech-apps' },
    
    // Companies & Brands subcategories
    { id: 'tech-companies', name: 'Tech Companies', parentCategory: 'companies' },
    { id: 'retail', name: 'Retail', parentCategory: 'companies' },
    { id: 'automotive-brands', name: 'Automotive Brands', parentCategory: 'companies' },
    { id: 'fashion-brands', name: 'Fashion Brands', parentCategory: 'companies' },
    { id: 'consumer-goods', name: 'Consumer Goods', parentCategory: 'companies' },
    { id: 'food-beverage-brands', name: 'Food & Beverage Brands', parentCategory: 'companies' },
    { id: 'entertainment-companies', name: 'Entertainment Companies', parentCategory: 'companies' },
    { id: 'service-providers', name: 'Service Providers', parentCategory: 'companies' },
    
    // Food & Restaurants subcategories
    { id: 'fast-food', name: 'Fast Food', parentCategory: 'food-restaurants' },
    { id: 'casual-dining', name: 'Casual Dining', parentCategory: 'food-restaurants' },
    { id: 'fine-dining', name: 'Fine Dining', parentCategory: 'food-restaurants' },
    { id: 'cafes', name: 'Cafés & Coffee Shops', parentCategory: 'food-restaurants' },
    { id: 'desserts', name: 'Desserts & Bakeries', parentCategory: 'food-restaurants' },
    { id: 'ethnic-cuisine', name: 'Ethnic Cuisine', parentCategory: 'food-restaurants' },
    { id: 'food-delivery', name: 'Food Delivery Services', parentCategory: 'food-restaurants' },
    { id: 'packaged-foods', name: 'Packaged Foods', parentCategory: 'food-restaurants' },
  ];
  
  // Category theming for UI styling
  export const categoryThemes = {
    'electronics': {
      primaryColor: '#0066cc',
      secondaryColor: '#003366',
      gradient: 'linear-gradient(135deg, #0066cc, #003366)',
      headerStyle: 'featured'
    },
    'apparel': {
      primaryColor: '#ff6b6b',
      secondaryColor: '#cc5555',
      gradient: 'linear-gradient(135deg, #ff6b6b, #cc5555)',
      headerStyle: 'featured'
    },
    'home-kitchen': {
      primaryColor: '#4caf50',
      secondaryColor: '#2e7d32',
      gradient: 'linear-gradient(135deg, #4caf50, #2e7d32)',
      headerStyle: 'featured'
    },
    'beauty-personal-care': {
      primaryColor: '#ec407a',
      secondaryColor: '#c2185b',
      gradient: 'linear-gradient(135deg, #ec407a, #c2185b)',
      headerStyle: 'featured'
    },
    'sports-outdoors': {
      primaryColor: '#ff9800',
      secondaryColor: '#ef6c00',
      gradient: 'linear-gradient(135deg, #ff9800, #ef6c00)',
      headerStyle: 'featured'
    },
    'automotive': {
      primaryColor: '#546e7a',
      secondaryColor: '#37474f',
      gradient: 'linear-gradient(135deg, #546e7a, #37474f)',
      headerStyle: 'featured'
    },
    'books': {
      primaryColor: '#7e57c2',
      secondaryColor: '#512da8',
      gradient: 'linear-gradient(135deg, #7e57c2, #512da8)',
      headerStyle: 'featured'
    },
    'movies': {
      primaryColor: '#d32f2f',
      secondaryColor: '#b71c1c',
      gradient: 'linear-gradient(135deg, #d32f2f, #b71c1c)',
      headerStyle: 'featured'
    },
    'tv-shows': {
      primaryColor: '#00acc1',
      secondaryColor: '#007c91',
      gradient: 'linear-gradient(135deg, #00acc1, #007c91)',
      headerStyle: 'featured'
    },
    'video-games': {
      primaryColor: '#8e24aa',
      secondaryColor: '#6a1b9a',
      gradient: 'linear-gradient(135deg, #8e24aa, #6a1b9a)',
      headerStyle: 'featured'
    },
    'tech-apps': {
      primaryColor: '#00bcd4',
      secondaryColor: '#0097a7',
      gradient: 'linear-gradient(135deg, #00bcd4, #0097a7)',
      headerStyle: 'featured'
    },
    'companies': {
      primaryColor: '#3f51b5',
      secondaryColor: '#303f9f',
      gradient: 'linear-gradient(135deg, #3f51b5, #303f9f)',
      headerStyle: 'featured'
    },
    'food-restaurants': {
      primaryColor: '#ff5722',
      secondaryColor: '#e64a19',
      gradient: 'linear-gradient(135deg, #ff5722, #e64a19)',
      headerStyle: 'featured'
    }
  };
  
  // Get category theming for a specific category ID
  export function getCategoryTheme(categoryId: string): any {
    return categoryThemes[categoryId as keyof typeof categoryThemes] || {
      primaryColor: '#4a5568',
      secondaryColor: '#2d3748',
      gradient: 'linear-gradient(135deg, #4a5568, #2d3748)',
      headerStyle: 'default'
    };
  }
  
  // Get subcategories for a specific parent category
  export function getSubcategoriesForParent(parentCategoryId: string) {
    return subcategories.filter(sub => sub.parentCategory === parentCategoryId);
  }
  
  // Helper to save categories to Firestore (to be used in an admin interface)
  export async function saveCategoryToFirestore(db: any, categoryId: string, categoryData: any) {
    const theme = getCategoryTheme(categoryId);
    
    try {
      await db.collection('categories').doc(categoryId).set({
        id: categoryId,
        name: categoryData.name,
        slug: categoryId,
        description: categoryData.description || '',
        icon: categoryData.icon || categories.find(c => c.id === categoryId)?.icon || '⭐',
        style: {
          primaryColor: theme.primaryColor,
          secondaryColor: theme.secondaryColor,
          headerStyle: theme.headerStyle,
          gradient: theme.gradient
        },
        subcategories: getSubcategoriesForParent(categoryId).map(sub => sub.id)
      }, { merge: true });
      
      return true;
    } catch (error) {
      console.error("Error saving category:", error);
      return false;
    }
  }