'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Loader2, 
  Search, 
  X, 
  AlertCircle, 
  Check, 
  Upload, 
  Link as LinkIcon,
  ThumbsUp,
  Meh,
  ThumbsDown
} from 'lucide-react';
import { debounce } from 'lodash';
import { useToast } from '@/components/ui/toast';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, getDoc, doc } from 'firebase/firestore';
import { FormData } from '../page';
import { Category } from '@/lib/data';

// Import subcomponents
import ImageUploader from './ImageUploader';
import AutoDescription from './AutoDescription';
import RatingSelector from './RatingSelector';

// Import subcategories
import { subcategories as localSubcategories } from '@/lib/subcategories';

// Types
type SubcategoryOption = {
  id: string;
  name: string;
  parentCategory: string;
};

type SuggestedItem = {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  imageUrl: string | null;
  similarity: number;
};

// Categories array
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

// Helper function to calculate string similarity
function calculateSimilarity(str1: string, str2: string): number {
  // Convert to lowercase for case-insensitive comparison
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // Simple matching algorithm
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

interface AddItemFormProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onPreview: () => void;
  onSubmit: () => void;
  onSubmitAndShare: () => void;
  isSubmitting: boolean;
  error: string;
  success: string;
}

export default function AddItemForm({
  formData,
  setFormData,
  onPreview,
  onSubmit,
  onSubmitAndShare,
  isSubmitting,
  error,
  success
}: AddItemFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for subcategories
  const [availableSubcategories, setAvailableSubcategories] = useState<SubcategoryOption[]>([]);
  const [allSubcategories, setAllSubcategories] = useState<SubcategoryOption[]>([]);
  
  // State for duplicate detection
  const [isSearching, setIsSearching] = useState(false);
  const [suggestedItems, setSuggestedItems] = useState<SuggestedItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // State for description generation
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  
  // Fetch all subcategories when the component mounts
  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        console.log('Fetching subcategories from Firestore...');
        
        // Query categories that have a parentCategory field
        const subcategoriesQuery = query(
          collection(db, 'categories'),
          where('parentCategory', '!=', null)
        );
        
        const snapshot = await getDocs(subcategoriesQuery);
        
        if (!snapshot.empty) {
          const fetchedSubcategories: SubcategoryOption[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || 'Unnamed Subcategory',
              parentCategory: data.parentCategory
            };
          });
          
          console.log(`Found ${fetchedSubcategories.length} subcategories in database`);
          setAllSubcategories(fetchedSubcategories);
        } else {
          console.log('No subcategories found in database, using local data');
          // Use the subcategories from your local file as fallback
          setAllSubcategories(localSubcategories);
        }
      } catch (error) {
        console.error('Error fetching subcategories:', error);
        // In case of error, also use local subcategories
        setAllSubcategories(localSubcategories);
      }
    };
    
    fetchSubcategories();
  }, []);
  
  // Update available subcategories when category changes
  useEffect(() => {
    if (formData.category) {
      // Filter subcategories based on selected category
      const filtered = allSubcategories.filter(sub => sub.parentCategory === formData.category);
      console.log(`Filtered subcategories for ${formData.category}:`, filtered);
      setAvailableSubcategories(filtered);
      
      // If current subcategory doesn't belong to the new category, reset it
      if (formData.subcategory && !filtered.some(sub => sub.id === formData.subcategory)) {
        setFormData(prev => ({ ...prev, subcategory: '' }));
      }
      
      // Also fetch category data from Firestore for any custom configuration
      const fetchCategoryData = async () => {
        try {
          const categoryDoc = await getDoc(doc(db, 'categories', formData.category));
          if (categoryDoc.exists()) {
            const categoryData = categoryDoc.data() as Category;
            // Handle any category-specific logic here if needed
          }
        } catch (error) {
          console.error('Error fetching category data:', error);
        }
      };
      
      fetchCategoryData();
    } else {
      setAvailableSubcategories([]);
      setFormData(prev => ({ ...prev, subcategory: '' }));
    }
  }, [formData.category, formData.subcategory, allSubcategories, setFormData]);
  
  // Handle name change with duplicate detection
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFormData(prev => ({ ...prev, name: newName }));
    
    // Only search if we have at least 3 characters
    if (newName.length >= 3) {
      setIsSearching(true);
      searchSimilarItems(newName);
    } else {
      setSuggestedItems([]);
      setShowSuggestions(false);
    }
  };
  
  // Handle description change
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ 
      ...prev, 
      description: e.target.value.slice(0, 500) 
    }));
  };
  
  // Handle user review change
  const handleUserReviewChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ 
      ...prev, 
      userReview: e.target.value.slice(0, 300) 
    }));
  };
  
  // Handle category change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, category: e.target.value }));
  };
  
  // Handle subcategory change
  const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, subcategory: e.target.value }));
  };
  
  // Handle image source change
  const handleImageSourceChange = (source: 'upload' | 'url') => {
    setFormData(prev => ({ ...prev, imageSource: source }));
  };
  
  // Handle image URL change
  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, imageUrl: e.target.value }));
  };
  
  // Handle rating selection
  const handleRatingSelect = (rating: 'rate' | 'meh' | 'hate') => {
    setFormData(prev => ({ ...prev, userRating: rating }));
  };
  
  // Generate description from name
  const generateDescription = async () => {
    if (!formData.name || formData.name.length < 3) {
      toast({
        title: "Too short",
        description: "Please enter a longer item name to generate a description.",
        type: "error",
      });
      return;
    }
    
    setIsGeneratingDescription(true);
    
    try {
      // Make a request to your backend that will use a web search API
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: formData.name }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate description');
      }
      
      const data = await response.json();
      if (data.description) {
        setFormData(prev => ({ ...prev, description: data.description }));
        toast({
          title: "Description generated",
          description: "Successfully generated a description for your item.",
          type: "success",
        });
      } else {
        throw new Error('No description generated');
      }
    } catch (error) {
      console.error('Error generating description:', error);
      toast({
        title: "Generation failed",
        description: "Could not generate a description. Please try again or enter manually.",
        type: "error",
      });
    } finally {
      setIsGeneratingDescription(false);
    }
  };
  
  // Debounced search function
  const searchSimilarItems = debounce(async (searchText: string) => {
    if (searchText.length < 3) {
      setIsSearching(false);
      setSuggestedItems([]);
      setShowSuggestions(false);
      return;
    }
    
    try {
      // Search for exact or similar matches
      const searchTerm = searchText.toLowerCase().trim();
      const searchTermEnd = searchTerm + '\uf8ff';
      
      // Create a Firestore query using the name_lower field
      const itemsQuery = query(
        collection(db, 'items'),
        where('name_lower', '>=', searchTerm),
        where('name_lower', '<=', searchTermEnd),
        orderBy('name_lower'),
        limit(5)
      );
      
      const itemsSnapshot = await getDocs(itemsQuery);
      
      if (itemsSnapshot.empty) {
        setIsSearching(false);
        setSuggestedItems([]);
        setShowSuggestions(false);
        return;
      }
      
      // Process results and calculate similarity
      const suggestions: SuggestedItem[] = itemsSnapshot.docs.map(doc => {
        const data = doc.data();
        const similarity = calculateSimilarity(searchText, data.name);
        
        return {
          id: doc.id,
          name: data.name,
          category: data.category,
          subcategory: data.subcategory,
          imageUrl: data.imageUrl,
          similarity
        };
      });
      
      // Filter by minimum similarity threshold (0.3) and sort by similarity
      const filteredSuggestions = suggestions
        .filter(item => item.similarity > 0.3)
        .sort((a, b) => b.similarity - a.similarity);
      
      setSuggestedItems(filteredSuggestions);
      setShowSuggestions(filteredSuggestions.length > 0);
    } catch (error) {
      console.error('Error searching for similar items:', error);
    } finally {
      setIsSearching(false);
    }
  }, 500);
  
  // Close suggestions panel
  const closeSuggestions = () => {
    setShowSuggestions(false);
  };
  
  // Navigate to an existing item
  const goToExistingItem = (itemId: string) => {
    window.location.href = `/item/${itemId}`;
  };
  
  // Handle image file change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        type: "error",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB.",
        type: "error",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({
        ...prev,
        imageFile: file,
        imagePreview: reader.result as string
      }));
    };
    reader.readAsDataURL(file);
  };
  
  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          type: "error",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 5MB.",
          type: "error",
        });
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({
          ...prev,
          imageFile: file,
          imagePreview: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Remove image
  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      imageFile: null,
      imagePreview: null,
      imageUrl: ''
    }));
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <>
      <div className="mb-6">
        <Link href="/" className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Home
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Item</h1>
          <div className="flex items-center">
            <ThumbsUp className="h-5 w-5 text-blue-500 mr-0.5" />
            <Meh className="h-5 w-5 text-yellow-500 mx-0.5" />
            <ThumbsDown className="h-5 w-5 text-red-500 ml-0.5" />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded-r-lg">
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
            </div>
          </div>
        )}

        <form className="space-y-6">
          {/* Item Name with Duplicate Detection */}
          <div className="relative">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Item Name *
            </label>
            <div className="relative">
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={handleNameChange}
                className="block w-full p-2 pr-10 border rounded-lg dark:bg-gray-700 dark:text-white"
                placeholder="What do you want people to rate?"
                required
                autoComplete="off"
              />
              {isSearching && (
                <div className="absolute right-3 top-2.5">
                  <Loader2 className="animate-spin h-5 w-5 text-gray-400" />
                </div>
              )}
            </div>
            
            {/* Similar Items Suggestions */}
            {showSuggestions && suggestedItems.length > 0 && (
              <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Similar items already exist
                  </h3>
                  <button 
                    type="button"
                    onClick={closeSuggestions}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <ul className="max-h-60 overflow-auto py-1">
                  {suggestedItems.map((item) => (
                    <li key={item.id} className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                      <button
                        type="button"
                        className="w-full text-left flex items-start space-x-3"
                        onClick={() => goToExistingItem(item.id)}
                      >
                        {item.imageUrl ? (
                          <img 
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-10 w-10 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/40?text=?';
                            }}
                          />
                        ) : (
                          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                            <Search className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {item.name}
                          </p>
                          <div className="flex flex-wrap gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <span>{categories.find(cat => cat.id === item.category)?.name || item.category}</span>
                            {item.subcategory && (
                              <>
                                <span>•</span>
                                <span>{allSubcategories.find(sub => sub.id === item.subcategory)?.name || item.subcategory}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 text-xs text-gray-500 dark:text-gray-400">
                  Consider checking these existing items before adding a new one
                </div>
              </div>
            )}
          </div>

          {/* Category Selection */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category *
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={handleCategoryChange}
              className="block w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory Selection - Show only if category is selected and subcategories exist */}
          {formData.category && (
            <div>
              <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subcategory {availableSubcategories.length === 0 && '(None available for this category)'}
              </label>
              <select
                id="subcategory"
                value={formData.subcategory}
                onChange={handleSubcategoryChange}
                className="block w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                disabled={availableSubcategories.length === 0}
              >
                <option value="">General (no specific subcategory)</option>
                {availableSubcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Item Description */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description *
              </label>
              <button
                type="button"
                onClick={generateDescription}
                disabled={isGeneratingDescription}
                className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800/30 flex items-center"
              >
                {isGeneratingDescription ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Search className="h-3 w-3 mr-1" />
                    Auto-Generate
                  </>
                )}
              </button>
            </div>
            <textarea
              id="description"
              value={formData.description}
              onChange={handleDescriptionChange}
              rows={4}
              className="block w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="Provide details about this item..."
              required
              maxLength={500}
            />
            <p className={`mt-1 text-xs ${formData.description.length > 450 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {formData.description.length}/500 characters
            </p>
          </div>

          {/* User Review */}
          <div>
            <label htmlFor="userReview" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Your Review / Thoughts *
            </label>
            <textarea
              id="userReview"
              value={formData.userReview}
              onChange={handleUserReviewChange}
              rows={3}
              className="block w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="Share your personal thoughts or review of this item..."
              required
              maxLength={400}
            />
            <p className={`mt-1 text-xs ${formData.userReview.length > 250 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {formData.userReview.length}/400 characters
            </p>
          </div>

          {/* Rating Selection */}
          <RatingSelector formData={formData} setFormData={setFormData} />

          {/* Image Source Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Image Source
            </label>
            <div className="flex space-x-2 mb-3">
              <button
                type="button"
                onClick={() => handleImageSourceChange('upload')}
                className={`px-3 py-1.5 rounded text-sm ${
                  formData.imageSource === 'upload' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                }`}
              >
                <Upload className="h-4 w-4 inline mr-1" />
                Upload Image
              </button>
              <button
                type="button"
                onClick={() => handleImageSourceChange('url')}
                className={`px-3 py-1.5 rounded text-sm ${
                  formData.imageSource === 'url' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                }`}
              >
                <LinkIcon className="h-4 w-4 inline mr-1" />
                Image URL
              </button>
            </div>
          </div>

          {/* Conditional Image Input */}
          {formData.imageSource === 'upload' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Image Upload (Optional)
              </label>
              <div 
                className="flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.imagePreview ? (
                  <div className="relative w-full h-60">
                    <img
                      src={formData.imagePreview}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage();
                      }}
                      className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <label
                        htmlFor="image-upload"
                        className="relative cursor-pointer font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 focus-within:outline-none"
                      >
                        <span>Upload an image</span>
                        <input
                          id="image-upload"
                          name="image-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleImageChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF up to 5MB</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="image-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Image URL (Optional)
              </label>
              <input
                type="url"
                id="image-url"
                value={formData.imageUrl}
                onChange={handleImageUrlChange}
                placeholder="https://example.com/image.jpg"
                className="block w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
              />
              {formData.imageUrl && (
                <div className="mt-3 relative border rounded-lg overflow-hidden">
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-full h-60 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Invalid+Image+URL';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                    className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onPreview}
              className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2.5 px-4 rounded-lg transition-colors"
            >
              Preview
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Submitting...
                </>
              ) : (
                'Add Item'
              )}
            </button>
            <button
              type="button"
              onClick={onSubmitAndShare}
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Processing...
                </>
              ) : (
                'Add & Share'
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}