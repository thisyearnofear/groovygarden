"""
Performance Monitoring and Observability for DegenDancing
Implements metrics collection, health checks, and performance tracking
"""

import time
import logging
from typing import Dict, Any, Optional, Callable, Awaitable
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import asyncio
from collections import deque
import psutil
import os


logger = logging.getLogger(__name__)


class MetricType(Enum):
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"
    SUMMARY = "summary"


@dataclass
class Metric:
    """Base metric class"""
    name: str
    type: MetricType
    value: Any = None
    labels: Dict[str, str] = field(default_factory=dict)
    description: str = ""
    timestamp: datetime = field(default_factory=datetime.utcnow)


class MetricsCollector:
    """Collects and manages application metrics"""
    
    def __init__(self):
        self.metrics: Dict[str, Metric] = {}
        self.request_times: deque = deque(maxlen=1000)  # Keep last 1000 request times
        self.error_counts: Dict[str, int] = {}
        self.start_time = datetime.utcnow()
    
    def increment_counter(self, name: str, labels: Optional[Dict[str, str]] = None, amount: int = 1):
        """Increment a counter metric"""
        labels = labels or {}
        key = f"{name}_" + "_".join(f"{k}={v}" for k, v in sorted(labels.items()))
        
        if key not in self.metrics:
            self.metrics[key] = Metric(
                name=name,
                type=MetricType.COUNTER,
                value=0,
                labels=labels
            )
        
        self.metrics[key].value += amount
        self.metrics[key].timestamp = datetime.utcnow()
    
    def set_gauge(self, name: str, value: float, labels: Optional[Dict[str, str]] = None):
        """Set a gauge metric"""
        labels = labels or {}
        key = f"{name}_" + "_".join(f"{k}={v}" for k, v in sorted(labels.items()))
        
        self.metrics[key] = Metric(
            name=name,
            type=MetricType.GAUGE,
            value=value,
            labels=labels
        )
        self.metrics[key].timestamp = datetime.utcnow()
    
    def record_request_time(self, duration: float, endpoint: str = "unknown", method: str = "UNKNOWN"):
        """Record request processing time"""
        self.request_times.append({
            'duration': duration,
            'endpoint': endpoint,
            'method': method,
            'timestamp': datetime.utcnow()
        })
        
        # Update metrics
        self.increment_counter("http_requests_total", {"endpoint": endpoint, "method": method})
        self.set_gauge("http_request_duration_seconds", duration, {"endpoint": endpoint, "method": method})
    
    def record_error(self, error_type: str, endpoint: str = "unknown"):
        """Record an error occurrence"""
        self.increment_counter("http_errors_total", {"error_type": error_type, "endpoint": endpoint})
        
        if error_type not in self.error_counts:
            self.error_counts[error_type] = 0
        self.error_counts[error_type] += 1
    
    def get_metrics_summary(self) -> Dict[str, Any]:
        """Get a summary of current metrics"""
        # Calculate request statistics
        request_durations = [req['duration'] for req in self.request_times]
        avg_request_time = sum(request_durations) / len(request_durations) if request_durations else 0
        max_request_time = max(request_durations) if request_durations else 0
        min_request_time = min(request_durations) if request_durations else 0
        
        # System metrics
        process = psutil.Process(os.getpid())
        memory_info = process.memory_info()
        cpu_percent = process.cpu_percent()
        
        return {
            "uptime": (datetime.utcnow() - self.start_time).total_seconds(),
            "request_stats": {
                "total_requests": len(self.request_times),
                "avg_request_time": avg_request_time,
                "max_request_time": max_request_time,
                "min_request_time": min_request_time,
                "requests_last_minute": len([
                    req for req in self.request_times 
                    if (datetime.utcnow() - req['timestamp']).total_seconds() < 60
                ])
            },
            "system_stats": {
                "memory_rss": memory_info.rss,
                "memory_vms": memory_info.vms,
                "cpu_percent": cpu_percent,
                "pid": process.pid
            },
            "error_counts": self.error_counts,
            "active_metrics": len(self.metrics)
        }


# Global metrics collector instance
metrics_collector = MetricsCollector()


def monitor_endpoint(endpoint_name: str, method: str = "OTHER"):
    """Decorator to monitor endpoint performance"""
    def decorator(func: Callable) -> Callable:
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                duration = time.time() - start_time
                metrics_collector.record_request_time(duration, endpoint_name, method)
                return result
            except Exception as e:
                duration = time.time() - start_time
                metrics_collector.record_request_time(duration, endpoint_name, method)
                metrics_collector.record_error(type(e).__name__, endpoint_name)
                raise
        return wrapper
    return decorator


def get_system_health() -> Dict[str, Any]:
    """Get system health information"""
    try:
        # Check if we can connect to the database (placeholder - would integrate with actual DB connection)
        db_connected = True  # This would check actual DB connection
        
        # Check if AI services are available (placeholder)
        ai_available = True  # This would check actual AI service availability
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "checks": {
                "database": db_connected,
                "ai_services": ai_available,
                "system_resources": True
            },
            "metrics_summary": metrics_collector.get_metrics_summary()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


class RequestTimeTracker:
    """Helper class to track request processing times"""
    
    def __init__(self):
        self.start_time = None
    
    def start(self):
        """Start timing"""
        self.start_time = time.time()
    
    def stop(self, endpoint: str, method: str = "OTHER") -> float:
        """Stop timing and record the result"""
        if self.start_time is None:
            return 0.0
        
        duration = time.time() - self.start_time
        metrics_collector.record_request_time(duration, endpoint, method)
        return duration


def get_performance_metrics() -> Dict[str, Any]:
    """Get detailed performance metrics for monitoring"""
    return {
        "metrics": {k: {
            "type": v.type.value,
            "value": v.value,
            "labels": v.labels,
            "timestamp": v.timestamp.isoformat() if v.timestamp else None
        } for k, v in metrics_collector.metrics.items()},
        "summary": metrics_collector.get_metrics_summary()
    }


def log_slow_requests(threshold: float = 1.0) -> None:
    """Log requests that took longer than the threshold"""
    slow_requests = [
        req for req in metrics_collector.request_times
        if req['duration'] > threshold
    ]
    
    for req in slow_requests:
        logger.warning(
            f"SLOW REQUEST: {req['method']} {req['endpoint']} took {req['duration']:.3f}s at {req['timestamp']}"
        )


# Health check endpoint would be added to FastAPI routes
async def health_check_endpoint():
    """Health check endpoint function"""
    health_info = get_system_health()
    return health_info


# Performance metrics endpoint function
async def metrics_endpoint():
    """Metrics endpoint function"""
    return get_performance_metrics()