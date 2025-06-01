/**
 * TrendingTicker Component
 * 
 * Displays a continuously moving ticker of trending items (restaurants, dishes, lists)
 * with real-time status indicators, creating a stock market ticker feeling.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  RefreshCw,
  Utensils,
  Hash,
  MapPin,
  Users,
  Star,
  Clock,
  Flame
} from 'lucide-react';
import { cn } from '@/lib/utils';
import apiClient from '@/services/apiClient';
import { logDebug, logError } from '@/utils/logger';
import { engagementService } from '@/services/engagementService';

// Fetch trending data function
const fetchTrendingData = async () => {
  try {
    const [restaurants, dishes, lists] = await Promise.all([
      apiClient.get('/trending/restaurants?limit=8').catch(() => ({ data: [] })),
      apiClient.get('/trending/dishes?limit=8').catch(() => ({ data: [] })),
      apiClient.get('/trending/lists?limit=8').catch(() => ({ data: [] }))
    ]);

    return {
      restaurants: Array.isArray(restaurants.data) ? restaurants.data : [],
      dishes: Array.isArray(dishes.data) ? dishes.data : [],
      lists: Array.isArray(lists.data) ? lists.data : []
    };
  } catch (error) {
    logError('[TrendingTicker] Error fetching trending data:', error);
    // Return empty arrays on error to prevent crashes
    return {
      restaurants: [],
      dishes: [],
      lists: []
    };
  }
};

// Status indicator logic
const getStatusIndicator = (item, type) => {
  const now = new Date();
  const createdAt = new Date(item.created_at);
  const updatedAt = new Date(item.updated_at);
  const hoursSinceCreated = (now - createdAt) / (1000 * 60 * 60);
  const hoursSinceUpdated = (now - updatedAt) / (1000 * 60 * 60);
  
  // Just added (< 24h)
  if (hoursSinceCreated < 24) {
    return { 
      icon: Sparkles, 
      text: "Just Added", 
      color: "text-green-500 bg-green-50",
      pulse: true
    };
  }
  
  // Recently updated (< 6h)
  if (hoursSinceUpdated < 6) {
    return { 
      icon: RefreshCw, 
      text: "Just Updated", 
      color: "text-blue-500 bg-blue-50",
      pulse: false
    };
  }
  
  // High trending score
  if (item.trend_score > 50) {
    return { 
      icon: Flame, 
      text: "Hot Right Now", 
      color: "text-red-500 bg-red-50",
      pulse: true
    };
  }
  
  // Medium trending score
  if (item.trend_score > 20) {
    return { 
      icon: TrendingUp, 
      text: "Trending Up", 
      color: "text-orange-500 bg-orange-50",
      pulse: false
    };
  }
  
  // Default popular
  return { 
    icon: Star, 
    text: "Popular", 
    color: "text-yellow-600 bg-yellow-50",
    pulse: false
  };
};

// Trending Card Component
const TrendingCard = ({ item, type, onClick }) => {
  const status = getStatusIndicator(item, type);
  const StatusIcon = status.icon;
  
  const getTypeIcon = () => {
    switch (type) {
      case 'restaurant': return Utensils;
      case 'dish': return Hash;
      case 'list': return MapPin;
      default: return Star;
    }
  };
  
  const TypeIcon = getTypeIcon();
  
  const getItemDetails = () => {
    switch (type) {
      case 'restaurant':
        return {
          title: item.name,
          subtitle: `${item.cuisine_type || 'Restaurant'} • ${item.city_name || 'Unknown'}`,
          metric: `${item.trend_score || 0} views`
        };
      case 'dish':
        return {
          title: item.name,
          subtitle: `at ${item.restaurant_name || 'Unknown'}`,
          metric: item.price ? `$${item.price}` : 'Popular'
        };
      case 'list':
        return {
          title: item.name,
          subtitle: `by ${item.creator_handle || 'Anonymous'}`,
          metric: `${item.item_count || item.items_count || 0} items`
        };
      default:
        return {
          title: item.name || 'Unknown',
          subtitle: '',
          metric: ''
        };
    }
  };
  
  const details = getItemDetails();
  
  const handleCardClick = () => {
    // Log engagement
    engagementService.logEngagement({
      item_type: type,
      item_id: item.id,
      engagement_type: 'click'
    });
    
    onClick(item, type);
  };
  
  return (
    <div
      onClick={handleCardClick}
      className="flex-shrink-0 w-64 h-24 bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-all duration-200 hover:border-gray-300 mx-2"
    >
      <div className="flex items-start justify-between h-full">
        <div className="flex-1 min-w-0">
          {/* Status indicator */}
          <div className={cn(
            "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mb-2",
            status.color,
            status.pulse && "animate-pulse"
          )}>
            <StatusIcon size={10} />
            <span>{status.text}</span>
          </div>
          
          {/* Title */}
          <h3 className="font-semibold text-sm text-gray-900 truncate mb-1">
            {details.title}
          </h3>
          
          {/* Subtitle */}
          <p className="text-xs text-gray-500 truncate">
            {details.subtitle}
          </p>
          
          {/* Metric */}
          <p className="text-xs text-gray-400 mt-1">
            {details.metric}
          </p>
        </div>
        
        {/* Type icon */}
        <div className="flex-shrink-0 ml-2">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <TypeIcon size={14} className="text-gray-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Main TrendingTicker Component
const TrendingTicker = ({ 
  refreshInterval = 180000, // 3 minutes
  scrollSpeed = 'normal',
  pauseOnHover = true,
  className = ""
}) => {
  const navigate = useNavigate();
  const [isPaused, setIsPaused] = useState(false);
  
  // Fetch trending data
  const { data: trendingData, isLoading, error } = useQuery({
    queryKey: ['trending-ticker'],
    queryFn: fetchTrendingData,
    refetchInterval: refreshInterval,
    staleTime: 60000, // 1 minute
    cacheTime: 300000, // 5 minutes
    retry: 2
  });
  
  // Combine and shuffle trending items
  const tickerItems = useMemo(() => {
    if (!trendingData) return [];
    
    // Ensure all data arrays exist and are arrays
    const restaurants = Array.isArray(trendingData.restaurants) ? trendingData.restaurants : [];
    const dishes = Array.isArray(trendingData.dishes) ? trendingData.dishes : [];
    const lists = Array.isArray(trendingData.lists) ? trendingData.lists : [];
    
    const allItems = [
      ...restaurants.map(item => ({ ...item, type: 'restaurant' })),
      ...dishes.map(item => ({ ...item, type: 'dish' })),
      ...lists.map(item => ({ ...item, type: 'list' }))
    ];
    
    // Sort by trend_score and shuffle for variety
    return allItems
      .sort((a, b) => (b.trend_score || 0) - (a.trend_score || 0))
      .slice(0, 24) // Take top 24 items
      .sort(() => Math.random() - 0.5); // Shuffle for variety
  }, [trendingData]);
  
  // Handle item clicks
  const handleItemClick = useCallback((item, type) => {
    const routes = {
      restaurant: '/restaurants',
      dish: '/dishes', 
      list: '/lists'
    };
    
    navigate(`${routes[type]}/${item.id}`);
  }, [navigate]);
  
  // Get scroll speed class
  const getScrollSpeedClass = () => {
    switch (scrollSpeed) {
      case 'slow': return 'animate-scroll-slow';
      case 'fast': return 'animate-scroll-fast';
      case 'normal':
      default: return 'animate-scroll';
    }
  };
  
  if (error) {
    logError('[TrendingTicker] Error loading trending data:', error);
    return null; // Gracefully hide on error
  }
  
  if (isLoading || !tickerItems.length) {
    return (
      <div className={cn("w-full overflow-hidden bg-gray-50 border-y border-gray-200 py-4", className)}>
        <div className="flex items-center justify-center space-x-2 text-gray-500">
          <RefreshCw size={16} className="animate-spin" />
          <span className="text-sm">Loading trending items...</span>
        </div>
      </div>
    );
  }
  
  // Duplicate items to create seamless loop
  const duplicatedItems = [...tickerItems, ...tickerItems];
  
  return (
    <div 
      className={cn("w-full overflow-hidden bg-gray-50 border-y border-gray-200 py-4", className)}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      {/* Ticker header */}
      <div className="flex items-center justify-center mb-3">
        <div className="flex items-center space-x-2 text-gray-700">
          <TrendingUp size={16} />
          <span className="text-sm font-medium">Trending Now</span>
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        </div>
      </div>
      
      {/* Scrolling ticker */}
      <div className="relative">
        <div 
          className={cn(
            "flex",
            getScrollSpeedClass(),
            isPaused && "animation-paused"
          )}
          style={{
            width: `${duplicatedItems.length * 272}px` // 264px card width + 8px margin
          }}
        >
          {duplicatedItems.map((item, index) => (
            <TrendingCard
              key={`${item.type}-${item.id}-${index}`}
              item={item}
              type={item.type}
              onClick={handleItemClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrendingTicker; 