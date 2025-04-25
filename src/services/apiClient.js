/*
 * Filename: root/src/services/apiClient.js
 * Description: Centralized Axios instance for making API requests.
 */
import axios from 'axios';
import useAuthStore from '@/stores/useAuthStore.js';
import config from '@/config';

const apiClient = axios.create({
  baseURL: config.API_BASE_URL.replace(/\/api$/, ''), // Remove trailing /api
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (axiosConfig) => {
    const token = useAuthStore.getState().token;
    if (token) {
      axiosConfig.headers = axiosConfig.headers || {};
      axiosConfig.headers['Authorization'] = `Bearer ${token}`;
    }
    return axiosConfig;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data.success === 'boolean') {
        if (response.data.success) {
            return response.data;
        } else {
            console.error('API Error (Success=false):', response.data.message || 'Unknown error');
            return Promise.reject({
                 response: response,
                 message: response.data.message || 'An unexpected error occurred.',
                 errorDetails: response.data.error || null
             });
        }
    }
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response || error.message || error);
    let errorMessage = 'An unexpected network error occurred. Please try again later.';
    let errorDetails = null;

    if (error.response) {
      const { data, status } = error.response;
      if (data && typeof data === 'object') {
          errorMessage = data.message || `Request failed with status code ${status}`;
          errorDetails = data.error || data;
      } else if (typeof data === 'string' && data.length < 200) {
          errorMessage = data;
      } else {
          switch (status) {
              case 400: errorMessage = 'Bad Request. Please check your input.'; break;
              case 401: errorMessage = 'Authentication failed. Please log in again.'; break;
              case 403: errorMessage = 'Forbidden. You do not have permission to perform this action.'; break;
              case 404: errorMessage = 'Resource not found.'; break;
              case 500: errorMessage = 'Internal Server Error. Please try again later.'; break;
              default: errorMessage = `Request failed with status code ${status}`;
          }
      }
       console.error(`API Error: Status ${status}, Message: ${errorMessage}`, errorDetails || '');
    } else if (error.request) {
      errorMessage = 'No response received from server. Check network connection.';
       console.error('API No Response Error:', error.request);
    } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'The request timed out. Please try again.';
        console.error('API Timeout Error:', error.message);
    } else {
      errorMessage = error.message || 'Error setting up request.';
      console.error('API Setup Error:', error.message);
    }

     return Promise.reject({
         message: errorMessage,
         errorDetails: errorDetails,
         status: error.response?.status,
         originalError: error
     });
  }
);

export default apiClient;