'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  voteCount?: number;
  rateLimit?: {
    votes: {
      hourly: number;
      daily: number;
      lastVoteTime: Date | null;
    };
  };
};

type AuthContextType = {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Clear any previous error
  const clearError = () => setError(null);

  useEffect(() => {
    let unsubscribe: () => void;
    
    const initializeAuth = async () => {
      try {
        unsubscribe = onAuthStateChanged(auth, async (authUser) => {
          if (authUser) {
            setUser(authUser);
            
            // Fetch user profile
            try {
              const userRef = doc(db, 'users', authUser.uid);
              const userDoc = await getDoc(userRef);
              
              if (userDoc.exists()) {
                const userData = userDoc.data();
                setUserProfile({
                  uid: authUser.uid,
                  email: authUser.email,
                  displayName: authUser.displayName,
                  photoURL: authUser.photoURL,
                  createdAt: userData.createdAt?.toDate() || new Date(),
                  voteCount: userData.voteCount || 0,
                  rateLimit: userData.rateLimit ? {
                    votes: {
                      hourly: userData.rateLimit.votes?.hourly || 0,
                      daily: userData.rateLimit.votes?.daily || 0,
                      lastVoteTime: userData.rateLimit.votes?.lastVoteTime?.toDate() || null
                    }
                  } : undefined
                });
              } else {
                // Create profile if it doesn't exist
                const newProfile = {
                  uid: authUser.uid,
                  email: authUser.email,
                  displayName: authUser.displayName,
                  photoURL: authUser.photoURL,
                  createdAt: new Date(),
                  voteCount: 0,
                  rateLimit: {
                    votes: {
                      hourly: 0,
                      daily: 0,
                      lastVoteTime: null
                    }
                  }
                };
                
                await setDoc(userRef, {
                  email: authUser.email,
                  displayName: authUser.displayName,
                  photoURL: authUser.photoURL,
                  createdAt: serverTimestamp(),
                  voteCount: 0,
                  rateLimit: {
                    votes: {
                      hourly: 0,
                      daily: 0,
                      lastVoteTime: null
                    }
                  }
                });
                
                setUserProfile(newProfile);
              }
            } catch (err) {
              console.error("Error fetching user profile:", err);
            }
          } else {
            setUser(null);
            setUserProfile(null);
          }
          
          setIsLoading(false);
        });
      } catch (err) {
        console.error("Error setting up auth state observer:", err);
        setIsLoading(false);
      }
    };

    initializeAuth();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, name?: string) => {
    clearError();
    setIsLoading(true);
    
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with name if provided
      if (name && result.user) {
        await updateProfile(result.user, { displayName: name });
      }
      
      return;
    } catch (err: any) {
      let errorMessage = 'Failed to create account';
      
      // Handle known Firebase auth error codes
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Email is already in use';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    clearError();
    setIsLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      let errorMessage = 'Failed to sign in';
      
      // Handle known Firebase auth error codes
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect email or password';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format';
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many unsuccessful login attempts. Please try again later';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logOut = async () => {
    clearError();
    
    try {
      await firebaseSignOut(auth);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to log out';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const resetPassword = async (email: string) => {
    clearError();
    setIsLoading(true);
    
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      let errorMessage = 'Failed to send password reset email';
      
      // Handle known Firebase auth error codes
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (data: { displayName?: string; photoURL?: string }) => {
    clearError();
    setIsLoading(true);
    
    try {
      if (!user) {
        throw new Error('No user logged in');
      }
      
      // Update Firebase Auth profile
      await updateProfile(user, data);
      
      // Update Firestore user document
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...data,
        lastUpdated: serverTimestamp()
      });
      
      // Update local state
      setUser({ ...user, ...data });
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          displayName: data.displayName || userProfile.displayName,
          photoURL: data.photoURL || userProfile.photoURL
        });
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      isLoading,
      error,
      signUp,
      signIn,
      logOut,
      resetPassword,
      updateUserProfile,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};