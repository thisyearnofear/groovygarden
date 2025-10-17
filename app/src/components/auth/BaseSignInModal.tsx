import React, { useState } from 'react';
import { useAuthContext } from '../../auth/AuthProvider';
import { X } from 'lucide-react';

interface BaseSignInModalProps {
  onClose: () => void;
}

export const BaseSignInModal: React.FC<BaseSignInModalProps> = ({ onClose }) => {
  const { login, authLoading } = useAuthContext();
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setError(null);
      await login();
      onClose();
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-95 animate-in fade-in zoom-in-95">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Sign in with Base</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-col items-center space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-2">
                Connect your Base Account for seamless authentication and payments
              </p>
              <p className="text-sm text-gray-500">
                Powered by Coinbase • Self-custodial • No seed phrases required
              </p>
            </div>

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
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-center space-x-8">
              <div className="text-center">
                <div className="bg-green-100 rounded-full p-2 w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-600 font-bold">✓</span>
                </div>
                <p className="text-xs text-gray-600">One-tap sign in</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 rounded-full p-2 w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 font-bold">$</span>
                </div>
                <p className="text-xs text-gray-600">USDC payments</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 rounded-full p-2 w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <span className="text-purple-600 font-bold">🔒</span>
                </div>
                <p className="text-xs text-gray-600">Self-custodial</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};