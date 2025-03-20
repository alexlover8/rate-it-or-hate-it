'use client';

import Link from 'next/link';
import { ThumbsUp, ThumbsDown, Meh, Twitter, Instagram, Github, Linkedin, ChevronRight, Mail, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function Footer() {
  // Current year for copyright
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Category links
  const categories = [
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Apparel', slug: 'apparel' },
    { name: 'Home & Kitchen', slug: 'home-kitchen' },
    { name: 'Beauty & Personal Care', slug: 'beauty-personal-care' },
    { name: 'Sports & Outdoors', slug: 'sports-outdoors' },
    { name: 'Automotive', slug: 'automotive' },
  ];
  
  // Popular sections
  const popularSections = [
    { name: 'Trending Items', href: '/trending' },
    { name: 'Recent Additions', href: '/recent' },
    { name: 'Hot Debates', href: '/controversial' },
    { name: 'Most Rated', href: '/most-rated' },
    { name: 'Most Hated', href: '/most-hated' },
  ];
  
  // Helper links updated to include new legal pages
  const helperLinks = [
    { name: 'About Us', href: '/about' },
    { name: 'Privacy Policy', href: '/privacy-policy' },
    { name: 'Terms of Service', href: '/terms-of-service' },
    { name: 'Fair Use Policy', href: '/fair-use' },
    { name: 'Cookie Policy', href: '/cookie-policy' },
    { name: 'FAQ', href: '/faqs' },
    { name: 'Contact Us', href: '/contact' },
  ];
  
  // Social media links
  const socialLinks = [
    { name: 'Twitter', icon: Twitter, href: 'https://twitter.com' },
    { name: 'Instagram', icon: Instagram, href: 'https://instagram.com' },
    { name: 'GitHub', icon: Github, href: 'https://github.com' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com' },
  ];

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) return;
    
    setLoading(true);
    
    try {
      // In a real app, you would send this to your API
      // const response = await fetch('/api/newsletter', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email }),
      // });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setSubscribed(true);
      setEmail('');
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-white pt-16 pb-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Footer Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand and Description */}
          <div>
            <Link href="/" className="flex items-center mb-4">
              <div className="flex items-center">
                <ThumbsUp className="h-5 w-5 text-blue-500" />
                <Meh className="h-5 w-5 mx-1 text-yellow-500" />
                <ThumbsDown className="h-5 w-5 text-red-500 mr-2" />
              </div>
              <span className="text-xl font-bold">
                Rate It <Meh className="inline h-4 w-4 text-yellow-500 mx-1" /> Hate It
              </span>
            </Link>
            <p className="text-gray-400 mb-6">
              The platform where your opinion shapes the trends. Express what you love, feel neutral about, or hate to see what the world thinks.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((link) => (
                <a 
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors bg-gray-800 p-2 rounded-full hover:bg-gray-700"
                  aria-label={link.name}
                >
                  <link.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
          
          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-gray-800 pb-2 flex items-center">
              <span className="bg-gradient-to-r from-blue-500 to-blue-600 w-1.5 h-5 rounded-full mr-2"></span>
              Popular Categories
            </h3>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.slug} className="group">
                  <Link 
                    href={`/category/${category.slug}`}
                    className="text-gray-400 hover:text-white transition-colors flex items-center"
                  >
                    <ChevronRight className="h-3 w-3 mr-2 text-gray-600 group-hover:text-blue-500 transition-colors" />
                    {category.name}
                  </Link>
                </li>
              ))}
              <li className="group pt-2">
                <Link 
                  href="/category/all"
                  className="text-blue-400 hover:text-blue-300 transition-colors flex items-center font-medium"
                >
                  <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                  View All Categories
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Popular Sections */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-gray-800 pb-2 flex items-center">
              <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 w-1.5 h-5 rounded-full mr-2"></span>
              Popular Sections
            </h3>
            <ul className="space-y-2">
              {popularSections.map((section) => (
                <li key={section.name} className="group">
                  <Link 
                    href={section.href}
                    className="text-gray-400 hover:text-white transition-colors flex items-center"
                  >
                    <ChevronRight className="h-3 w-3 mr-2 text-gray-600 group-hover:text-yellow-500 transition-colors" />
                    {section.name}
                  </Link>
                </li>
              ))}
              <li className="pt-2 group">
                <Link 
                  href="/add-item"
                  className="text-blue-400 hover:text-blue-300 transition-colors flex items-center font-medium"
                >
                  <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                  Add New Item
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Newsletter Signup */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-gray-800 pb-2 flex items-center">
              <span className="bg-gradient-to-r from-red-500 to-red-600 w-1.5 h-5 rounded-full mr-2"></span>
              Stay Updated
            </h3>
            <p className="text-gray-400 mb-4">
              Subscribe to our newsletter for the latest trends and updates on what people are rating or hating.
            </p>
            {subscribed ? (
              <div className="bg-green-900/30 border border-green-800 text-green-200 rounded-lg p-4 text-sm">
                <p className="font-medium">Thanks for subscribing!</p>
                <p className="mt-1 text-green-300">We'll keep you updated with the latest trends.</p>
              </div>
            ) : (
              <form className="flex flex-col space-y-2" onSubmit={handleSubscribe}>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <input 
                    type="email" 
                    placeholder="Your email address" 
                    aria-label="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 w-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-80 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Subscribing...
                    </>
                  ) : (
                    'Subscribe'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
        
        {/* Helper Links */}
        <div className="border-t border-gray-800 pt-8 pb-6">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
            {helperLinks.map((link) => (
              <Link 
                key={link.name}
                href={link.href}
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
        
        {/* Footer Bottom Section */}
        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            © {currentYear} Rate It or Hate It. All rights reserved.
          </p>
          
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href="/privacy-policy" className="text-gray-500 text-xs hover:text-gray-400 transition-colors">
              Privacy
            </Link>
            <Link href="/terms-of-service" className="text-gray-500 text-xs hover:text-gray-400 transition-colors">
              Terms
            </Link>
            <Link href="/cookie-policy" className="text-gray-500 text-xs hover:text-gray-400 transition-colors">
              Cookies
            </Link>
            <Link href="/sitemap" className="text-gray-500 text-xs hover:text-gray-400 transition-colors">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
