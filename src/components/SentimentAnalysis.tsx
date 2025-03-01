'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, BarChart2, Loader2 } from 'lucide-react';

type SentimentAnalysisProps = {
  itemId: string;
  comments: Array<{
    id: string;
    text: string;
  }>;
};

type SentimentResult = {
  sentiment: 'positive' | 'negative' | 'neutral';
  positivePercentage: number;
  negativePercentage: number;
  summary: string;
  keyPositive: string[];
  keyNegative: string[];
};

// This is a placeholder for the actual AI sentiment analysis
// In a real implementation, you would call an API endpoint
// that uses a language model to analyze the comments
async function analyzeSentiment(comments: Array<{ id: string; text: string }>): Promise<SentimentResult> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // For demonstration, we'll generate a simple analysis
  // In a real scenario, this would come from an AI model
  const commentTexts = comments.map(c => c.text);
  
  // Count positive/negative words as a simple proxy
  const positiveWords = ['love', 'great', 'good', 'excellent', 'amazing', 'awesome', 'best', 'like'];
  const negativeWords = ['hate', 'bad', 'terrible', 'awful', 'worst', 'dislike', 'poor', 'horrible'];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  commentTexts.forEach(text => {
    const lowerText = text.toLowerCase();
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveCount++;
    });
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeCount++;
    });
  });
  
  const total = positiveCount + negativeCount || 1; // Avoid division by zero
  const sentiment = positiveCount > negativeCount ? 'positive' : 
                    negativeCount > positiveCount ? 'negative' : 'neutral';
  
  return {
    sentiment,
    positivePercentage: Math.round((positiveCount / total) * 100),
    negativePercentage: Math.round((negativeCount / total) * 100),
    summary: `Based on ${comments.length} comments, the overall sentiment is ${sentiment}. ${
      sentiment === 'positive' 
        ? 'People generally like this item and mention positive aspects.'
        : sentiment === 'negative'
        ? 'People seem to dislike this item and mention negative aspects.'
        : 'People have mixed opinions about this item.'
    }`,
    keyPositive: ['Feature 1', 'Feature 2', 'Feature 3'].slice(0, Math.min(3, positiveCount)),
    keyNegative: ['Issue 1', 'Issue 2', 'Issue 3'].slice(0, Math.min(3, negativeCount)),
  };
}

export default function SentimentAnalysis({ itemId, comments }: SentimentAnalysisProps) {
  const [analysis, setAnalysis] = useState<SentimentResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Only analyze if we have enough comments
    if (comments.length < 3) {
      setIsLoading(false);
      return;
    }
    
    const performAnalysis = async () => {
      try {
        // Call the analysis function using the itemId and comments
        const result = await analyzeSentiment(comments);
        setAnalysis(result);
      } catch (err) {
        console.error('Error analyzing sentiment:', err);
        setError('Failed to analyze comments.');
      } finally {
        setIsLoading(false);
      }
    };
    
    performAnalysis();
  }, [comments, itemId]);
  
  // Don't show anything if there are too few comments
  if (comments.length < 3 && !isLoading) {
    return null;
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold flex items-center mb-4">
        <BarChart2 className="mr-2 h-5 w-5" />
        Comment Analysis
      </h2>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin h-8 w-8 text-blue-500 mr-2" />
          <span className="text-gray-600 dark:text-gray-300">Analyzing comments...</span>
        </div>
      ) : error ? (
        <div className="text-red-500 py-4">{error}</div>
      ) : analysis ? (
        <div>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{analysis.summary}</p>
          
          <div className="mb-6">
            <div className="flex justify-between mb-1">
              <span className="text-green-600 dark:text-green-400 font-medium flex items-center">
                <ThumbsUp className="h-4 w-4 mr-1" />
                Positive
              </span>
              <span className="text-green-600 dark:text-green-400 font-bold">{analysis.positivePercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-green-500 h-2.5 rounded-full"
                style={{ width: `${analysis.positivePercentage}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between mb-1 mt-2">
              <span className="text-red-600 dark:text-red-400 font-medium flex items-center">
                <ThumbsDown className="h-4 w-4 mr-1" />
                Negative
              </span>
              <span className="text-red-600 dark:text-red-400 font-bold">{analysis.negativePercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-red-500 h-2.5 rounded-full"
                style={{ width: `${analysis.negativePercentage}%` }}
              ></div>
            </div>
          </div>
          
          {analysis.keyPositive.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Key Positive Points:</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 pl-2">
                {analysis.keyPositive.map((point, index) => (
                  <li key={`pos-${index}`}>{point}</li>
                ))}
              </ul>
            </div>
          )}
          
          {analysis.keyNegative.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Key Negative Points:</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 pl-2">
                {analysis.keyNegative.map((point, index) => (
                  <li key={`neg-${index}`}>{point}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}