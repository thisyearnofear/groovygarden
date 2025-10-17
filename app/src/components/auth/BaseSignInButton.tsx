import React, { useState } from 'react';
import { useAuthContext } from '../../auth/AuthProvider';

export const BaseSignInButton: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
    const { login, authLoading } = useAuthContext();
    const [error, setError] = useState<string | null>(null);

    const handleSignIn = async () => {
        try {
            setError(null);
            await login();
            onSuccess?.();
        } catch (err) {
            console.error('Sign in error:', err);
            setError(err instanceof Error ? err.message : 'Failed to connect wallet');
        }
    };

    return (
        <div className="flex flex-col items-center space-y-4">
            <button
                onClick={handleSignIn}
                disabled={authLoading}
                className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
            >
                {authLoading ? (
                    <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Connecting...</span>
                    </>
                ) : (
                    <>
                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-sm">B</span>
                        </div>
                        <span>Sign in with Base</span>
                    </>
                )}
            </button>

            {error && (
                <div className="max-w-md text-center">
                    <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg border border-red-200">
                        {error}
                    </p>
                    <button
                        onClick={() => setError(null)}
                        className="text-blue-600 text-xs mt-2 hover:underline"
                    >
                        Try again
                    </button>
                </div>
            )}

            <div className="text-center text-gray-600 text-sm max-w-md">
                <p className="mb-2">
                    Connect your Base Account for seamless authentication and payments
                </p>
                <p className="text-xs text-gray-500">
                    Powered by Coinbase • Self-custodial • No seed phrases required
                </p>
            </div>
        </div>
    );
};