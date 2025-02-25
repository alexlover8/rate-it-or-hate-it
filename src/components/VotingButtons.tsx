'use client';

import { useState } from 'react';
import { FaHeart, FaHeartBroken } from 'react-icons/fa';

export default function VotingButtons({ itemId }: { itemId: string }) {
  const [voted, setVoted] = useState<'rate' | 'hate' | null>(null);

  const handleVote = async (vote: 'rate' | 'hate') => {
    console.log(`Voted ${vote} for item ${itemId}`); // Replace with API call
    setVoted(vote);
  };

  return (
    <div className="flex gap-4">
      <button
        onClick={() => handleVote('rate')}
        className={`flex-1 bg-green-500 text-white rounded-lg p-3 hover:bg-green-600 transition flex items-center justify-center ${
          voted === 'rate' ? 'opacity-50' : ''
        }`}
        disabled={voted !== null}
      >
        <FaHeart className="mr-2" /> Rate It
      </button>
      <button
        onClick={() => handleVote('hate')}
        className={`flex-1 bg-red-500 text-white rounded-lg p-3 hover:bg-red-600 transition flex items-center justify-center ${
          voted === 'hate' ? 'opacity-50' : ''
        }`}
        disabled={voted !== null}
      >
        <FaHeartBroken className="mr-2" /> Hate It
      </button>
    </div>
  );
}