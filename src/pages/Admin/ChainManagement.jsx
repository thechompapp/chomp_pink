/**
 * Restaurant Chain Management Admin Interface
 * Provides comprehensive tools for detecting, managing, and organizing restaurant chains
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Building2, 
  MapPin, 
  Scan, 
  Plus, 
  X, 
  Check, 
  AlertTriangle,
  BarChart3,
  Settings
} from 'lucide-react';
import apiClient from '@/services/apiClient';
import { logError, logInfo } from '@/utils/logger';

const ChainManagement = () => {
  const [scanResults, setScanResults] = useState(null);
  const [existingChains, setExistingChains] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scanOptions, setScanOptions] = useState({
    similarityThreshold: 0.8,
    minLocations: 2,
    maxResults: 50
  });

  // Fetch existing chains and stats on component mount
  useEffect(() => {
    fetchExistingChains();
    fetchStats();
  }, []);

  const fetchExistingChains = async () => {
    try {
      const response = await apiClient.get('/admin/chains');
      setExistingChains(response.data.data);
    } catch (error) {
      logError('Error fetching existing chains:', error);
      setError('Failed to fetch existing chains');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/admin/chains/stats');
      setStats(response.data.data);
    } catch (error) {
      logError('Error fetching chain stats:', error);
    }
  };

  const handleScanForChains = async () => {
    setLoading(true);
    setError(null);
    
    try {
      logInfo('Starting chain detection scan with options:', scanOptions);
      
      const response = await apiClient.get('/admin/chains/scan', {
        params: scanOptions
      });
      
      setScanResults(response.data.data);
      logInfo(`Found ${response.data.data.totalPotentialChains} potential chains`);
      
    } catch (error) {
      logError('Error scanning for chains:', error);
      setError('Failed to scan for restaurant chains. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChain = async (chainData) => {
    try {
      setLoading(true);
      
      const response = await apiClient.post('/admin/chains', chainData);
      
      // Refresh data
      await fetchExistingChains();
      await fetchStats();
      
      // Remove the created chain from scan results
      if (scanResults) {
        setScanResults(prev => ({
          ...prev,
          chains: prev.chains.filter(chain => 
            !chainData.restaurantIds.every(id => 
              chain.locations.some(loc => loc.id === id)
            )
          ),
          totalPotentialChains: prev.totalPotentialChains - 1
        }));
      }
      
      logInfo(`Successfully created chain: ${chainData.name}`);
      
    } catch (error) {
      logError('Error creating chain:', error);
      setError('Failed to create chain. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromChain = async (restaurantId) => {
    try {
      await apiClient.put(`/admin/chains/1/remove-restaurant`, {
        restaurantId
      });
      
      await fetchExistingChains();
      await fetchStats();
      
    } catch (error) {
      logError('Error removing restaurant from chain:', error);
      setError('Failed to remove restaurant from chain');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Restaurant Chain Management</h1>
        <Button
          onClick={handleScanForChains}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Scan className="h-4 w-4" />
          {loading ? 'Scanning...' : 'Scan for Chains'}
        </Button>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="scan" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scan">Chain Detection</TabsTrigger>
          <TabsTrigger value="existing">Existing Chains</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Chain Detection Tab */}
        <TabsContent value="scan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Chain Detection Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scanResults ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      Found {scanResults.totalPotentialChains} potential chains from {scanResults.summary.restaurantsAnalyzed} restaurants
                    </p>
                    <Badge variant="outline">
                      Avg: {scanResults.summary.averageLocationsPerChain?.toFixed(1)} locations/chain
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {scanResults.chains.map((chain, index) => (
                      <ChainSuggestionCard
                        key={`${chain.normalizedName}-${index}`}
                        chain={chain}
                        onCreateChain={handleCreateChain}
                        loading={loading}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">
                    Click "Scan for Chains" to detect potential restaurant chains
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Existing Chains Tab */}
        <TabsContent value="existing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Existing Restaurant Chains ({existingChains.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {existingChains.map((chain) => (
                  <ExistingChainCard
                    key={chain.id}
                    chain={chain}
                    onRemoveRestaurant={handleRemoveFromChain}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats">
          <StatsPanel stats={stats} />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <ScanSettingsPanel
            options={scanOptions}
            onChange={setScanOptions}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Chain suggestion card component
const ChainSuggestionCard = ({ chain, onCreateChain, loading }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState({
    name: chain.suggestedName,
    website: '',
    description: '',
    restaurantIds: chain.locations.map(loc => loc.id)
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreateChain(formData);
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{chain.suggestedName}</CardTitle>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary">{chain.locationCount} locations</Badge>
              <Badge variant="outline">{chain.confidence}% confidence</Badge>
              <Badge variant="outline">{chain.cities.length} cities</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Review'}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Location list */}
            <div>
              <h4 className="font-medium mb-2">Locations ({chain.locationCount})</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {chain.locations.map((location) => (
                  <div key={location.id} className="flex items-center gap-2 text-sm">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <span>{location.name}</span>
                    <span className="text-gray-500">• {location.address}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Create chain form */}
            <form onSubmit={handleSubmit} className="space-y-3 border-t pt-4">
              <div>
                <label className="block text-sm font-medium mb-1">Chain Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Website (optional)</label>
                <Input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description (optional)</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Chain
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsExpanded(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// Existing chain card component
const ExistingChainCard = ({ chain, onRemoveRestaurant }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{chain.name}</CardTitle>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary">{chain.location_count} locations</Badge>
              {chain.cities && chain.cities.length > 0 && (
                <Badge variant="outline">{chain.cities.length} cities</Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chain.description && (
          <p className="text-sm text-gray-600 mb-2">{chain.description}</p>
        )}
        {chain.website && (
          <a
            href={chain.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm"
          >
            {chain.website}
          </a>
        )}
      </CardContent>
    </Card>
  );
};

// Statistics panel component
const StatsPanel = ({ stats }) => {
  if (!stats) return <div>Loading statistics...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Chains</p>
              <p className="text-2xl font-bold">{stats.totalChains}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <MapPin className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Chained Restaurants</p>
              <p className="text-2xl font-bold">{stats.totalChainedRestaurants}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Locations</p>
              <p className="text-2xl font-bold">{stats.averageLocationsPerChain.toFixed(1)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Largest Chain</p>
              <p className="text-lg font-bold">{stats.largestChain?.name || 'N/A'}</p>
              <p className="text-sm text-gray-500">
                {stats.largestChain?.location_count} locations
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Scan settings panel component
const ScanSettingsPanel = ({ options, onChange }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Chain Detection Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Name Similarity Threshold ({(options.similarityThreshold * 100).toFixed(0)}%)
          </label>
          <input
            type="range"
            min="0.5"
            max="1"
            step="0.05"
            value={options.similarityThreshold}
            onChange={(e) => onChange({
              ...options,
              similarityThreshold: parseFloat(e.target.value)
            })}
            className="w-full"
          />
          <p className="text-sm text-gray-600 mt-1">
            Higher values require more similar names to be considered the same chain
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Minimum Locations</label>
          <Input
            type="number"
            min="2"
            max="10"
            value={options.minLocations}
            onChange={(e) => onChange({
              ...options,
              minLocations: parseInt(e.target.value)
            })}
          />
          <p className="text-sm text-gray-600 mt-1">
            Minimum number of locations required to be considered a chain
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Max Results</label>
          <Input
            type="number"
            min="10"
            max="200"
            value={options.maxResults}
            onChange={(e) => onChange({
              ...options,
              maxResults: parseInt(e.target.value)
            })}
          />
          <p className="text-sm text-gray-600 mt-1">
            Maximum number of potential chains to return
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChainManagement; 