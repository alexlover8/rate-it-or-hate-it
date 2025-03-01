'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, MessageCircle, Send, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  increment 
} from 'firebase/firestore';

type Comment = {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  timestamp: Date;
};

type CommentSectionProps = {
  itemId: string;
  initialCommentCount?: number;
};

export default function CommentSection({ itemId, initialCommentCount = 0 }: CommentSectionProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  
  // Load comments
  useEffect(() => {
    const commentsQuery = query(
      collection(db, 'comments'),
      where('itemId', '==', itemId),
      orderBy('timestamp', 'desc')
    );
    
    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const loadedComments: Comment[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedComments.push({
          id: doc.id,
          text: data.text,
          userId: data.userId,
          userName: data.userName,
          userPhotoURL: data.userPhotoURL,
          timestamp: data.timestamp?.toDate() || new Date(),
        });
      });
      
      setComments(loadedComments);
      setCommentCount(loadedComments.length);
      setIsLoading(false);
    }, (err) => {
      console.error('Error loading comments:', err);
      setIsLoading(false);
      setError('Failed to load comments.');
    });
    
    return () => unsubscribe();
  }, [itemId]);
  
  // Handle comment submission
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is signed in
    if (!user) {
      router.push(`/login?redirectTo=/item/${itemId}`);
      return;
    }
    
    // Validate comment text
    if (!commentText.trim()) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Add comment to Firestore
      await addDoc(collection(db, 'comments'), {
        itemId,
        text: commentText.trim(),
        userId: user.uid,
        userName: user.displayName || 'Anonymous User',
        userPhotoURL: user.photoURL,
        timestamp: serverTimestamp(),
      });
      
      // Update comment count on the item
      const itemRef = doc(db, 'items', itemId);
      await updateDoc(itemRef, {
        commentCount: increment(1),
        lastUpdated: serverTimestamp()
      });
      
      // Clear comment input
      setCommentText('');
      
    } catch (err: any) {
      console.error('Error adding comment:', err);
      setError(err.message || 'Failed to add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000; // seconds
    
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    
    return date.toLocaleDateString();
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <MessageCircle className="mr-2 h-5 w-5" />
          Comments ({commentCount})
        </h2>
      </div>
      
      {/* Comment form */}
      <form onSubmit={handleSubmitComment} className="mb-6">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0">
            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || 'User'} 
                className="w-10 h-10 rounded-full" 
              />
            ) : (
              user ? (
                <span className="font-medium text-sm">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </span>
              ) : (
                <span className="font-medium text-sm">?</span>
              )
            )}
          </div>
          <div className="flex-grow relative">
            <textarea
              placeholder={user ? "Add a comment..." : "Sign in to comment"}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={!user || isSubmitting}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 min-h-[80px] resize-y"
            />
            <button
              type="submit"
              disabled={!user || isSubmitting || !commentText.trim()}
              className="absolute bottom-2 right-2 text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed p-1 rounded-full hover:bg-blue-50"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {error}
          </p>
        )}
      </form>
      
      {/* Comments list */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0">
                {comment.userPhotoURL ? (
                  <img 
                    src={comment.userPhotoURL} 
                    alt={comment.userName} 
                    className="w-10 h-10 rounded-full" 
                  />
                ) : (
                  <span className="font-medium text-sm">
                    {comment.userName.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-gray-900">{comment.userName}</h3>
                  <span className="text-sm text-gray-500">{formatDate(comment.timestamp)}</span>
                </div>
                <p className="text-gray-700 whitespace-pre-line">{comment.text}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  );
}