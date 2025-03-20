'use client';

import { useState } from 'react';
import { X, UserPlus, LogIn } from 'lucide-react';
import Link from 'next/link';

type LoginPromptModalProps = {
  isOpen: boolean;
  onClose: () => void;
  actionType?: 'vote' | 'comment' | 'general';
  returnUrl?: string;
};

export default function LoginPromptModal({ 
  isOpen, 
  onClose, 
  actionType = 'vote',
  returnUrl = ''
}: LoginPromptModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  if (!isOpen) return null;

  const actionText = {
    vote: 'vote on items',
    comment: 'leave comments',
    general: 'access all features'
  }[actionType];

  // Prepare return URL for auth redirects
  const encodedReturnUrl = encodeURIComponent(returnUrl || window.location.pathname);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="relative p-6 bg-gradient-to-r from-blue-600 to-teal-500 text-white">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-semibold text-center">
              Join Rate It or Hate It
            </h2>
            <p className="text-white/90 text-sm text-center mt-1">
              Sign in or create an account to {actionText}
            </p>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              className={`flex-1 py-3 text-center font-medium text-sm transition-colors ${
                activeTab === 'login'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('login')}
            >
              Sign In
            </button>
            <button
              className={`flex-1 py-3 text-center font-medium text-sm transition-colors ${
                activeTab === 'signup'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('signup')}
            >
              Create Account
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {activeTab === 'login' ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Link
                    href={`/login?returnUrl=${encodedReturnUrl}`}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    <LogIn className="w-5 h-5" />
                    <span>Sign In</span>
                  </Link>
                </div>
                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                  <p>
                    Don't have an account?{' '}
                    <button 
                      className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                      onClick={() => setActiveTab('signup')}
                    >
                      Sign up
                    </button>
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Link
                    href={`/register?returnUrl=${encodedReturnUrl}`}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>Create New Account</span>
                  </Link>
                </div>
                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                  <p>
                    Already have an account?{' '}
                    <button 
                      className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                      onClick={() => setActiveTab('login')}
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 text-center text-xs text-gray-500 dark:text-gray-400">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}