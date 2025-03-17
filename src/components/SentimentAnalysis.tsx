'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Meh as MehIcon, BarChart2, Loader2, AlertTriangle } from 'lucide-react';

type SentimentAnalysisProps = {
  itemId: string;
  comments: Array<{
    id: string;
    text: string;
  }>;
};

type SentimentResult = {
  sentiment: 'positive' | 'neutral' | 'negative';
  positivePercentage: number;
  neutralPercentage: number;
  negativePercentage: number;
  summary: string;
  keyPositive: string[];
  keyNeutral: string[];
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
  
  // Count positive/neutral/negative words as a simple proxy
  const positiveWords = ['love', 'great', 'good', 'excellent', 'amazing', 'awesome', 'best', 'like', 'fantastic', 'brilliant'];
  const neutralWords = ['okay', 'fine', 'meh', 'average', 'decent', 'mediocre', 'passable', 'so-so', 'neutral', 'moderate'];
  const negativeWords = ['hate', 'bad', 'terrible', 'awful', 'worst', 'dislike', 'poor', 'horrible', 'disappointing', 'useless'];
  
  let positiveCount = 0;
  let neutralCount = 0;
  let negativeCount = 0;
  
  commentTexts.forEach(text => {
    const lowerText = text.toLowerCase();
    
    // Track which category had the most matches for this comment
    let commentPositive = 0;
    let commentNeutral = 0;
    let commentNegative = 0;
    
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) commentPositive++;
    });
    
    neutralWords.forEach(word => {
      if (lowerText.includes(word)) commentNeutral++;
    });
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) commentNegative++;
    });
    
    // Increment the highest sentiment count for this comment
    // This prevents one comment with many positive words from skewing results too much
    if (commentPositive > commentNeutral && commentPositive > commentNegative) {
      positiveCount++;
    } else if (commentNegative > commentPositive && commentNegative > commentNeutral) {
      negativeCount++;
    } else if (commentNeutral > 0) {
      neutralCount++;
    } else if (commentPositive > 0 || commentNegative > 0) {
      // If tie between positive and negative, count as neutral
      neutralCount++;
    }
  });
  
  const total = positiveCount + neutralCount + negativeCount || 1; // Avoid division by zero
  
  // Determine the dominant sentiment
  let sentiment: 'positive' | 'neutral' | 'negative';
  if (positiveCount > neutralCount && positiveCount > negativeCount) {
    sentiment = 'positive';
  } else if (negativeCount > positiveCount && negativeCount > neutralCount) {
    sentiment = 'negative';
  } else {
    sentiment = 'neutral';
  }
  
  // Calculate percentages with integer rounding that sums to 100%
  let positivePercentage = Math.floor((positiveCount / total) * 100);
  let neutralPercentage = Math.floor((neutralCount / total) * 100);
  let negativePercentage = Math.floor((negativeCount / total) * 100);
  
  // Adjust for rounding errors to ensure they sum to 100%
  const sum = positivePercentage + neutralPercentage + negativePercentage;
  if (sum < 100) {
    // Add the difference to the largest percentage
    if (positiveCount >= neutralCount && positiveCount >= negativeCount) {
      positivePercentage += (100 - sum);
    } else if (neutralCount >= positiveCount && neutralCount >= negativeCount) {
      neutralPercentage += (100 - sum);
    } else {
      negativePercentage += (100 - sum);
    }
  }
  
  return {
    sentiment,
    positivePercentage,
    neutralPercentage,
    negativePercentage,
    summary: `Based on ${comments.length} comments, the overall sentiment is ${sentiment}. ${
      sentiment === 'positive' 
        ? 'People generally like this item and mention positive aspects.'
        : sentiment === 'negative'
        ? 'People seem to dislike this item and mention negative aspects.'
        : 'People have mixed or neutral opinions about this item.'
    }`,
    keyPositive: ['Feature 1', 'Feature 2', 'Feature 3'].slice(0, Math.min(3, positiveCount)),
    keyNeutral: ['Average aspect 1', 'Average aspect 2', 'Average aspect 3'].slice(0, Math.min(3, neutralCount)),
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
  
  // Get color based on sentiment type
  const getSentimentColor = (type: 'positive' | 'neutral' | 'negative') => {
    switch (type) {
      case 'positive': return 'text-blue-600 dark:text-blue-400';
      case 'neutral': return 'text-yellow-600 dark:text-yellow-400';
      case 'negative': return 'text-red-600 dark:text-red-400';
      default: return '';
    }
  };
  
  // Don't show anything if there are too few comments
  if (comments.length < 3 && !isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold flex items-center mb-4">
          <BarChart2 className="mr-2 h-5 w-5" />
          MEHtrics Analysis
        </h2>
        <div className="flex items-center justify-center p-4 text-gray-500 dark:text-gray-400">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <p>Not enough comments for sentiment analysis (minimum 3 required).</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700 transition-all duration-200">
      <h2 className="text-xl font-semibold flex items-center mb-4 text-gray-900 dark:text-gray-100">
        <BarChart2 className="mr-2 h-5 w-5" />
        MEHtrics Analysis
      </h2>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="animate-spin h-8 w-8 text-blue-500 mb-2" />
          <span className="text-gray-600 dark:text-gray-300">Analyzing sentiment in comments...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 p-4 rounded-lg flex items-start">
          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      ) : analysis ? (
        <div>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{analysis.summary}</p>
          
          <div className="grid gap-4 mb-8">
            {/* Rate It - Positive */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-blue-600 dark:text-blue-400 font-medium flex items-center">
                  <ThumbsUp className="h-5 w-5 mr-2" />
                  Rate It
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                  {analysis.positivePercentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${analysis.positivePercentage}%` }}
                ></div>
              </div>
              {analysis.keyPositive.length > 0 && (
                <div className="mt-3 pl-2">
                  <h4 className="font-medium text-blue-700 dark:text-blue-300 text-sm mb-1">Key Points:</h4>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 text-sm">
                    {analysis.keyPositive.map((point, index) => (
                      <li key={`pos-${index}`}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Meh - Neutral */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-yellow-600 dark:text-yellow-400 font-medium flex items-center">
                  <MehIcon className="h-5 w-5 mr-2" />
                  Meh
                </span>
                <span className="text-yellow-600 dark:text-yellow-400 font-bold text-lg">
                  {analysis.neutralPercentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-yellow-500 h-3 rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${analysis.neutralPercentage}%` }}
                ></div>
              </div>
              {analysis.keyNeutral.length > 0 && (
                <div className="mt-3 pl-2">
                  <h4 className="font-medium text-yellow-700 dark:text-yellow-300 text-sm mb-1">Key Points:</h4>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 text-sm">
                    {analysis.keyNeutral.map((point, index) => (
                      <li key={`neu-${index}`}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Hate It - Negative */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-red-600 dark:text-red-400 font-medium flex items-center">
                  <ThumbsDown className="h-5 w-5 mr-2" />
                  Hate It
                </span>
                <span className="text-red-600 dark:text-red-400 font-bold text-lg">
                  {analysis.negativePercentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-red-500 h-3 rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${analysis.negativePercentage}%` }}
                ></div>
              </div>
              {analysis.keyNegative.length > 0 && (
                <div className="mt-3 pl-2">
                  <h4 className="font-medium text-red-700 dark:text-red-300 text-sm mb-1">Key Points:</h4>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 text-sm">
                    {analysis.keyNegative.map((point, index) => (
                      <li key={`neg-${index}`}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <strong>Note:</strong> MEHtrics analysis is based on AI sentiment detection in comments. Results are for informational purposes only.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}