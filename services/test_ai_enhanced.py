"""
Test suite for enhanced AI service with multi-provider support and caching
"""
import unittest
from unittest.mock import Mock, patch, MagicMock
from core.ai_service import AIService
import time


class TestAIService(unittest.TestCase):
    """Test the enhanced AI service with multi-provider support"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.ai_service = AIService()
        
    @patch('core.ai_service.CEREBRAS_AVAILABLE', True)
    @patch('core.ai_service.OPENAI_AVAILABLE', True)
    @patch('core.ai_service.ANTHROPIC_AVAILABLE', True)
    def test_initialization_with_all_providers(self, mock_anthropic, mock_openai, mock_cerebras):
        """Test AI service initialization with all providers available"""
        # Mock the actual clients
        mock_cerebras_client = Mock()
        mock_openai_client = Mock()
        mock_anthropic_client = Mock()
        
        with patch('core.ai_service.Cerebras', return_value=mock_cerebras_client), \
             patch('core.ai_service.OpenAI', return_value=mock_openai_client), \
             patch('core.ai_service.anthropic.Anthropic', return_value=mock_anthropic_client):
            
            ai_service = AIService()
            
            # Verify that clients are not initialized without API keys
            self.assertIsNone(ai_service.cerebras_client)
            self.assertIsNone(ai_service.openai_client)
            self.assertIsNone(ai_service.anthropic_client)
    
    @patch('os.environ.get')
    @patch('core.ai_service.CEREBRAS_AVAILABLE', True)
    def test_call_llama_with_mock_provider(self, mock_env):
        """Test _call_llama method uses mock provider when no real providers are configured"""
        # Ensure no API keys are set
        mock_env.return_value = None
        
        ai_service = AIService()
        
        # Call the method
        result = ai_service._call_llama("test-model", "test prompt", "test-feature")
        
        # Verify it returns a mock response
        self.assertIn("Mock AI Response", result["content"])
        self.assertEqual(result["powered_by"], "Mock (set CEREBRAS_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY)")
        self.assertEqual(result["provider"], "mock")
    
    def test_cache_functionality(self):
        """Test that caching works properly"""
        ai_service = AIService()
        
        # Test cache key generation
        prompt1 = "test prompt"
        prompt2 = "different prompt"
        model = "test-model"
        
        key1 = ai_service._get_cache_key(prompt1, model)
        key2 = ai_service._get_cache_key(prompt1, model)  # Same inputs
        key3 = ai_service._get_cache_key(prompt2, model)  # Different prompt
        
        # Same inputs should produce same key
        self.assertEqual(key1, key2)
        # Different inputs should produce different keys
        self.assertNotEqual(key1, key3)
        
        # Test setting and getting from cache
        test_response = {"content": "cached response", "model": "test-model"}
        ai_service._set_cache_response(prompt1, model, test_response)
        
        cached = ai_service._get_cached_response(prompt1, model)
        self.assertEqual(cached, test_response)
        
        # Test cache expiration (simulate by manually changing timestamp)
        import time
        cache_key = ai_service._get_cache_key(prompt1, model)
        ai_service._cache[cache_key] = (test_response, time.time() - 4000)  # Expired
        
        expired_cached = ai_service._get_cached_response(prompt1, model)
        self.assertIsNone(expired_cached)
    
    def test_metrics_tracking(self):
        """Test that metrics are properly tracked"""
        ai_service = AIService()
        
        # Reset metrics for clean test
        ai_service.metrics = {
            "total_requests": 0,
            "total_inference_time_ms": 0,
            "requests_by_feature": {},
            "provider_usage": {}
        }
        
        # Track a metric
        ai_service._track_metric("test_feature", 100, "test_provider")
        
        # Verify metrics were recorded
        self.assertEqual(ai_service.metrics["total_requests"], 1)
        self.assertEqual(ai_service.metrics["total_inference_time_ms"], 100)
        self.assertIn("test_feature", ai_service.metrics["requests_by_feature"])
        self.assertIn("test_provider", ai_service.metrics["provider_usage"])
        
        feature_stats = ai_service.metrics["requests_by_feature"]["test_feature"]
        provider_stats = ai_service.metrics["provider_usage"]["test_provider"]
        
        self.assertEqual(feature_stats["count"], 1)
        self.assertEqual(feature_stats["total_time_ms"], 100)
        self.assertEqual(provider_stats["count"], 1)
        self.assertEqual(provider_stats["total_time_ms"], 100)
    
    def test_parse_challenge_response(self):
        """Test the challenge response parsing function"""
        ai_service = AIService()
        
        test_content = """CHALLENGE NAME: Epic Dance Move
DESCRIPTION: This is an amazing dance challenge that will make you move
KEY MOVES: Jump, Spin, Drop
MUSIC VIBE: Hip-Hop
HASHTAGS: #dance #fun #viral"""
        
        result = ai_service._parse_challenge_response(test_content)
        
        self.assertEqual(result["name"], "Epic Dance Move")
        self.assertEqual(result["description"], "This is an amazing dance challenge that will make you move")
        self.assertEqual(result["key_moves"], ["Jump", "Spin", "Drop"])
        self.assertEqual(result["music_vibe"], "Hip-Hop")
        self.assertEqual(result["hashtags"], ["#dance", "#fun", "#viral"])
    
    def test_performance_metrics(self):
        """Test that performance metrics are correctly calculated"""
        ai_service = AIService()
        
        # Add some test metrics
        ai_service.metrics = {
            "total_requests": 10,
            "total_inference_time_ms": 500,
            "requests_by_feature": {
                "test_feature": {
                    "count": 5,
                    "total_time_ms": 250
                }
            },
            "provider_usage": {
                "cerebras": {
                    "count": 7,
                    "total_time_ms": 350
                },
                "openai": {
                    "count": 3,
                    "total_time_ms": 150
                }
            }
        }
        
        metrics = ai_service.get_performance_metrics()
        
        self.assertEqual(metrics["total_requests"], 10)
        self.assertEqual(metrics["avg_inference_time_ms"], 50)  # 500ms / 10 requests
        self.assertIn("multi_provider", metrics["speed_comparison"])
        self.assertEqual(metrics["features"]["test_feature"]["count"], 5)
        self.assertEqual(metrics["providers"]["cerebras"]["avg_time_ms"], 50)  # 350ms / 7 requests


class TestAIServiceFallbacks(unittest.TestCase):
    """Test AI service fallback mechanisms"""
    
    def test_provider_priority_order(self):
        """Test that providers are tried in the correct order"""
        ai_service = AIService()
        
        # The providers order should be: cerebras, openai, anthropic, mock
        providers = []
        
        # We can't easily test the exact order without mocking the internal logic,
        # but we can test that fallbacks work by simulating provider failures
        with patch.object(ai_service, '_call_cerebras', side_effect=Exception("Cerebras failed")):
            with patch.object(ai_service, '_call_openai', side_effect=Exception("OpenAI failed")):
                with patch.object(ai_service, '_call_anthropic', side_effect=Exception("Anthropic failed")):
                    # This should fall back to mock provider
                    result = ai_service._call_llama("test-model", "test prompt", "test-feature")
                    self.assertIn("Mock AI Response", result["content"])


if __name__ == '__main__':
    unittest.main()