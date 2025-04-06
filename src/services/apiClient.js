import useAuthStore from '@/stores/useAuthStore';
import { API_BASE_URL } from '@/config';

const apiClient = async (endpoint, errorContext = 'API Request', options = {}) => {
    const { method = 'GET', headers = {}, body } = options;
    const token = useAuthStore.getState().token;

    const finalEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
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
    }

    try {
        const response = await fetch(url, {
            method,
            headers: requestHeaders,
            body: (method !== 'GET' && method !== 'HEAD') ? body : undefined,
        });

        const responseText = await response.text();

        if (response.status === 401) {
            console.warn(`[apiClient ${errorContext}] Received 401 Unauthorized for ${url}. Triggering logout.`);
            useAuthStore.getState().logout();
            throw new Error('Session expired or invalid. Please log in again.');
        }

        if (!response.ok) {
            let responseErrorMsg = `HTTP error! Status: ${response.status}`;
            try {
                const errorJson = JSON.parse(responseText);
                responseErrorMsg = errorJson.error || errorJson.msg || errorJson.message || responseErrorMsg;
            } catch (e) {
                responseErrorMsg = response.statusText || responseErrorMsg;
            }
            console.error(`[apiClient ${errorContext}] HTTP error! Status: ${response.status}, URL: ${url}, Response: ${responseText}`);
            throw new Error(responseErrorMsg);
        }

        if (!responseText && response.status === 204) {
            if (import.meta.env.DEV) {
                console.log(`[apiClient ${errorContext}] Received ${response.status} No Content for ${method} ${url}.`);
            }
            return { success: true };
        }

        if (!responseText && method === 'DELETE' && response.status === 200) {
            if (import.meta.env.DEV) {
                console.log(`[apiClient ${errorContext}] Received empty 200 OK for ${method} ${url}. Assuming success.`);
            }
            return { success: true };
        }

        if (!responseText && response.status !== 204) {
            console.warn(`[apiClient ${errorContext}] Received unexpected empty response body for ${method} ${url} (Status: ${response.status}). Returning null.`);
            return null;
        }

        try {
            const jsonData = JSON.parse(responseText);
            return jsonData;
        } catch (parseError) {
            console.error(`[apiClient ${errorContext}] Failed to parse JSON response for ${url}:`, responseText, parseError);
            throw new Error(`Failed to parse server response.`);
        }
    } catch (error) {
        if (error.message === 'Session expired or invalid. Please log in again.') {
            throw error;
        }
        console.error(`[apiClient ${errorContext}] Fetch/processing error for ${url}:`, error);
        throw new Error(`Error during ${errorContext}: ${error.message || 'Network request failed or response handling error'}`);
    }
};

export default apiClient;