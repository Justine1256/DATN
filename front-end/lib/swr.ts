import { SWRConfiguration } from 'swr';

// Global SWR configuration
export const swrConfig: SWRConfiguration = {
  // Revalidation settings
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  revalidateIfStale: true,
  
  // Cache and deduping
  dedupingInterval: 60000, // 1 minute
  focusThrottleInterval: 5000,
  
  // Error retry
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  
  // Loading delay
  loadingTimeout: 3000,
  
  // Default fetcher
  fetcher: async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  // Error handler
  onError: (error, key) => {
    console.error('SWR Error:', error, 'Key:', key);
  },

  // Success handler  
  onSuccess: (data, key) => {
    // Optional: Log successful requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log('SWR Success:', key, data);
    }
  }
};

// Cache management utilities
export const swrCache = {
  // Clear all cache
  clearAll: () => {
    if (typeof window !== 'undefined') {
      const { cache } = require('swr');
      cache.clear();
    }
  },
  
  // Clear specific cache by key pattern
  clearByPattern: (pattern: RegExp) => {
    if (typeof window !== 'undefined') {
      const { cache } = require('swr');
      const keys = Array.from(cache.keys()) as string[];
      keys.forEach(key => {
        if (pattern.test(key)) {
          cache.delete(key);
        }
      });
    }
  }
};
