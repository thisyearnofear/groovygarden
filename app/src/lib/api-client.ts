import { createClient, createConfig, type Client } from '@hey-api/client-fetch';

// Get user address from localStorage (Base Account integration)
const getUserAddress = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('base_user_address');
};

// Create a custom client with proper configuration
const config = createConfig({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  // Add auth token automatically
  async onRequest({ request }) {
    // Get user address from localStorage and add the X-User-Address header for Base Accounts
    try {
      const userAddress = getUserAddress();
      if (userAddress) {
        request.headers.set('X-User-Address', userAddress);
      }
    } catch (error) {
      // If wallet is not connected, continue without the header
      console.debug('Wallet not connected, proceeding without X-User-Address header');
    }
    
    return request;
  },
  // Handle responses
  async onResponse({ response }) {
    // Check for rate limit responses
    if (response.status === 429) {
      console.error('Rate limit exceeded:', await response.text());
      // You might want to show a user-friendly message here
    }
    
    return response;
  },
});

export const apiClient: Client = createClient(config);

export default apiClient;