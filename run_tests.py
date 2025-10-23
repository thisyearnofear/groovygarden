#!/usr/bin/env python3
"""
Test runner for DegenDancing
"""

import unittest
import sys
import os
from pathlib import Path

# Add services directory to path
sys.path.insert(0, str(Path(__file__).parent / "services"))

def run_tests():
    """Run all tests in the services directory"""
    loader = unittest.TestLoader()
    start_dir = Path(__file__).parent / "services"
    
    # Discover and run all tests
    suite = loader.discover(
        start_dir=str(start_dir),
        pattern='test_*.py',
        top_level_dir=str(start_dir)
    )
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Return success/failure
    return len(result.failures) == 0 and len(result.errors) == 0

if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)