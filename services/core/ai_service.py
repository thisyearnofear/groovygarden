"""
Shared AI Service - Cerebras + Llama Integration
Single source of truth for all AI operations
"""

import os
import time
from typing import Dict, Optional, List
from functools import wraps
import json

# Cerebras SDK
try:
    from cerebras.cloud.sdk import Cerebras
    CEREBRAS_AVAILABLE = True
except ImportError:
    CEREBRAS_AVAILABLE = False
    print("Warning: Cerebras SDK not available. Install with: pip install cerebras-cloud-sdk")


class AIService:
    """
    Centralized AI service using Cerebras for ultra-fast Llama inference.
    Tracks performance metrics for all AI operations.
    """
    
    def __init__(self):
        self.client = None
        self.metrics = {
            "total_requests": 0,
            "total_inference_time_ms": 0,
            "requests_by_feature": {}
        }
        
        if CEREBRAS_AVAILABLE:
            api_key = os.environ.get("CEREBRAS_API_KEY")
            if api_key:
                self.client = Cerebras(api_key=api_key)
            else:
                print("Warning: CEREBRAS_API_KEY not set")
    
    def _track_metric(self, feature: str, inference_time_ms: int):
        """Track performance metrics for demo purposes"""
        self.metrics["total_requests"] += 1
        self.metrics["total_inference_time_ms"] += inference_time_ms
        
        if feature not in self.metrics["requests_by_feature"]:
            self.metrics["requests_by_feature"][feature] = {
                "count": 0,
                "total_time_ms": 0
            }
        
        self.metrics["requests_by_feature"][feature]["count"] += 1
        self.metrics["requests_by_feature"][feature]["total_time_ms"] += inference_time_ms
    
    def _call_llama(self, model: str, prompt: str, feature: str) -> Dict:
        """
        Internal method to call Llama via Cerebras with performance tracking.
        Returns dict with content and performance metrics.
        """
        if not self.client:
            # Fallback for development without API key
            return {
                "content": f"[Mock AI Response for {feature}]",
                "inference_time_ms": 100,
                "model": model,
                "powered_by": "Mock (set CEREBRAS_API_KEY)",
                "error": "Cerebras client not initialized"
            }
        
        start_time = time.time()
        
        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.7
            )
            
            inference_time_ms = int((time.time() - start_time) * 1000)
            content = response.choices[0].message.content
            
            # Track metrics
            self._track_metric(feature, inference_time_ms)
            
            return {
                "content": content,
                "inference_time_ms": inference_time_ms,
                "model": model,
                "powered_by": "Cerebras + Llama"
            }
            
        except Exception as e:
            inference_time_ms = int((time.time() - start_time) * 1000)
            return {
                "content": f"AI service error: {str(e)}",
                "inference_time_ms": inference_time_ms,
                "model": model,
                "powered_by": "Cerebras + Llama",
                "error": str(e)
            }
    
    # ===== AI FEATURES =====
    
    def generate_challenge(self, theme: str, difficulty: str) -> Dict:
        """
        Generate a complete dance challenge using Llama on Cerebras.
        Returns structured challenge with performance metrics.
        """
        prompt = f"""Generate a creative dance challenge for a social platform.

Theme: {theme}
Difficulty: {difficulty}

Provide in this exact format:
CHALLENGE NAME: [catchy 2-4 word name]
DESCRIPTION: [1-2 exciting sentences]
KEY MOVES: [3-5 specific moves separated by commas]
MUSIC VIBE: [genre or mood]
HASHTAGS: [3 viral hashtags with # symbols]

Make it fun, achievable, and shareable!"""

        result = self._call_llama(
            model="llama-3.3-70b",
            prompt=prompt,
            feature="challenge_generator"
        )
        
        # Parse response into structured format
        content = result.get("content", "")
        challenge = self._parse_challenge_response(content)
        challenge.update({
            "inference_time_ms": result["inference_time_ms"],
            "powered_by": result.get("powered_by"),
            "theme": theme,
            "difficulty": difficulty
        })
        
        return challenge
    
    def _parse_challenge_response(self, content: str) -> Dict:
        """Parse AI response into structured challenge data"""
        lines = content.strip().split('\n')
        challenge = {
            "name": "",
            "description": "",
            "key_moves": [],
            "music_vibe": "",
            "hashtags": []
        }
        
        for line in lines:
            line = line.strip()
            if line.startswith("CHALLENGE NAME:"):
                challenge["name"] = line.replace("CHALLENGE NAME:", "").strip()
            elif line.startswith("DESCRIPTION:"):
                challenge["description"] = line.replace("DESCRIPTION:", "").strip()
            elif line.startswith("KEY MOVES:"):
                moves = line.replace("KEY MOVES:", "").strip()
                challenge["key_moves"] = [m.strip() for m in moves.split(',')]
            elif line.startswith("MUSIC VIBE:"):
                challenge["music_vibe"] = line.replace("MUSIC VIBE:", "").strip()
            elif line.startswith("HASHTAGS:"):
                hashtags = line.replace("HASHTAGS:", "").strip()
                challenge["hashtags"] = [h.strip() for h in hashtags.split() if h.startswith('#')]
        
        return challenge
    
    def generate_coach_commentary(self, verification_score: float, duration: float, move_number: int) -> Dict:
        """
        Generate encouraging AI coach feedback with real-time speed.
        Uses fast Llama-8B model for instant feedback.
        """
        prompt = f"""You are an encouraging dance coach providing feedback.

Move Performance:
- Verification score: {verification_score:.2f} (0-1 scale)
- Duration: {duration:.1f} seconds
- Move number: {move_number} in chain

Provide 2-3 sentences of:
- Positive encouragement
- Specific feedback (if score < 0.9)
- Tip for improvement (if applicable)
- Motivation to keep going

Be enthusiastic, supportive, and constructive! Keep it brief and energetic."""

        return self._call_llama(
            model="llama-3.1-8b-instruct",
            prompt=prompt,
            feature="coach_commentary"
        )
    
    def describe_move(self, pose_analysis: Dict) -> Dict:
        """
        Generate natural language description of a dance move.
        Lightning-fast using Llama-8B.
        """
        prompt = f"""Describe this dance move in natural, engaging language.

Movement analysis:
- Body position: {pose_analysis.get('position', 'dynamic')}
- Arm motion: {pose_analysis.get('arms', 'expressive')}
- Leg motion: {pose_analysis.get('legs', 'rhythmic')}
- Energy level: {pose_analysis.get('energy', 'medium')}

Create a fun, 1-2 sentence description that dancers would understand.
Use dance terminology where appropriate but keep it accessible."""

        return self._call_llama(
            model="llama-3.1-8b-instruct",
            prompt=prompt,
            feature="move_description"
        )
    
    def generate_viral_caption(self, chain_title: str, category: str, participant_count: int) -> Dict:
        """
        Generate viral-worthy social media caption.
        Optimized for Farcaster and social sharing.
        """
        prompt = f"""Create a viral social media caption for a dance challenge.

Challenge: {chain_title}
Category: {category}
Current participants: {participant_count}

Make it:
- Exciting and FOMO-inducing
- Include emojis (3-5 max)
- Include call-to-action
- 1-2 sentences max
- Shareable and engaging

Example vibe: "🔥 {participant_count} dancers, ONE epic chain - can you keep up? Drop your move now! 💃"
"""

        result = self._call_llama(
            model="llama-3.1-8b-instruct",
            prompt=prompt,
            feature="caption_generator"
        )
        
        # Add scalability note
        result["scalability_note"] = "Can generate 100+ captions/min with Cerebras"
        return result
    
    def get_performance_metrics(self) -> Dict:
        """
        Return current performance metrics for demo purposes.
        Shows Cerebras speed advantage.
        """
        avg_time = 0
        if self.metrics["total_requests"] > 0:
            avg_time = self.metrics["total_inference_time_ms"] / self.metrics["total_requests"]
        
        feature_stats = {}
        for feature, data in self.metrics["requests_by_feature"].items():
            if data["count"] > 0:
                feature_stats[feature] = {
                    "count": data["count"],
                    "avg_time_ms": int(data["total_time_ms"] / data["count"])
                }
        
        return {
            "total_requests": self.metrics["total_requests"],
            "avg_inference_time_ms": int(avg_time),
            "speed_comparison": {
                "cerebras": f"~{int(avg_time)}ms",
                "typical_cloud": "~2000ms",
                "speedup": f"{2000/max(avg_time, 1):.1f}x faster" if avg_time > 0 else "N/A"
            },
            "features": feature_stats,
            "models_available": [
                "llama-3.3-70b",
                "llama-3.1-8b-instruct",
                "llama-4-scout-17b-16e-instruct"
            ],
            "status": "active" if self.client else "mock_mode"
        }


# Singleton instance
ai_service = AIService()
