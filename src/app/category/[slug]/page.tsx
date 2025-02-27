import { capitalize } from 'lodash';
import Link from 'next/link';

// Define type for individual item
type Item = {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
};

// Define a type for the items object with index signature
type CategoryItems = {
  [key: string]: Item[];
};

// Mock function to simulate fetching items by category slug
async function getItemsByCategory(slug: string): Promise<Item[]> {
  // This would be replaced with a real API call or database query
  const items: CategoryItems = {
    electronics: [
      { 
        id: 1, 
        name: 'Smartphone', 
        description: 'Latest model with high-res camera.',
        imageUrl: '/images/smartphone.jpg'
      },
      { 
        id: 2, 
        name: 'Laptop', 
        description: 'Powerful machine for work and play.',
        imageUrl: '/images/laptop.jpg'
      },
      { 
        id: 5, 
        name: 'Smart Watch', 
        description: 'Track your fitness and stay connected.',
        imageUrl: '/images/smartwatch.jpg'
      },
    ],
    books: [
      { 
        id: 3, 
        name: 'Novel', 
        description: 'A gripping tale of adventure.',
        imageUrl: '/images/novel.jpg'
      },
      { 
        id: 4, 
        name: 'Biography', 
        description: 'The life story of a famous figure.',
        imageUrl: '/images/biography.jpg'
      },
    ],
    companies: [
      { 
        id: 6, 
        name: 'Tech Giant', 
        description: 'Leading innovation in technology.',
        imageUrl: '/images/techcompany.jpg'
      },
      { 
        id: 7, 
        name: 'Retail Chain', 
        description: 'Your one-stop shop for everything.',
        imageUrl: '/images/retail.jpg'
      },
    ],
  };
  
  return items[slug] || []; // Return items for the slug, or an empty array if none exist
}

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const items = await getItemsByCategory(slug);
  const categoryName = capitalize(slug);

  // Handle case where category doesn't exist
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Category Not Found</h1>
        <p className="mb-4">Sorry, we couldn't find any items in the "{slug}" category.</p>
        <Link href="/" className="text-blue-500 hover:underline">
          Return to home page
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{categoryName}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <Link href={`/item/${item.id}`} key={item.id}>
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full">
              {item.imageUrl ? (
                <div className="h-48 bg-gray-200 relative">
                  <div 
                    className="w-full h-full bg-center bg-cover" 
                    style={{ backgroundImage: `url(${item.imageUrl})` }}
                  />
                </div>
              ) : (
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No image available</span>
                </div>
              )}
              
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">{item.name}</h2>
                <p className="text-gray-600">{item.description}</p>
                
                <div className="mt-4 flex justify-between items-center">
                  <div className="bg-gray-100 h-2 rounded-full flex-grow mr-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${Math.random() * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500">Rate It</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}