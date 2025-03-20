'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  sendPasswordResetEmail,
  updateProfile,
  User,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// Types for user profile and auth context
type UserProfile = {
  displayName: string;
  email: string;
  photoURL: string | null;
  bio: string | null;
  joinDate: Date;
  voteCount: {
    total: number;
    rate: number;
    meh: number;
    hate: number;
  };
};

type AuthContextType = {
  user: User | null;
  userProfile: UserProfile | null;
  error: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, displayName: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  signInWithFacebook: () => Promise<any>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
};

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  error: null,
  isLoading: true,
  signIn: async () => ({}),
  signUp: async () => ({}),
  signInWithGoogle: async () => ({}),
  signInWithFacebook: async () => ({}),
  logOut: async () => {},
  resetPassword: async () => {},
  updateUserProfile: async () => {},
});

// Check if we're on the client side
const isClient = typeof window !== 'undefined';

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    // Skip on server-side
    if (!isClient) {
      setIsLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
        
        if (currentUser) {
          // Fetch user profile from Firestore
          try {
            const userRef = doc(db, 'users', currentUser.uid);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
              setUserProfile(userSnap.data() as UserProfile);
            } else {
              console.log('No user profile found');
            }
          } catch (err) {
            console.error('Error fetching user profile:', err);
          }
        } else {
          setUserProfile(null);
        }
        
        setIsLoading(false);
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error("Auth state monitoring error:", error);
      setIsLoading(false);
      return () => {};
    }
  }, []);

  // Sign up function
  const signUp = async (email: string, password: string, displayName: string) => {
    if (!isClient) {
      throw new Error("Authentication is not available on the server");
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Create user with Firebase Auth
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user profile with display name
      await updateProfile(user, { displayName });
      
      // Create user document in Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        displayName,
        email,
        photoURL: null,
        bio: null,
        joinDate: new Date(),
        voteCount: {
          total: 0,
          rate: 0,
          meh: 0,
          hate: 0
        },
        lastActive: serverTimestamp()
      });
      
      return { user };
    } catch (err: any) {
      console.error('Error signing up:', err);
      
      // Handle known Firebase auth error codes
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else {
        setError(err.message || 'Failed to create account');
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    if (!isClient) {
      throw new Error("Authentication is not available on the server");
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last active timestamp
      if (result.user) {
        const userRef = doc(db, 'users', result.user.uid);
        await updateDoc(userRef, {
          lastActive: serverTimestamp()
        });
      }
      
      return result;
    } catch (err: any) {
      console.error('Error signing in:', err);
      
      // Handle known Firebase auth error codes
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later');
      } else if (err.code === 'auth/user-disabled') {
        setError('This account has been disabled');
      } else {
        setError(err.message || 'Failed to sign in');
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    if (!isClient) {
      throw new Error("Authentication is not available on the server");
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if this is a new user
      const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
      
      // If new user, create a profile in Firestore
      if (isNewUser) {
        const userRef = doc(db, 'users', result.user.uid);
        await setDoc(userRef, {
          displayName: result.user.displayName || 'User',
          email: result.user.email,
          photoURL: result.user.photoURL,
          bio: null,
          joinDate: new Date(),
          voteCount: {
            total: 0,
            rate: 0,
            meh: 0,
            hate: 0
          },
          lastActive: serverTimestamp(),
          provider: 'google'
        });
      } else {
        // Update last active timestamp
        const userRef = doc(db, 'users', result.user.uid);
        await updateDoc(userRef, {
          lastActive: serverTimestamp()
        });
      }
      
      return result;
    } catch (err: any) {
      console.error('Error signing in with Google:', err);
      
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Sign-in popup was blocked by your browser');
      } else {
        setError(err.message || 'Failed to sign in with Google');
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in with Facebook
  const signInWithFacebook = async () => {
    if (!isClient) {
      throw new Error("Authentication is not available on the server");
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const provider = new FacebookAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if this is a new user
      const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
      
      // If new user, create a profile in Firestore
      if (isNewUser) {
        const userRef = doc(db, 'users', result.user.uid);
        await setDoc(userRef, {
          displayName: result.user.displayName || 'User',
          email: result.user.email,
          photoURL: result.user.photoURL,
          bio: null,
          joinDate: new Date(),
          voteCount: {
            total: 0,
            rate: 0,
            meh: 0,
            hate: 0
          },
          lastActive: serverTimestamp(),
          provider: 'facebook'
        });
      } else {
        // Update last active timestamp
        const userRef = doc(db, 'users', result.user.uid);
        await updateDoc(userRef, {
          lastActive: serverTimestamp()
        });
      }
      
      return result;
    } catch (err: any) {
      console.error('Error signing in with Facebook:', err);
      
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Sign-in popup was blocked by your browser');
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with the same email address but different sign-in credentials');
      } else {
        setError(err.message || 'Failed to sign in with Facebook');
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Log out function
  const logOut = async () => {
    if (!isClient) {
      throw new Error("Authentication is not available on the server");
    }
    
    setIsLoading(true);
    
    try {
      await signOut(auth);
    } catch (err: any) {
      console.error('Error signing out:', err);
      setError(err.message || 'Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    if (!isClient) {
      throw new Error("Authentication is not available on the server");
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      console.error('Error resetting password:', err);
      
      // Handle known Firebase auth error codes
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else {
        setError(err.message || 'Failed to reset password');
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile
  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!isClient) {
      throw new Error("Authentication is not available on the server");
    }
    
    if (!user) throw new Error('No authenticated user');
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Only update auth profile if we're changing relevant fields
      if (data.displayName || data.photoURL) {
        await updateProfile(user, {
          displayName: data.displayName,
          photoURL: data.photoURL
        });
      }
      
      // Update Firestore profile
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...data,
        lastActive: serverTimestamp()
      });
      
      // Update local state
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          ...data
        });
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const value = {
    user,
    userProfile,
    error,
    isLoading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithFacebook,
    logOut,
    resetPassword,
    updateUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth() {
  return useContext(AuthContext);
}