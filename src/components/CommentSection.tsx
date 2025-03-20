'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Loader2, 
  MessageCircle, 
  Send, 
  AlertCircle, 
  ThumbsUp, 
  ThumbsDown, 
  Meh as MehIcon,
  Edit,
  Trash2,
  CornerDownRight,
  Heart,
  Smile,
  Image,
  X,
  ChevronDown,
  Filter
} from 'lucide-react';
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
  getDoc, 
  deleteDoc,
  getDocs,
  Timestamp,
  writeBatch,
  setDoc
} from 'firebase/firestore';

type CommentSentiment = 'rate' | 'meh' | 'hate' | null;

type Comment = {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  timestamp: Date;
  updatedAt?: Date;
  sentiment?: CommentSentiment;
  parentId?: string | null;
  gifUrl?: string | null;
  replyCount: number;
  likeCount: number;
  isEdited?: boolean;
};

type CommentLike = {
  commentId: string;
  userId: string;
  timestamp: Date;
};

type CommentSectionProps = {
  itemId: string;
  initialCommentCount?: number;
};

type FilterOptions = 'newest' | 'oldest' | 'mostLiked' | 'mostReplies';

// Common emojis for the simple emoji picker
const commonEmojis = [
  '😀', '😂', '😍', '🤔', '😎', '👍', '👎', '❤️', '🔥', '🎉',
  '😊', '🙌', '👏', '🤣', '😢', '😡', '🤷‍♂️', '👀', '💯', '🙏'
];

export default function CommentSection({ itemId, initialCommentCount = 0 }: CommentSectionProps) {
  const router = useRouter();
  const { user } = useAuth();
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  
  // Main state
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentSentiment, setCommentSentiment] = useState<CommentSentiment>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [userVote, setUserVote] = useState<'rate' | 'meh' | 'hate' | null>(null);
  
  // New features state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedCommentText, setEditedCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedGifUrl, setSelectedGifUrl] = useState<string | null>(null);
  const [gifSearchTerm, setGifSearchTerm] = useState('');
  const [showGifSearch, setShowGifSearch] = useState(false);
  const [gifSearchResults, setGifSearchResults] = useState<any[]>([]);
  const [filterOption, setFilterOption] = useState<FilterOptions>('newest');
  const [isSearchingGifs, setIsSearchingGifs] = useState(false);
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});
  
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
    // Only query top-level comments (no parentId or parentId is null)
    const commentsQuery = query(
      collection(db, 'comments'),
      where('itemId', '==', itemId),
      where('parentId', '==', null),
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
          updatedAt: data.updatedAt?.toDate() || null,
          parentId: data.parentId || null,
          gifUrl: data.gifUrl || null,
          replyCount: data.replyCount || 0,
          likeCount: data.likeCount || 0,
          isEdited: data.updatedAt ? true : false
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
  
  // Load user likes
  useEffect(() => {
    if (!user) return;
    
    const likesQuery = query(
      collection(db, 'commentLikes'),
      where('userId', '==', user.uid),
      where('itemId', '==', itemId)
    );
    
    const unsubscribe = onSnapshot(likesQuery, (snapshot) => {
      const likedCommentIds = new Set<string>();
      snapshot.forEach((doc) => {
        const data = doc.data();
        likedCommentIds.add(data.commentId);
      });
      
      setUserLikes(likedCommentIds);
    });
    
    return () => unsubscribe();
  }, [user, itemId]);
  
  // Filter comments
  const filteredComments = useMemo(() => {
    let sorted = [...comments];
    switch (filterOption) {
      case 'newest':
        return sorted.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      case 'oldest':
        return sorted.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      case 'mostLiked':
        return sorted.sort((a, b) => b.likeCount - a.likeCount);
      case 'mostReplies':
        return sorted.sort((a, b) => b.replyCount - a.replyCount);
      default:
        return sorted;
    }
  }, [comments, filterOption]);
  
  // GIF search function
  const searchGifs = async (term: string) => {
    if (!term.trim()) {
      setGifSearchResults([]);
      return;
    }
    
    setIsSearchingGifs(true);
    try {
      const response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=KNvQ659hT8314ay6AzTz2ynKTM8PrvP8&q=${encodeURIComponent(term)}&limit=10&rating=pg-13`);
      const data = await response.json();
      
      setGifSearchResults(data.data.map((gif: any) => ({
        id: gif.id,
        url: gif.images.fixed_height.url,
        preview: gif.images.fixed_height_small.url
      })));
    } catch (err) {
      console.error('Error searching GIFs:', err);
    } finally {
      setIsSearchingGifs(false);
    }
  };
  
  // Add emoji to text field
  const addEmoji = (emoji: string, isReply: boolean = false) => {
    if (isReply) {
      setReplyText(prev => prev + emoji);
    } else {
      setCommentText(prev => prev + emoji);
    }
    setShowEmojiPicker(false);
  };
  
  // Load replies for a comment
  const loadReplies = async (commentId: string) => {
    if (showReplies[commentId]) {
      // If replies are already shown, hide them
      setShowReplies(prev => ({ ...prev, [commentId]: false }));
      return;
    }
    
    try {
      const repliesQuery = query(
        collection(db, 'comments'),
        where('parentId', '==', commentId),
        orderBy('timestamp', 'asc')
      );
      
      const snapshot = await getDocs(repliesQuery);
      const replies: Comment[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        replies.push({
          id: doc.id,
          text: data.text,
          userId: data.userId,
          userName: data.userName,
          userPhotoURL: data.userPhotoURL,
          sentiment: data.sentiment || null,
          timestamp: data.timestamp?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || null,
          parentId: data.parentId,
          gifUrl: data.gifUrl || null,
          replyCount: data.replyCount || 0,
          likeCount: data.likeCount || 0,
          isEdited: data.updatedAt ? true : false
        });
      });
      
      // Add replies to comments state
      setComments(prev => {
        const updated = [...prev];
        replies.forEach(reply => {
          if (!updated.some(c => c.id === reply.id)) {
            updated.push(reply);
          }
        });
        return updated;
      });
      
      // Show replies for this comment
      setShowReplies(prev => ({ ...prev, [commentId]: true }));
      
    } catch (err) {
      console.error('Error loading replies:', err);
    }
  };
  
  // Handle comment submission
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is signed in
    if (!user) {
      router.push(`/login?redirectTo=/item/${itemId}`);
      return;
    }
    
    // Validate comment text
    if (!commentText.trim() && !selectedGifUrl) {
      setError('Please enter a comment or add a GIF');
      return;
    }
    
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
        sentiment: commentSentiment || userVote || null, // Use explicit sentiment or user's vote
        timestamp: serverTimestamp(),
        parentId: null, // Top level comment
        gifUrl: selectedGifUrl,
        replyCount: 0,
        likeCount: 0
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
      setSelectedGifUrl(null);
      
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
  
  // Handle comment editing
  const handleUpdateComment = async (e: React.FormEvent, commentId: string) => {
    e.preventDefault();
    
    if (!user) return;
    if (!editedCommentText.trim() && !selectedGifUrl) {
      setError('Comment cannot be empty');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const commentRef = doc(db, 'comments', commentId);
      const commentDoc = await getDoc(commentRef);
      
      if (!commentDoc.exists()) {
        throw new Error('Comment not found');
      }
      
      const commentData = commentDoc.data();
      
      // Verify user owns this comment
      if (commentData.userId !== user.uid) {
        throw new Error('You can only edit your own comments');
      }
      
      // Update the comment
      await updateDoc(commentRef, {
        text: editedCommentText.trim(),
        updatedAt: serverTimestamp(),
        gifUrl: selectedGifUrl || null  // Ensure null instead of undefined
      });
      
      // Reset editing state
      setEditingCommentId(null);
      setEditedCommentText('');
      setSelectedGifUrl(null);
      
    } catch (err: any) {
      console.error('Error updating comment:', err);
      setError(err.message || 'Failed to update comment');
    } finally {
      setIsSubmitting(false);
    }
  };
  
 // Handle comment deletion
const handleDeleteComment = async (commentId: string) => {
  if (!user || !window.confirm('Are you sure you want to delete this comment?')) return;
  
  try {
    const commentRef = doc(db, 'comments', commentId);
    const commentDoc = await getDoc(commentRef);
    
    if (!commentDoc.exists()) {
      throw new Error('Comment not found');
    }
    
    const commentData = commentDoc.data();
    
    // Verify user owns this comment
    if (commentData.userId !== user.uid) {
      throw new Error('You can only delete your own comments');
    }
    
    // 1. If this is a parent comment, delete all replies first
    if (!commentData.parentId) {
      try {
        // Get all replies to this comment
        const repliesQuery = query(
          collection(db, 'comments'),
          where('parentId', '==', commentId)
        );
        
        const repliesSnapshot = await getDocs(repliesQuery);
        let deletedRepliesCount = 0;
        
        // Process each reply
        for (const replyDoc of repliesSnapshot.docs) {
          try {
            // For each reply, try to delete associated likes
            const replyLikesQuery = query(
              collection(db, 'commentLikes'),
              where('commentId', '==', replyDoc.id)
            );
            
            const likesSnapshot = await getDocs(replyLikesQuery);
            for (const likeDoc of likesSnapshot.docs) {
              try {
                await deleteDoc(doc(db, 'commentLikes', likeDoc.id));
              } catch (likeErr) {
                console.error('Error deleting reply like:', likeErr);
                // Continue even if a like couldn't be deleted
              }
            }
            
            // Now delete the reply itself
            await deleteDoc(doc(db, 'comments', replyDoc.id));
            deletedRepliesCount++;
          } catch (replyErr) {
            console.error('Error deleting reply:', replyErr);
            // Continue with next reply even if this one failed
          }
        }
        
        // Update item comment count with the parent comment plus all successfully deleted replies
        const itemRef = doc(db, 'items', itemId);
        await updateDoc(itemRef, {
          commentCount: increment(-(1 + deletedRepliesCount)),
          lastUpdated: serverTimestamp()
        });
      } catch (err) {
        console.error('Error processing replies:', err);
        // Continue to delete the parent comment even if there was an error with replies
      }
    } else {
      // This is a reply, update parent's reply count
      try {
        const parentRef = doc(db, 'comments', commentData.parentId);
        await updateDoc(parentRef, {
          replyCount: increment(-1)
        });
        
        // Update item comment count for just this reply
        const itemRef = doc(db, 'items', itemId);
        await updateDoc(itemRef, {
          commentCount: increment(-1),
          lastUpdated: serverTimestamp()
        });
      } catch (err) {
        console.error('Error updating parent comment:', err);
        // Continue to delete the reply even if updating parent failed
      }
    }
    
    // 2. Delete likes for this comment
    try {
      const likesQuery = query(
        collection(db, 'commentLikes'),
        where('commentId', '==', commentId)
      );
      
      const likesSnapshot = await getDocs(likesQuery);
      for (const likeDoc of likesSnapshot.docs) {
        try {
          await deleteDoc(doc(db, 'commentLikes', likeDoc.id));
        } catch (likeErr) {
          console.error('Error deleting comment like:', likeErr);
          // Continue even if a like couldn't be deleted
        }
      }
    } catch (err) {
      console.error('Error processing likes:', err);
      // Continue to delete the comment even if there was an error with likes
    }
    
    // 3. Finally delete the comment itself
    await deleteDoc(commentRef);
    
  } catch (err: any) {
    console.error('Error deleting comment:', err);
    setError(err.message || 'Failed to delete comment');
  }
};
  
  // Handle reply submission
  const handleSubmitReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    
    if (!user) {
      router.push(`/login?redirectTo=/item/${itemId}`);
      return;
    }
    
    if (!replyText.trim() && !selectedGifUrl) {
      setError('Reply cannot be empty');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Add reply to Firestore
      await addDoc(collection(db, 'comments'), {
        itemId,
        text: replyText.trim(),
        userId: user.uid,
        userName: user.displayName || 'Anonymous User',
        userPhotoURL: user.photoURL,
        sentiment: commentSentiment || userVote || null,
        timestamp: serverTimestamp(),
        parentId, // Reference to parent comment
        gifUrl: selectedGifUrl,
        replyCount: 0,
        likeCount: 0
      });
      
      // Update reply count on parent comment
      const parentRef = doc(db, 'comments', parentId);
      await updateDoc(parentRef, {
        replyCount: increment(1)
      });
      
      // Update comment count on the item
      const itemRef = doc(db, 'items', itemId);
      await updateDoc(itemRef, {
        commentCount: increment(1),
        lastUpdated: serverTimestamp()
      });
      
      // Clear reply input
      setReplyText('');
      setReplyingToId(null);
      setSelectedGifUrl(null);
      
      // Make sure replies are shown
      setShowReplies(prev => ({ ...prev, [parentId]: true }));
      
    } catch (err: any) {
      console.error('Error adding reply:', err);
      setError(err.message || 'Failed to add reply');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle like toggling
  const toggleLike = async (commentId: string) => {
    if (!user) {
      router.push(`/login?redirectTo=/item/${itemId}`);
      return;
    }
    
    try {
      const likeId = `${commentId}_${user.uid}`;
      const likeRef = doc(db, 'commentLikes', likeId);
      const commentRef = doc(db, 'comments', commentId);
      
      // Check if user already liked this comment
      if (userLikes.has(commentId)) {
        // Unlike
        await deleteDoc(likeRef);
        await updateDoc(commentRef, {
          likeCount: increment(-1)
        });
      } else {
        // Like
        await setDoc(likeRef, {
          commentId,
          userId: user.uid,
          itemId, // Store itemId for efficient queries
          timestamp: serverTimestamp()
        });
        await updateDoc(commentRef, {
          likeCount: increment(1)
        });
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };
  
  // Format date helper
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000; // seconds
    
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    
    return date.toLocaleDateString();
  };
  
  // Helper functions for styling based on sentiment
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
  
  // Comment renderer
  const renderComment = (comment: Comment, isReply = false) => {
    const isEditing = editingCommentId === comment.id;
    const isReplying = replyingToId === comment.id;
    const hasUserLiked = userLikes.has(comment.id);
    const replies = isReply ? [] : comments.filter(c => c.parentId === comment.id && showReplies[comment.id]);
    
    return (
      <div key={comment.id} className={`${isReply ? 'mt-3 ml-8 pl-3 border-l-2 border-gray-200 dark:border-gray-700' : 'mb-6'}`}>
        <div className="flex space-x-3">
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
                {comment.isEdited && (
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 italic">
                    (edited)
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(comment.timestamp)}
              </span>
            </div>
            
            {isEditing ? (
              // Edit form
              <form onSubmit={(e) => handleUpdateComment(e, comment.id)} className="mb-2">
                <textarea
                  value={editedCommentText}
                  onChange={(e) => setEditedCommentText(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent mb-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Edit your comment..."
                  rows={3}
                />
                
                {selectedGifUrl && (
                  <div className="relative mb-2 border rounded overflow-hidden">
                    <img src={selectedGifUrl} alt="Selected GIF" className="max-h-40 w-auto" />
                    <button
                      type="button"
                      onClick={() => setSelectedGifUrl(null)}
                      className="absolute top-1 right-1 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md"
                    >
                      <X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                )}
                
                <div className="flex items-center space-x-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setShowGifSearch(!showGifSearch)}
                    className="p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <Image className="h-5 w-5" />
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Simple emoji picker */}
                {showEmojiPicker && (
                  <div className="mb-2 p-2 border rounded-lg bg-white dark:bg-gray-700">
                    <div className="flex flex-wrap gap-1">
                      {commonEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => addEmoji(emoji, false)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer text-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {showGifSearch && (
                  <div className="mb-2 p-2 border rounded-lg bg-white dark:bg-gray-700">
                    <div className="flex mb-2">
                      <input
                        type="text"
                        value={gifSearchTerm}
                        onChange={(e) => {
                          setGifSearchTerm(e.target.value);
                          searchGifs(e.target.value);
                        }}
                        placeholder="Search GIFs..."
                        className="flex-grow px-2 py-1 border rounded mr-2 dark:bg-gray-800 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowGifSearch(false)}
                        className="p-1 text-gray-500"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    
                    {isSearchingGifs ? (
                      <div className="flex justify-center p-4">
                        <Loader2 className="animate-spin h-5 w-5 text-gray-500" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                        {gifSearchResults.map(gif => (
                          <img
                            key={gif.id}
                            src={gif.preview}
                            alt="GIF"
                            className="w-full h-20 object-cover cursor-pointer rounded"
                            onClick={() => {
                              setSelectedGifUrl(gif.url);
                              setShowGifSearch(false);
                            }}
                          />
                        ))}
                        {gifSearchResults.length === 0 && gifSearchTerm && (
                          <p className="col-span-2 text-center text-gray-500 p-2">No GIFs found</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCommentId(null);
                      setEditedCommentText('');
                      setSelectedGifUrl(null);
                    }}
                    className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || (!editedCommentText.trim() && !selectedGifUrl)}
                    className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4 mr-1" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              // Regular comment display
              <>
                <div className="mb-2">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{comment.text}</p>
                  
                  {comment.gifUrl && (
                    <div className="mt-2 border rounded overflow-hidden">
                      <img src={comment.gifUrl} alt="GIF" className="max-h-60 w-auto" />
                    </div>
                  )}
                </div>
                
                <div className="flex items-center text-sm space-x-4">
                  {/* Like button */}
                  <button
                    onClick={() => toggleLike(comment.id)}
                    className={`flex items-center space-x-1 ${
                      hasUserLiked 
                        ? 'text-red-500 dark:text-red-400' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400'
                    }`}
                    aria-label={hasUserLiked ? 'Unlike' : 'Like'}
                  >
                    <Heart className={`h-4 w-4 ${hasUserLiked ? 'fill-current' : ''}`} />
                    <span>{comment.likeCount > 0 ? comment.likeCount : ''}</span>
                  </button>
                  
                  {/* Reply button */}
                  <button
                    onClick={() => {
                      if (user) {
                        setReplyingToId(replyingToId === comment.id ? null : comment.id);
                        setReplyText('');
                      } else {
                        router.push(`/login?redirectTo=/item/${itemId}`);
                      }
                    }}
                    className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                  >
                    <CornerDownRight className="h-4 w-4" />
                    <span>Reply</span>
                  </button>
                  
                  {/* Edit/Delete buttons (only for user's own comments) */}
                  {user && comment.userId === user.uid && (
                    <>
                      <button
                        onClick={() => {
                          setEditingCommentId(comment.id);
                          setEditedCommentText(comment.text);
                          setSelectedGifUrl(comment.gifUrl || null);
                        }}
                        className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                      
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
            
            {/* Reply form */}
            {isReplying && (
              <div className="mt-4 ml-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                <form onSubmit={(e) => handleSubmitReply(e, comment.id)}>
                  <div className="mb-2">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder={`Reply to ${comment.userName}...`}
                      rows={2}
                    />
                    
                    {selectedGifUrl && (
                      <div className="relative mt-2 border rounded overflow-hidden">
                        <img src={selectedGifUrl} alt="Selected GIF" className="max-h-40 w-auto" />
                        <button
                          type="button"
                          onClick={() => setSelectedGifUrl(null)}
                          className="absolute top-1 right-1 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md"
                        >
                          <X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setShowGifSearch(!showGifSearch)}
                      className="p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <Image className="h-5 w-5" />
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <Smile className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {/* Simple emoji picker for reply */}
                  {showEmojiPicker && (
                    <div className="mb-2 p-2 border rounded-lg bg-white dark:bg-gray-700">
                      <div className="flex flex-wrap gap-1">
                        {commonEmojis.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => addEmoji(emoji, true)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer text-lg"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {showGifSearch && (
                    <div className="mb-2 p-2 border rounded-lg bg-white dark:bg-gray-700">
                      <div className="flex mb-2">
                        <input
                          type="text"
                          value={gifSearchTerm}
                          onChange={(e) => {
                            setGifSearchTerm(e.target.value);
                            searchGifs(e.target.value);
                          }}
                          placeholder="Search GIFs..."
                          className="flex-grow px-2 py-1 border rounded mr-2 dark:bg-gray-800 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowGifSearch(false)}
                          className="p-1 text-gray-500"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      
                      {isSearchingGifs ? (
                        <div className="flex justify-center p-4">
                          <Loader2 className="animate-spin h-5 w-5 text-gray-500" />
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                          {gifSearchResults.map(gif => (
                            <img
                              key={gif.id}
                              src={gif.preview}
                              alt="GIF"
                              className="w-full h-20 object-cover cursor-pointer rounded"
                              onClick={() => {
                                setSelectedGifUrl(gif.url);
                                setShowGifSearch(false);
                              }}
                            />
                          ))}
                          {gifSearchResults.length === 0 && gifSearchTerm && (
                            <p className="col-span-2 text-center text-gray-500 p-2">No GIFs found</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setReplyingToId(null)}
                      className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || (!replyText.trim() && !selectedGifUrl)}
                      className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 flex items-center"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin h-4 w-4 mr-1" />
                          Sending...
                        </>
                      ) : (
                        'Post Reply'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Show replies toggle button */}
            {!isReply && comment.replyCount > 0 && (
              <button
                onClick={() => loadReplies(comment.id)}
                className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
              >
                <ChevronDown 
                  className={`h-4 w-4 mr-1 transition-transform ${showReplies[comment.id] ? 'rotate-180' : ''}`} 
                />
                {showReplies[comment.id] ? 'Hide' : 'Show'} {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>
        </div>
        
        {/* Render all replies */}
        {showReplies[comment.id] && (
          <div className="mt-3">
            {replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center text-gray-900 dark:text-gray-100">
          <MessageCircle className="mr-2 h-5 w-5" />
          Comments ({commentCount})
        </h2>
        
        {/* Filter dropdown */}
        <div className="relative">
          <div className="flex items-center space-x-1">
            <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <select
              value={filterOption}
              onChange={(e) => setFilterOption(e.target.value as FilterOptions)}
              className="text-sm border-none bg-transparent focus:ring-0 text-gray-600 dark:text-gray-300 py-1 pl-1 pr-7 appearance-none cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="mostLiked">Most Liked</option>
              <option value="mostReplies">Most Replies</option>
            </select>
          </div>
        </div>
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
              
              {selectedGifUrl && (
                <div className="mt-2 relative border rounded overflow-hidden">
                  <img src={selectedGifUrl} alt="Selected GIF" className="max-h-60 w-auto" />
                  <button
                    type="button"
                    onClick={() => setSelectedGifUrl(null)}
                    className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              )}
              
              <button
                type="submit"
                disabled={!user || isSubmitting || (!commentText.trim() && !selectedGifUrl)}
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
            <div className="flex items-center ml-12 space-x-2">
              {/* Sentiment buttons */}
              <div className="flex items-center space-x-2">
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
              </div>
              
              {/* Media insertion buttons */}
              <div className="ml-4 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowGifSearch(!showGifSearch)}
                  className="p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Image className="h-5 w-5" />
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Smile className="h-5 w-5" />
                </button>
              </div>
              
              {userVote && !commentSentiment && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  (Will use your current "{userVote === 'rate' ? 'Rate It' : userVote === 'meh' ? 'Meh' : 'Hate It'}" vote)
                </span>
              )}
            </div>
          )}
          
          {/* Simple emoji picker */}
          {showEmojiPicker && (
            <div className="relative z-10 ml-12">
              <div className="p-2 border rounded-lg bg-white dark:bg-gray-700 shadow-lg">
                <div className="flex flex-wrap gap-1">
                  {commonEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => addEmoji(emoji)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* GIF search */}
          {showGifSearch && (
            <div className="ml-12 p-2 border rounded-lg bg-white dark:bg-gray-700">
              <div className="flex mb-2">
                <input
                  type="text"
                  value={gifSearchTerm}
                  onChange={(e) => {
                    setGifSearchTerm(e.target.value);
                    searchGifs(e.target.value);
                  }}
                  placeholder="Search GIFs..."
                  className="flex-grow px-2 py-1 border rounded mr-2 dark:bg-gray-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowGifSearch(false)}
                  className="p-1 text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {isSearchingGifs ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="animate-spin h-5 w-5 text-gray-500" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1 max-h-60 overflow-y-auto">
                  {gifSearchResults.map(gif => (
                    <img
                      key={gif.id}
                      src={gif.preview}
                      alt="GIF"
                      className="w-full h-24 object-cover cursor-pointer rounded"
                      onClick={() => {
                        setSelectedGifUrl(gif.url);
                        setShowGifSearch(false);
                      }}
                    />
                  ))}
                  {gifSearchResults.length === 0 && gifSearchTerm && (
                    <p className="col-span-2 text-center text-gray-500 p-2">No GIFs found</p>
                  )}
                </div>
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
        ) : filteredComments.length > 0 ? (
          filteredComments.filter(comment => !comment.parentId).map(comment => renderComment(comment))
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