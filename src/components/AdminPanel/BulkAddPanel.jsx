/**
 * Bulk Add Panel Component
 * 
 * Specialized component for handling bulk add operations via text input
 * Extracted from the monolithic BulkOperationsPanel for better maintainability.
 */

import React, { useState } from 'react';
import { Plus, Type, List, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const BulkAddPanel = ({ 
  resourceType, 
  bulkOps 
}) => {
  const [textInput, setTextInput] = useState('');
  const [inputFormat, setInputFormat] = useState('list'); // 'list' or 'csv'
  
  const getPlaceholderText = (resourceType, format) => {
    if (format === 'csv') {
      const csvExamples = {
        restaurants: 'name,address,city,phone\nBistro Luna,123 Main St,Boston,555-0123\nCafe Roma,456 Oak Ave,Cambridge,555-0456',
        dishes: 'name,description,price,category\nPasta Carbonara,Classic Italian pasta,15.99,Italian\nCaesar Salad,Fresh romaine lettuce,12.99,Salad',
        users: 'email,username,full_name,role\nuser@example.com,johndoe,John Doe,user\nadmin@example.com,janesmith,Jane Smith,admin',
        hashtags: 'name,category\nitalian,cuisine\nvegetarian,dietary',
        restaurant_chains: 'name,website,description\nSample Chain,https://example.com,A chain restaurant',
        locations: 'name,type,parent_name,state\nDowntown,neighborhood,Boston,MA\nBack Bay,neighborhood,Boston,MA'
      };
      return csvExamples[resourceType] || 'field1,field2,field3\nvalue1,value2,value3';
    } else {
      const listExamples = {
        restaurants: 'Joe\'s Pizza, 7 Carmine St, New York, NY 10014\nKatz\'s Delicatessen, 205 E Houston St, New York, NY 10002\nCarbone, 181 Thompson St, New York, NY 10012\nLucali, 575 Henry St, Brooklyn, NY 11231',
        dishes: 'Pasta Carbonara\nCaesar Salad\nMargherita Pizza\nTuna Sashimi',
        users: 'user@example.com\nadmin@example.com\nmanager@example.com',
        hashtags: 'italian\nvegetarian\nspicy\ngluten-free',
        restaurant_chains: 'Sample Chain\nAnother Chain\nThird Chain',
        locations: 'Downtown\nBack Bay\nNorth End\nSouth End'
      };
      return listExamples[resourceType] || 'Item 1\nItem 2\nItem 3';
    }
  };

  const getFormatInstructions = (resourceType, format) => {
    if (format === 'csv') {
      return [
        'First line should contain column headers',
        'Each subsequent line represents one record',
        'Use commas to separate field values',
        'Wrap values containing commas in quotes'
      ];
    } else {
      if (resourceType === 'restaurants') {
        return [
          'Enter one restaurant per line',
          'Format: Name, Address, City, State, ZIP',
          'Example: Joe\'s Pizza, 7 Carmine St, New York, NY 10014',
          'Empty lines will be ignored'
        ];
      } else {
        return [
          'Enter one item per line',
          'Each line will create a new record',
          'Empty lines will be ignored',
          'Additional fields will use default values'
        ];
      }
    }
  };

  const parseInput = () => {
    if (!textInput.trim()) return [];
    
    const lines = textInput.trim().split('\n').filter(line => line.trim());
    
    if (inputFormat === 'csv' && lines.length > 1) {
      const headers = lines[0].split(',').map(h => h.trim());
      return lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        const record = {};
        headers.forEach((header, i) => {
          record[header] = values[i] || '';
        });
        return { ...record, _lineNumber: index + 2 };
      });
    } else {
      // Simple list format - create records with just the name field
      return lines.map((line, index) => ({
        name: line.trim(),
        _lineNumber: index + 1
      }));
    }
  };

  const parsedData = parseInput();
  const validRecords = parsedData.filter(record => record.name && record.name.trim());

  const handleAdd = async () => {
    if (parsedData.length === 0) return;
    
    try {
      // Parse the data into the format expected by the backend
      const preparedData = parsedData.map(record => {
        if (inputFormat === 'csv') {
          // For CSV, we already have the structured data
          return record;
        } else {
          // For simple list format, create a basic record
          if (resourceType === 'restaurants') {
            // Try to parse restaurant name and address from the simple format
            // Examples: "Joe's Pizza, 7 Carmine St, New York, NY 10014"
            const parts = record.name.split(',').map(part => part.trim());
            if (parts.length >= 3) {
              // Parse the third part which might be "New York, NY 10014"
              const locationPart = parts[2];
              const cityStateZip = locationPart.split(' ');
              
              // Try to extract city, state, and zip
              let city = '', state = '', zip = '';
              
              if (cityStateZip.length >= 3) {
                // Last part is likely ZIP code
                zip = cityStateZip[cityStateZip.length - 1];
                // Second to last is likely state
                state = cityStateZip[cityStateZip.length - 2];
                // Everything else is city
                city = cityStateZip.slice(0, -2).join(' ');
              } else if (cityStateZip.length === 2) {
                city = cityStateZip[0];
                state = cityStateZip[1];
              } else {
                city = locationPart;
              }
              
              return {
                name: parts[0],
                address: parts[1],
                city: city,
                state: state,
                zip: zip
              };
            } else {
              return {
                name: record.name.trim(),
                address: '',
                city: '',
                state: '',
                zip: ''
              };
            }
          } else {
            return {
              name: record.name.trim(),
              // Add default fields based on resource type
              ...(resourceType === 'dishes' && { 
                description: '', 
                restaurant_id: null 
              }),
              ...(resourceType === 'users' && { 
                email: record.name.includes('@') ? record.name : `${record.name}@example.com`,
                username: record.name.toLowerCase().replace(/\s+/g, ''),
                role: 'user'
              }),
              ...(resourceType === 'hashtags' && { 
                category: 'general' 
              }),
              ...(resourceType === 'restaurant_chains' && { 
                website: '', 
                description: '' 
              }),
              ...(resourceType === 'locations' && { 
                type: 'neighborhood',
                state: ''
              })
            };
          }
        }
      });

      console.log('Adding records:', preparedData);
      
      // Call the bulk add function from the bulkOps hook
      if (bulkOps.handleBulkAdd) {
        await bulkOps.handleBulkAdd(preparedData);
      } else {
        // Fallback to direct API call if hook method doesn't exist
        const response = await fetch(`/api/admin/${resourceType}/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Bypass-Auth': 'true' // For development
          },
          credentials: 'include',
          body: JSON.stringify({ 
            [resourceType]: preparedData 
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
          console.log('Bulk add successful:', result);
          // Clear the input and reset
          setTextInput('');
          bulkOps.resetOperation();
          // Show success message
          if (window.toast) {
            window.toast.success(`Successfully added ${result.data?.success || preparedData.length} records`);
          }
        } else {
          throw new Error(result.message || 'Bulk add failed');
        }
      }
    } catch (error) {
      console.error('Error adding records:', error);
      // Show error message
      if (window.toast) {
        window.toast.error(`Failed to add records: ${error.message}`);
      } else {
        alert(`Failed to add records: ${error.message}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Info */}
      <div className="bg-purple-50 p-4 rounded-lg">
        <div className="flex items-center space-x-3">
          <Plus className="w-5 h-5 text-purple-600" />
          <div>
            <h4 className="font-medium text-purple-900">
              Bulk Add {resourceType}
            </h4>
            <p className="text-sm text-purple-700 mt-1">
              Add multiple records by typing or pasting text data
            </p>
          </div>
        </div>
      </div>

      {/* Format Selection */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Input Format</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className={cn(
            "relative flex items-start p-4 border rounded-lg cursor-pointer transition-colors",
            inputFormat === 'list' ? "border-purple-500 bg-purple-50" : "border-gray-300 hover:border-gray-400"
          )}>
            <input
              type="radio"
              name="inputFormat"
              value="list"
              checked={inputFormat === 'list'}
              onChange={(e) => setInputFormat(e.target.value)}
              className="sr-only"
            />
            <div className="flex items-start space-x-3 flex-1">
              <List className={cn(
                "w-5 h-5 mt-0.5",
                inputFormat === 'list' ? "text-purple-600" : "text-gray-400"
              )} />
              <div className="flex-1">
                <span className="font-medium text-gray-900">Simple List</span>
                <p className="text-sm text-gray-600 mt-1">
                  One item per line, quick and easy
                </p>
              </div>
            </div>
            {inputFormat === 'list' && (
              <div className="absolute top-3 right-3 w-2 h-2 bg-purple-600 rounded-full"></div>
            )}
          </label>

          <label className={cn(
            "relative flex items-start p-4 border rounded-lg cursor-pointer transition-colors",
            inputFormat === 'csv' ? "border-purple-500 bg-purple-50" : "border-gray-300 hover:border-gray-400"
          )}>
            <input
              type="radio"
              name="inputFormat"
              value="csv"
              checked={inputFormat === 'csv'}
              onChange={(e) => setInputFormat(e.target.value)}
              className="sr-only"
            />
            <div className="flex items-start space-x-3 flex-1">
              <Type className={cn(
                "w-5 h-5 mt-0.5",
                inputFormat === 'csv' ? "text-purple-600" : "text-gray-400"
              )} />
              <div className="flex-1">
                <span className="font-medium text-gray-900">CSV Format</span>
                <p className="text-sm text-gray-600 mt-1">
                  Include multiple fields and values
                </p>
              </div>
            </div>
            {inputFormat === 'csv' && (
              <div className="absolute top-3 right-3 w-2 h-2 bg-purple-600 rounded-full"></div>
            )}
          </label>
        </div>
      </div>

      {/* Format Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">
          {inputFormat === 'csv' ? 'CSV Format Instructions' : 'List Format Instructions'}
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          {getFormatInstructions(resourceType, inputFormat).map((instruction, i) => (
            <li key={i} className="flex items-start space-x-1">
              <span className="text-blue-500">•</span>
              <span>{instruction}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Text Input */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Enter Data</h4>
        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder={getPlaceholderText(resourceType, inputFormat)}
          className="w-full h-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
        />
      </div>

      {/* Parse Preview */}
      {textInput.trim() && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Preview</h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                Parsed {parsedData.length} records, {validRecords.length} valid
              </span>
              {parsedData.length !== validRecords.length && (
                <span className="text-sm text-yellow-600">
                  {parsedData.length - validRecords.length} records missing required fields
                </span>
              )}
            </div>
            
            {validRecords.length > 0 && (
              <div className="max-h-32 overflow-auto">
                <div className="space-y-1 text-sm">
                  {validRecords.slice(0, 5).map((record, i) => (
                    <div key={i} className="text-gray-700">
                      {inputFormat === 'csv' 
                        ? Object.entries(record).filter(([key]) => key !== '_lineNumber').map(([key, value]) => `${key}: ${value}`).join(', ')
                        : record.name
                      }
                    </div>
                  ))}
                  {validRecords.length > 5 && (
                    <div className="text-gray-500 italic">
                      ...and {validRecords.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Validation Warnings */}
      {parsedData.length > 0 && parsedData.length !== validRecords.length && (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900 mb-2">
                Validation Issues
              </h4>
              <p className="text-sm text-yellow-800">
                {parsedData.length - validRecords.length} records are missing required fields and will be skipped.
                Only {validRecords.length} valid records will be added.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          onClick={bulkOps.resetOperation}
          className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleAdd}
          disabled={validRecords.length === 0 || bulkOps.isLoading}
          className={cn(
            "px-4 py-2 rounded transition-colors flex items-center space-x-2",
            validRecords.length > 0 && !bulkOps.isLoading
              ? "bg-purple-600 text-white hover:bg-purple-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          )}
        >
          <Plus className="w-4 h-4" />
          <span>
            {bulkOps.isLoading 
              ? 'Adding...' 
              : `Add ${validRecords.length} Records`
            }
          </span>
        </button>
      </div>
    </div>
  );
}; 