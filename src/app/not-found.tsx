'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Home, AlertTriangle } from 'lucide-react';

// Inner component with client-side hooks
function NotFoundContent() {
  const router = useRouter();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-blue-100 p-6">
            <AlertTriangle size={64} className="text-blue-600" />
          </div>
        </div>
        <h1 className="text-9xl font-extrabold text-blue-600 dark:text-blue-400">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-4">Page Not Found</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2 mb-8">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="flex justify-center">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            <Home className="mr-2 h-5 w-5" />
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense
export default function NotFound() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
          <span className="mt-2 text-gray-600 dark:text-gray-300">Loading...</span>
        </div>
      </div>
    }>
      <NotFoundContent />
    </Suspense>
  );
}