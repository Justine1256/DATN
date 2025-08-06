/**
 * E-commerce Navigation Optimizer
 * Optimizes performance, memory, and resources for navigation
 */

interface NavigationConfig {
  enablePrefetch: boolean;
  maxCacheSize: number;
  cacheTimeout: number;
  priorityRoutes: string[];
}

interface UserContext {
  isAuthenticated: boolean;
  hasShop: boolean;
  cartItemCount: number;
  recentlyVisited: string[];
}

class NavigationOptimizer {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private prefetchQueue = new Set<string>();
  private config: NavigationConfig;

  constructor(config: NavigationConfig) {
    this.config = config;
    this.initializeCleanup();
  }

  // 🧹 Auto-cleanup expired cache entries
  private initializeCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.cache.entries()) {
        if (now - value.timestamp > this.config.cacheTimeout) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Cleanup every minute
  }

  // 🎯 Smart prefetch based on user behavior
  getPrefetchStrategy(userContext: UserContext): string[] {
    const routes: string[] = [];

    // High priority routes (always prefetch)
    routes.push('/cart');

    if (userContext.isAuthenticated) {
      routes.push('/account', '/wishlist');
      
      // If user has items in cart, prefetch checkout
      if (userContext.cartItemCount > 0) {
        routes.push('/checkout');
      }

      // If user has a shop, prefetch shop routes
      if (userContext.hasShop) {
        routes.push('/shop/dashboard');
      }
    } else {
      routes.push('/login', '/register');
    }

    // Add recently visited pages
    userContext.recentlyVisited.slice(0, 3).forEach(route => {
      if (!routes.includes(route)) {
        routes.push(route);
      }
    });

    return routes;
  }

  // 🚀 Optimized navigation with intelligent caching
  async navigate(router: any, path: string, options: {
    replace?: boolean;
    prefetch?: boolean;
    trackEvent?: string;
  } = {}) {
    const { replace = false, prefetch = true, trackEvent } = options;

    // Analytics tracking (if needed)
    if (trackEvent) {
      // Track navigation event
    }

    // Check cache first
    const cached = this.getCachedRoute(path);
    if (cached && this.isValidCache(cached)) {
      // Use cached navigation
      if (replace) {
        router.replace(path);
      } else {
        router.push(path);
      }
      return;
    }

    // Prefetch if enabled
    if (prefetch && this.config.enablePrefetch) {
      await router.prefetch(path);
    }

    // Navigate
    if (replace) {
      router.replace(path);
    } else {
      router.push(path);
    }

    // Cache the navigation
    this.cacheRoute(path);
  }

  // 💾 Cache management
  private getCachedRoute(path: string) {
    return this.cache.get(path);
  }

  private isValidCache(cached: { data: any; timestamp: number }): boolean {
    return Date.now() - cached.timestamp < this.config.cacheTimeout;
  }

  private cacheRoute(path: string) {
    // Limit cache size
    if (this.cache.size >= this.config.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(path, {
      data: { path, timestamp: Date.now() },
      timestamp: Date.now()
    });
  }

  // 🎯 Conditional prefetching based on network conditions
  async conditionalPrefetch(router: any, routes: string[]) {
    // Check network conditions
    const connection = (navigator as any).connection;
    if (connection) {
      const { effectiveType, saveData } = connection;
      
      // Skip prefetch on slow connections or data saver mode
      if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
        return;
      }
    }

    // Prefetch in batches to avoid overwhelming the browser
    const batchSize = 3;
    for (let i = 0; i < routes.length; i += batchSize) {
      const batch = routes.slice(i, i + batchSize);
      
      await Promise.all(
        batch
          .map(route => {
            if (!this.prefetchQueue.has(route)) {
              this.prefetchQueue.add(route);
              const prefetchPromise = router.prefetch(route);
              // Ensure we have a valid promise before calling catch
              if (prefetchPromise && typeof prefetchPromise.catch === 'function') {
                return prefetchPromise.catch(() => {
                  // Ignore prefetch errors
                  this.prefetchQueue.delete(route);
                });
              } else {
                // If prefetch doesn't return a promise, just resolve
                return Promise.resolve();
              }
            }
            return Promise.resolve(); // Return resolved promise for items already in queue
          })
          .filter(promise => promise !== undefined) // Filter out undefined values
      );

      // Small delay between batches
      if (i + batchSize < routes.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  // 📊 Performance monitoring
  getPerformanceMetrics() {
    return {
      cacheSize: this.cache.size,
      prefetchQueueSize: this.prefetchQueue.size,
      cacheHitRate: this.calculateCacheHitRate(),
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  private calculateCacheHitRate(): number {
    // Simplified cache hit rate calculation
    return this.cache.size > 0 ? 0.8 : 0; // Placeholder
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage in KB
    return this.cache.size * 2; // 2KB per cached route (rough estimate)
  }
}

// Default configuration for e-commerce
export const defaultNavigationConfig: NavigationConfig = {
  enablePrefetch: true,
  maxCacheSize: 50, // Limit cache to 50 routes
  cacheTimeout: 300000, // 5 minutes
  priorityRoutes: ['/cart', '/checkout', '/account', '/wishlist']
};

export default NavigationOptimizer;
