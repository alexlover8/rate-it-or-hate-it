'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Client component with all the interactive logic
export default function VerifyEmailContent() {
  const { user } = useAuth();
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Set up countdown for resending verification email
  useEffect(() => {
    if (!canResend && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);
  
  // Handle resend verification email
  const handleResend = async () => {
    if (!user) return;
    
    setIsResending(true);
    setError('');
    setSuccess('');
    
    try {
      await sendEmailVerification(user);
      setSuccess('Verification email sent successfully!');
      setCanResend(false);
      setCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };
  
  // If no user is logged in, show error
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md text-center">
          <div className="rounded-full bg-red-100 p-4 w-20 h-20 mx-auto flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Not Signed In</h1>
          <p className="text-gray-600">Please sign in to verify your email</p>
          <div className="mt-6">
            <Link
              href="/login"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md text-center">
        <div className="rounded-full bg-blue-100 p-4 w-20 h-20 mx-auto flex items-center justify-center">
          <Mail className="h-10 w-10 text-blue-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900">Verify Your Email</h1>
        <p className="text-gray-600">
          We've sent a verification email to <strong>{user.email}</strong>. 
          Please check your inbox and click the verification link to activate your account.
        </p>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 text-left">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 text-left">
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        )}
        
        <div className="mt-6 space-y-4">
          <button
            onClick={handleResend}
            disabled={!canResend || isResending}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? (
              <>
                <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                Sending...
              </>
            ) : !canResend ? (
              `Resend in ${countdown}s`
            ) : (
              'Resend Verification Email'
            )}
          </button>
          
          <div className="text-sm text-gray-600">
            <p>
              Already verified your email?{' '}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}