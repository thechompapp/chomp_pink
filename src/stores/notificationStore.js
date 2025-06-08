// Notification Store - Zustand store for managing notification state and real-time updates
// Handles notification data, preferences, real-time connections, and UI state

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { produce } from 'immer';
import apiClient from '@/services/apiClient';
import { logInfo, logError, logDebug } from '@/utils/logger';

/**
 * Notification Store State Structure
 */
const initialState = {
  // Notification data
  notifications: [],
  unreadCount: 0,
  hasMore: true,
  currentPage: 1,
  totalPages: 1,
  
  // UI state
  isLoading: false,
  isLoadingMore: false,
  error: null,
  isNotificationPanelOpen: false,
  
  // Real-time connection
  isConnected: false,
  connectionError: null,
  eventSource: null,
  
  // User preferences
  preferences: null,
  isPreferencesLoading: false,
  preferencesError: null,
  
  // Filters and sorting
  filters: {
    unreadOnly: false,
    type: null
  },
  
  // Selection state (for bulk operations)
  selectedNotifications: new Set(),
  isSelectionMode: false,
  
  // Last fetch timestamp for cache invalidation
  lastFetched: null
};

/**
 * Create notification store with Zustand
 */
export const useNotificationStore = create(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,

      // ========== ACTIONS ==========

      /**
       * Fetch notifications with pagination
       */
      fetchNotifications: async (options = {}) => {
        const { page = 1, append = false, markAsSeen = true } = options;
        const state = get();
        
        // Prevent duplicate requests
        if (state.isLoading || (state.isLoadingMore && append)) return;
        
        try {
          set(
            produce((draft) => {
              if (append) {
                draft.isLoadingMore = true;
              } else {
                draft.isLoading = true;
                draft.error = null;
              }
            })
          );

          const params = new URLSearchParams({
            page: page.toString(),
            limit: '20',
            mark_as_seen: markAsSeen.toString()
          });

          // Add filters
          if (state.filters.unreadOnly) {
            params.append('unread_only', 'true');
          }
          if (state.filters.type) {
            params.append('type', state.filters.type);
          }

          const response = await apiClient.get(`/notifications?${params}`);
          
          if (response.data.success) {
            set(
              produce((draft) => {
                if (append) {
                  draft.notifications.push(...response.data.data);
                } else {
                  draft.notifications = response.data.data;
                }
                
                draft.currentPage = response.data.pagination.page;
                draft.totalPages = response.data.pagination.pages;
                draft.hasMore = page < response.data.pagination.pages;
                draft.lastFetched = Date.now();
                draft.isLoading = false;
                draft.isLoadingMore = false;
                draft.error = null;
              })
            );

            // Update unread count
            get().fetchUnreadCount();
            
            logDebug(`[NotificationStore] Fetched ${response.data.data.length} notifications (page ${page})`);
          }
        } catch (error) {
          logError('[NotificationStore] Error fetching notifications:', error);
          
          set(
            produce((draft) => {
              draft.error = error.response?.data?.message || 'Failed to fetch notifications';
              draft.isLoading = false;
              draft.isLoadingMore = false;
            })
          );
        }
      },

      /**
       * Load more notifications (pagination)
       */
      loadMoreNotifications: async () => {
        const state = get();
        
        if (!state.hasMore || state.isLoadingMore) return;
        
        await get().fetchNotifications({
          page: state.currentPage + 1,
          append: true
        });
      },

      /**
       * Refresh notifications (pull to refresh)
       */
      refreshNotifications: async () => {
        const state = get();
        
        // Reset pagination state
        set(
          produce((draft) => {
            draft.currentPage = 1;
            draft.hasMore = true;
          })
        );
        
        await get().fetchNotifications({ page: 1, append: false });
      },

      /**
       * Fetch unread notification count
       */
      fetchUnreadCount: async () => {
        try {
          const response = await apiClient.get('/notifications/unread-count');
          
          if (response.data.success) {
            set(
              produce((draft) => {
                draft.unreadCount = response.data.data.count;
              })
            );
          }
        } catch (error) {
          logError('[NotificationStore] Error fetching unread count:', error);
        }
      },

      /**
       * Mark notification(s) as read
       */
      markAsRead: async (notificationIds) => {
        try {
          const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
          
          // Optimistically update UI
          set(
            produce((draft) => {
              draft.notifications.forEach(notification => {
                if (ids.includes(notification.id) && !notification.isRead) {
                  notification.isRead = true;
                  notification.readAt = new Date().toISOString();
                  draft.unreadCount = Math.max(0, draft.unreadCount - 1);
                }
              });
            })
          );

          let response;
          if (ids.length === 1) {
            response = await apiClient.post(`/notifications/${ids[0]}/read`);
          } else {
            response = await apiClient.post('/notifications/read-multiple', {
              notification_ids: ids
            });
          }

          if (response.data.success) {
            logInfo(`[NotificationStore] Marked ${ids.length} notifications as read`);
            
            // Update unread count from server to ensure accuracy
            get().fetchUnreadCount();
          }
        } catch (error) {
          logError('[NotificationStore] Error marking notifications as read:', error);
          
          // Revert optimistic update on error
          set(
            produce((draft) => {
              draft.notifications.forEach(notification => {
                if (notificationIds.includes(notification.id)) {
                  notification.isRead = false;
                  notification.readAt = null;
                }
              });
            })
          );
          
          throw error;
        }
      },

      /**
       * Mark all notifications as read
       */
      markAllAsRead: async () => {
        try {
          const state = get();
          const unreadNotifications = state.notifications.filter(n => !n.isRead);
          
          if (unreadNotifications.length === 0) return;
          
          // Optimistically update UI
          set(
            produce((draft) => {
              draft.notifications.forEach(notification => {
                if (!notification.isRead) {
                  notification.isRead = true;
                  notification.readAt = new Date().toISOString();
                }
              });
              draft.unreadCount = 0;
            })
          );

          const response = await apiClient.post('/notifications/read-all');
          
          if (response.data.success) {
            logInfo(`[NotificationStore] Marked all notifications as read`);
          }
        } catch (error) {
          logError('[NotificationStore] Error marking all notifications as read:', error);
          
          // Revert optimistic update
          get().refreshNotifications();
          throw error;
        }
      },

      /**
       * Delete notification(s)
       */
      deleteNotification: async (notificationId) => {
        try {
          // Optimistically remove from UI
          const state = get();
          const notification = state.notifications.find(n => n.id === notificationId);
          
          set(
            produce((draft) => {
              draft.notifications = draft.notifications.filter(n => n.id !== notificationId);
              if (notification && !notification.isRead) {
                draft.unreadCount = Math.max(0, draft.unreadCount - 1);
              }
            })
          );

          const response = await apiClient.delete(`/notifications/${notificationId}`);
          
          if (response.data.success) {
            logInfo(`[NotificationStore] Deleted notification ${notificationId}`);
          }
        } catch (error) {
          logError('[NotificationStore] Error deleting notification:', error);
          
          // Revert optimistic update
          get().refreshNotifications();
          throw error;
        }
      },

      /**
       * Set notification filters
       */
      setFilters: (newFilters) => {
        set(
          produce((draft) => {
            draft.filters = { ...draft.filters, ...newFilters };
            draft.currentPage = 1;
            draft.hasMore = true;
          })
        );
        
        // Refetch with new filters
        get().fetchNotifications({ page: 1 });
      },

      /**
       * Toggle notification panel open/close
       */
      toggleNotificationPanel: () => {
        set(
          produce((draft) => {
            draft.isNotificationPanelOpen = !draft.isNotificationPanelOpen;
          })
        );
        
        const state = get();
        
        // Fetch notifications when opening panel if not already loaded
        if (state.isNotificationPanelOpen && state.notifications.length === 0) {
          get().fetchNotifications();
        }
      },

      /**
       * Close notification panel
       */
      closeNotificationPanel: () => {
        set(
          produce((draft) => {
            draft.isNotificationPanelOpen = false;
          })
        );
      },

      // ========== REAL-TIME CONNECTION ==========

      /**
       * Connect to real-time notification stream
       */
      connectToNotificationStream: () => {
        const state = get();
        
        // Don't connect if already connected
        if (state.isConnected || state.eventSource) return;

        try {
          logInfo('[NotificationStore] Connecting to notification stream...');
          
          const eventSource = new EventSource('/api/notifications/stream', {
            withCredentials: true
          });

          eventSource.onopen = () => {
            set(
              produce((draft) => {
                draft.isConnected = true;
                draft.connectionError = null;
                draft.eventSource = eventSource;
              })
            );
            
            logInfo('[NotificationStore] Connected to notification stream');
          };

          eventSource.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              get().handleRealTimeMessage(data);
            } catch (error) {
              logError('[NotificationStore] Error parsing SSE message:', error);
            }
          };

          eventSource.onerror = (error) => {
            logError('[NotificationStore] SSE connection error:', error);
            
            set(
              produce((draft) => {
                draft.isConnected = false;
                draft.connectionError = 'Connection lost';
              })
            );
            
            // Close the failed connection
            eventSource.close();
            
            // Only try to reconnect after a delay if we're not already disconnecting
            const currentState = get();
            if (!currentState.isConnected) {
              setTimeout(() => {
                const latestState = get();
                // Only reconnect if we're still not connected and don't have an active connection
                if (!latestState.isConnected && !latestState.eventSource) {
                  get().reconnectToNotificationStream();
                }
              }, 5000);
            }
          };

        } catch (error) {
          logError('[NotificationStore] Error setting up notification stream:', error);
          
          set(
            produce((draft) => {
              draft.connectionError = 'Failed to connect to notification stream';
            })
          );
        }
      },

      /**
       * Disconnect from notification stream
       */
      disconnectFromNotificationStream: () => {
        const state = get();
        
        if (state.eventSource) {
          state.eventSource.close();
        }
        
        set(
          produce((draft) => {
            draft.isConnected = false;
            draft.eventSource = null;
            draft.connectionError = null;
          })
        );
        
        logInfo('[NotificationStore] Disconnected from notification stream');
      },

      /**
       * Reconnect to notification stream
       */
      reconnectToNotificationStream: () => {
        const state = get();
        
        if (state.isConnected) return;
        
        get().disconnectFromNotificationStream();
        
        setTimeout(() => {
          get().connectToNotificationStream();
        }, 1000);
      },

      /**
       * Handle real-time messages
       */
      handleRealTimeMessage: (message) => {
        const { type, data } = message;
        
        switch (type) {
          case 'notification':
            // New notification received
            set(
              produce((draft) => {
                // Add to beginning of list if it's not already there
                const exists = draft.notifications.find(n => n.id === data.id);
                if (!exists) {
                  draft.notifications.unshift(data);
                  if (!data.isRead) {
                    draft.unreadCount += 1;
                  }
                }
              })
            );
            
            logDebug('[NotificationStore] Received real-time notification:', data);
            break;
            
          case 'unread_count':
            // Unread count update
            set(
              produce((draft) => {
                draft.unreadCount = data.count;
              })
            );
            break;
            
          case 'notifications_read':
            // Notifications marked as read
            set(
              produce((draft) => {
                draft.notifications.forEach(notification => {
                  if (data.readIds.includes(notification.id)) {
                    notification.isRead = true;
                    notification.readAt = new Date().toISOString();
                  }
                });
                draft.unreadCount = data.newUnreadCount;
              })
            );
            break;
            
          case 'connected':
            logInfo('[NotificationStore] Real-time connection established');
            break;
            
          case 'heartbeat':
            // Connection is alive
            break;
            
          default:
            logDebug('[NotificationStore] Unknown real-time message type:', type);
        }
      },

      // ========== PREFERENCES ==========

      /**
       * Fetch notification preferences
       */
      fetchPreferences: async () => {
        try {
          set(
            produce((draft) => {
              draft.isPreferencesLoading = true;
              draft.preferencesError = null;
            })
          );

          const response = await apiClient.get('/notifications/preferences');
          
          if (response.data.success) {
            set(
              produce((draft) => {
                draft.preferences = response.data.data;
                draft.isPreferencesLoading = false;
              })
            );
          }
        } catch (error) {
          logError('[NotificationStore] Error fetching preferences:', error);
          
          set(
            produce((draft) => {
              draft.preferencesError = error.response?.data?.message || 'Failed to fetch preferences';
              draft.isPreferencesLoading = false;
            })
          );
        }
      },

      /**
       * Update notification preferences
       */
      updatePreferences: async (updates) => {
        try {
          const response = await apiClient.put('/notifications/preferences', updates);
          
          if (response.data.success) {
            set(
              produce((draft) => {
                draft.preferences = response.data.data;
                draft.preferencesError = null;
              })
            );
            
            logInfo('[NotificationStore] Updated notification preferences');
          }
        } catch (error) {
          logError('[NotificationStore] Error updating preferences:', error);
          
          set(
            produce((draft) => {
              draft.preferencesError = error.response?.data?.message || 'Failed to update preferences';
            })
          );
          
          throw error;
        }
      },

      // ========== SELECTION & BULK OPERATIONS ==========

      /**
       * Toggle selection mode
       */
      toggleSelectionMode: () => {
        set(
          produce((draft) => {
            draft.isSelectionMode = !draft.isSelectionMode;
            if (!draft.isSelectionMode) {
              draft.selectedNotifications.clear();
            }
          })
        );
      },

      /**
       * Toggle notification selection
       */
      toggleNotificationSelection: (notificationId) => {
        set(
          produce((draft) => {
            if (draft.selectedNotifications.has(notificationId)) {
              draft.selectedNotifications.delete(notificationId);
            } else {
              draft.selectedNotifications.add(notificationId);
            }
          })
        );
      },

      /**
       * Select all notifications
       */
      selectAllNotifications: () => {
        const state = get();
        
        set(
          produce((draft) => {
            draft.selectedNotifications.clear();
            state.notifications.forEach(notification => {
              draft.selectedNotifications.add(notification.id);
            });
          })
        );
      },

      /**
       * Clear selection
       */
      clearSelection: () => {
        set(
          produce((draft) => {
            draft.selectedNotifications.clear();
          })
        );
      },

      /**
       * Mark selected notifications as read
       */
      markSelectedAsRead: async () => {
        const state = get();
        const selectedIds = Array.from(state.selectedNotifications);
        
        if (selectedIds.length === 0) return;
        
        await get().markAsRead(selectedIds);
        get().clearSelection();
      },

      // ========== UTILITY FUNCTIONS ==========

      /**
       * Reset store to initial state
       */
      reset: () => {
        const state = get();
        
        // Disconnect from stream
        if (state.eventSource) {
          state.eventSource.close();
        }
        
        set(initialState);
      },

      /**
       * Get notification by ID
       */
      getNotificationById: (notificationId) => {
        const state = get();
        return state.notifications.find(n => n.id === notificationId);
      },

      /**
       * Check if notifications need refresh
       */
      shouldRefreshNotifications: () => {
        const state = get();
        const now = Date.now();
        const staleTime = 5 * 60 * 1000; // 5 minutes
        
        return !state.lastFetched || (now - state.lastFetched) > staleTime;
      }
    })),
    {
      name: 'notification-store'
    }
  )
);

// ========== SELECTORS ==========

/**
 * Memoized selectors for better performance
 */
export const useUnreadNotifications = () => 
  useNotificationStore(state => state.notifications.filter(n => !n.isRead));

export const useNotificationsByType = (type) =>
  useNotificationStore(state => 
    type ? state.notifications.filter(n => n.notificationType === type) : state.notifications
  );

export const useSelectedNotificationsCount = () =>
  useNotificationStore(state => state.selectedNotifications.size);

export const useHasUnreadNotifications = () =>
  useNotificationStore(state => state.unreadCount > 0);

// ========== AUTO-CONNECT TO REAL-TIME STREAM ==========

// Auto-connect when store is created (if user is authenticated)
if (typeof window !== 'undefined') {
  // Wait for auth context to be ready
  setTimeout(() => {
    const { connectToNotificationStream } = useNotificationStore.getState();
    connectToNotificationStream();
  }, 1000);
}

export default useNotificationStore; 