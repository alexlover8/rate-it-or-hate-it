'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, HeartOff, Settings, User, Edit, Upload, ChevronDown } from 'lucide-react';

// Mock vote history data - will be replaced with real data from your backend
const mockVoteHistory = [
  { id: 1, itemName: 'Smartphone', itemId: 1, vote: 'rate', date: '2023-11-01' },
  { id: 2, itemName: 'Biography Book', itemId: 4, vote: 'hate', date: '2023-10-28' },
  { id: 3, itemName: 'Laptop', itemId: 2, vote: 'rate', date: '2023-10-25' },
  { id: 4, itemName: 'Tech Giant Company', itemId: 6, vote: 'hate', date: '2023-10-20' },
];

export default function ProfilePage() {
  // State for user data - will be replaced with auth context
  const [user, setUser] = useState({
    username: 'CoolUser123',
    email: 'user@example.com',
    profilePicture: '/profile-placeholder.png', 
    voteCount: 15,
    joinDate: '2023-09-15',
    bio: 'I love rating products and sharing my opinions!',
  });

  // State for active tab
  const [activeTab, setActiveTab] = useState('votes');
  
  // State for image upload
  const [isUploading, setIsUploading] = useState(false);
  
  // Handler for profile image upload
  const handleImageUpload = () => {
    // Simulate upload process
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      // Would update user profile picture with the uploaded image URL from your storage
      setUser({...user, profilePicture: '/profile-placeholder.png'});
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-32 relative">
            {/* Edit cover photo button - would be implemented with your storage solution */}
            <button className="absolute right-4 bottom-4 bg-white bg-opacity-80 rounded-full p-2 hover:bg-opacity-100 transition-all">
              <Edit size={16} />
            </button>
          </div>
          
          <div className="px-6 pb-6 relative">
            {/* Profile picture with upload functionality */}
            <div className="relative -mt-16 mb-4 inline-block">
              <div className="h-32 w-32 rounded-full border-4 border-white overflow-hidden bg-gray-200 relative">
                <Image
                  src={user.profilePicture}
                  alt="Profile Picture"
                  fill
                  sizes="128px"
                  className="object-cover"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-t-blue-500 border-white border-opacity-30 rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <button 
                onClick={handleImageUpload}
                className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-md transition-colors"
              >
                <Upload size={16} />
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{user.username}</h1>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-gray-500 text-sm">Member since {user.joinDate}</p>
              </div>
              
              <div className="mt-4 md:mt-0 flex items-center space-x-2">
                <div className="bg-gray-100 rounded-lg px-3 py-1 text-sm flex items-center">
                  <span className="text-gray-700 font-medium">{user.voteCount}</span>
                  <span className="ml-1 text-gray-500">votes</span>
                </div>
                <button className="bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1 text-sm flex items-center transition-colors">
                  <Settings size={14} className="mr-1" />
                  <span>Settings</span>
                </button>
              </div>
            </div>
            
            {user.bio && (
              <p className="mt-4 text-gray-700">{user.bio}</p>
            )}
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('votes')}
              className={`px-4 py-3 font-medium flex items-center ${
                activeTab === 'votes' 
                  ? 'text-blue-600 border-b-2 border-blue-500' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Heart size={16} className={`mr-2 ${activeTab === 'votes' ? 'text-blue-500' : 'text-gray-400'}`} />
              Your Votes
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-3 font-medium flex items-center ${
                activeTab === 'settings' 
                  ? 'text-blue-600 border-b-2 border-blue-500' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User size={16} className={`mr-2 ${activeTab === 'settings' ? 'text-blue-500' : 'text-gray-400'}`} />
              Account Settings
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'votes' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Your Vote History</h2>
                {mockVoteHistory.length > 0 ? (
                  <div className="divide-y">
                    {mockVoteHistory.map(vote => (
                      <div key={vote.id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center">
                          {vote.vote === 'rate' ? (
                            <Heart size={18} className="text-red-500 mr-3" />
                          ) : (
                            <HeartOff size={18} className="text-gray-500 mr-3" />
                          )}
                          <div>
                            <a href={`/item/${vote.itemId}`} className="font-medium hover:text-blue-600">
                              {vote.itemName}
                            </a>
                            <p className="text-xs text-gray-500">{vote.date}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          vote.vote === 'rate' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {vote.vote === 'rate' ? 'Rate It' : 'Hate It'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">You haven't voted on anything yet.</p>
                    <a href="/" className="mt-2 inline-block text-blue-500 hover:underline">
                      Discover items to rate
                    </a>
                  </div>
                )}
                
                {mockVoteHistory.length > 0 && (
                  <div className="mt-4 text-center">
                    <button className="text-blue-500 hover:text-blue-700 flex items-center mx-auto">
                      <span>View more</span>
                      <ChevronDown size={16} className="ml-1" />
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Account Settings</h2>
                <form className="space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={user.username}
                      onChange={(e) => setUser({...user, username: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={user.email}
                      onChange={(e) => setUser({...user, email: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={user.bio}
                      onChange={(e) => setUser({...user, bio: e.target.value})}
                    />
                  </div>
                  
                  <div className="pt-2">
                    <button
                      type="button"
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}