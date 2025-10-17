import { useCallback, useEffect, useState, useRef } from "react";

// Extend window interface for Base SDK
declare global {
    interface Window {
        createBaseAccountSDK?: (config: any) => any;
        base?: {
            pay: (params: any) => Promise<any>;
            getPaymentStatus: (params: any) => Promise<any>;
        };
    }
}

interface UserDetails {
    active: boolean;
    client_id: string;
    sub: string;
    email: string;
    address?: string;
}

interface AuthState {
    isLoggedIn: boolean;
    userDetails: UserDetails | null;
    authLoading: boolean;
    token: string | null;
    login: () => Promise<void>;
    logout: () => void;
}

const storage = {
    get: (key: string) => localStorage.getItem(key),
    set: (key: string, value: string) => localStorage.setItem(key, value),
    remove: (key: string) => localStorage.removeItem(key),
    getUserAddress: () => localStorage.getItem('base_user_address'),
    setUserAddress: (address: string) => localStorage.setItem('base_user_address', address),
    clearAuth: () => {
        localStorage.removeItem('base_user_address');
    }
};

export function useAuth(): AuthState {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const [authLoading, setAuthLoading] = useState<boolean>(true);
    const [sdk, setSdk] = useState<any>(null);

    const auth = {
        initialize: async () => {
            try {
                console.log('Starting auth initialization...');
                // Wait for Base Account SDK to be available
                let retries = 0;
                const maxRetries = 50; // 5 seconds with 100ms intervals
                while (typeof window !== 'undefined' && !window.createBaseAccountSDK && retries < maxRetries) {
                    console.log(`Waiting for SDK... retry ${retries}`);
                    await new Promise(resolve => setTimeout(resolve, 100));
                    retries++;
                }

                // Initialize Base Account SDK
                if (typeof window !== 'undefined' && window.createBaseAccountSDK) {
                    const baseSDK = window.createBaseAccountSDK({
                        appName: 'Degen Dancing',
                        appLogoUrl: 'https://base.org/logo.png',
                    });
                    setSdk(baseSDK);
                    console.log('Base Account SDK initialized successfully');
                } else {
                    console.warn('Base Account SDK not available after waiting');
                }

                const userAddress = storage.getUserAddress();
                console.log('User address from storage:', userAddress);
                if (userAddress) {
                    // Try to get additional profile information
                    let userProfile = null;
                    try {
                        // Initialize SDK if not already done
                        let currentSdk = sdk;
                        if (!currentSdk && typeof window !== 'undefined' && window.createBaseAccountSDK) {
                            currentSdk = window.createBaseAccountSDK({
                                appName: 'Degen Dancing',
                                appLogoUrl: 'https://base.org/logo.png',
                            });
                            setSdk(currentSdk);
                            console.log('Base Account SDK initialized during user restoration');
                        }
                        
                        // Try to get profile info if we have a provider
                        if (currentSdk) {
                            const provider = currentSdk.getProvider();
                            console.log('Provider obtained for existing user:', provider);
                            
                            // Try different possible profile methods
                            const profileMethods = [
                                'eth_getProfile',
                                'wallet_getProfile',
                                'personal_getProfile',
                                'base_getUserProfile'
                            ];
                            
                            for (const method of profileMethods) {
                                try {
                                    const profileResponse = await provider.request({
                                        method: method,
                                        params: [userAddress]
                                    });
                                    if (profileResponse) {
                                        userProfile = profileResponse;
                                        console.log(`User profile from ${method}:`, profileResponse);
                                        break;
                                    }
                                } catch (methodError) {
                                    console.log(`${method} not supported:`, methodError);
                                }
                            }
                        }
                    } catch (profileError) {
                        console.log('Error getting user profile during initialization:', profileError);
                    }
                    
                    setUserDetails({
                        active: true,
                        client_id: "base-account",
                        sub: userAddress,
                        email: `${userAddress.slice(0, 8)}@base.local`,
                        address: userAddress
                    });
                    setIsLoggedIn(true);
                    console.log('User logged in from storage');
                } else {
                    console.log('No user found in storage');
                }
                console.log('Auth initialization completed');
            } catch (err) {
                console.error("Auth initialization failed:", err);
                storage.clearAuth();
                setIsLoggedIn(false);
                setUserDetails(null);
            }
        },

        signIn: async () => {
            try {
                setAuthLoading(true);
                console.log('Attempting to sign in...');

                // Check if Base Account SDK is available
                let currentSdk = sdk;
                if (!currentSdk) {
                    // Try to initialize SDK if not available
                    if (typeof window !== 'undefined' && window.createBaseAccountSDK) {
                        currentSdk = window.createBaseAccountSDK({
                            appName: 'Degen Dancing',
                            appLogoUrl: 'https://base.org/logo.png',
                        });
                        setSdk(currentSdk);
                        console.log('Base Account SDK initialized on demand');
                    }
                }
                
                if (!currentSdk) {
                    throw new Error('Base Account SDK not available. Please refresh the page.');
                }

                // Get the provider from the SDK
                const provider = currentSdk.getProvider();
                console.log('Provider obtained:', provider);
                
                // Generate a fresh nonce for authentication
                const nonce = window.crypto.randomUUID().replace(/-/g, '');
                console.log('Generated nonce:', nonce);
                
                // Connect and authenticate using the wallet_connect method
                console.log('Sending wallet_connect request...');
                const response = await provider.request({
                    method: 'wallet_connect',
                    params: [{
                        version: '1',
                        capabilities: {
                            signInWithEthereum: { 
                                nonce, 
                                chainId: '0x2105' // Base Mainnet - 8453
                            }
                        }
                    }]
                });
                
                console.log('Wallet connect response:', response);
                const { accounts } = response;
                const { address } = accounts[0];
                const { message, signature } = accounts[0].capabilities.signInWithEthereum;
                
                // Try to get additional user profile information if available
                let userProfile = null;
                try {
                    // Check if there are any profile-related methods
                    console.log('Available methods on provider:', Object.keys(provider));
                    
                    // Try to get user profile if the SDK supports it
                    if (provider.request) {
                        // Some Base Account SDK versions might have profile methods
                        try {
                            // Try different possible profile methods
                            const profileMethods = [
                                'eth_getProfile',
                                'wallet_getProfile',
                                'personal_getProfile',
                                'base_getUserProfile'
                            ];
                            
                            for (const method of profileMethods) {
                                try {
                                    const profileResponse = await provider.request({
                                        method: method,
                                        params: [address]
                                    });
                                    if (profileResponse) {
                                        userProfile = profileResponse;
                                        console.log(`User profile from ${method}:`, profileResponse);
                                        break;
                                    }
                                } catch (methodError) {
                                    console.log(`${method} not supported:`, methodError);
                                }
                            }
                        } catch (profileError) {
                            console.log('Profile request not supported or failed:', profileError);
                        }
                    }
                } catch (profileError) {
                    console.log('Error getting user profile:', profileError);
                }
                
                // Store user address
                storage.setUserAddress(address);
                console.log('User address stored:', address);

                // Set user details
                setUserDetails({
                    active: true,
                    client_id: "base-account",
                    sub: address,
                    email: `${address.slice(0, 8)}@base.local`,
                    address: address
                });

                setIsLoggedIn(true);
                console.log('Sign in successful');

            } catch (error: any) {
                console.error('Base Account sign-in failed:', error);
                throw error;
            } finally {
                setAuthLoading(false);
            }
        },

        signOut: async () => {
            try {
                storage.clearAuth();
                setIsLoggedIn(false);
                setUserDetails(null);
                console.log('User signed out');
            } catch (error) {
                console.error("Sign out failed:", error);
            }
        }
    };

    const login = useCallback(async () => {
        await auth.signIn();
    }, [sdk]);

    const logout = useCallback(async () => {
        await auth.signOut();
    }, []);

    const isInitializing = useRef(false);

    useEffect(() => {
        console.log('Auth useEffect triggered');
        if (isInitializing.current) {
            console.log('Auth already initializing, skipping');
            return;
        }
        isInitializing.current = true;
        setAuthLoading(true);
        console.log('Starting auth initialization...');

        auth.initialize().finally(() => {
            setAuthLoading(false);
            isInitializing.current = false;
            console.log('Auth initialization completed');
        });
    }, []);

    return {
        isLoggedIn,
        userDetails,
        authLoading,
        login,
        logout,
        token: null // Base accounts don't use traditional tokens
    };
}