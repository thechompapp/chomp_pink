// src/services/apiClient.js
import useAuthStore from '@/stores/useAuthStore'; // Use alias
import { API_BASE_URL } from '@/config'; // Use alias

const apiClient = async (endpoint, errorContext = 'API Request', options = {}) => {
    const { method = 'GET', headers = {}, body } = options;

    // --- Logging Token Retrieval ---
    let token = null;
    let tokenSource = 'N/A';
    try {
        token = useAuthStore.getState().token;
        tokenSource = token ? 'Zustand Store' : 'Zustand Store (null)';
    } catch (storeError) {
        console.error(`[apiClient ${errorContext}] Error retrieving token from Zustand:`, storeError);
        tokenSource = 'Error accessing store';
    }
    console.log(`[apiClient ${errorContext}] Token retrieved via getState(): ${token ? 'Exists' : 'MISSING/NULL'}. Source: ${tokenSource}`);
    // --- End Logging ---

    const finalEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_BASE_URL}${finalEndpoint}`;

    const requestHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers, // Allow overriding default headers
    };

    // --- Logging Header Attachment ---
    if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
        console.log(`[apiClient ${errorContext}] Authorization header attached.`);
    } else {
        console.log(`[apiClient ${errorContext}] No token found, Authorization header NOT attached.`);
    }
    // --- End Logging ---

    if (import.meta.env.DEV) {
        console.log(`[apiClient ${errorContext}] Request: ${method} ${url}`);
        // Avoid logging sensitive body in production logs
        if (body && typeof body === 'string' && body.includes('password')) {
             console.log(`[apiClient ${errorContext}] Body: [REDACTED_PASSWORD]`);
        } else if (body) {
             console.log(`[apiClient ${errorContext}] Body:`, body);
        }
    }

    try {
        const response = await fetch(url, {
            method,
            headers: requestHeaders,
            // Only include body for relevant methods
            body: (method !== 'GET' && method !== 'HEAD' && body) ? body : undefined,
            // Add cache control for specific needs if required, e.g., for POST/PUT/DELETE
            // cache: 'no-store',
        });

        // Log basic response info
        console.log(`[apiClient ${errorContext}] Response Status: ${response.status} ${response.statusText} for ${method} ${url}`);

        const responseText = await response.text();

        if (!response.ok) {
            let errorMsg = `HTTP error! Status: ${response.status}`;
            let errorDetails = responseText; // Default to raw response text

            try {
                const errorJson = JSON.parse(responseText);
                // Prioritize specific error fields from JSON response
                errorMsg = errorJson.error || errorJson.msg || errorJson.message || errorMsg;
                errorDetails = errorJson; // Use parsed JSON as details if available
            } catch (e) {
                // Failed to parse response text as JSON, use original text
                errorMsg = response.statusText || errorMsg; // Fallback to statusText
                console.warn(`[apiClient ${errorContext}] Response body was not valid JSON:`, responseText);
            }

            console.error(`[apiClient ${errorContext}] Request failed with status ${response.status}. Error: "${errorMsg}". URL: ${url}. Details:`, errorDetails);

            if (response.status === 401) {
                console.warn(`[apiClient ${errorContext}] Unauthorized (401) for ${url}. Triggering logout.`);
                // Trigger logout using the store action
                useAuthStore.getState().logout();
                // Throw a specific, user-friendly error for the UI
                throw new Error('Session expired. Please log in again.');
            }
            // For other client/server errors, throw a more general error using the parsed message
            throw new Error(errorMsg); // Throw the specific error message parsed
        }

        // Handle successful responses without content (e.g., 204 No Content)
        if (response.status === 204 || !responseText) {
            if (import.meta.env.DEV) {
                console.log(`[apiClient ${errorContext}] Success with status ${response.status} (No Content or Empty Body) for ${method} ${url}.`);
            }
            // Return a standard success indicator for non-content responses
            // For DELETE, it might be better to return nothing or { success: true }
             return (method === 'DELETE') ? { success: true } : null;
        }

        // Attempt to parse successful responses as JSON
        try {
            const jsonData = JSON.parse(responseText);
            // if (import.meta.env.DEV) { // Optional: Log successful data only in dev
            //    console.log(`[apiClient ${errorContext}] Success Response Data for ${method} ${url}:`, jsonData);
            // }
            return jsonData;
        } catch (parseError) {
            console.error(`[apiClient ${errorContext}] JSON parse error for successful response (${url}):`, responseText, parseError);
            // If JSON parsing fails even on success, it indicates a backend issue
            throw new Error('Invalid server response format.');
        }

    } catch (error) {
        // Catch fetch errors (network issues) or errors thrown above (like 401 or parsing errors)
        console.error(`[apiClient ${errorContext}] FAILED for ${method} ${url}:`, error.message || error);

        // IMPORTANT: Re-throw the error so React Query or calling code can handle it.
        // Do not just return null here unless specifically intended.
        // If it's the specific session expiry error, re-throw it as is.
        if (error.message === 'Session expired. Please log in again.') {
             throw error;
        }
        // Otherwise, wrap other errors if needed, or re-throw directly
         throw new Error(`Network or processing error during ${errorContext}: ${error.message || 'Request failed'}`);
    }
};

export default apiClient;