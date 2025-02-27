import Link from 'next/link';
import { Heart, Twitter, Instagram, Github, Mail, Linkedin } from 'lucide-react';

export default function Footer() {
  // Current year for copyright
  const currentYear = new Date().getFullYear();
  
  // Category links
  const categories = [
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Books', slug: 'books' },
    { name: 'Movies', slug: 'movies' },
    { name: 'Companies', slug: 'companies' },
    { name: 'TV Shows', slug: 'tv-shows' },
    { name: 'Tech & Apps', slug: 'tech-apps' },
  ];
  
  // Helper links
  const helperLinks = [
    { name: 'About Us', href: '/about' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'FAQ', href: '/faq' },
  ];
  
  // Social media links
  const socialLinks = [
    { name: 'Twitter', icon: Twitter, href: 'https://twitter.com' },
    { name: 'Instagram', icon: Instagram, href: 'https://instagram.com' },
    { name: 'GitHub', icon: Github, href: 'https://github.com' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com' },
  ];

  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        {/* Footer Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand and Description */}
          <div>
            <Link href="/" className="flex items-center mb-4">
              <Heart className="h-6 w-6 text-red-500 mr-2" />
              <span className="text-xl font-bold">
                Rate It <span className="text-red-500">or</span> Hate It
              </span>
            </Link>
            <p className="text-gray-400 mb-6">
              The platform where your opinion shapes the trends. Vote on products and companies to see what the world loves or hates.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((link) => (
                <a 
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label={link.name}
                >
                  <link.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
          
          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-gray-800 pb-2">
              Popular Categories
            </h3>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link 
                    href={`/category/${category.slug}`}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link 
                  href="/categories"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  View All Categories
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Help & Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-gray-800 pb-2">
              Help & Information
            </h3>
            <ul className="space-y-2">
              {helperLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Newsletter Signup */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-gray-800 pb-2">
              Stay Updated
            </h3>
            <p className="text-gray-400 mb-4">
              Subscribe to our newsletter for the latest trends and popular items.
            </p>
            <form className="flex flex-col space-y-2">
              <input 
                type="email" 
                placeholder="Your email address" 
                aria-label="Email address"
                className="bg-gray-800 border border-gray-700 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
        
        {/* Footer Bottom Section */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            © {currentYear} Rate It or Hate It. All rights reserved.
          </p>
          
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href="/privacy" className="text-gray-400 text-sm hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-gray-400 text-sm hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/cookies" className="text-gray-400 text-sm hover:text-white transition-colors">
              Cookies
            </Link>
            <Link href="/sitemap" className="text-gray-400 text-sm hover:text-white transition-colors">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}