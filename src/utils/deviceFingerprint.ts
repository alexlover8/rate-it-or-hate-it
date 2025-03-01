'use client';

// Generate a device fingerprint based on browser characteristics
export async function generateFingerprint(): Promise<string> {
  try {
    // Create a simplified fingerprint using available browser info
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 'unknown',
      'memory:' + (navigator as any).deviceMemory || 'unknown',
      navigator.platform || 'unknown',
      'localStorage:' + !!window.localStorage,
      'sessionStorage:' + !!window.sessionStorage,
      'cookiesEnabled:' + navigator.cookieEnabled,
    ];

    // Create a string representation
    const fingerprint = components.join('###');
    
    // Use a hashing function to create a consistent ID
    const hashCode = await simpleHash(fingerprint);
    
    return hashCode;
  } catch (error) {
    console.error("Error generating device fingerprint:", error);
    // Fallback to a temporary device ID if fingerprinting fails
    return 'temp-' + Math.random().toString(36).substring(2, 15);
  }
}

// Simple hash function
async function simpleHash(text: string): Promise<string> {
  // Use SubtleCrypto API for secure hashing if available
  if (window.crypto && window.crypto.subtle) {
    try {
      const msgUint8 = new TextEncoder().encode(text);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (e) {
      // Fallback to simpler hash if SubtleCrypto fails
    }
  }
  
  // Simple fallback hash if crypto API is not available
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}