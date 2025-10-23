# Performance Monitoring & Observability for DegenDancing

This document describes the performance monitoring and observability system implemented for DegenDancing.

## Overview

The monitoring system provides comprehensive performance tracking, health checks, and observability for the DegenDancing platform. It follows the PERFORMANT principle by implementing efficient metrics collection without impacting application performance.

## Architecture

### Metrics Collector

The `MetricsCollector` class provides centralized metrics collection:

- **Counters**: Track event counts (requests, errors, cache hits/misses)
- **Gauges**: Track current values (request times, system resources)
- **Histograms**: Track distribution of values (request times)
- **Summaries**: Provide statistical summaries

### Monitoring Endpoints

The system exposes several endpoints for monitoring:

1. `/health` - Basic health check
2. `/metrics` - Detailed metrics for Prometheus-style monitoring
3. `/monitoring/status` - Monitoring system status

## Key Features

### 1. AI Service Monitoring

The enhanced AI service now tracks:
- Inference duration by provider and feature
- Request counts by provider and feature
- Cache hits/misses
- Provider failures
- Error rates

### 2. Video Processing Monitoring

Video processing functions track:
- Processing duration for pose extraction
- Frame processing counts
- Error rates by operation type
- Success/failure rates

### 3. API Request Monitoring

The rate limiting middleware tracks:
- Request counts by endpoint and method
- Request duration by endpoint and method
- Error rates by error type and endpoint

### 4. System Health Monitoring

The system monitors:
- Uptime
- Request statistics (average, min, max times)
- Error counts by type
- System resource usage (memory, CPU)
- Active metrics count

## Integration Points

### FastAPI Integration

The monitoring system is integrated into FastAPI through:

1. **Health Check Endpoint**: `/health` provides system health information
2. **Metrics Endpoint**: `/metrics` provides detailed metrics data
3. **Request Tracking**: Middleware tracks all requests automatically

### Decorator Integration

The `@monitor_endpoint` decorator can be used to automatically track performance for specific functions:

```python
from services.monitoring import monitor_endpoint

@monitor_endpoint("my_endpoint", "POST")
async def my_api_endpoint():
    # Endpoint implementation
    pass
```

## Metrics Schema

### HTTP Metrics
- `http_requests_total` - Counter of HTTP requests
- `http_errors_total` - Counter of HTTP errors  
- `http_request_duration_seconds` - Gauge of request duration

### AI Service Metrics
- `ai_requests_total` - Counter of AI requests
- `ai_errors_total` - Counter of AI errors
- `ai_provider_failures_total` - Counter of provider failures
- `ai_inference_duration_seconds` - Gauge of inference duration
- `ai_cache_hits_total` - Counter of cache hits
- `ai_cache_misses_total` - Counter of cache misses

### Video Processing Metrics
- `video_processing_total` - Counter of video processing operations
- `video_processing_errors_total` - Counter of video processing errors
- `video_processing_duration_seconds` - Gauge of processing duration
- `video_frames_processed` - Gauge of frames processed

## Security Considerations

1. **Metric Exposure**: Sensitive information is not included in metrics
2. **Rate Limiting**: Metrics collection does not impact application performance
3. **Access Control**: Monitoring endpoints follow the same security as other API endpoints

## Alerting

The system provides the foundation for alerting based on:

- High error rates
- Slow response times
- Resource exhaustion
- Service unavailability

## Performance Impact

The monitoring system is designed to have minimal impact on performance:
- Metrics are collected in memory with bounded storage
- No blocking operations during metrics collection
- Optional monitoring that can be disabled in resource-constrained environments

## Usage

### For Developers
- Use the monitoring decorators to track custom functions
- Access metrics via the global `metrics_collector` instance
- Implement custom metrics collection where needed

### For Operations
- Configure monitoring tools to scrape `/metrics` endpoint
- Set up alerts based on error rates and performance metrics  
- Monitor the `/health` endpoint for service availability

## Testing

The monitoring system can be tested using the existing test framework. Metrics collection is designed to work without interfering with unit tests.

## Future Enhancements

- Integration with external monitoring services
- Advanced alerting and dashboarding
- Automated performance optimization suggestions
- Enhanced tracing capabilities