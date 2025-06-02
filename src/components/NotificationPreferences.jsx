// NotificationPreferences.jsx - Comprehensive notification preferences component for user profile
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  List, 
  Star, 
  CheckCircle, 
  Save,
  AlertCircle,
  Clock,
  Mail,
  Smartphone,
  Volume2
} from 'lucide-react';
import Button from './UI/Button';
import LoadingSpinner from './UI/LoadingSpinner';

const NotificationPreferences = ({ userId }) => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch user's current notification preferences
  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications/preferences', {
        credentials: 'include',
        headers: { 'X-Bypass-Auth': 'true' } // For development
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }
      
      const data = await response.json();
      if (data.success) {
        setPreferences(data.data);
      } else {
        throw new Error(data.message || 'Failed to load preferences');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Save preferences to server
  const savePreferences = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'X-Bypass-Auth': 'true' // For development
        },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      const data = await response.json();
      if (data.success) {
        setPreferences(data.data);
        setHasChanges(false);
      } else {
        throw new Error(data.message || 'Failed to save preferences');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Update a preference and mark as changed
  const updatePreference = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  // Load preferences on mount
  useEffect(() => {
    fetchPreferences();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner message="Loading notification preferences..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center text-red-600 mb-4">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span className="font-medium">Error loading preferences</span>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchPreferences} variant="secondary" size="sm">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Bell className="w-6 h-6 text-gray-700 mr-3" />
          <h2 className="text-xl font-semibold text-gray-800">Notification Preferences</h2>
        </div>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center space-x-2"
          >
            <span className="text-sm text-orange-600">Unsaved changes</span>
            <Button 
              onClick={savePreferences} 
              disabled={saving}
              size="sm"
              variant="primary"
              className="flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </motion.div>
        )}
      </div>

      {/* Delivery Methods */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
          <Volume2 className="w-5 h-5 mr-2 text-gray-600" />
          Delivery Methods
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Bell className="w-5 h-5 text-blue-500 mr-3" />
              <div>
                <span className="font-medium text-gray-800">In-App Notifications</span>
                <p className="text-sm text-gray-600">Get notified within the app</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences?.inAppNotifications || false}
                onChange={(e) => updatePreference('inAppNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Mail className="w-5 h-5 text-green-500 mr-3" />
              <div>
                <span className="font-medium text-gray-800">Email Notifications</span>
                <p className="text-sm text-gray-600">Receive notifications via email</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences?.emailNotifications || false}
                onChange={(e) => updatePreference('emailNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Smartphone className="w-5 h-5 text-purple-500 mr-3" />
              <div>
                <span className="font-medium text-gray-800">Push Notifications</span>
                <p className="text-sm text-gray-600">Mobile push notifications (coming soon)</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences?.pushNotifications || false}
                onChange={(e) => updatePreference('pushNotifications', e.target.checked)}
                className="sr-only peer"
                disabled
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-disabled:opacity-50"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Notification Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Social Interactions */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide">Social</h4>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Heart className="w-4 h-4 text-red-500 mr-2" />
                <span className="text-sm text-gray-800">Likes & Reactions</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences?.likesEnabled || false}
                  onChange={(e) => updatePreference('likesEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MessageCircle className="w-4 h-4 text-blue-500 mr-2" />
                <span className="text-sm text-gray-800">Comments</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences?.commentsEnabled || false}
                  onChange={(e) => updatePreference('commentsEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <UserPlus className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-sm text-gray-800">New Followers</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences?.followsEnabled || false}
                  onChange={(e) => updatePreference('followsEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Content & Recommendations */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide">Content</h4>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <List className="w-4 h-4 text-purple-500 mr-2" />
                <span className="text-sm text-gray-800">List Activity</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences?.listActivityEnabled || false}
                  onChange={(e) => updatePreference('listActivityEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-500 mr-2" />
                <span className="text-sm text-gray-800">Recommendations</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences?.recommendationsEnabled || false}
                  onChange={(e) => updatePreference('recommendationsEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-sm text-gray-800">Submissions</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences?.submissionsEnabled || false}
                  onChange={(e) => updatePreference('submissionsEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Bell className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-sm text-gray-800">System Announcements</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences?.systemAnnouncementsEnabled || false}
                  onChange={(e) => updatePreference('systemAnnouncementsEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Email Digest Settings */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-gray-600" />
          Email Digest
        </h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Digest Frequency
          </label>
          <select
            value={preferences?.digestFrequency || 'weekly'}
            onChange={(e) => updatePreference('digestFrequency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="never">Never</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Get a summary of your notifications via email
          </p>
        </div>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-4 border-t border-gray-200"
        >
          <Button 
            onClick={savePreferences} 
            disabled={saving}
            variant="primary"
            className="w-full flex items-center justify-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Saving preferences...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save All Changes
              </>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default NotificationPreferences; 