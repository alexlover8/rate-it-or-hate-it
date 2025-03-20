'use client';

import { useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, Check, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import ReCAPTCHA from 'react-google-recaptcha';

// Inner component with all the client hooks and logic
function RegisterContent() {
  const router = useRouter();
  const { signUp, signInWithGoogle, signInWithFacebook, error: authError, isLoading } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [verifyingCaptcha, setVerifyingCaptcha] = useState(false);
  const [socialLoginInProgress, setSocialLoginInProgress] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  
  // Password strength indicators
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordStrength = [
    hasMinLength, hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar
  ].filter(Boolean).length;
  
  const handleCaptchaChange = async (token: string | null) => {
    if (!token) {
      setCaptchaVerified(false);
      return;
    }

    try {
      setVerifyingCaptcha(true);
      const response = await fetch('/api/verify-captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      
      const data = await response.json();
      setCaptchaVerified(data.success);
      
      if (!data.success) {
        setError('CAPTCHA verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying captcha:', error);
      setCaptchaVerified(false);
      setError('Error verifying CAPTCHA. Please try again.');
    } finally {
      setVerifyingCaptcha(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!name) return setError('Name is required');
    if (!email) return setError('Email is required');
    if (!password) return setError('Password is required');
    if (password !== confirmPassword) return setError('Passwords do not match');
    if (passwordStrength < 3) return setError('Password is too weak');
    if (!agreedToTerms) return setError('You must agree to the terms and conditions');
    if (!captchaVerified) return setError('Please complete the CAPTCHA verification');
    
    try {
      await signUp(email, password, name);
      router.push('/verify-email');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
      // Reset captcha on error
      recaptchaRef.current?.reset();
      setCaptchaVerified(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setSocialLoginInProgress(true);
      await signInWithGoogle();
      router.push('/');
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Failed to sign in with Google');
      }
    } finally {
      setSocialLoginInProgress(false);
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      setError('');
      setSocialLoginInProgress(true);
      await signInWithFacebook();
      router.push('/');
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Failed to sign in with Facebook');
      }
    } finally {
      setSocialLoginInProgress(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">Create Account</h1>
          <p className="mt-2 text-sm text-gray-600">
            Join Rate It or Hate It and start sharing your opinions
          </p>
        </div>
        
        {(error || authError) && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-sm text-red-700">{error || authError}</p>
            </div>
          </div>
        )}
        
        {/* Social Registration/Login Buttons */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={socialLoginInProgress || isLoading}
            className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          <button
            type="button"
            onClick={handleFacebookSignIn}
            disabled={socialLoginInProgress || isLoading}
            className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
              />
            </svg>
            Continue with Facebook
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Or register with email
            </span>
          </div>
        </div>
        
        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="pl-10 block w-full border border-gray-300 rounded-md py-2 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="John Smith"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-10 block w-full border border-gray-300 rounded-md py-2 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-10 pr-10 block w-full border border-gray-300 rounded-md py-2 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Password strength meter */}
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      passwordStrength <= 1 ? 'bg-red-500' : 
                      passwordStrength <= 3 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${(passwordStrength / 5) * 100}%` }}
                  ></div>
                </div>
                
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center">
                    {hasMinLength ? (
                      <Check className="text-green-500 h-3 w-3 mr-1" />
                    ) : (
                      <X className="text-red-500 h-3 w-3 mr-1" />
                    )}
                    <span>At least 8 characters</span>
                  </div>
                  <div className="flex items-center">
                    {hasUpperCase ? (
                      <Check className="text-green-500 h-3 w-3 mr-1" />
                    ) : (
                      <X className="text-red-500 h-3 w-3 mr-1" />
                    )}
                    <span>Uppercase letter</span>
                  </div>
                  <div className="flex items-center">
                    {hasLowerCase ? (
                      <Check className="text-green-500 h-3 w-3 mr-1" />
                    ) : (
                      <X className="text-red-500 h-3 w-3 mr-1" />
                    )}
                    <span>Lowercase letter</span>
                  </div>
                  <div className="flex items-center">
                    {hasNumber ? (
                      <Check className="text-green-500 h-3 w-3 mr-1" />
                    ) : (
                      <X className="text-red-500 h-3 w-3 mr-1" />
                    )}
                    <span>Number</span>
                  </div>
                  <div className="flex items-center">
                    {hasSpecialChar ? (
                      <Check className="text-green-500 h-3 w-3 mr-1" />
                    ) : (
                      <X className="text-red-500 h-3 w-3 mr-1" />
                    )}
                    <span>Special character</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={`pl-10 block w-full border rounded-md py-2 text-gray-900 focus:ring-blue-500 focus:border-blue-500 ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                )}
              </div>
            </div>
          </div>
          
          {/* reCAPTCHA component */}
          <div className="flex justify-center">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''}
              onChange={handleCaptchaChange}
            />
          </div>
          
          {verifyingCaptcha && (
            <div className="flex justify-center">
              <Loader2 className="animate-spin h-5 w-5 text-blue-600" />
              <span className="ml-2 text-sm text-gray-600">Verifying CAPTCHA...</span>
            </div>
          )}
          
          {captchaVerified && (
            <div className="text-center text-sm text-green-600">
              CAPTCHA verified
            </div>
          )}
          
          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              checked={agreedToTerms}
              onChange={e => setAgreedToTerms(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
              I agree to the{' '}
              <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                Privacy Policy
              </Link>
            </label>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isLoading || !captchaVerified || verifyingCaptcha || socialLoginInProgress}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense
export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
          <span className="mt-2 text-gray-600">Loading...</span>
        </div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}