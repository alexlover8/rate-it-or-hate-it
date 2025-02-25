import SearchBar from '@/components/SearchBar';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-10">
        <h1 className="text-4xl font-extrabold text-center text-blue-600 mb-6">
          Trending Now
        </h1>
        <SearchBar /> {/* <-- New search bar added here */}
        <p className="text-center text-gray-700 mb-10">
          Explore what the world loves or hates today!
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow hover:shadow-md transition p-6">
            <h2 className="text-2xl font-bold mb-2">Example Item</h2>
            <p className="text-gray-600">
              This is an example of a trending item. Click to learn more!
            </p>
          </div>
          {/* Additional cards here */}
        </div>
      </div>
    </div>
  );
}
