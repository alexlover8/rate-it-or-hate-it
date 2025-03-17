'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, MessageCircle, Send, AlertCircle, ThumbsUp, ThumbsDown, Meh as MehIcon } from 'lucide-react';
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
  increment,
  getDoc 
} from 'firebase/firestore';

type CommentSentiment = 'rate' | 'meh' | 'hate' | null;

type Comment = {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  timestamp: Date;
  sentiment?: CommentSentiment;
};

type CommentSectionProps = {
  itemId: string;
  initialCommentCount?: number;
};

export default function CommentSection({ itemId, initialCommentCount = 0 }: CommentSectionProps) {
  const router = useRouter();
  const { user } = useAuth();
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentSentiment, setCommentSentiment] = useState<CommentSentiment>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [userVote, setUserVote] = useState<'rate' | 'meh' | 'hate' | null>(null);
  
  // Load user's vote for this item
  useEffect(() => {
    if (!user) return;
    
    const fetchUserVote = async () => {
      try {
        // Check if user has voted on this item
        const voteRef = doc(db, 'users', user.uid, 'votes', itemId);
        const voteDoc = await getDoc(voteRef);
        
        if (voteDoc.exists()) {
          const voteData = voteDoc.data();
          setUserVote(voteData.vote as 'rate' | 'meh' | 'hate');
        }
      } catch (err) {
        console.error('Error fetching user vote:', err);
      }
    };
    
    fetchUserVote();
  }, [user, itemId]);
  
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
          sentiment: data.sentiment || null,
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
        sentiment: commentSentiment || userVote, // Use explicit sentiment or user's vote
        timestamp: serverTimestamp(),
      });
      
      // Update comment count on the item
      const itemRef = doc(db, 'items', itemId);
      await updateDoc(itemRef, {
        commentCount: increment(1),
        lastUpdated: serverTimestamp()
      });
      
      // Clear comment input and sentiment
      setCommentText('');
      setCommentSentiment(null);
      
      // Focus back on the input field
      if (commentInputRef.current) {
        commentInputRef.current.focus();
      }
      
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
  
  const getSentimentColor = (sentiment: CommentSentiment) => {
    switch (sentiment) {
      case 'rate': return 'text-blue-600 dark:text-blue-400';
      case 'meh': return 'text-yellow-600 dark:text-yellow-400';
      case 'hate': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-400';
    }
  };
  
  const getSentimentBgColor = (sentiment: CommentSentiment) => {
    switch (sentiment) {
      case 'rate': return 'bg-blue-50 dark:bg-blue-900/20';
      case 'meh': return 'bg-yellow-50 dark:bg-yellow-900/20';
      case 'hate': return 'bg-red-50 dark:bg-red-900/20';
      default: return 'bg-gray-100 dark:bg-gray-800';
    }
  };
  
  const getSentimentBorderColor = (sentiment: CommentSentiment) => {
    switch (sentiment) {
      case 'rate': return 'border-blue-200 dark:border-blue-800';
      case 'meh': return 'border-yellow-200 dark:border-yellow-800';
      case 'hate': return 'border-red-200 dark:border-red-800';
      default: return 'border-gray-200 dark:border-gray-700';
    }
  };
  
  const getSentimentIcon = (sentiment: CommentSentiment) => {
    switch (sentiment) {
      case 'rate': return <ThumbsUp className="h-4 w-4" />;
      case 'meh': return <MehIcon className="h-4 w-4" />;
      case 'hate': return <ThumbsDown className="h-4 w-4" />;
      default: return null;
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center text-gray-900 dark:text-gray-100">
          <MessageCircle className="mr-2 h-5 w-5" />
          Comments ({commentCount})
        </h2>
      </div>
      
      {/* Comment form */}
      <form onSubmit={handleSubmitComment} className="mb-6">
        <div className="flex flex-col space-y-3">
          <div className="flex items-start space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              commentSentiment 
                ? getSentimentBgColor(commentSentiment) 
                : 'bg-blue-100 dark:bg-blue-900/50'
            }`}>
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'} 
                  className="w-10 h-10 rounded-full" 
                />
              ) : (
                user ? (
                  <span className={`font-medium text-sm ${
                    commentSentiment 
                      ? getSentimentColor(commentSentiment) 
                      : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </span>
                ) : (
                  <span className="font-medium text-sm text-blue-600 dark:text-blue-400">?</span>
                )
              )}
            </div>
            <div className="flex-grow relative">
              <textarea
                ref={commentInputRef}
                placeholder={user ? "Add a comment..." : "Sign in to comment"}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={!user || isSubmitting}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 min-h-[80px] resize-y bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  commentSentiment 
                    ? `${getSentimentBorderColor(commentSentiment)} focus:ring-${commentSentiment === 'rate' ? 'blue' : commentSentiment === 'meh' ? 'yellow' : 'red'}-500` 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                }`}
              />
              <button
                type="submit"
                disabled={!user || isSubmitting || !commentText.trim()}
                className="absolute bottom-2 right-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:text-gray-400 disabled:cursor-not-allowed p-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          
          {user && (
            <div className="flex items-center space-x-2 ml-12">
              <span className="text-sm text-gray-500 dark:text-gray-400 mr-1">Add sentiment:</span>
              <button
                type="button"
                onClick={() => setCommentSentiment(commentSentiment === 'rate' ? null : 'rate')}
                className={`p-1.5 rounded-full transition-colors ${
                  commentSentiment === 'rate' 
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' 
                    : 'text-gray-500 hover:bg-blue-50 dark:text-gray-400 dark:hover:bg-blue-900/20'
                }`}
                aria-label="Rate It"
              >
                <ThumbsUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setCommentSentiment(commentSentiment === 'meh' ? null : 'meh')}
                className={`p-1.5 rounded-full transition-colors ${
                  commentSentiment === 'meh' 
                    ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400' 
                    : 'text-gray-500 hover:bg-yellow-50 dark:text-gray-400 dark:hover:bg-yellow-900/20'
                }`}
                aria-label="Meh"
              >
                <MehIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setCommentSentiment(commentSentiment === 'hate' ? null : 'hate')}
                className={`p-1.5 rounded-full transition-colors ${
                  commentSentiment === 'hate' 
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400' 
                    : 'text-gray-500 hover:bg-red-50 dark:text-gray-400 dark:hover:bg-red-900/20'
                }`}
                aria-label="Hate It"
              >
                <ThumbsDown className="h-4 w-4" />
              </button>
              {userVote && !commentSentiment && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  (Will use your current "{userVote === 'rate' ? 'Rate It' : userVote === 'meh' ? 'Meh' : 'Hate It'}" vote)
                </span>
              )}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {error}
          </p>
        )}
      </form>
      
      {/* Comments list */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="animate-spin h-8 w-8 text-blue-500 mb-2" />
            <span className="text-gray-500 dark:text-gray-400">Loading comments...</span>
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                comment.sentiment ? getSentimentBgColor(comment.sentiment) : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                {comment.userPhotoURL ? (
                  <img 
                    src={comment.userPhotoURL} 
                    alt={comment.userName} 
                    className="w-10 h-10 rounded-full" 
                  />
                ) : (
                  <span className={`font-medium text-sm ${
                    comment.sentiment ? getSentimentColor(comment.sentiment) : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {comment.userName.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{comment.userName}</h3>
                    {comment.sentiment && (
                      <span className={`ml-2 inline-flex items-center text-xs py-0.5 px-1.5 rounded-full ${
                        getSentimentBgColor(comment.sentiment)
                      } ${getSentimentColor(comment.sentiment)}`}>
                        {getSentimentIcon(comment.sentiment)}
                        <span className="ml-1">
                          {comment.sentiment === 'rate' ? 'Rate It' : comment.sentiment === 'meh' ? 'Meh' : 'Hate It'}
                        </span>
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(comment.timestamp)}</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{comment.text}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 px-6">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
              <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}