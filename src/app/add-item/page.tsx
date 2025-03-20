'use client';

import { useState, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Upload,
  X,
  AlertCircle,
  Check,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Meh,
  Link as LinkIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { generateSecureFilename } from '@/lib/r2'; // Import only the helper function
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';

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

function AddItemForm() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  
  // New state variables for image source handling
  const [imageSource, setImageSource] = useState('upload'); // 'upload' or 'url'
  const [imageUrl, setImageUrl] = useState('');

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        type: "error",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB.');
      toast({
        title: "File too large",
        description: "Image must be less than 5MB.",
        type: "error",
      });
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle image URL change
  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
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
        setError('Please select an image file.');
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          type: "error",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB.');
        toast({
          title: "File too large",
          description: "Image must be less than 5MB.",
          type: "error",
        });
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle preview mode
  const togglePreview = () => {
    if (!name || !description || !category) {
      setError('Please fill in all required fields to preview.');
      toast({
        title: "Missing information",
        description: "Please fill in all required fields to preview.",
        type: "error",
      });
      return;
    }
    setError('');
    setPreviewMode(!previewMode);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure user is signed in
    if (!user) {
      router.push('/login?redirectTo=/add-item');
      return;
    }

    // Validate required fields
    if (!name.trim()) {
      setError('Name is required');
      toast({
        title: "Missing information",
        description: "Name is required",
        type: "error",
      });
      return;
    }
    if (!description.trim()) {
      setError('Description is required');
      toast({
        title: "Missing information",
        description: "Description is required",
        type: "error",
      });
      return;
    }
    if (!category) {
      setError('Category is required');
      toast({
        title: "Missing information",
        description: "Category is required",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Generate a unique ID for the item
      const itemId = uuidv4();
      let finalImageUrl = null;

      // Handle image based on source
      if (imageSource === 'upload' && imageFile) {
        const secureFilename = generateSecureFilename(imageFile.name, `items/${itemId}/`);
        
        // Create a FormData object to send the file to our API route
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('path', secureFilename);
        
        // Send the request to our API route
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }
        
        const data = await response.json();
        finalImageUrl = data.imageUrl;
      } else if (imageSource === 'url' && imageUrl) {
        // For external URLs, use the URL directly
        finalImageUrl = imageUrl;
      }

      // Create the item document in Firestore
      await setDoc(doc(db, 'items', itemId), {
        id: itemId,
        name,
        name_lower: name.toLowerCase(), // Lowercase field for case-insensitive search
        description,
        category,
        imageUrl: finalImageUrl,
        imageSource: imageSource, // Track the source of the image
        creatorId: user.uid,
        creatorName: user.displayName || 'Anonymous User',
        rateCount: 0,
        mehCount: 0,
        hateCount: 0,
        totalVotes: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      });

      setSuccess('Item added successfully!');
      toast({
        title: "Success!",
        description: "Your item has been added successfully.",
        type: "success",
      });

      // Redirect to the newly created item page after a delay
      setTimeout(() => router.push(`/item/${itemId}`), 1500);
    } catch (err: any) {
      console.error('Error adding item:', err);
      setError(err.message || 'Failed to add item. Please try again.');
      toast({
        title: "Error",
        description: err.message || 'Failed to add item. Please try again.',
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user is not logged in, show a login prompt
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 dark:text-yellow-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Login Required</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">You need to be logged in to add items.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push('/login?redirectTo=/add-item')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push('/register?redirectTo=/add-item')}
                className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2.5 px-4 rounded-lg transition-colors"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Preview mode display
  if (previewMode) {
    const categoryName = categories.find((cat) => cat.id === category)?.name || '';

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <button
              onClick={togglePreview}
              className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Edit
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Item Preview</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                This is how your item will appear when published.
              </p>

              {/* Item preview */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                {/* Image */}
                <div className="relative h-64 bg-gray-100 dark:bg-gray-700">
                  {imageSource === 'upload' && imagePreview ? (
                    <img src={imagePreview} alt={name} className="w-full h-full object-contain" />
                  ) : imageSource === 'url' && imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={name} 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Invalid+Image+URL';
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400 dark:text-gray-500">No image provided</p>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-gray-900/70 text-white text-xs font-medium px-2 py-1 rounded-full">
                    {categoryName}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{name}</h2>
                  <p className="text-gray-700 dark:text-gray-300 mb-6">{description}</p>

                  {/* MEHtrics */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">MEHtrics</h3>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex flex-col items-center bg-white dark:bg-gray-800 rounded-lg p-3">
                        <ThumbsUp className="h-6 w-6 text-blue-500 mb-2" />
                        <span className="text-lg font-semibold">0%</span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">Rate It</span>
                      </div>

                      <div className="flex flex-col items-center bg-white dark:bg-gray-800 rounded-lg p-3">
                        <Meh className="h-6 w-6 text-yellow-500 mb-2" />
                        <span className="text-lg font-semibold">0%</span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">Meh</span>
                      </div>

                      <div className="flex flex-col items-center bg-white dark:bg-gray-800 rounded-lg p-3">
                        <ThumbsDown className="h-6 w-6 text-red-500 mb-2" />
                        <span className="text-lg font-semibold">0%</span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">Hate It</span>
                      </div>
                    </div>
                  </div>

                  {/* Creator info */}
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Added by {user.displayName || 'Anonymous User'} • Just now
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={togglePreview}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2.5 px-4 rounded-lg transition-colors"
                >
                  Continue Editing
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Publishing...
                    </>
                  ) : (
                    'Publish Item'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular form display
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
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

          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded-r-lg">
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Item Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                placeholder="What do you want people to rate?"
                required
              />
            </div>

            {/* Category Selection */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category *
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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

            {/* Item Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description *
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                rows={4}
                className="block w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                placeholder="Provide details about this item..."
                required
                maxLength={500}
              />
              <p className={`mt-1 text-xs ${description.length > 450 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>
                {description.length}/500 characters
              </p>
            </div>

            {/* Image Source Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Image Source
              </label>
              <div className="flex space-x-2 mb-3">
                <button
                  type="button"
                  onClick={() => setImageSource('upload')}
                  className={`px-3 py-1.5 rounded text-sm ${
                    imageSource === 'upload' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                  }`}
                >
                  <Upload className="h-4 w-4 inline mr-1" />
                  Upload Image
                </button>
                <button
                  type="button"
                  onClick={() => setImageSource('url')}
                  className={`px-3 py-1.5 rounded text-sm ${
                    imageSource === 'url' 
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
            {imageSource === 'upload' ? (
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
                  {imagePreview ? (
                    <div className="relative w-full h-60">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageFile(null);
                          setImagePreview(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
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
                  value={imageUrl}
                  onChange={handleImageUrlChange}
                  placeholder="https://example.com/image.jpg"
                  className="block w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                />
                {imageUrl && (
                  <div className="mt-3 relative border rounded-lg overflow-hidden">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-60 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Invalid+Image+URL';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
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
                onClick={togglePreview}
                className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2.5 px-4 rounded-lg transition-colors"
              >
                Preview
              </button>
              <button
                type="submit"
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
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AddItemPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AddItemForm />
    </Suspense>
  );
}