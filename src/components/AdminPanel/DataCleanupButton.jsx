/**
 * DataCleanupButton Component
 * 
 * Provides configurable data cleanup functionality for admin panel tabs.
 * Allows enabling/disabling specific validation checks and cleanup rules.
 */

import React, { useState, useCallback } from 'react';
import { Wrench, Settings, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { cleanupService } from '@/services/cleanupService';
import { DataCleanupModal } from './DataCleanupModal';
import { logInfo, logError } from '@/utils/logger';

/**
 * Default cleanup check configurations for each resource type
 */
const DEFAULT_CLEANUP_CONFIGS = {
  restaurants: {
    relationships: {
      missingCityId: { enabled: true, label: 'Missing City', priority: 'high' },
      missingNeighborhoodId: { enabled: true, label: 'Missing Neighborhood', priority: 'high' },
      invalidCityId: { enabled: true, label: 'Invalid City Reference', priority: 'high' },
      invalidNeighborhoodId: { enabled: true, label: 'Invalid Neighborhood Reference', priority: 'high' }
    },
    formatting: {
      nameFormatting: { enabled: true, label: 'Name Formatting (Title Case)', priority: 'medium' },
      phoneFormatting: { enabled: true, label: 'Phone Number Formatting', priority: 'medium' },
      websiteFormatting: { enabled: true, label: 'Website URL Formatting', priority: 'low' },
      addressFormatting: { enabled: true, label: 'Address Formatting', priority: 'low' }
    },
    validation: {
      requiredFields: { enabled: true, label: 'Required Fields Check', priority: 'high' },
      duplicateNames: { enabled: true, label: 'Duplicate Restaurant Names', priority: 'medium' },
      invalidPhoneNumbers: { enabled: false, label: 'Invalid Phone Numbers', priority: 'low' },
      invalidWebsites: { enabled: false, label: 'Invalid Website URLs', priority: 'low' }
    }
  },
  dishes: {
    relationships: {
      missingRestaurantId: { enabled: true, label: 'Missing Restaurant', priority: 'high' },
      invalidRestaurantId: { enabled: true, label: 'Invalid Restaurant Reference', priority: 'high' },
      orphanedDishes: { enabled: true, label: 'Orphaned Dishes', priority: 'high' }
    },
    formatting: {
      nameFormatting: { enabled: true, label: 'Dish Name Formatting', priority: 'medium' },
      descriptionFormatting: { enabled: true, label: 'Description Formatting', priority: 'low' }
    },
    validation: {
      requiredFields: { enabled: true, label: 'Required Fields Check', priority: 'high' },
      duplicateDishes: { enabled: true, label: 'Duplicate Dishes per Restaurant', priority: 'medium' },
      priceValidation: { enabled: false, label: 'Price Validation', priority: 'low' },
      priceConsistency: { enabled: false, label: 'Price Consistency', priority: 'low' }
    }
  },
  neighborhoods: {
    relationships: {
      missingCityId: { enabled: true, label: 'Missing City', priority: 'high' },
      invalidCityId: { enabled: true, label: 'Invalid City Reference', priority: 'high' }
    },
    formatting: {
      nameFormatting: { enabled: true, label: 'Neighborhood Name Formatting', priority: 'medium' },
      boroughFormatting: { enabled: true, label: 'Borough Formatting', priority: 'low' }
    },
    validation: {
      requiredFields: { enabled: true, label: 'Required Fields Check', priority: 'high' },
      duplicateNames: { enabled: true, label: 'Duplicate Neighborhood Names', priority: 'medium' },
      invalidZipcodes: { enabled: false, label: 'Invalid Zipcode Ranges', priority: 'low' }
    }
  },
  users: {
    formatting: {
      nameFormatting: { enabled: true, label: 'Name Formatting', priority: 'medium' },
      emailFormatting: { enabled: true, label: 'Email Formatting', priority: 'medium' }
    },
    validation: {
      requiredFields: { enabled: true, label: 'Required Fields Check', priority: 'high' },
      emailValidation: { enabled: true, label: 'Email Validation', priority: 'high' },
      duplicateEmails: { enabled: true, label: 'Duplicate Email Addresses', priority: 'high' },
      unverifiedAccounts: { enabled: false, label: 'Unverified Accounts', priority: 'low' }
    }
  },
  cities: {
    formatting: {
      nameFormatting: { enabled: true, label: 'City Name Formatting', priority: 'medium' },
      stateFormatting: { enabled: true, label: 'State Formatting', priority: 'low' }
    },
    validation: {
      requiredFields: { enabled: true, label: 'Required Fields Check', priority: 'high' },
      duplicateNames: { enabled: true, label: 'Duplicate City Names', priority: 'medium' }
    }
  },
  hashtags: {
    formatting: {
      nameFormatting: { enabled: true, label: 'Hashtag Formatting', priority: 'medium' },
      hashtagPrefix: { enabled: true, label: 'Hashtag Prefix (#)', priority: 'low' }
    },
    validation: {
      requiredFields: { enabled: true, label: 'Required Fields Check', priority: 'high' },
      duplicateNames: { enabled: true, label: 'Duplicate Hashtags', priority: 'medium' },
      unusedHashtags: { enabled: false, label: 'Unused Hashtags', priority: 'low' }
    }
  },
  submissions: {
    validation: {
      requiredFields: { enabled: true, label: 'Required Fields Check', priority: 'high' },
      pendingSubmissions: { enabled: true, label: 'Long-Pending Submissions', priority: 'medium' },
      duplicateSubmissions: { enabled: true, label: 'Duplicate Submissions', priority: 'medium' }
    }
  },
  restaurant_chains: {
    formatting: {
      nameFormatting: { enabled: true, label: 'Chain Name Formatting', priority: 'medium' }
    },
    validation: {
      requiredFields: { enabled: true, label: 'Required Fields Check', priority: 'high' },
      duplicateNames: { enabled: true, label: 'Duplicate Chain Names', priority: 'medium' }
    }
  }
};

/**
 * DataCleanupButton Component
 */
export const DataCleanupButton = ({ 
  resourceType, 
  data = [], 
  onRefresh,
  className 
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cleanupResults, setCleanupResults] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [issueCount, setIssueCount] = useState(0);
  const [cleanupConfig, setCleanupConfig] = useState(
    DEFAULT_CLEANUP_CONFIGS[resourceType] || {}
  );

  // Get enabled checks count
  const getEnabledChecksCount = useCallback(() => {
    let count = 0;
    Object.values(cleanupConfig).forEach(category => {
      Object.values(category).forEach(check => {
        if (check.enabled) count++;
      });
    });
    return count;
  }, [cleanupConfig]);

  // Handle cleanup analysis
  const handleAnalyze = useCallback(async () => {
    if (!resourceType || !data.length) {
      toast.error('No data available to analyze');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      logInfo(`[DataCleanupButton] Starting analysis for ${resourceType}`, {
        resourceType,
        dataCount: data.length,
        enabledChecks: getEnabledChecksCount()
      });

      const results = await cleanupService.analyzeData(resourceType, data, cleanupConfig);
      
      setCleanupResults(results);
      setIssueCount(results.totalIssues || 0);
      setIsModalOpen(true);

      logInfo(`[DataCleanupButton] Analysis completed`, {
        resourceType,
        issuesFound: results.totalIssues,
        categories: Object.keys(results.issues || {})
      });

      if (results.totalIssues > 0) {
        toast.success(`Found ${results.totalIssues} issues to address`);
      } else {
        toast.success('No data issues found!');
      }
    } catch (error) {
      logError('[DataCleanupButton] Analysis failed:', error);
      toast.error(`Analysis failed: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [resourceType, data, cleanupConfig, getEnabledChecksCount]);

  // Handle cleanup configuration change
  const handleConfigChange = useCallback((category, checkKey, enabled) => {
    setCleanupConfig(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [checkKey]: {
          ...prev[category][checkKey],
          enabled
        }
      }
    }));
  }, []);

  // Handle cleanup modal close
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setCleanupResults(null);
  }, []);

  // Handle cleanup completion
  const handleCleanupComplete = useCallback(async () => {
    setIsModalOpen(false);
    setCleanupResults(null);
    setIssueCount(0);
    
    // Refresh the data
    if (onRefresh) {
      await onRefresh();
    }
    
    toast.success('Data cleanup completed successfully');
  }, [onRefresh]);

  const enabledChecksCount = getEnabledChecksCount();

  return (
    <>
      <button
        onClick={handleAnalyze}
        disabled={isAnalyzing || !data.length || enabledChecksCount === 0}
        className={cn(
          'inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
          'bg-orange-50 text-orange-700 border border-orange-200',
          'hover:bg-orange-100 hover:border-orange-300',
          'disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed',
          'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
          issueCount > 0 && 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
          className
        )}
        title={`Analyze ${resourceType} data (${enabledChecksCount} checks enabled)`}
      >
        {isAnalyzing ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
        ) : (
          <Wrench className="w-4 h-4 mr-2" />
        )}
        
        <span>
          {isAnalyzing ? 'Analyzing...' : 'Data Cleanup'}
        </span>
        
        {issueCount > 0 && (
          <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
            {issueCount}
          </span>
        )}
        
        {enabledChecksCount > 0 && (
          <span className="ml-2 text-xs opacity-75">
            ({enabledChecksCount} checks)
          </span>
        )}
      </button>

      {/* Cleanup Modal */}
      <DataCleanupModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        resourceType={resourceType}
        cleanupResults={cleanupResults}
        cleanupConfig={cleanupConfig}
        onConfigChange={handleConfigChange}
        onCleanupComplete={handleCleanupComplete}
        enabledChecksCount={enabledChecksCount}
      />
    </>
  );
};

export default DataCleanupButton; 