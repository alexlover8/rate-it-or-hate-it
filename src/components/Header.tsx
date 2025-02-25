import Link from 'next/link';

const categories = [
  { name: 'Companies & Brands', slug: 'companies-brands' },
  { name: 'Products', slug: 'products' },
  { name: 'Movies', slug: 'movies' },
  { name: 'Books', slug: 'books' },
  { name: 'TV Shows', slug: 'tv-shows' },
  { name: 'Cars', slug: 'cars' },
  { name: 'Tech & Apps', slug: 'tech-apps' },
  { name: 'Food & Restaurants', slug: 'food-restaurants' },
  { name: 'Celebrities & Influencers', slug: 'celebrities' },
  { name: 'Video Games & Consoles', slug: 'video-games' },
  { name: 'Trends & Social Issues', slug: 'trends-social' },
  { name: 'Sports Teams & Events', slug: 'sports-teams' },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white bg-opacity-95 shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row sm:justify-between items-center">
        <Link href="/">
          <span className="text-3xl font-bold text-blue-600 flex items-center">
            <span className="mr-2 text-4xl">🔥</span>
            Rate It or Hate It
          </span>
        </Link>
        <nav className="mt-3 sm:mt-0">
          <ul className="flex flex-wrap gap-4">
            {categories.map((cat) => (
              <li key={cat.slug}>
                <Link href={`/category/${cat.slug}`}>
                  <span className="text-gray-700 hover:text-blue-600 transition-colors cursor-pointer">
                    {cat.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}


