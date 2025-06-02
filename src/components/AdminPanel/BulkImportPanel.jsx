/**
 * Bulk Import Panel Component
 * 
 * Specialized component for handling data import operations
 * Extracted from the monolithic BulkOperationsPanel for better maintainability.
 */

import React from 'react';
import { FileText, Download, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileDropZone } from '@/components/UI/FileDropZone';

export const BulkImportPanel = ({ 
  resourceType, 
  bulkOps 
}) => {
  const getTemplateData = (resourceType) => {
    const templates = {
      restaurants: [
        { name: 'Example Restaurant', address: '123 Main St', city: 'New York', phone: '555-0123' },
        { name: 'Sample Cafe', address: '456 Oak Ave', city: 'Boston', phone: '555-0456' }
      ],
      dishes: [
        { name: 'Pasta Carbonara', description: 'Classic Italian pasta', restaurant_id: 1, price: 15.99 },
        { name: 'Caesar Salad', description: 'Fresh romaine lettuce', restaurant_id: 1, price: 12.99 }
      ],
      users: [
        { email: 'user@example.com', username: 'sampleuser', full_name: 'John Doe', role: 'user' },
        { email: 'admin@example.com', username: 'adminuser', full_name: 'Jane Smith', role: 'admin' }
      ],
      locations: [
        { name: 'Downtown', type: 'neighborhood', parent_name: 'Manhattan', state: 'NY' },
        { name: 'Back Bay', type: 'neighborhood', parent_name: 'Boston', state: 'MA' }
      ],
      hashtags: [
        { name: 'italian', category: 'cuisine' },
        { name: 'vegetarian', category: 'dietary' }
      ],
      restaurant_chains: [
        { name: 'Sample Chain', website: 'https://example.com', description: 'A chain restaurant' },
        { name: 'Another Chain', website: 'https://another.com', description: 'Another example' }
      ]
    };
    return templates[resourceType] || [];
  };

  const downloadTemplate = () => {
    const templateData = getTemplateData(resourceType);
    if (templateData.length === 0) return;
    
    // Convert to CSV
    const headers = Object.keys(templateData[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = templateData.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    );
    
    const csvContent = [csvHeaders, ...csvRows].join('\n');
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resourceType}-template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFormatInstructions = (resourceType) => {
    const instructions = {
      restaurants: [
        'name: Restaurant name (required)',
        'address: Full street address',
        'city: City name',
        'phone: Phone number'
      ],
      dishes: [
        'name: Dish name (required)',
        'description: Dish description',
        'restaurant_id: ID of the restaurant',
        'price: Price in decimal format (e.g., 15.99)'
      ],
      users: [
        'email: Valid email address (required)',
        'username: Unique username (required)',
        'full_name: User\'s full name',
        'role: Either "user" or "admin"'
      ],
      locations: [
        'name: Location name (required)',
        'type: Either "city" or "neighborhood"',
        'parent_name: Parent city/state name',
        'state: State or country code'
      ],
      hashtags: [
        'name: Hashtag name without # symbol (required)',
        'category: Category like "cuisine", "dietary", etc.'
      ],
      restaurant_chains: [
        'name: Chain name (required)',
        'website: Website URL',
        'description: Brief description'
      ]
    };
    return instructions[resourceType] || [];
  };

  return (
    <div className="space-y-6">
      {/* Import Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">
              Import {resourceType} Data
            </h4>
            <p className="text-sm text-blue-700 mb-3">
              Upload a CSV or JSON file to add multiple {resourceType} records at once.
            </p>
            
            {/* Field Requirements */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-800">Required fields:</p>
              <ul className="text-sm text-blue-700 space-y-0.5">
                {getFormatInstructions(resourceType).map((instruction, i) => (
                  <li key={i} className="flex items-start space-x-1">
                    <span className="text-blue-500">•</span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Template Download */}
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-start space-x-3">
            <Download className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900">
                Download Template
              </h4>
              <p className="text-sm text-green-700 mt-1">
                Get a sample CSV file with the correct format and example data
              </p>
            </div>
          </div>
          <button
            onClick={downloadTemplate}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Template</span>
          </button>
        </div>
      </div>

      {/* File Upload */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Upload Your File</h4>
        <FileDropZone
          onFileSelect={bulkOps.handleFileUpload}
          acceptedTypes=".csv,.json"
          isLoading={bulkOps.isLoading}
          maxSize="10MB"
        />
      </div>

      {/* Important Notes */}
      <div className="bg-yellow-50 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-900 mb-2">
              Important Notes
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Files are validated before import to ensure data quality</li>
              <li>• You'll see a preview of all records before final import</li>
              <li>• Invalid records will be highlighted with specific error messages</li>
              <li>• Only valid records will be imported to maintain data integrity</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          onClick={bulkOps.resetOperation}
          className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}; 