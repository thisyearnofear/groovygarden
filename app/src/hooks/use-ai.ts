/**
 * AI Features Hook - Single source for all AI operations
 * Uses Cerebras + Llama for ultra-fast inference
 * 
 * Following core principles:
 * - DRY: Single source of truth for AI features
 * - CLEAN: Clear separation of concerns
 * - PERFORMANT: Includes loading states, caching
 */

import { useState, useCallback } from 'react';

// Types
interface AIResponse<T = any> {
    data: T | null;
    error: string | null;
    loading: boolean;
    inferenceTimeMs?: number;
    poweredBy?: string;
}

interface ChallengeData {
    name: string;
    description: string;
    key_moves: string[];
    music_vibe: string;
    hashtags: string[];
    inference_time_ms: number;
    powered_by: string;
    theme: string;
    difficulty: string;
}

interface CoachCommentary {
    content: string;
    inference_time_ms: number;
    model: string;
    powered_by: string;
}

interface MoveDescription {
    content: string;
    inference_time_ms: number;
    speed_advantage: string;
}

interface ViralCaption {
    content: string;
    inference_time_ms: number;
    scalability_note: string;
}

interface PerformanceMetrics {
    total_requests: number;
    avg_inference_time_ms: number;
    speed_comparison: {
        cerebras: string;
        typical_cloud: string;
        speedup: string;
    };
    features: Record<string, { count: number; avg_time_ms: number }>;
    models_available: string[];
    status: string;
}

/**
 * Hook for AI-powered features using Cerebras + Llama
 * Provides consistent interface for all AI operations
 */
export function useAI() {
    const [state, setState] = useState<AIResponse>({
        data: null,
        error: null,
        loading: false,
    });

    // Helper to make API calls with consistent error handling
    const makeAIRequest = useCallback(async <T,>(
        endpoint: string,
        body: FormData | Record<string, any>
    ): Promise<T> => {
        setState({ data: null, error: null, loading: true });

        try {
            const isFormData = body instanceof FormData;
            const response = await fetch(`/api/ai/${endpoint}`, {
                method: 'POST',
                headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
                body: isFormData ? body : JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Request failed' }));
                throw new Error(errorData.detail || `HTTP ${response.status}`);
            }

            const data = await response.json();
            setState({
                data,
                error: null,
                loading: false,
                inferenceTimeMs: data.inference_time_ms,
                poweredBy: data.powered_by,
            });

            return data;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setState({ data: null, error: errorMessage, loading: false });
            throw error;
        }
    }, []);

    // Generate dance challenge
    const generateChallenge = useCallback(
        async (theme: string, difficulty: 'easy' | 'medium' | 'hard'): Promise<ChallengeData> => {
            const formData = new FormData();
            formData.append('theme', theme);
            formData.append('difficulty', difficulty);
            return makeAIRequest<ChallengeData>('generate_challenge', formData);
        },
        [makeAIRequest]
    );

    // Get AI coach commentary
    const getCoachCommentary = useCallback(
        async (
            verificationScore: number,
            duration: number,
            moveNumber: number
        ): Promise<CoachCommentary> => {
            const formData = new FormData();
            formData.append('verification_score', verificationScore.toString());
            formData.append('duration', duration.toString());
            formData.append('move_number', moveNumber.toString());
            return makeAIRequest<CoachCommentary>('coach_commentary', formData);
        },
        [makeAIRequest]
    );

    // Describe dance move
    const describeMove = useCallback(
        async (poseAnalysis: {
            position?: string;
            arms?: string;
            legs?: string;
            energy?: string;
        }): Promise<MoveDescription> => {
            return makeAIRequest<MoveDescription>('describe_move', poseAnalysis);
        },
        [makeAIRequest]
    );

    // Generate viral caption
    const generateCaption = useCallback(
        async (
            chainTitle: string,
            category: string,
            participantCount: number
        ): Promise<ViralCaption> => {
            const formData = new FormData();
            formData.append('chain_title', chainTitle);
            formData.append('category', category);
            formData.append('participant_count', participantCount.toString());
            return makeAIRequest<ViralCaption>('viral_caption', formData);
        },
        [makeAIRequest]
    );

    // Get performance metrics (for demo/debug)
    const getMetrics = useCallback(async (): Promise<PerformanceMetrics> => {
        try {
            const response = await fetch('/api/ai/performance_metrics');
            if (!response.ok) throw new Error('Failed to fetch metrics');
            return await response.json();
        } catch (error) {
            console.error('Failed to get AI metrics:', error);
            throw error;
        }
    }, []);

    return {
        // State
        ...state,

        // Actions
        generateChallenge,
        getCoachCommentary,
        describeMove,
        generateCaption,
        getMetrics,
    };
}

// Export types for consumers
export type {
    ChallengeData,
    CoachCommentary,
    MoveDescription,
    ViralCaption,
    PerformanceMetrics,
};
