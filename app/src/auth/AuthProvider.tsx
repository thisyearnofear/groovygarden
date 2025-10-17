import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { UserDetailsPanel } from './UserDetailsPanel';
import { Client } from '@hey-api/client-fetch';
import { UserDetails } from '../types/auth-types';

interface AuthContextType {
    isLoggedIn: boolean;
    userDetails: UserDetails | null;
    authLoading: boolean;
    token: string | null;
    logout: () => void;
    login: () => Promise<void>;
    clientReady: boolean;
    appName?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
};

export const SignedIn: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isLoggedIn, clientReady } = useAuthContext();
    
    if (!clientReady || !isLoggedIn) {
        return null;
    }
    
    return <>{children}</>;
};

export const SignedOut: React.FC<{ children?: ReactNode }> = ({ children }) => {
    const { isLoggedIn, clientReady, authLoading } = useAuthContext();

    if (!clientReady || authLoading) {
        // Show a subtle loading indicator in the corner instead of full screen
        return (
            <>
                {children}
                <div className="fixed top-4 right-4 z-50">
                    <div className="bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                        <span className="text-gray-700 text-sm font-medium">Connecting...</span>
                    </div>
                </div>
            </>
        );
    }

    if (isLoggedIn) {
        return null;
    }

    return <>{children}</>;
};

interface AuthProviderProps {
    children: ReactNode;
    client: Client;
    baseInfranodeUrl: string;
    clientId: string;
    loginRedirectUrl?: string;
    appName?: string;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, client, baseInfranodeUrl, loginRedirectUrl, clientId, appName }) => {
    const [authToken, setAuthToken] = useState<string | null>(null);
    // Use the passed baseInfranodeUrl instead of hardcoding HTTPS
    const baseUrl = baseInfranodeUrl;

    console.log('🔐 AuthProvider Config:', { baseUrl, baseInfranodeUrl, loginRedirectUrl, clientId });
    const {
        isLoggedIn,
        userDetails,
        authLoading,
        login,
        logout,
        token
    } = useAuth();

    useEffect(() => {
        if (isLoggedIn && userDetails?.address) {
            // For Base Accounts, we can use the address as authorization
            setAuthToken(userDetails.address!);
        }
    }, [isLoggedIn, userDetails]);

    const clientReady = !authLoading;
    console.log('AuthProvider state:', { isLoggedIn, authLoading, clientReady });

    return (
        <AuthContext.Provider value={{ isLoggedIn, userDetails, authLoading, token: authToken, logout, login, clientReady, appName }}>
            {children}
            
        </AuthContext.Provider>
    );
};