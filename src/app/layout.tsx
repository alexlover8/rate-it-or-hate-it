import './globals.css'; // This will link to the globals.css file you'll create
import Header from '@/components/Header';
import { Poppins } from 'next/font/google';

// Load Poppins font with Next.js optimized font loading
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
});

// Enhanced metadata for SEO and social sharing
export const metadata = {
  title: 'Love It or Hate It',
  description: 'Vote, vent, and see what the world loves or hates.',
  openGraph: {
    title: 'Love It or Hate It',
    description: 'Join the conversation and vote on your favorite products.',
    url: 'https://yourdomain.com', // Replace with your actual domain
    image: '/og-image.jpg', // Add this image to your public folder
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${poppins.variable} font-poppins bg-gray-50 text-gray-800 antialiased`}>
        <Header />
        <main className="container mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}