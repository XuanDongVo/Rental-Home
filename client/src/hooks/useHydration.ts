"use client";

import { useEffect, useState } from 'react';

/**
 * Custom hook to handle hydration safely
 * Prevents hydration mismatches by ensuring consistent rendering
 */
export const useHydration = () => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
};

/**
 * Hook to safely format dates without hydration issues
 */
export const useSafeDateFormat = () => {
  const isHydrated = useHydration();

  const formatTime = (date: Date) => {
    if (!isHydrated) {
      // Return a consistent fallback during SSR
      return '--:--';
    }
    
    return new Intl.DateTimeFormat('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    }).format(date);
  };

  const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions) => {
    if (!isHydrated) {
      // Return a consistent fallback during SSR
      return '--';
    }
    
    return new Intl.DateTimeFormat('en-US', options || {
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return { formatTime, formatDate, isHydrated };
};