/* src/services/apiClient.ts */
import useAuthStore from '@/stores/useAuthStore'; // Use global alias
import { API_BASE_URL } from '@/config'; // Use global alias

// Interface for standard API options
interface ApiClientOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';
    headers?: Record<string, string>;
    body?: string; // Expecting stringified JSON body
    signal?: AbortSignal;
}

// Standardized pagination structure (if used by backend)
// Exporting this allows other services to potentially type their responses better
export interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// Standardized API response structure
// Use a more specific error field, default data to 'unknown' initially
export interface ApiResponse<T = unknown> {
    data: T | null; // Use 'unknown' as default, allowing specific types later
    message?: string; // General message (success or info)
    pagination?: Pagination; // Optional pagination info
    success: boolean; // Indicate overall success/failure
    error?: string; // Specific error message from backend or client
    status?: number; // Add HTTP status for context
}

// Custom Error class to include ApiResponse details
class ApiError extends Error {
    status: number;
    response?: ApiResponse<null>; // Include response structure in error

    constructor(message: string, status: number, response?: ApiResponse<null>) {
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
 *
 * @template T The expected type of the 'data' field in a successful response. Defaults to 'unknown'.
 * @param {string} endpoint The API endpoint (e.g., '/users').
 * @param {string} [errorContext='API Request'] Context for error logging.
 * @param {ApiClientOptions} [options={}] Fetch options (method, headers, body, signal).
 * @returns {Promise<ApiResponse<T>>} A promise resolving to the standardized API response.
 */
const apiClient = async <T = unknown>(
    endpoint: string,
    errorContext = 'API Request',
    options: ApiClientOptions = {}
): Promise<ApiResponse<T>> => {
    const { method = 'GET', headers = {}, body, signal } = options;

    let token: string | null = null;
    try {
        // Fetch token directly from store state
        token = useAuthStore.getState().token;
        // Avoid logging token value itself for security, just its presence
        // console.log(`[apiClient ${errorContext}] Token Status:`, token ? 'Present' : 'Absent');
    } catch (storeError) {
        console.error(`[apiClient ${errorContext}] Error accessing auth store:`, storeError);
        // Proceed without token, but log the error
    }

    const finalEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_BASE_URL}${finalEndpoint}`;

    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...headers,
    };

    if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Development logging (optional)
    if (import.meta.env.DEV) {
        console.log(`[apiClient ${errorContext}] Requesting: ${method} ${url}`, {
            headers: requestHeaders, // Be careful logging sensitive headers
            body: body ? '(Body Present)' : '(No Body)',
        });
    }

    try {
        const response = await fetch(url, {
            method,
            headers: requestHeaders,
            // Only include body for relevant methods and if body is provided
            body: (method !== 'GET' && method !== 'HEAD' && body) ? body : undefined,
            signal,
        });

        // --- Handle Response ---
        let responseBodyText: string | null = null;
        try {
             responseBodyText = await response.text();
        } catch (textError) {
            console.warn(`[apiClient ${errorContext}] Could not read response body text for ${response.status} at ${url}:`, textError);
            // Continue processing status code even if body is unreadable
        }


        if (!response.ok) {
            let errorMsg = `HTTP error! Status: ${response.status}`;
            let parsedError: any = null;
            let apiResponseMessage: string | undefined = undefined;

            try {
                if (responseBodyText) {
                    parsedError = JSON.parse(responseBodyText);
                    // Prioritize specific 'message' or 'error' field from backend JSON error
                    errorMsg = parsedError.message || parsedError.error || errorMsg;
                    apiResponseMessage = parsedError.message; // Store message separately if needed
                } else {
                    // Use status text if body is empty or unparseable
                    errorMsg = response.statusText || errorMsg;
                }
            } catch (e) {
                // JSON parsing failed, stick with the initial HTTP error message or status text
                errorMsg = response.statusText || errorMsg;
                console.warn(`[apiClient ${errorContext}] Failed to parse error response body for status ${response.status}:`, responseBodyText);
            }

             // Construct standardized error response structure
             const errorResponse: ApiResponse<null> = {
                 data: null,
                 success: false,
                 error: errorMsg, // Use the refined error message
                 message: apiResponseMessage, // Include original message if available
                 status: response.status
             };

            console.error(`[apiClient ${errorContext}] Request Failed: ${response.status} - "${errorMsg}". URL: ${url}.`);

            // Specific handling for 401 Unauthorized
            if (response.status === 401) {
                console.warn(`[apiClient ${errorContext}] Unauthorized (401) - Possible expired token or invalid credentials.`);
                // Trigger logout only if a token was actually used for the request
                if (token) {
                    console.log(`[apiClient ${errorContext}] Invalidating session due to 401 with token.`);
                    useAuthStore.getState().logout(); // Assuming logout clears token and user state
                     errorResponse.error = 'Your session has expired. Please log in again.'; // User-friendly message
                } else {
                     errorResponse.error = 'Authentication required. Please log in.';
                }
                 throw new ApiError(errorResponse.error, response.status, errorResponse);
            }

            // Throw a custom error containing the standardized response
             throw new ApiError(errorMsg, response.status, errorResponse);
        }

        // Handle success responses (including 204 No Content)
        if (response.status === 204 || !responseBodyText) {
            if (import.meta.env.DEV) {
                console.log(`[apiClient ${errorContext}] Success (Status: ${response.status}): No Content from ${url}`);
            }
             // Ensure correct generic type T for data (null in this case)
             return { data: null, success: true, status: response.status } as ApiResponse<T>;
        }

        // Attempt to parse successful JSON response
        try {
            const jsonData = JSON.parse(responseBodyText);

            // Standardize the successful response structure
            const standardizedResponse: ApiResponse<T> = {
                // Prefer 'data' field if backend nests, otherwise assume top-level is data
                data: jsonData.data ?? jsonData ?? null,
                success: jsonData.success !== false, // Default to true if success field is missing
                message: jsonData.message || undefined,
                pagination: jsonData.pagination || undefined,
                error: jsonData.error || undefined, // Include error even in success if API provides it
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

    } catch (error: unknown) {
         // Catch network errors, previously thrown ApiErrors, or other exceptions
        console.error(`[apiClient ${errorContext}] FAILED Execution:`, error);

         // If it's already our custom ApiError, re-throw it
         if (error instanceof ApiError) {
             throw error;
         }

         // Create a generic ApiError for other cases
         const errorMessage = error instanceof Error ? error.message : 'Network request failed or an unexpected error occurred.';
         const genericApiError = new ApiError(errorMessage, 500, { // Default to 500 for unknown/network errors
             data: null,
             success: false,
             error: errorMessage,
             status: 500,
         });
         throw genericApiError;
    }
};

export default apiClient;

// Re-export ApiError if needed by other modules
export { ApiError };