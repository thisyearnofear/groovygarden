import { useState, useCallback, useEffect } from 'react';
import { 
  userServiceGetUserProfile,
  userServiceCreateUserProfile,
  userServiceUpdateUserProfile,
  userServiceGetPublicUserProfile,
  chainServiceCreateDanceChain,
  chainServiceGetDanceChains,
  chainServiceGetDanceChain,
  chainServiceGetChainMoves,
  chainServiceAddMoveToChain,
  votingServiceVoteOnMove,
  votingServiceRemoveVote,
  type UserServiceGetUserProfileResponse,
  type UserServiceCreateUserProfileData,
  type UserServiceUpdateUserProfileData,
  type ChainServiceCreateDanceChainData,
  type ChainServiceGetDanceChainsData,
  type ChainServiceAddMoveToChainData,
  type VotingServiceVoteOnMoveData
} from './sdk';
import { handleApiError, validateUserProfile, validateDanceChain } from './api-helpers';
import { apiClient } from './api-client';

export interface ApiHookState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

/**
 * Custom hook for API calls with loading and error states
 */
export function useApiCall<T, P = void>() {
  const [state, setState] = useState<ApiHookState<T>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  });

  const execute = useCallback(async (apiCall: (params: P) => Promise<T>) => {
    setState({ data: null, loading: true, error: null, success: false });
    
    try {
      const result = await apiCall;
      setState({ data: result, loading: false, error: null, success: true });
      return result;
    } catch (error) {
      const apiError = handleApiError(error);
      setState({ data: null, loading: false, error: apiError.error || 'API call failed', success: false });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null, success: false });
  }, []);

  return { ...state, execute, reset };
}

/**
 * Custom hook for user profile API calls
 */
export function useUserProfile() {
  const [state, setState] = useState<ApiHookState<UserServiceGetUserProfileResponse>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  });

  const fetchProfile = useCallback(async () => {
    setState({ data: null, loading: true, error: null, success: false });
    
    try {
      const result = await userServiceGetUserProfile();
      setState({ data: result, loading: false, error: null, success: true });
      return result;
    } catch (error) {
      const apiError = handleApiError(error);
      setState({ data: null, loading: false, error: apiError.error || 'Failed to fetch profile', success: false });
      throw error;
    }
  }, []);

  const createProfile = useCallback(async (data: UserServiceCreateUserProfileData) => {
    // Validate input
    const validation = validateUserProfile({
      username: data.username,
      display_name: data.display_name || undefined,
      bio: data.bio || undefined,
      location: data.location || undefined,
      dance_styles: data.dance_styles || undefined,
    });
    
    if (!validation.valid) {
      setState({ data: null, loading: false, error: validation.errors[0], success: false });
      throw new Error(validation.errors[0]);
    }
    
    setState({ data: null, loading: true, error: null, success: false });
    
    try {
      const result = await userServiceCreateUserProfile({ 
        ...data,
        // Prepare form data for file uploads
        avatar: data.avatar,
        bio: data.bio,
        dance_styles: data.dance_styles,
        display_name: data.display_name,
        location: data.location,
        username: data.username,
      });
      setState({ data: result, loading: false, error: null, success: true });
      return result;
    } catch (error) {
      const apiError = handleApiError(error);
      setState({ data: null, loading: false, error: apiError.error || 'Failed to create profile', success: false });
      throw error;
    }
  }, []);

  const updateProfile = useCallback(async (data: UserServiceUpdateUserProfileData) => {
    setState({ data: null, loading: true, error: null, success: false });
    
    try {
      const result = await userServiceUpdateUserProfile({
        avatar: data.avatar,
        bio: data.bio,
        dance_styles: data.dance_styles,
        display_name: data.display_name,
        location: data.location,
      });
      setState({ data: result, loading: false, error: null, success: true });
      return result;
    } catch (error) {
      const apiError = handleApiError(error);
      setState({ data: null, loading: false, error: apiError.error || 'Failed to update profile', success: false });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null, success: false });
  }, []);

  return {
    ...state,
    fetchProfile,
    createProfile,
    updateProfile,
    reset,
  };
}

/**
 * Custom hook for dance chain operations
 */
export function useDanceChains() {
  const [state, setState] = useState<ApiHookState<any>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  });

  const createChain = useCallback(async (data: ChainServiceCreateDanceChainData) => {
    // Validate input
    const validation = validateDanceChain({
      title: data.title,
      description: data.description,
      category: data.category,
      max_moves: data.max_moves,
    });
    
    if (!validation.valid) {
      setState({ data: null, loading: false, error: validation.errors[0], success: false });
      throw new Error(validation.errors[0]);
    }
    
    setState({ data: null, loading: true, error: null, success: false });
    
    try {
      const result = await chainServiceCreateDanceChain({
        category: data.category,
        description: data.description,
        max_moves: data.max_moves,
        title: data.title,
        video: data.video,
      });
      setState({ data: result, loading: false, error: null, success: true });
      return result;
    } catch (error) {
      const apiError = handleApiError(error);
      setState({ data: null, loading: false, error: apiError.error || 'Failed to create dance chain', success: false });
      throw error;
    }
  }, []);

  const fetchChains = useCallback(async (params: ChainServiceGetDanceChainsData) => {
    setState({ data: null, loading: true, error: null, success: false });
    
    try {
      const result = await chainServiceGetDanceChains(params);
      setState({ data: result, loading: false, error: null, success: true });
      return result;
    } catch (error) {
      const apiError = handleApiError(error);
      setState({ data: null, loading: false, error: apiError.error || 'Failed to fetch dance chains', success: false });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null, success: false });
  }, []);

  return {
    ...state,
    createChain,
    fetchChains,
    reset,
  };
}

/**
 * Custom hook for voting operations
 */
export function useVoting() {
  const [state, setState] = useState<ApiHookState<any>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  });

  const voteOnMove = useCallback(async (data: VotingServiceVoteOnMoveData) => {
    setState({ data: null, loading: true, error: null, success: false });
    
    try {
      const result = await votingServiceVoteOnMove(data);
      setState({ data: result, loading: false, error: null, success: true });
      return result;
    } catch (error) {
      const apiError = handleApiError(error);
      setState({ data: null, loading: false, error: apiError.error || 'Failed to vote on move', success: false });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null, success: false });
  }, []);

  return {
    ...state,
    voteOnMove,
    reset,
  };
}

/**
 * Custom hook for video upload operations
 */
export function useVideoUpload() {
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const uploadVideo = useCallback(async (file: File, endpoint: string) => {
    if (!file.type.startsWith('video/')) {
      setError('File must be a video');
      return null;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setError('Video file too large (max 50MB)');
      return null;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Using fetch with progress tracking
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: {
          // The X-User-Address header should be added automatically by our client config
        }
      });

      if (response.ok) {
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(null), 1000);
        setUploading(false);
        return await response.json();
      } else {
        const errorText = await response.text();
        setError(`Upload failed: ${response.status} ${errorText}`);
        setUploading(false);
        setUploadProgress(null);
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }
    } catch (err) {
      setError('Upload error: ' + err.message);
      setUploading(false);
      setUploadProgress(null);
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setUploadProgress(null);
    setUploading(false);
    setError(null);
  }, []);

  return {
    uploadProgress,
    uploading,
    error,
    uploadVideo,
    reset,
  };
}