import { capitalize } from 'lodash'; // Optional: for capitalizing the category name

// Mock function to simulate fetching items by category slug
async function getItemsByCategory(slug: string) {
  const items = {
    electronics: [
      { id: 1, name: 'Smartphone', description: 'Latest model with high-res camera.' },
      { id: 2, name: 'Laptop', description: 'Powerful machine for work and play.' },
    ],
    books: [
      { id: 3, name: 'Novel', description: 'A gripping tale of adventure.' },
      { id: 4, name: 'Biography', description: 'The life story of a famous figure.' },
    ],
  };
  return items[slug] || []; // Return items for the slug, or an empty array if none exist
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; // Await the promise to get the slug
  const categoryName = capitalize(slug.replace('-', ' ')); // Convert slug to readable name (e.g., "electronics" -> "Electronics")
  const items = await getItemsByCategory(slug); // Fetch items for the category

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-blue-600 mb-6 capitalize">
          {categoryName}
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.length > 0 ? (
            items.map(item => (
              <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-md transition p-6">
                <h2 className="text-2xl font-bold mb-2">{item.name}</h2>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-600">No items found for this category.</p>
          )}
        </div>
      </div>
    </div>
  );
}
  

  