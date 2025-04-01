'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/components/ui/toast';

// Import page components
import AddItemForm from './components/AddItemForm';
import ItemPreview from './components/ItemPreview';
import ShareOptions from './components/ShareOptions';

// Types for form data
export type FormData = {
  name: string;
  description: string;
  userReview: string;
  category: string;
  subcategory: string;
  imageSource: 'upload' | 'url';
  imageFile: File | null;
  imageUrl: string;
  imagePreview: string | null;
  userRating: 'rate' | 'meh' | 'hate' | null;
};

export default function AddItemPage() {
  // Get router and auth
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Form states
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    userReview: '',
    category: searchParams.get('category') || '',
    subcategory: searchParams.get('subcategory') || '',
    imageSource: 'upload',
    imageFile: null,
    imageUrl: '',
    imagePreview: null,
    userRating: null
  });
  
  // UI states
  const [previewMode, setPreviewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [newItemId, setNewItemId] = useState<string | null>(null);
  
  // Submit handler
  const handleSubmit = async (shareAfterSubmit = false) => {
    // Validate required fields
    if (!formData.name.trim()) {
      setError('Name is required');
      toast({
        title: "Missing information",
        description: "Name is required",
        type: "error",
      });
      return;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      toast({
        title: "Missing information",
        description: "Description is required",
        type: "error",
      });
      return;
    }
    if (!formData.userReview.trim()) {
      setError('Your review/thoughts are required');
      toast({
        title: "Missing information",
        description: "Please share your personal review or thoughts about this item",
        type: "error",
      });
      return;
    }
    if (!formData.category) {
      setError('Category is required');
      toast({
        title: "Missing information",
        description: "Category is required",
        type: "error",
      });
      return;
    }
    if (!formData.userRating) {
      setError('Please select a rating (Rate it, Meh, or Hate it)');
      toast({
        title: "Missing rating",
        description: "Please select your rating for this item",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      // Generate a unique ID for the item
      const itemId = uuidv4();
      setNewItemId(itemId);
      
      // Handle image upload if needed
      let finalImageUrl = null;
      
      if (formData.imageSource === 'upload' && formData.imageFile) {
        // Create a FormData object to send the file to our API route
        const uploadFormData = new FormData();
        uploadFormData.append('file', formData.imageFile);
        uploadFormData.append('filename', `items/${itemId}/${formData.imageFile.name}`);
        
        // Send the request to our API route
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }
        
        const data = await response.json();
        finalImageUrl = data.url;
      } else if (formData.imageSource === 'url' && formData.imageUrl) {
        // For external URLs, use the URL directly
        finalImageUrl = formData.imageUrl;
      }
      
      // Create the item document in Firestore
      await setDoc(doc(db, 'items', itemId), {
        id: itemId,
        name: formData.name,
        name_lower: formData.name.toLowerCase(), // For case-insensitive search
        description: formData.description,
        userReview: formData.userReview,
        category: formData.category,
        subcategory: formData.subcategory || null,
        imageUrl: finalImageUrl,
        imageSource: formData.imageSource,
        creatorId: user?.uid,
        creatorName: user?.displayName || 'Anonymous User',
        rateCount: formData.userRating === 'rate' ? 1 : 0,
        mehCount: formData.userRating === 'meh' ? 1 : 0,
        hateCount: formData.userRating === 'hate' ? 1 : 0,
        totalVotes: 1, // Start with the creator's vote
        commentCount: 0,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      });
      
      // Also record the user's vote in their votes collection
      if (user) {
        await setDoc(doc(db, 'users', user.uid, 'votes', itemId), {
          itemId,
          itemName: formData.name,
          voteType: formData.userRating,
          timestamp: serverTimestamp(),
          category: formData.category
        });
      }
      
      // Update subcategory count if a subcategory was selected
      // This part would typically be handled in a separate function or server-side
      
      setSuccess('Item added successfully!');
      toast({
        title: "Success!",
        description: "Your item has been added successfully.",
        type: "success",
      });
      
      // Handle post-submission actions
      if (shareAfterSubmit) {
        setShowShareOptions(true);
      } else {
        // Regular redirect to the newly created item page after a delay
        setTimeout(() => router.push(`/item/${itemId}`), 1500);
      }
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
  
  // Toggle preview mode
  const togglePreview = () => {
    if (!formData.name || !formData.description || !formData.userReview || !formData.category || !formData.userRating) {
      setError('Please fill in all required fields and select a rating before previewing.');
      toast({
        title: "Missing information",
        description: "Please complete all required fields before previewing.",
        type: "error",
      });
      return;
    }
    
    setPreviewMode(!previewMode);
  };
  
  // Handle share options close
  const handleShareOptionsClose = () => {
    setShowShareOptions(false);
    if (newItemId) {
      router.push(`/item/${newItemId}`);
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
  
  // Show share options modal if enabled
  if (showShareOptions && newItemId) {
    return (
      <ShareOptions 
        itemId={newItemId}
        itemName={formData.name}
        onClose={handleShareOptionsClose}
      />
    );
  }
  
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Show preview or form based on mode */}
          {previewMode ? (
            <ItemPreview
              formData={formData}
              onBack={togglePreview}
              onSubmit={() => handleSubmit(false)}
              onSubmitAndShare={() => handleSubmit(true)}
              isSubmitting={isSubmitting}
              user={user}
            />
          ) : (
            <AddItemForm
              formData={formData}
              setFormData={setFormData}
              onPreview={togglePreview}
              onSubmit={() => handleSubmit(false)}
              onSubmitAndShare={() => handleSubmit(true)}
              isSubmitting={isSubmitting}
              error={error}
              success={success}
            />
          )}
        </div>
      </div>
    </Suspense>
  );
}