import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ProfileContent from './ProfileContent';

// Generate static params for static export
export function generateStaticParams() {
  return [{}];
}

// Main component - Keep this extremely minimal
export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
          <span className="mt-2 text-gray-600">Loading...</span>
        </div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}