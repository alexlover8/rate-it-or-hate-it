'use client';

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, Firestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, Storage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, Functions, connectFunctionsEmulator } from "firebase/functions";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDgDtnrfNShz5TC9vUQfJjLtuvPU5K_K5o",
  authDomain: "rate-it-or-hate-it-new.firebaseapp.com",
  projectId: "rate-it-or-hate-it-new",
  storageBucket: "rate-it-or-hate-it-new.appspot.com",
  messagingSenderId: "793991979541",
  appId: "1:793991979541:web:daa2d2d000fa4b6362a41c",
  measurementId: "G-BWF22VW5R2"
};

// Initialize Firebase app
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: Storage;
let functions: Functions;

// Only initialize on client side
if (typeof window !== 'undefined') {
  try {
    // Initialize or get existing Firebase app
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    // Initialize services
    db = getFirestore(app);
    storage = getStorage(app);
    functions = getFunctions(app);
    auth = getAuth(app);

    // Connect to emulators in development if needed
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectAuthEmulator(auth, 'http://localhost:9099');
      connectStorageEmulator(storage, 'localhost', 9199);
      connectFunctionsEmulator(functions, 'localhost', 5001);
    }
  } catch (error) {
    console.error("Firebase initialization error:", error);
    
    // Create stub objects to prevent app crashes in case of initialization failure
    // @ts-ignore - Using empty objects as stubs
    if (!app) app = { name: 'firebase-stub' };
    if (!db) db = {};
    if (!auth) auth = {};
    if (!storage) storage = {};
    if (!functions) functions = {};
  }
} else {
  // Server-side stubs
  // @ts-ignore - Using empty objects as stubs for SSR
  app = { name: 'firebase-ssr-stub' };
  db = {};
  auth = {};
  storage = {};
  functions = {};
}

export { auth, db, storage, functions };
export default app;