#!/usr/bin/env python3
"""
Test AI Service Integration

This script tests the Cerebras AI integration for DegenDancing.
Run this after setting up your CEREBRAS_API_KEY in .env.

Usage:
    cd services
    python test_ai.py
"""

import os
import sys
import logging
from pathlib import Path

# Add the services directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

# Load environment variables from project root
from dotenv import load_dotenv
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_ai_service():
    """Test the AI service functionality."""
    logger.info("🧠 Testing AI Service Integration...")

    # Check if API key is configured
    cerebras_key = os.getenv("CEREBRAS_API_KEY")
    if not cerebras_key or cerebras_key == "your-cerebras-api-key-here":
        logger.error("❌ CEREBRAS_API_KEY not configured!")
        logger.error("Please get an API key from https://cloud.cerebras.ai")
        logger.error("Then set CEREBRAS_API_KEY in your .env file")
        return False

    logger.info("✅ Found CEREBRAS_API_KEY")

    try:
        # Import and test AI service
        from core.ai_service import ai_service

        # Test 1: Challenge generation
        logger.info("Testing challenge generation...")
        challenge = ai_service.generate_challenge("hip-hop", "easy")
        logger.info(f"✅ Challenge generated: {challenge.get('name', 'Unknown')}")
        logger.info(f"   Inference time: {challenge.get('inference_time_ms', 'N/A')}ms")

        # Test 2: Coach commentary
        logger.info("Testing coach commentary...")
        commentary = ai_service.generate_coach_commentary(0.85, 8.5, 2)
        logger.info(f"✅ Commentary generated: {len(commentary.get('content', ''))} chars")
        logger.info(f"   Inference time: {commentary.get('inference_time_ms', 'N/A')}ms")

        # Test 3: Move description
        logger.info("Testing move description...")
        pose_data = {
            "position": "standing",
            "arms": "outstretched",
            "legs": "apart",
            "energy": "high"
        }
        description = ai_service.describe_move(pose_data)
        logger.info(f"✅ Move described: {len(description.get('content', ''))} chars")
        logger.info(f"   Inference time: {description.get('inference_time_ms', 'N/A')}ms")

        # Test 4: Viral caption
        logger.info("Testing viral caption...")
        caption = ai_service.generate_viral_caption("Epic Dance Battle", "freestyle", 42)
        logger.info(f"✅ Caption generated: {len(caption.get('content', ''))} chars")
        logger.info(f"   Inference time: {caption.get('inference_time_ms', 'N/A')}ms")

        # Test 5: Performance metrics
        logger.info("Testing performance metrics...")
        metrics = ai_service.get_performance_metrics()
        logger.info("✅ Performance metrics retrieved")
        logger.info(f"   Total requests: {metrics.get('total_requests', 0)}")
        logger.info(f"   Avg inference time: {metrics.get('avg_inference_time_ms', 0)}ms")
        logger.info(f"   Speedup vs cloud: {metrics.get('speed_comparison', {}).get('speedup', 'N/A')}")

        logger.info("🎉 All AI tests passed!")
        return True

    except Exception as e:
        logger.error(f"❌ AI service test failed: {e}")
        logger.error("Make sure your CEREBRAS_API_KEY is valid and you have internet connection")
        return False

def main():
    """Main test function."""
    logger.info("🚀 Starting AI Service Tests...")

    success = test_ai_service()

    if success:
        logger.info("")
        logger.info("🎉 AI Integration is working perfectly!")
        logger.info("Your app is ready for dance chain creation with AI assistance.")
    else:
        logger.error("")
        logger.error("❌ AI Integration needs configuration.")
        logger.error("Get your Cerebras API key and try again.")

    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
