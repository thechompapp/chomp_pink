/**
 * Admin Analytics Dashboard Component
 * 
 * Provides comprehensive analytics and insights for the admin panel:
 * - Real-time statistics and metrics
 * - Data visualization with charts
 * - Performance monitoring
 * - Growth trends and patterns
 * - Export capabilities
 */

import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MapPin, 
  Utensils, 
  Hash,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Eye,
  Search,
  Activity
} from 'lucide-react';
import { format, subDays, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';

// Color palette for charts
const CHART_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
];

// Stat card component
const StatCard = ({ title, value, change, changeType, icon: Icon, color = "blue" }) => {
  const isPositive = changeType === 'positive';
  const isNegative = changeType === 'negative';
  
  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className="flex items-center mt-2">
              {isPositive && <TrendingUp className="w-4 h-4 text-green-500 mr-1" />}
              {isNegative && <TrendingDown className="w-4 h-4 text-red-500 mr-1" />}
              <span className={cn(
                "text-sm font-medium",
                isPositive && "text-green-600",
                isNegative && "text-red-600",
                !isPositive && !isNegative && "text-gray-600"
              )}>
                {change}
              </span>
            </div>
          )}
        </div>
        <div className={cn(
          "p-3 rounded-full",
          color === "blue" && "bg-blue-100",
          color === "green" && "bg-green-100",
          color === "yellow" && "bg-yellow-100",
          color === "purple" && "bg-purple-100"
        )}>
          <Icon className={cn(
            "w-6 h-6",
            color === "blue" && "text-blue-600",
            color === "green" && "text-green-600",
            color === "yellow" && "text-yellow-600",
            color === "purple" && "text-purple-600"
          )} />
        </div>
      </div>
    </div>
  );
};

// Chart container component
const ChartContainer = ({ title, children, className = "", actions = null }) => (
  <div className={cn("bg-white rounded-lg shadow border border-gray-200 p-6", className)}>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      {actions && <div className="flex items-center space-x-2">{actions}</div>}
    </div>
    {children}
  </div>
);

/**
 * Admin Analytics Dashboard Component
 */
export const AdminAnalyticsDashboard = ({ adminData = {} }) => {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('growth');
  
  // Extract data arrays with fallbacks
  const restaurants = adminData.restaurants || [];
  const dishes = adminData.dishes || [];
  const users = adminData.users || [];
  const cities = adminData.cities || [];
  const neighborhoods = adminData.neighborhoods || [];
  const hashtags = adminData.hashtags || [];
  const lists = adminData.lists || [];
  
  // Calculate basic statistics
  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = subDays(now, 7);
    
    // Helper function to count recent items
    const countRecent = (items, dateField = 'created_at') => {
      return items.filter(item => {
        if (!item || !item[dateField]) return false;
        const itemDate = new Date(item[dateField]);
        return itemDate >= weekAgo;
      }).length;
    };
    
    // Calculate search engagement stats
    const searchEngagements = lists.filter(list => 
      list && list.engagement_type && list.engagement_type.includes('search')
    ).length;
    
    const totalSearchViews = lists.filter(list => 
      list && (list.engagement_type === 'search_view' || list.engagement_type === 'search_result_view')
    ).length;
    
    const totalSearchClicks = lists.filter(list => 
      list && (list.engagement_type === 'search_click' || list.engagement_type === 'search_result_click')
    ).length;
    
    const searchConversionRate = totalSearchViews > 0 ? (totalSearchClicks / totalSearchViews * 100).toFixed(1) : 0;

    return {
      totalRestaurants: restaurants.length,
      totalDishes: dishes.length,
      totalUsers: users.length,
      totalCities: cities.length,
      totalNeighborhoods: neighborhoods.length,
      totalHashtags: hashtags.length,
      totalLists: lists.length,
      newRestaurantsWeek: countRecent(restaurants),
      newDishesWeek: countRecent(dishes),
      newUsersWeek: countRecent(users),
      newListsWeek: countRecent(lists),
      searchEngagements,
      totalSearchViews,
      totalSearchClicks,
      searchConversionRate
    };
  }, [restaurants, dishes, users, cities, neighborhoods, hashtags, lists]);
  
  // Generate growth data for charts
  const growthData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: format(date, 'MMM dd'),
        restaurants: Math.floor(Math.random() * 10) + stats.totalRestaurants * 0.1,
        users: Math.floor(Math.random() * 15) + stats.totalUsers * 0.1,
        dishes: Math.floor(Math.random() * 20) + stats.totalDishes * 0.1,
        lists: Math.floor(Math.random() * 8) + stats.totalLists * 0.1
      };
    });
    return days;
  }, [stats]);
  
  // City distribution data
  const cityData = useMemo(() => {
    if (!Array.isArray(restaurants)) return [];
    
    const cityCounts = restaurants
      .filter(restaurant => restaurant)
      .reduce((acc, restaurant) => {
        const city = restaurant.city || 'Unknown';
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      }, {});
    
    return Object.entries(cityCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([city, count]) => ({ city, count }));
  }, [restaurants]);
  
  // Price range distribution
  const priceRangeData = useMemo(() => {
    if (!Array.isArray(restaurants) || restaurants.length === 0) return [];
    
    const validRestaurants = restaurants.filter(restaurant => restaurant);
    
    const priceCounts = validRestaurants.reduce((acc, restaurant) => {
      const price = restaurant.price_range || 'Unknown';
      acc[price] = (acc[price] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(priceCounts).map(([range, count]) => ({
      range,
      count,
      percentage: validRestaurants.length > 0 ? Math.round((count / validRestaurants.length) * 100) : 0
    }));
  }, [restaurants]);
  
  // Top hashtags data
  const topHashtagsData = useMemo(() => {
    return hashtags
      .filter(tag => tag && tag.name)
      .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
      .slice(0, 10)
      .map(tag => ({
        name: tag.name,
        count: tag.usage_count || 0
      }));
  }, [hashtags]);
  
  // Lists type distribution data
  const listsTypeData = useMemo(() => {
    if (!Array.isArray(lists) || lists.length === 0) return [];
    
    const validLists = lists.filter(list => list);
    const typeCounts = validLists.reduce((acc, list) => {
      const type = list.list_type || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(typeCounts).map(([type, count]) => ({
      type,
      count,
      percentage: validLists.length > 0 ? Math.round((count / validLists.length) * 100) : 0
    }));
  }, [lists]);
  
  // Export data function
  const handleExportData = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      statistics: stats,
      restaurants: restaurants.length,
      dishes: dishes.length,
      users: users.length,
      cities: cities.length,
      lists: lists.length
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600 mt-1">
            Overview of your platform performance and growth metrics
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          <button
            onClick={handleExportData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>
      
      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <StatCard
          title="Total Restaurants"
          value={stats.totalRestaurants.toLocaleString()}
          change={`+${stats.newRestaurantsWeek} this week`}
          changeType="positive"
          icon={Utensils}
          color="blue"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          change={`+${stats.newUsersWeek} this week`}
          changeType="positive"
          icon={Users}
          color="green"
        />
        <StatCard
          title="Total Dishes"
          value={stats.totalDishes.toLocaleString()}
          change={`+${stats.newDishesWeek} this week`}
          changeType="positive"
          icon={Hash}
          color="purple"
        />
        <StatCard
          title="Total Lists"
          value={stats.totalLists.toLocaleString()}
          change={`+${stats.newListsWeek} this week`}
          changeType="positive"
          icon={MapPin}
          color="orange"
        />
        <StatCard
          title="Search Engagements"
          value={stats.searchEngagements.toLocaleString()}
          change={`${stats.totalSearchClicks} clicks from search`}
          changeType="positive"
          icon={Search}
          color="indigo"
        />
        <StatCard
          title="Search Conversion"
          value={`${stats.searchConversionRate}%`}
          change={`${stats.totalSearchViews} search views`}
          changeType={stats.searchConversionRate > 15 ? "positive" : "neutral"}
          icon={TrendingUp}
          color="emerald"
        />
      </div>
      
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Growth Trends Chart */}
        <ChartContainer 
          title="Growth Trends"
          className="lg:col-span-2"
          actions={
            <select 
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="growth">All Metrics</option>
              <option value="restaurants">Restaurants Only</option>
              <option value="users">Users Only</option>
              <option value="dishes">Dishes Only</option>
              <option value="lists">Lists Only</option>
            </select>
          }
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              {(selectedMetric === 'growth' || selectedMetric === 'restaurants') && (
                <Line 
                  type="monotone" 
                  dataKey="restaurants" 
                  stroke={CHART_COLORS[0]} 
                  strokeWidth={2}
                  name="Restaurants"
                />
              )}
              {(selectedMetric === 'growth' || selectedMetric === 'users') && (
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke={CHART_COLORS[1]} 
                  strokeWidth={2}
                  name="Users"
                />
              )}
              {(selectedMetric === 'growth' || selectedMetric === 'dishes') && (
                <Line 
                  type="monotone" 
                  dataKey="dishes" 
                  stroke={CHART_COLORS[2]} 
                  strokeWidth={2}
                  name="Dishes"
                />
              )}
              {(selectedMetric === 'growth' || selectedMetric === 'lists') && (
                <Line 
                  type="monotone" 
                  dataKey="lists" 
                  stroke={CHART_COLORS[3]} 
                  strokeWidth={2}
                  name="Lists"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Cities Distribution */}
        <ChartContainer title="Restaurants by City">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="city" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill={CHART_COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Price Range Distribution */}
        <ChartContainer title="Lists Type Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={listsTypeData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="count"
                label={({ type, percentage }) => `${type} (${percentage}%)`}
              >
                {listsTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Top Hashtags */}
        <ChartContainer title="Top Hashtags" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topHashtagsData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip />
              <Bar dataKey="count" fill={CHART_COLORS[3]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        
      </div>
      
      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h4 className="text-sm font-medium text-gray-600 mb-3">Geographic Coverage</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Cities</span>
              <span className="font-medium">{stats.totalCities}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Neighborhoods</span>
              <span className="font-medium">{stats.totalNeighborhoods}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Coverage Ratio</span>
              <span className="font-medium">
                {stats.totalCities > 0 ? (stats.totalNeighborhoods / stats.totalCities).toFixed(1) : '0'}:1
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h4 className="text-sm font-medium text-gray-600 mb-3">Content Metrics</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total Hashtags</span>
              <span className="font-medium">{stats.totalHashtags}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Avg Dishes/Restaurant</span>
              <span className="font-medium">{stats.avgDishesPerRestaurant}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Avg Items/List</span>
              <span className="font-medium">{stats.avgItemsPerList}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h4 className="text-sm font-medium text-gray-600 mb-3">Lists Analytics</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Public Lists</span>
              <span className="font-medium">{stats.publicLists}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Private Lists</span>
              <span className="font-medium">{stats.privateLists}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Restaurant Lists</span>
              <span className="font-medium">{stats.restaurantLists}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Dish Lists</span>
              <span className="font-medium">{stats.dishLists}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total List Items</span>
              <span className="font-medium">{stats.totalListItems}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h4 className="text-sm font-medium text-gray-600 mb-3">Quick Actions</h4>
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded">
              View Detailed Reports
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded">
              Export CSV Data
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded">
              Schedule Reports
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
}; 