// src/app/item/[id]/edit/EditItemForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/toast';
import Link from 'next/link';
import { Loader2 } from 'lucide-react'; // Added import for Loader2

type EditItemFormProps = {
  initialData: {
    id: string;
    name: string;
    description: string;
    category: string;
    imageUrl: string | null;
    creatorId: string;
    // Add other fields as needed
  };
};

export default function EditItemForm({ initialData }: EditItemFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(initialData.name);
  const [description, setDescription] = useState(initialData.description);
  const [category, setCategory] = useState(initialData.category);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Check ownership – if the current user isn’t the creator, redirect away.
  useEffect(() => {
    if (user && user.uid !== initialData.creatorId) {
      router.push(`/item/${initialData.id}`);
    }
  }, [user, initialData.creatorId, initialData.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !category) {
      setError('All fields are required.');
      return;
    }
    setIsSubmitting(true);
    setError('');

    try {
      const itemRef = doc(db, 'items', initialData.id);
      await updateDoc(itemRef, {
        name,
        // Update the lowercase name for search purposes as well
        name_lower: name.toLowerCase(),
        description,
        category,
        lastUpdated: serverTimestamp(),
      });
      toast({
        title: 'Item updated',
        description: 'Your item has been updated successfully.',
        type: 'success',
      });
      // Redirect to the item detail page after a short delay
      setTimeout(() => router.push(`/item/${initialData.id}`), 1500);
    } catch (err: any) {
      console.error('Error updating item:', err);
      setError(err.message || 'Failed to update item. Please try again.');
      toast({
        title: 'Error',
        description: err.message || 'Failed to update item. Please try again.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md">
        <div className="mb-6">
          <Link href={`/item/${initialData.id}`} className="text-blue-600 hover:underline">
            &larr; Back to Item
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Edit Item</h1>
        {error && (
          <div className="mb-4 text-red-600">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Item Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Category *
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="">Select a category</option>
              {/* You can hardcode categories or fetch them from Firestore if needed */}
              <option value="electronics">Electronics</option>
              <option value="apparel">Apparel</option>
              <option value="home-kitchen">Home & Kitchen</option>
              <option value="beauty-personal-care">Beauty & Personal Care</option>
              <option value="sports-outdoors">Sports & Outdoors</option>
              <option value="automotive">Automotive</option>
              <option value="books">Books</option>
              <option value="movies">Movies</option>
              <option value="tv-shows">TV Shows</option>
              <option value="video-games">Video Games</option>
              <option value="tech-apps">Tech & Apps</option>
              <option value="companies">Companies & Brands</option>
              <option value="food-restaurants">Food & Restaurants</option>
            </select>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description *
            </label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white"
              required
              maxLength={500}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Updating...
              </>
            ) : (
              'Update Item'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
