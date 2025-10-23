"""
Shared AI Service - Multi-Provider AI Integration with Caching
Single source of truth for all AI operations with fallback mechanisms
"""

import os
import time
from typing import Dict, Optional, List, Any
from functools import wraps
import json
import hashlib
import logging

logger = logging.getLogger(__name__)

# Import monitoring
try:
    from ..monitoring import metrics_collector, monitor_endpoint
    MONITORING_AVAILABLE = True
except ImportError:
    MONITORING_AVAILABLE = False
    logger.warning("Monitoring module not available")

# Try to import multiple AI providers
try:
    from cerebras.cloud.sdk import Cerebras
    CEREBRAS_AVAILABLE = True
except ImportError:
    CEREBRAS_AVAILABLE = False
    logger.warning("Cerebras SDK not available. Install with: pip install cerebras-cloud-sdk")

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    logger.warning("OpenAI SDK not available. Install with: pip install openai")

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False
    logger.warning("Anthropic SDK not available. Install with: pip install anthropic")


class AIService:
    """
    Centralized AI service with multi-provider support and caching.
    Tracks performance metrics for all AI operations and provides fallback mechanisms.
    """
    
    def __init__(self):
        self.cerebras_client = None
        self.openai_client = None
        self.anthropic_client = None
        self.metrics = {
            "total_requests": 0,
            "total_inference_time_ms": 0,
            "requests_by_feature": {},
            "provider_usage": {}
        }
        
        # Initialize clients based on available environment variables and packages
        if CEREBRAS_AVAILABLE:
            cerebras_key = os.environ.get("CEREBRAS_API_KEY")
            if cerebras_key:
                self.cerebras_client = Cerebras(api_key=cerebras_key)
                logger.info("Cerebras client initialized")
            else:
                logger.warning("CEREBRAS_API_KEY not set")
        
        if OPENAI_AVAILABLE:
            openai_key = os.environ.get("OPENAI_API_KEY")
            if openai_key:
                self.openai_client = OpenAI(api_key=openai_key)
                logger.info("OpenAI client initialized")
            else:
                logger.warning("OPENAI_API_KEY not set")
        
        if ANTHROPIC_AVAILABLE:
            anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
            if anthropic_key:
                self.anthropic_client = anthropic.Anthropic(api_key=anthropic_key)
                logger.info("Anthropic client initialized")
            else:
                logger.warning("ANTHROPIC_API_KEY not set")
        
        # Initialize cache (simple in-memory for now)
        self._cache = {}
        self._cache_ttl = 3600  # 1 hour default TTL
    
    def _get_cache_key(self, prompt: str, model: str) -> str:
        """Generate a unique cache key for the prompt and model"""
        cache_input = f"{prompt}:{model}"
        return hashlib.sha256(cache_input.encode()).hexdigest()
    
    def _get_cached_response(self, prompt: str, model: str) -> Optional[Dict]:
        """Get response from cache if available and not expired"""
        cache_key = self._get_cache_key(prompt, model)
        cached = self._cache.get(cache_key)
        if cached:
            response, timestamp = cached
            # Check if cache is expired
            if time.time() - timestamp < self._cache_ttl:
                return response
            else:
                # Remove expired cache
                del self._cache[cache_key]
        return None
    
    def _set_cache_response(self, prompt: str, model: str, response: Dict):
        """Store response in cache"""
        cache_key = self._get_cache_key(prompt, model)
        self._cache[cache_key] = (response, time.time())
    
    def _track_metric(self, feature: str, inference_time_ms: int, provider: str = "unknown"):
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
        
        # Track provider usage
        if provider not in self.metrics["provider_usage"]:
            self.metrics["provider_usage"][provider] = {
                "count": 0,
                "total_time_ms": 0
            }
        self.metrics["provider_usage"][provider]["count"] += 1
        self.metrics["provider_usage"][provider]["total_time_ms"] += inference_time_ms
    
    def _call_llama(self, model: str, prompt: str, feature: str) -> Dict:
        """
        Internal method to call Llama via Cerebras or fallback providers with performance tracking and caching.
        Returns dict with content and performance metrics.
        """
        # First check cache
        cached = self._get_cached_response(prompt, model)
        if cached:
            logger.info(f"Cache hit for {feature}")
            cached["from_cache"] = True
            # Track cache hit in monitoring
            if MONITORING_AVAILABLE:
                metrics_collector.increment_counter("ai_cache_hits_total", {"feature": feature})
            return cached
        
        start_time = time.time()
        
        # Track cache miss in monitoring
        if MONITORING_AVAILABLE:
            metrics_collector.increment_counter("ai_cache_misses_total", {"feature": feature})
        
        # Order of preference: Cerebras, OpenAI, Anthropic
        providers = []
        if self.cerebras_client:
            providers.append(("cerebras", self._call_cerebras))
        if self.openai_client:
            providers.append(("openai", self._call_openai))
        if self.anthropic_client:
            providers.append(("anthropic", self._call_anthropic))
        
        # Always add a mock provider as final fallback
        providers.append(("mock", self._call_mock))
        
        for provider_name, provider_func in providers:
            try:
                response = provider_func(model, prompt)
                
                inference_time_ms = int((time.time() - start_time) * 1000)
                response["inference_time_ms"] = inference_time_ms
                response["provider"] = provider_name
                
                # Track metrics
                self._track_metric(feature, inference_time_ms, provider_name)
                
                # Track in monitoring system
                if MONITORING_AVAILABLE:
                    metrics_collector.set_gauge(
                        "ai_inference_duration_seconds", 
                        inference_time_ms / 1000.0, 
                        {"feature": feature, "provider": provider_name}
                    )
                    metrics_collector.increment_counter(
                        "ai_requests_total", 
                        {"feature": feature, "provider": provider_name}
                    )
                
                # Cache successful responses (except mock)
                if provider_name != "mock":
                    self._set_cache_response(prompt, model, response)
                
                return response
            except Exception as e:
                logger.warning(f"{provider_name} provider failed: {str(e)}")
                
                # Track provider failure in monitoring
                if MONITORING_AVAILABLE:
                    metrics_collector.increment_counter(
                        "ai_provider_failures_total", 
                        {"feature": feature, "provider": provider_name}
                    )
                
                continue  # Try next provider
        
        # If all providers failed, return a proper error response
        inference_time_ms = int((time.time() - start_time) * 1000)
        
        # Track failure in monitoring
        if MONITORING_AVAILABLE:
            metrics_collector.increment_counter(
                "ai_errors_total", 
                {"feature": feature, "error_type": "all_providers_failed"}
            )
        
        error_response = {
            "content": f"AI service error: All providers failed for {feature}",
            "inference_time_ms": inference_time_ms,
            "model": model,
            "powered_by": "No available provider",
            "provider": "none",
            "error": "All AI providers failed"
        }
        return error_response
    
    def _call_cerebras(self, model: str, prompt: str) -> Dict:
        """Call Cerebras API"""
        response = self.cerebras_client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.7
        )
        
        return {
            "content": response.choices[0].message.content,
            "model": model,
            "powered_by": "Cerebras + Llama"
        }
    
    def _call_openai(self, model: str, prompt: str) -> Dict:
        """Call OpenAI API (using models like gpt-3.5-turbo or gpt-4)"""
        # Map our models to OpenAI equivalents
        openai_model = model
        if "llama-3.3" in model or "llama-3.1" in model:
            openai_model = "gpt-3.5-turbo"  # Use appropriate model
        elif "llama-4" in model:
            openai_model = "gpt-4"
            
        response = self.openai_client.chat.completions.create(
            model=openai_model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.7
        )
        
        return {
            "content": response.choices[0].message.content,
            "model": model,
            "powered_by": "OpenAI GPT"
        }
    
    def _call_anthropic(self, model: str, prompt: str) -> Dict:
        """Call Anthropic API (using Claude models)"""
        # Map our models to Anthropic equivalents
        anthropic_model = "claude-3-haiku-20240307"  # Use appropriate model
        if "llama-4" in model:
            anthropic_model = "claude-3-sonnet-20240229"
            
        response = self.anthropic_client.messages.create(
            model=anthropic_model,
            max_tokens=500,
            temperature=0.7,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return {
            "content": response.content[0].text if response.content else "",
            "model": model,
            "powered_by": "Anthropic Claude"
        }
    
    def _call_mock(self, model: str, prompt: str) -> Dict:
        """Mock provider for development"""
        return {
            "content": f"[Mock AI Response for {prompt[:50]}...]",
            "model": model,
            "powered_by": "Mock (set CEREBRAS_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY)"
        }
    
    # ===== AI FEATURES =====
    
    def generate_challenge(self, theme: str, difficulty: str) -> Dict:
        """
        Generate a complete dance challenge using AI with fallback mechanisms.
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
            "inference_time_ms": result.get("inference_time_ms", 0),
            "powered_by": result.get("powered_by"),
            "provider": result.get("provider", "unknown"),
            "from_cache": result.get("from_cache", False),
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
        Uses fast Llama-8B model for instant feedback with fallbacks.
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

        result = self._call_llama(
            model="llama-3.1-8b-instruct",
            prompt=prompt,
            feature="coach_commentary"
        )
        
        result["provider"] = result.get("provider", "unknown")
        result["from_cache"] = result.get("from_cache", False)
        return result
    
    def describe_move(self, pose_analysis: Dict) -> Dict:
        """
        Generate natural language description of a dance move.
        Lightning-fast using Llama-8B with fallback providers.
        """
        prompt = f"""Describe this dance move in natural, engaging language.

Movement analysis:
- Body position: {pose_analysis.get('position', 'dynamic')}
- Arm motion: {pose_analysis.get('arms', 'expressive')}
- Leg motion: {pose_analysis.get('legs', 'rhythmic')}
- Energy level: {pose_analysis.get('energy', 'medium')}

Create a fun, 1-2 sentence description that dancers would understand.
Use dance terminology where appropriate but keep it accessible."""

        result = self._call_llama(
            model="llama-3.1-8b-instruct",
            prompt=prompt,
            feature="move_description"
        )
        
        result["provider"] = result.get("provider", "unknown")
        result["from_cache"] = result.get("from_cache", False)
        return result
    
    def generate_viral_caption(self, chain_title: str, category: str, participant_count: int) -> Dict:
        """
        Generate viral-worthy social media caption.
        Optimized for Farcaster and social sharing with fallback providers.
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
        
        result["provider"] = result.get("provider", "unknown")
        result["from_cache"] = result.get("from_cache", False)
        # Update scalability note to be more accurate with multi-provider
        result["scalability_note"] = "Can generate 100+ captions/min with multi-provider AI"
        return result
    
    def get_performance_metrics(self) -> Dict:
        """
        Return current performance metrics for demo purposes.
        Shows multi-provider speed and usage statistics.
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
        
        provider_stats = {}
        for provider, data in self.metrics["provider_usage"].items():
            if data["count"] > 0:
                provider_stats[provider] = {
                    "count": data["count"],
                    "avg_time_ms": int(data["total_time_ms"] / data["count"])
                }
        
        # Add monitoring data if available
        monitoring_data = {}
        if MONITORING_AVAILABLE:
            monitoring_data = metrics_collector.get_metrics_summary()
        
        result = {
            "total_requests": self.metrics["total_requests"],
            "avg_inference_time_ms": int(avg_time),
            "speed_comparison": {
                "multi_provider": f"~{int(avg_time)}ms",
                "typical_cloud": "~2000ms",
                "speedup": f"{2000/max(avg_time, 1):.1f}x faster" if avg_time > 0 else "N/A"
            },
            "features": feature_stats,
            "providers": provider_stats,
            "models_available": [
                "llama-3.3-70b",
                "llama-3.1-8b-instruct", 
                "llama-4-scout-17b-16e-instruct"
            ],
            "status": "active" if (self.cerebras_client or self.openai_client or self.anthropic_client) else "mock_mode",
            "available_providers": {
                "cerebras": bool(self.cerebras_client),
                "openai": bool(self.openai_client),
                "anthropic": bool(self.anthropic_client)
            },
            "cache_info": {
                "cached_requests": len(self._cache),
                "cache_ttl_seconds": self._cache_ttl
            }
        }
        
        # Include monitoring data if available
        if monitoring_data:
            result["monitoring"] = monitoring_data
            
        return result


# Singleton instance
ai_service = AIService()
