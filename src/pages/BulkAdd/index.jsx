// src/pages/BulkAdd/index.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Upload, AlertTriangle } from 'lucide-react';
import Button from '@/components/Button';
import useAuthStore from '@/stores/useAuthStore';
import apiClient from '@/services/apiClient';
import { GOOGLE_PLACES_API_KEY } from '@/config'; // API Base URL not needed here

const BulkAdd = () => {
  const navigate = useNavigate();
  // Select specific state needed
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const userAccountType = useAuthStore(state => state.user?.account_type);
  const isAdmin = userAccountType === 'superuser'; // Only superusers have access

  const [inputData, setInputData] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);

  // Check for Google API key on mount (only if admin)
  useEffect(() => {
    if (isAdmin && !GOOGLE_PLACES_API_KEY) {
      setIsApiKeyMissing(true);
      console.warn("[BulkAdd] Google Places API Key (VITE_GOOGLE_PLACES_API_KEY) is missing. Address/Place ID lookup will be skipped.");
    }
  }, [isAdmin]); // Run only once when admin status is known

  const handleInputChange = (e) => {
    setInputData(e.target.value);
    setError('');
    setSuccessMessage('');
  };

  // Fetches Place ID and Formatted Address using Google Find Place API
  const fetchPlaceDetails = async (placeName, city) => {
    // Skip fetch if API key is missing
    if (!GOOGLE_PLACES_API_KEY) return null;

    // Construct a more specific query if city is provided
    const queryInput = city ? `${placeName}, ${city}` : placeName;

    try {
      // Use Find Place From Text request