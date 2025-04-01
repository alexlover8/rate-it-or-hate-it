'use client';

import { useState } from 'react';
import { Loader2, Search, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { FormData } from '../page';

interface AutoDescriptionProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

export default function AutoDescription({ formData, setFormData }: AutoDescriptionProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateDescription = async () => {
    if (!formData.name || formData.name.length < 3) {
      toast({
        title: "Too short",
        description: "Please enter a longer item name to generate a description.",
        type: "error",
      });
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // Make a request to your backend that will use OpenAI
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: formData.name }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to generate description');
      }
      
      if (data.description) {
        setFormData(prev => ({ ...prev, description: data.description }));
        toast({
          title: "Description generated",
          description: "Successfully generated a description for your item.",
          type: "success",
        });
      } else {
        throw new Error('No description generated');
      }
    } catch (error: any) {
      console.error('Error generating description:', error);
      setError(error.message || 'Failed to generate description');
      toast({
        title: "Generation failed",
        description: error.message || "Could not generate a description. Please try again or enter manually.",
        type: "error",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Description *
        </label>
        <button
          type="button"
          onClick={generateDescription}
          disabled={isGenerating}
          className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800/30 flex items-center"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Search className="h-3 w-3 mr-1" />
              Auto-Generate
            </>
          )}
        </button>
      </div>
      
      {/* Show error message if there is one */}
      {error && (
        <div className="mb-2 text-xs text-red-600 dark:text-red-400 flex items-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}