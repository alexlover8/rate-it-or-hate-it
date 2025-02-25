'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = () => {
    console.log('Searching for:', query);
    router.push(`/search?query=${encodeURIComponent(query)}`);
  };

  return (
    <div className="flex items-center justify-center my-6">
      <input
        type="text"
        className="border border-gray-300 rounded-l-full p-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Search products or companies..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button
        onClick={handleSearch}
        className="bg-blue-600 text-white px-4 py-2 rounded-r-full hover:bg-blue-700 transition"
      >
        Search
      </button>
    </div>
  );
}

