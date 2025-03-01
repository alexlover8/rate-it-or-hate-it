'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, Check, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import ReCAPTCHA from "react-google-recaptcha";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, isLoading, error } = useAuth();
  
  // Form state
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isBotCheckPassed, setIsBotCheckPassed] = useState(false);
  const [botCheckStartTime, setBotCheckStartTime] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [inputTiming, setInputTiming] = useState<number[]>([]);
  
  // Form validation state
  const [formErrors, setFormErrors] = useState<{
    email?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  
  // Password strength
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    hasMinLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });
  
  // Track scroll events
  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(true);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Start bot check timer
  useEffect(() => {
    setBotCheckStartTime(Date.now());
    
    // Delayed bot check
    const botCheckTimer = setTimeout(() => {
      checkForBotBehavior();
    }, 5000);
    
    return () => clearTimeout(botCheckTimer);
  }, []);
  
  // Update form errors from auth provider
  useEffect(() => {
    if (error) {
      setFormErrors({ general: error });
    }
  }, [error]);
  
  // Handle CAPTCHA completion
  const handleCaptchaChange = (token: string | null) => {
    setCaptchaToken(token);
  };
  
  // Password strength checker
  useEffect(() => {
    const strength = {
      score: 0,
      hasMinLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[^A-Za-z0-9]/.test(password),
    };
    
    // Calculate score
    let score = 0;
    if (strength.hasMinLength) score++;
    if (strength.hasUppercase) score++;
    if (strength.hasLowercase) score++;
    if (strength.hasNumber) score++;
    if (strength.hasSpecialChar) score++;
    
    strength.score = score;
    setPasswordStrength(strength);
  }, [password]);
  
  // Track keypress timing for bot detection
  const handleKeyPress = () => {
    if (inputTiming.length < 10) {
      setInputTiming(prev => [...prev, Date.now()]);
    }
    setHasInteracted(true);
  };
  
  // Check for bot-like behavior
  const checkForBotBehavior = () => {
    const registrationTime = Date.now() - botCheckStartTime;
    
    // Human-like behavior checks
    const hasHumanTiming = registrationTime > 4000; // Spent at least 4 seconds on the page
    const hasNaturalInteraction = hasInteracted && hasScrolled;
    
    // Check keystroke patterns if we have enough data
    let hasNaturalTyping = true;
    if (inputTiming.length > 5) {
      // Calculate time between keystrokes
      const intervals = [];
      for (let i = 1; i < inputTiming.length; i++) {
        intervals.push(inputTiming[i] - inputTiming[i - 1]);
      }
      
      // Check for unnaturally consistent typing (bot behavior)
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const deviations = intervals.map(interval => Math.abs(interval - avgInterval));
      const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
      
      // Bots often have very consistent typing patterns
      hasNaturalTyping = avgDeviation > 50; // Humans have more varied timing
    }
    
    setIsBotCheckPassed(hasHumanTiming && hasNaturalInteraction && hasNaturalTyping);
  };
  
  // Form validation
  const validateForm = () => {
    const errors: {
      email?: string;
      username?: string;
      password?: string;
      confirmPassword?: string;
      general?: string;
    } = {};
    
    // Email validation
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Username validation
    if (!username) {
      errors.username = 'Username is required';
    } else if (username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }
    
    // Password validation
    if (!password) {
      errors.password = 'Password is required';
    } else if (passwordStrength.score < 3) {
      errors.password = 'Password is too weak';
    }
    
    // Confirm password validation
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    // Bot check
    if (!isBotCheckPassed && !captchaToken) {
      errors.general = 'Please complete the CAPTCHA verification';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Perform final bot check
    checkForBotBehavior();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await signUp(email, password, captchaToken || undefined);
      
      // Redirect to email verification page
      router.push('/verify-email');
    } catch {
      // Error is handled by the auth provider and set to the error state
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>
        
        {/* General error message */}
        {formErrors.general && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-sm text-red-700">{formErrors.general}</p>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            {/* Email field */}
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    formErrors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="user@example.com"
                />
              </div>
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>
            
            {/* Username field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    formErrors.username ? 'border-red-300' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="cooluser123"
                />
              </div>
              {formErrors.username && (
                <p className="mt-1 text-sm text-red-600">{formErrors.username}</p>
              )}
            </div>
            
            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className={`block w-full pl-10 pr-10 py-2 border ${
                    formErrors.password ? 'border-red-300' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
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
              {formErrors.password && (
                <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
              )}
              
              {/* Password strength meter */}
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${
                      passwordStrength.score < 2
                        ? 'bg-red-500'
                        : passwordStrength.score < 4
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  ></div>
                </div>
                
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center">
                    {passwordStrength.hasMinLength ? (
                      <Check className="h-3.5 w-3.5 text-green-500 mr-1" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-red-500 mr-1" />
                    )}
                    <span>At least 8 characters</span>
                  </div>
                  <div className="flex items-center">
                    {passwordStrength.hasUppercase ? (
                      <Check className="h-3.5 w-3.5 text-green-500 mr-1" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-red-500 mr-1" />
                    )}
                    <span>Uppercase letter</span>
                  </div>
                  <div className="flex items-center">
                    {passwordStrength.hasLowercase ? (
                      <Check className="h-3.5 w-3.5 text-green-500 mr-1" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-red-500 mr-1" />
                    )}
                    <span>Lowercase letter</span>
                  </div>
                  <div className="flex items-center">
                    {passwordStrength.hasNumber ? (
                      <Check className="h-3.5 w-3.5 text-green-500 mr-1" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-red-500 mr-1" />
                    )}
                    <span>Number</span>
                  </div>
                  <div className="flex items-center">
                    {passwordStrength.hasSpecialChar ? (
                      <Check className="h-3.5 w-3.5 text-green-500 mr-1" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-red-500 mr-1" />
                    )}
                    <span>Special character</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Confirm Password field */}
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    formErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="••••••••"
                />
              </div>
              {formErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
              )}
            </div>
          </div>
          
          {/* Terms and conditions */}
          <div className="flex items-center">
            <input
              id="terms-and-privacy"
              name="terms-and-privacy"
              type="checkbox"
              required
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="terms-and-privacy" className="ml-2 block text-sm text-gray-900">
              I agree to the{' '}
              <Link href="/terms" className="font-medium text-blue-600 hover:text-blue-500">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="font-medium text-blue-600 hover:text-blue-500">
                Privacy Policy
              </Link>
            </label>
          </div>
          
          {/* CAPTCHA if bot check failed */}
          {!isBotCheckPassed && (
            <div className="flex justify-center mt-4">
              <ReCAPTCHA
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'} // Test key if not set
                onChange={handleCaptchaChange}
              />
            </div>
          )}
          
          {/* Submit button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </div>
        </form>
        
        {/* Security notice */}
        <div className="mt-6 bg-blue-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1 md:flex md:justify-between">
              <p className="text-sm text-blue-700">
                We use advanced security measures to prevent bots. After sign up, we'll send a confirmation email to verify your account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}