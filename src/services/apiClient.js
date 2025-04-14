/* src/services/apiClient.js */
/* REMOVED: All TypeScript syntax (interfaces, generics, types) */
import useAuthStore from '@/stores/useAuthStore'; // Use global alias
import { API_BASE_URL } from '@/config'; // Use global alias

// Custom Error class to include ApiResponse details
class ApiError extends Error {
    // REMOVED: Type annotations
    status;
    response;

    constructor(message, status, response) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.response = response;
        // Ensure the prototype chain is set correctly
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}

/**
 * Generic API client function.
 */
const apiClient = async (
    endpoint,
    errorContext = 'API Request',
    options = {}
) /* REMOVED: -> Promise<ApiResponse<T>> */ => {
    const { method = 'GET', headers = {}, body, signal } = options;

    let token = null;
    try {
        token = useAuthStore.getState().token;
    } catch (storeError) {
        console.error(`[apiClient ${errorContext}] Error accessing auth store:`, storeError);
    }

    const finalEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_BASE_URL}${finalEndpoint}`;

    const requestHeaders = { // REMOVED: : Record<string, string>
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...headers,
    };

    if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    if (import.meta.env.DEV) {
        console.log(`[apiClient ${errorContext}] Requesting: ${method} ${url}`, {
            headers: requestHeaders,
            body: body ? '(Body Present)' : '(No Body)',
        });
    }

    try {
        const response = await fetch(url, {
            method,
            headers: requestHeaders,
            body: (method !== 'GET' && method !== 'HEAD' && body) ? body : undefined,
            signal,
        });

        let responseBodyText = null;
        try {
             responseBodyText = await response.text();
        } catch (textError) {
            console.warn(`[apiClient ${errorContext}] Could not read response body text for ${response.status} at ${url}:`, textError);
        }


        if (!response.ok) {
            let errorMsg = `HTTP error! Status: ${response.status}`;
            let parsedError = null;
            let apiResponseMessage = undefined;

            try {
                if (responseBodyText) {
                    parsedError = JSON.parse(responseBodyText);
                    errorMsg = parsedError.message || parsedError.error || errorMsg;
                    apiResponseMessage = parsedError.message;
                } else {
                    errorMsg = response.statusText || errorMsg;
                }
            } catch (e) {
                errorMsg = response.statusText || errorMsg;
                console.warn(`[apiClient ${errorContext}] Failed to parse error response body for status ${response.status}:`, responseBodyText);
            }

             const errorResponse/*REMOVED: : ApiResponse<null>*/ = {
                 data: null,
                 success: false,
                 error: errorMsg,
                 message: apiResponseMessage,
                 status: response.status
             };

            console.error(`[apiClient ${errorContext}] Request Failed: ${response.status} - "${errorMsg}". URL: ${url}.`);

            if (response.status === 401) {
                console.warn(`[apiClient ${errorContext}] Unauthorized (401) - Possible expired token or invalid credentials.`);
                if (token) {
                    console.log(`[apiClient ${errorContext}] Invalidating session due to 401 with token.`);
                    useAuthStore.getState().logout();
                     errorResponse.error = 'Your session has expired. Please log in again.';
                } else {
                     errorResponse.error = 'Authentication required. Please log in.';
                }
                 throw new ApiError(errorResponse.error, response.status, errorResponse);
            }

             throw new ApiError(errorMsg, response.status, errorResponse);
        }

        if (response.status === 204 || !responseBodyText) {
            if (import.meta.env.DEV) {
                console.log(`[apiClient ${errorContext}] Success (Status: ${response.status}): No Content from ${url}`);
            }
             return { data: null, success: true, status: response.status }; // REMOVED: as ApiResponse<T>
        }

        try {
            const jsonData = JSON.parse(responseBodyText);

            const standardizedResponse/*REMOVED: : ApiResponse<T>*/ = {
                data: jsonData.data ?? jsonData ?? null,
                success: jsonData.success !== false,
                message: jsonData.message || undefined,
                pagination: jsonData.pagination || undefined,
                error: jsonData.error || undefined,
                status: response.status,
            };

            if (import.meta.env.DEV) {
                console.log(`[apiClient ${errorContext}] Success Response (${response.status} - ${url}):`, standardizedResponse);
            }

            return standardizedResponse;

        } catch (parseError) {
            console.error(`[apiClient ${errorContext}] JSON Parse Error for Success Response (${response.status} - ${url}). Body:`, responseBodyText, parseError);
             const formatError = new ApiError('Invalid server response format.', 500, {
                 data: null,
                 success: false,
                 error: 'Invalid server response format.',
                 status: 500,
             });
             throw formatError;
        }

    } catch (error/*REMOVED: : unknown*/) {
        console.error(`[apiClient ${errorContext}] FAILED Execution:`, error);

         if (error instanceof ApiError) {
             throw error;
         }

         const errorMessage = error instanceof Error ? error.message : 'Network request failed or an unexpected error occurred.';
         const genericApiError = new ApiError(errorMessage, 500, {
             data: null,
             success: false,
             error: errorMessage,
             status: 500,
         });
         throw genericApiError;
    }
};

export default apiClient;
export { ApiError }; // Re-export ApiError