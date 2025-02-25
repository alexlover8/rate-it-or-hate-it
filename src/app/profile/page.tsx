import Image from 'next/image';

export default function ProfilePage() {
  // Placeholder user data – later, populate this from your auth system
  const user = {
    username: 'CoolUser123',
    email: 'user@example.com',
    profilePicture: '/profile-placeholder.png', // Place this image in your public folder
    voteCount: 15,
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">Your Profile</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Image
              src={user.profilePicture}
              alt="Profile Picture"
              width={80}
              height={80}
              className="rounded-full"
            />
            <div className="ml-4">
              <h2 className="text-2xl font-bold">{user.username}</h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-xl font-bold mb-2">Your Votes</h3>
            <p className="text-gray-600">You have voted on {user.voteCount} items.</p>
          </div>
          {/* Additional profile features can go here */}
        </div>
      </div>
    </div>
  );
}
