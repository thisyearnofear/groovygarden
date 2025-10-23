import type { 
  ChainMove,
  DanceChain,
  UserProfile,
  Vote
} from './sdk';

/**
 * Helper functions for handling API responses and errors
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Format a dance chain for display
 */
export function formatDanceChain(chain: DanceChain): DanceChain {
  return {
    ...chain,
    // Add any additional formatting here
    created_at: chain.created_at ? new Date(chain.created_at) : undefined,
    updated_at: chain.updated_at ? new Date(chain.updated_at) : undefined,
  };
}

/**
 * Format chain moves for display
 */
export function formatChainMoves(moves: ChainMove[]): ChainMove[] {
  return moves.map(move => ({
    ...move,
    created_at: move.created_at ? new Date(move.created_at) : undefined,
  }));
}

/**
 * Format user profile for display
 */
export function formatUserProfile(profile: UserProfile): UserProfile {
  return {
    ...profile,
    created_at: profile.created_at ? new Date(profile.created_at) : undefined,
    updated_at: profile.updated_at ? new Date(profile.updated_at) : undefined,
  };
}

/**
 * Format vote for display
 */
export function formatVote(vote: Vote): Vote {
  return {
    ...vote,
    created_at: vote.created_at ? new Date(vote.created_at) : undefined,
  };
}

/**
 * Validate user profile data before submission
 */
export function validateUserProfile(profile: {
  username: string;
  display_name?: string;
  bio?: string;
  location?: string;
  dance_styles?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!profile.username || profile.username.length < 3 || profile.username.length > 30) {
    errors.push('Username must be between 3 and 30 characters');
  }

  if (profile.display_name && profile.display_name.length > 100) {
    errors.push('Display name must be 100 characters or less');
  }

  if (profile.bio && profile.bio.length > 500) {
    errors.push('Bio must be 500 characters or less');
  }

  if (profile.location && profile.location.length > 100) {
    errors.push('Location must be 100 characters or less');
  }

  if (profile.dance_styles && profile.dance_styles.length > 500) {
    errors.push('Dance styles must be 500 characters or less');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate dance chain creation data
 */
export function validateDanceChain(data: {
  title: string;
  description: string;
  category: string;
  max_moves?: number;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.title || data.title.length < 3 || data.title.length > 200) {
    errors.push('Title must be between 3 and 200 characters');
  }

  if (data.description && data.description.length > 1000) {
    errors.push('Description must be 1000 characters or less');
  }

  if (!data.category || data.category.length < 1 || data.category.length > 50) {
    errors.push('Category must be between 1 and 50 characters');
  }

  if (data.max_moves !== undefined && (data.max_moves < 2 || data.max_moves > 50)) {
    errors.push('Max moves must be between 2 and 50');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: any): ApiResponse<null> {
  console.error('API Error:', error);
  
  let message = 'An unexpected error occurred';
  
  if (error.status === 429) {
    message = 'Too many requests. Please try again later.';
  } else if (error.status === 401) {
    message = 'Unauthorized. Please connect your wallet.';
  } else if (error.status === 403) {
    message = 'Access forbidden. Please check your permissions.';
  } else if (error.status === 500) {
    message = 'Server error. Please try again later.';
  } else if (error.message) {
    message = error.message;
  }

  return {
    success: false,
    error: message,
    message,
  };
}