// src/services/apiClient.js
import useAuthStore from '@/stores/useAuthStore';
import { API_BASE_URL } from '@/config';

const apiClient = async (endpoint, errorContext = 'API Request', options = {}) => {
    const { method = 'GET', headers = {}, body } = options;
    const token = useAuthStore.getState().token;

    const finalEndpoint = endpoint;
    const url = `${API_BASE_URL}${finalEndpoint}`;

    const requestHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers,
    };

    if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    if (import.meta.env.DEV) {
        console.log(`[apiClient ${errorContext}] ${method} ${url}`);
        console.log(`[apiClient ${errorContext}] Auth token present: ${!!token}`);
        if (body) {
            console.log(`[apiClient ${errorContext}] Request body:`, body);
        }
    }

    try {
        const response = await fetch(url, {
            method,
            headers: requestHeaders,
            body,
        });

        const responseText = await response.text();

        if (response.status === 401) {
            console.warn(`[apiClient ${errorContext}] Received 401 Unauthorized for ${url}. Triggering logout.`);
            useAuthStore.getState().logout();
            throw new Error('Session expired or invalid. Please log in again.');
        }

        if (!response.ok) {
            let responseErrorMsg = `HTTP error! status: ${response.status}`;
            try {
                const errorJson = JSON.parse(responseText);
                responseErrorMsg = errorJson.error || errorJson.msg || errorJson.message || responseErrorMsg;
            } catch (e) {
                responseErrorMsg = response.statusText || responseErrorMsg;
            }
            console.error(`[apiClient ${errorContext}] HTTP error! Status: ${response.status}, Response: ${responseText}`);
            throw new Error(responseErrorMsg);
        }

        if (!responseText) {
            if (options.method === 'DELETE' || response.status === 204) {
                return { success: true };
            }
            console.warn(`[apiClient ${errorContext}] Received empty response body for non-DELETE/204 request.`);
            return null;
        }

        const jsonData = JSON.parse(responseText);

        if (import.meta.env.DEV) {
            if (Array.isArray(jsonData)) {
                console.log(`[apiClient ${errorContext}] Received array with ${jsonData.length} items`);
            } else if (typeof jsonData === 'object' && jsonData !== null) {
                console.log(`[apiClient ${errorContext}] Received data with keys: ${Object.keys(jsonData).join(', ')}`);
            }
        }

        return jsonData;

    } catch (error) {
        if (error.message === 'Session expired or invalid. Please log in again.') {
            throw error;
        }
        console.error(`[apiClient ${errorContext}] Fetch or processing error for ${url}:`, error);
        throw new Error(`Error during ${errorContext}: ${error.message || 'Network request failed or response processing error'}`);
    }
};

export default apiClient;