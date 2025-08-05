import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import NavigationOptimizer, { defaultNavigationConfig } from '../utils/navigationOptimizer';

interface UseOptimizedNavigationProps {
  user?: any;
  cartItems?: any[];
  categories?: any[];
}

export const useOptimizedNavigation = ({ 
  user, 
  cartItems = [], 
  categories = [] 
}: UseOptimizedNavigationProps) => {
  const router = useRouter();

  // Initialize optimizer with configuration
  const optimizer = useMemo(() => 
    new NavigationOptimizer(defaultNavigationConfig), 
    []
  );

  // Smart prefetching based on user context
  useEffect(() => {
    const timer = setTimeout(() => {
      const userContext = {
        isAuthenticated: !!user,
        hasShop: !!user?.shop,
        cartItemCount: cartItems.length,
        recentlyVisited: [] // Could be retrieved from localStorage
      };

      const routesToPrefetch = optimizer.getPrefetchStrategy(userContext);
      
      // Add popular categories
      if (categories.length > 0) {
        const topCategories = categories.slice(0, 3).map(cat => `/category/${cat.slug}`);
        routesToPrefetch.push(...topCategories);
      }

      optimizer.conditionalPrefetch(router, routesToPrefetch);
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, cartItems.length, categories.length, optimizer, router]); // Use categories.length instead of categories array

  // Optimized navigation function
  const navigateTo = (path: string, options?: {
    replace?: boolean;
    trackEvent?: string;
  }) => {
    return optimizer.navigate(router, path, {
      replace: options?.replace || false,
      prefetch: true,
      trackEvent: options?.trackEvent
    });
  };

  // Smart cart navigation with caching
  const navigateToCart = () => {
    const cartCache = sessionStorage.getItem('cart-page-cache');
    const cacheTime = sessionStorage.getItem('cart-cache-time');
    const now = Date.now();
    
    if (cartCache && cacheTime && (now - parseInt(cacheTime)) < 30000) {
      router.replace("/cart");
      return;
    }
    
    navigateTo("/cart", { replace: true, trackEvent: "cart_navigation" });
    sessionStorage.setItem('cart-cache-time', now.toString());
  };

  // Performance metrics (for debugging)
  const getMetrics = () => optimizer.getPerformanceMetrics();

  return {
    navigateTo,
    navigateToCart,
    getMetrics,
    prefetchRoute: (path: string) => router.prefetch(path)
  };
};
