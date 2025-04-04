// src/pages/AdminPanel/index.jsx
import React, { useState, useCallback } from "react";
import { useQuery, useQueryClient } from '@tanstack/react-query'; // Keep useQueryClient here
import { API_BASE_URL } from "@/config";
import Button from "@/components/Button";
import { ChevronDown, ChevronUp, Edit, Trash, Loader2 } from "lucide-react";
import LoadingSpinner from "@/components/UI/LoadingSpinner";
import ErrorMessage from "@/components/UI/ErrorMessage";
// Removed direct import of queryClient from main, useQueryClient hook provides it

// ... Fetcher, validation functions ...
const fetchAdminData = async (type, sort) => { /* ... */ };

// Component Definition
const AdminPanel = React.memo(() => {
  const queryClient = useQueryClient(); // Get client via hook

  // ... state ...
  const {
      data: items = [], isLoading, isError, error, refetch
  } = useQuery({ /* ... query config ... */ });

  // --- Event Handlers ---
  // ... handleTabChange, handleSort, handleEdit ...

  const handleSave = useCallback(async () => {
    // ... save logic ...
    try {
        // ... API call ...
        setEditingItem(null);
        // Invalidate queries using the client from the hook
        queryClient.invalidateQueries({ queryKey: ['adminData', activeTab, sort] });
        queryClient.invalidateQueries({ queryKey: ['trendingData'] });
        queryClient.invalidateQueries({ queryKey: ['trendingPageData'] });
        console.log(`[AdminPanel] Invalidated admin and trending queries after saving ${type} ID: ${id}`);
    } catch (err) {
       // ... error handling ...
    } finally {
        // ...
    }
  }, [editingItem, activeTab, sort, queryClient]); // Add queryClient dependency

  const handleDelete = useCallback(async (id, type) => {
    // ... delete logic ...
    try {
        // ... API call ...
        // Invalidate queries using the client from the hook
        queryClient.invalidateQueries({ queryKey: ['adminData', activeTab, sort] });
        queryClient.invalidateQueries({ queryKey: ['trendingData'] });
        queryClient.invalidateQueries({ queryKey: ['trendingPageData'] });
        console.log(`[AdminPanel] Invalidated admin and trending queries after deleting ${type} ID: ${id}`);
    } catch (err) {
       // ... error handling ...
    } finally {
       // ...
    }
  }, [activeTab, sort, queryClient]); // Add queryClient dependency

  // ... renderTable ...

  // --- Main Render ---
  return (
      // ... component JSX ...
  );
});

export default AdminPanel;