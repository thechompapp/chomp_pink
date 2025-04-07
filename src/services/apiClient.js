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
            body: method !== 'GET' && method !== 'HEAD' ? body : undefined,
        });

        const responseText = await response.text();

        if (!response.ok) {
            let errorMsg = `HTTP error! Status: ${response.status}`;
            try {
                const errorJson = JSON.parse(responseText);
                errorMsg = errorJson.error || errorJson.msg || errorJson.message || errorMsg;
            } catch (e) {
                errorMsg = response.statusText || errorMsg;
            }

            if (response.status === 401) {
                console.warn(`[apiClient ${errorContext}] Unauthorized for ${url}. Logging out.`);
                useAuthStore.getState().logout();
                throw new Error('Session expired. Please log in again.');
            } else if (response.status >= 400 && response.status < 500) {
                console.error(`[apiClient ${errorContext}] Client error ${response.status} at ${url}: ${responseText}`);
                throw new Error(`Request failed: ${errorMsg}`);
            } else if (response.status >= 500) {
                console.error(`[apiClient ${errorContext}] Server error ${response.status} at ${url}: ${responseText}`);
                throw new Error(`Server error: ${errorMsg}`);
            }
        }

        if (!responseText && response.status === 204) {
            if (import.meta.env.DEV) {
                console.log(`[apiClient ${errorContext}] No Content for ${method} ${url}.`);
            }
            return { success: true };
        }

        if (!responseText && method === 'DELETE' && response.status === 200) {
            if (import.meta.env.DEV) {
                console.log(`[apiClient ${errorContext}] Empty 200 OK for ${method} ${url}.`);
            }
            return { success: true };
        }

        if (!responseText && response.status !== 204) {
            console.warn(`[apiClient ${errorContext}] Empty response for ${method} ${url} (Status: ${response.status}).`);
            return null;
        }

        try {
            return JSON.parse(responseText);
        } catch (parseError) {
            console.error(`[apiClient ${errorContext}] JSON parse error for ${url}:`, responseText, parseError);
            throw new Error('Invalid server response format.');
        }
    } catch (error) {
        console.error(`[apiClient ${errorContext}] Fetch error for ${url}:`, error);
        throw error.message === 'Session expired. Please log in again.'
            ? error
            : new Error(`Network error during ${errorContext}: ${error.message || 'Request failed'}`);
    }
};

export default apiClient;