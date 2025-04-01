'use client';

import { useState } from 'react';
import { X, Copy, Check, Facebook, Twitter, Share2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface ShareOptionsProps {
  itemId: string;
  itemName: string;
  onClose: () => void;
}

export default function ShareOptions({ itemId, itemName, onClose }: ShareOptionsProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  // Generate the item URL
  const itemUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/item/${itemId}`
    : `/item/${itemId}`;
  
  // Handle copy to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(itemUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share link copied to clipboard",
        type: "success",
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try using one of the share buttons instead",
        type: "error",
      });
    }
  };
  
  // Share to social platforms
  const shareToSocial = (platform: string) => {
    const shareText = `Check out "${itemName}" on Rate it or Hate it!`;
    
    switch(platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(itemUrl)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(itemUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + itemUrl)}`, '_blank');
        break;
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Share Your Item</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="text-center mb-8">
            <div className="bg-green-100 dark:bg-green-900/30 rounded-full inline-flex items-center justify-center p-3 mb-4">
              <Share2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Your item was added successfully!
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Share "{itemName}" with your friends and networks
            </p>
          </div>
          
          {/* Share URL */}
          <div className="mb-6">
            <label htmlFor="share-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Item Link
            </label>
            <div className="flex">
              <input
                type="text"
                id="share-url"
                value={itemUrl}
                readOnly
                className="flex-1 p-2 border rounded-l-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
              <button
                onClick={copyToClipboard}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-r-lg flex items-center transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Social share buttons */}
          <div className="space-y-3">
            <button
              onClick={() => shareToSocial('facebook')}
              className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition-colors"
            >
              <Facebook className="h-5 w-5 mr-2" />
              Share on Facebook
            </button>
            
            <button
              onClick={() => shareToSocial('twitter')}
              className="w-full p-3 bg-blue-400 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center transition-colors"
            >
              <Twitter className="h-5 w-5 mr-2" />
              Share on Twitter/X
            </button>
            
            <button
              onClick={() => shareToSocial('whatsapp')}
              className="w-full p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center transition-colors"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 1.43.253 2.813.725 4.094L.146 22.86l6.012-2.127C7.704 21.56 9.318 22 11.007 22 17.633 22 23 16.627 23 10S18.627 0 12 0zm5.894 17.34c-.387.265-.868.447-1.416.487-.55.04-1.042-.036-1.425-.227-3.018-1.2-4.853-4.021-5.146-4.406-.293-.385-1.347-1.95-1.347-3.519 0-1.57.73-2.212 1.022-2.522.291-.31.642-.41.856-.41.214 0 .428.005.61.028.183.023.398-.65.618.488.221.55.654 1.955.712 2.096.057.14.108.34.033.555-.076.217-.14.35-.262.55-.122.201-.254.337-.371.475-.118.138-.247.287-.106.561.14.273.619 1.171 1.331 1.898.913.929 1.69 1.317 1.925 1.459.235.14.405.136.558.026.153-.11.662-.744.838-1.045.176-.3.351-.233.59-.139.238.93.963.468 1.122.557.16.89.29.212.34.361.05.149.05.545-.173.982z"/>
              </svg>
              Share on WhatsApp
            </button>
          </div>
          
          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full p-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
            >
              View My Item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}