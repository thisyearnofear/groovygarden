import { createClient, createConfig, type Client } from '@hey-api/client-fetch';
import { getWalletClient } from '../auth/utils';

// Create a custom client with proper configuration
const config = createConfig({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  // Add auth token automatically
  async onRequest({ request }) {
    // Get wallet client and add the X-User-Address header for Base Accounts
    try {
      const walletClient = await getWalletClient();
      if (walletClient && walletClient.account) {
        request.headers.set('X-User-Address', walletClient.account.address);
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