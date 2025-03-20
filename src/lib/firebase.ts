'use client';

if (typeof window === 'undefined') {
  throw new Error("firebase.ts is for client-side usage only. Please import the appropriate module on the server.");
}

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, Firestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import type { FirebaseStorage } from "firebase/storage";
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

// Initialize Firebase app and services
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let functions: Functions;

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

  // Fallback stub objects in case initialization fails.
  // These stubs are here only to prevent app crashes, but they are not valid Firestore instances.
  app = { name: 'firebase-stub' } as FirebaseApp;
  db = { 
    type: 'firestore-stub', 
    app: app, 
    toJSON: () => ({})
  } as unknown as Firestore;
  auth = { 
    app: app, 
    name: 'auth-stub', 
    config: {},
    setPersistence: async () => {}
  } as unknown as Auth;
  storage = { 
    app: app, 
    maxUploadRetryTime: 0
  } as unknown as FirebaseStorage;
  functions = { 
    app: app, 
    region: 'us-central1', 
    customDomain: null 
  } as unknown as Functions;
}

export { auth, db, storage, functions };
export default app;
