'use client';

import { useState, useEffect } from 'react';
import { 
  User, 
  Loader2, 
  X, 
  Check, 
  AlertCircle, 
  Info 
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

// Define age groups
const AGE_GROUPS = [
  "Under 18",
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55-64",
  "65+"
];

// Define gender options
const GENDER_OPTIONS = [
  "Male",
  "Female",
  "Non-binary",
  "Prefer not to say"
];

// Define interests categories
const INTEREST_CATEGORIES = [
  "Technology",
  "Fashion",
  "Sports",
  "Fitness",
  "Gaming",
  "Movies",
  "Music",
  "Books",
  "Food",
  "Travel",
  "Art",
  "Photography",
  "Home Decor",
  "Finance",
  "Automotive",
  "Health & Wellness"
];

// Define lifestyle tags
const LIFESTYLE_TAGS = [
  "Urban",
  "Suburban",
  "Rural",
  "Eco-friendly",
  "Budget-conscious",
  "Luxury",
  "Minimalist",
  "Family-oriented",
  "Pet owner",
  "Outdoor enthusiast",
  "Fitness enthusiast",
  "Foodie",
  "DIY enthusiast",
  "Tech enthusiast",
  "Early adopter",
  "Social activist"
];

// Type definition for demographic data
export type Demographics = {
  age_group: string | null;
  gender: string | null;
  location: {
    country: string | null;
    region: string | null;
    city: string | null;
  } | null;
  interests: string[] | null;
  lifestyle_tags: string[] | null;
  favorite_categories: string[] | null;
  profile_completion: number;
  data_sharing_consent: boolean;
  last_updated: Date | null;
};

// Type for form props
interface DemographicFormProps {
  currentDemographics: Demographics | null;
  onSave: (demographics: Demographics) => Promise<void>;
  categories: Array<{ id: string; name: string }>;
  isLoading?: boolean;
}

export default function DemographicForm({ 
  currentDemographics, 
  onSave, 
  categories,
  isLoading = false 
}: DemographicFormProps) {
  const { toast } = useToast();
  
  // State for demographic data
  const [demographics, setDemographics] = useState<Demographics>({
    age_group: null,
    gender: null,
    location: {
      country: null,
      region: null,
      city: null
    },
    interests: [],
    lifestyle_tags: [],
    favorite_categories: [],
    profile_completion: 0,
    data_sharing_consent: false,
    last_updated: null
  });
  
  // UI States
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [showLocationInfo, setShowLocationInfo] = useState(false);
  
  // Initialize form with current data if available
  useEffect(() => {
    if (currentDemographics) {
      setDemographics(currentDemographics);
    }
  }, [currentDemographics]);
  
  // Auto-detect location when the component mounts
  useEffect(() => {
    const detectLocation = async () => {
      // Skip if we already have location data
      if (demographics.location?.country && 
          demographics.location?.city) {
        return;
      }
      
      try {
        setLocationLoading(true);
        
        // IP-based geolocation API
        const response = await fetch('https://ipinfo.io/[IP address]?token=dff8aa2dde1793');
        
        if (!response.ok) {
          throw new Error('Failed to get location');
        }
        
        const data = await response.json();
        
        setDemographics(prev => ({
          ...prev,
          location: {
            country: data.country || null,
            region: data.region || null,
            city: data.city || null
          }
        }));
      } catch (err) {
        console.error('Error detecting location:', err);
        setDemographics(prev => ({
            ...prev,
            location: {
              country: null,
              region: null,
              city: null
            }
        }));
      } finally {
        setLocationLoading(false);
      }
    };
    
    // Only run if component is mounted on client
    if (typeof window !== 'undefined') {
      detectLocation();
    }
  }, []);
  
  // Calculate profile completion percentage
  useEffect(() => {
    const calculateCompletion = () => {
      let fieldsTotal = 4; // age, gender, location, consent
      let fieldsCompleted = 0;
      
      if (demographics.age_group) fieldsCompleted++;
      if (demographics.gender) fieldsCompleted++;
      if (demographics.location?.country) fieldsCompleted++;
      if (demographics.data_sharing_consent) fieldsCompleted++;
      
      // Count array fields differently
      const arrayFields = [
        { field: demographics.interests, minItems: 2 },
        { field: demographics.lifestyle_tags, minItems: 2 },
        { field: demographics.favorite_categories, minItems: 1 }
      ];
      
      fieldsTotal += arrayFields.length;
      
      arrayFields.forEach(({ field, minItems }) => {
        if (field && field.length >= minItems) {
          fieldsCompleted++;
        }
      });
      
      const completionPercentage = Math.round((fieldsCompleted / fieldsTotal) * 100);
      
      setDemographics(prev => ({
        ...prev,
        profile_completion: completionPercentage
      }));
    };
    
    calculateCompletion();
  }, [demographics.age_group, demographics.gender, demographics.location, 
      demographics.interests, demographics.lifestyle_tags, 
      demographics.favorite_categories, demographics.data_sharing_consent]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError('');
      setSaving(true);
      
      // Update the last_updated timestamp
      const updatedDemographics = {
        ...demographics,
        last_updated: new Date()
      };
      
      // Call the save function provided via props
      await onSave(updatedDemographics);
      
      toast({
        title: "Demographics saved",
        description: "Your demographic information has been updated.",
        type: "success"
      });
    } catch (err) {
      console.error('Error saving demographics:', err);
      setError('Failed to save demographic information. Please try again.');
      
      toast({
        title: "Error",
        description: "Failed to save demographic information.",
        type: "error"
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Toggle selection for array-based fields
  const toggleArrayItem = (field: keyof Demographics, item: string) => {
    setDemographics(prev => {
      // Get the current array
      const currentArray = prev[field] as string[] || [];
      
      // Check if the item is already selected
      const isSelected = currentArray.includes(item);
      
      // Create new array with item toggled
      const newArray = isSelected
        ? currentArray.filter(i => i !== item)
        : [...currentArray, item];
      
      // Return updated demographics
      return {
        ...prev,
        [field]: newArray
      };
    });
  };
  
  // Handle change for simple fields
  const handleChange = (field: keyof Demographics, value: any) => {
    setDemographics(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading demographics...</span>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Demographic Information</h2>
      
      {/* Info notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex">
          <Info className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2 flex-shrink-0" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p>Completing your demographic information helps us to provide better content suggestions and improve your experience. This information may be used in anonymized, aggregated form for analytics.</p>
            <p className="mt-1 font-semibold">Your privacy is important to us. We never share your personal information without your consent.</p>
          </div>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}
      
      {/* Completion indicator */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Profile Completion
          </span>
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            {demographics.profile_completion}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 rounded-full" 
            style={{ width: `${demographics.profile_completion}%` }}
          ></div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Age Group */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Age Group
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {AGE_GROUPS.map(age => (
              <button
                key={age}
                type="button"
                onClick={() => handleChange('age_group', age)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${demographics.age_group === age 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                {age}
              </button>
            ))}
          </div>
        </div>
        
        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Gender
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {GENDER_OPTIONS.map(gender => (
              <button
                key={gender}
                type="button"
                onClick={() => handleChange('gender', gender)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${demographics.gender === gender 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                {gender}
              </button>
            ))}
          </div>
        </div>
        
        {/* Location - Detected automatically */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Location
            </label>
            <button
              type="button"
              onClick={() => setShowLocationInfo(!showLocationInfo)}
              className="text-xs text-blue-500 dark:text-blue-400 hover:underline flex items-center"
            >
              <Info className="h-3.5 w-3.5 mr-1" />
              How is this detected?
            </button>
          </div>
          
          {showLocationInfo && (
            <div className="mb-3 text-xs bg-gray-50 dark:bg-gray-750 p-3 rounded-lg text-gray-600 dark:text-gray-400">
              Your approximate location is detected based on your IP address. This helps us show relevant content. You can update this information if it's not accurate.
            </div>
          )}
          
          <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-3 relative">
            {locationLoading ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 text-blue-500 animate-spin mr-2" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Detecting location...</span>
              </div>
            ) : demographics.location?.city && demographics.location?.country ? (
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {demographics.location.city}, {demographics.location.region && demographics.location.region + ','} {demographics.location.country}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setDemographics(prev => ({
                    ...prev,
                    location: { country: null, region: null, city: null }
                  }))}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  aria-label="Remove location"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Location detection failed. Please try again later.
              </div>
            )}
          </div>
        </div>
        
        {/* Interests - Multi-select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Interests (select 2+ that apply)
          </label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_CATEGORIES.map(interest => (
              <button
                key={interest}
                type="button"
                onClick={() => toggleArrayItem('interests', interest)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors
                  ${demographics.interests?.includes(interest)
                    ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                {interest}
              </button>
            ))}
          </div>
          {demographics.interests && demographics.interests.length > 0 && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {demographics.interests.length} interests selected
            </p>
          )}
        </div>
        
        {/* Lifestyle Tags - Multi-select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Lifestyle (select 2+ that describe you)
          </label>
          <div className="flex flex-wrap gap-2">
            {LIFESTYLE_TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleArrayItem('lifestyle_tags', tag)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors
                  ${demographics.lifestyle_tags?.includes(tag)
                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                {tag}
              </button>
            ))}
          </div>
          {demographics.lifestyle_tags && demographics.lifestyle_tags.length > 0 && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {demographics.lifestyle_tags.length} lifestyle tags selected
            </p>
          )}
        </div>
        
        {/* Favorite Categories - Multi-select from platform categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Favorite Categories (select at least 1)
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                type="button"
                onClick={() => toggleArrayItem('favorite_categories', category.id)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors
                  ${demographics.favorite_categories?.includes(category.id)
                    ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                {category.name}
              </button>
            ))}
          </div>
          {demographics.favorite_categories && demographics.favorite_categories.length > 0 && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {demographics.favorite_categories.length} categories selected
            </p>
          )}
        </div>
        
        {/* Data Sharing Consent */}
        <div className="pt-2">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="data_consent"
                name="data_consent"
                type="checkbox"
                checked={demographics.data_sharing_consent}
                onChange={(e) => handleChange('data_sharing_consent', e.target.checked)}
                className="h-4 w-4 text-blue-500 dark:text-blue-400 border-gray-300 dark:border-gray-600 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="data_consent" className="font-medium text-gray-700 dark:text-gray-300">
                Data Sharing Consent
              </label>
              <p className="text-gray-500 dark:text-gray-400">
                I agree that Rate It or Hate It may use my demographic information in anonymized, aggregated form for platform analytics and to improve recommendations.
              </p>
            </div>
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full flex justify-center items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save Demographics
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}