import VotingButtons from '@/components/VotingButtons';

// Simulated fetch (replace with your API/database call)
async function getItem(id: string) {
  return {
    id,
    name: `Item ${id}`,
    description: 'Sample description.',
    loveCount: 100, // Placeholder vote counts
    hateCount: 30,
  };
}

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getItem(id);

  // Calculate percentages
  const totalVotes = item.loveCount + item.hateCount;
  const lovePercentage = totalVotes > 0 ? Math.round((item.loveCount / totalVotes) * 100) : 0;
  const hatePercentage = 100 - lovePercentage;

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">Vote on {item.name}</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-2">{item.name}</h2>
          <p className="text-gray-600 mb-4">{item.description}</p>
          <VotingButtons itemId={item.id} />
          <div className="mt-6">
            <h3 className="text-xl font-bold mb-2">Vote Results</h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <p className="text-green-500 font-bold">{lovePercentage}% Rate It</p>
                <div className="bg-green-200 h-2 rounded-full">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${lovePercentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-red-500 font-bold">{hatePercentage}% Hate It</p>
                <div className="bg-red-200 h-2 rounded-full">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${hatePercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
