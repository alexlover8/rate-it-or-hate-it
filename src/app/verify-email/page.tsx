import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import VerifyEmailContent from './VerifyEmailContent';

// Generate static paths for static export (only works in server components)
export function generateStaticParams() {
  // For email verification, we only need to generate the base route
  return [{}];
}

// Main page component that uses the client component
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
          <span className="mt-2 text-gray-600">Loading...</span>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}