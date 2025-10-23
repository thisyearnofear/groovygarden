# Configuration System for DegenDancing

This document describes the centralized configuration system implemented for DegenDancing.

## Overview

The configuration system provides a centralized way to manage application settings while maintaining compatibility with the existing Solar SDK structure. It follows the DRY principle by consolidating all environment variable access in a single location.

## Architecture

### Configuration Classes

The system uses specialized dataclasses for different configuration areas:

- `DatabaseConfig`: Database connection settings
- `AIConfig`: AI service credentials and parameters  
- `AuthConfig`: Authentication and JWT settings
- `MediaConfig`: Media storage and file handling settings
- `AppEnvironmentConfig`: Environment-specific settings
- `SecurityConfig`: Security and rate limiting settings
- `CacheConfig`: Caching settings

### Main Config Class

The `Config` class consolidates all configuration areas and provides validation methods:

```python
from services.config import get_config

config = get_config()

# Access settings
database_url = config.db.neon_conn_url
jwt_secret = config.auth.jwt_secret_key
```

## Validation

The system includes comprehensive validation:

```python
validation_result = config.validate()
if not validation_result["valid"]:
    print("Configuration errors:", validation_result["errors"])
```

## Environment Variables

### Required Variables
- `NEON_CONN_URL`: Database connection string
- `CEREBRAS_API_KEY`: AI service API key
- `JWT_SECRET_KEY`: Authentication secret (required in production)

### Optional Variables
All configuration values have sensible defaults, but can be customized via environment variables. See `services/config.py` for a complete list.

## Usage in Different Components

### FastAPI Application
The routes file now imports and uses the centralized config for:
- Rate limiting parameters
- CORS allowed origins  
- Environment detection

### Solar SDK Integration
The existing Solar SDK configuration class has been updated to delegate to the centralized config while maintaining backward compatibility.

## Security Considerations

1. **Production Mode**: In production, the system validates critical settings like JWT secrets
2. **Default Values**: Reasonable defaults are provided, but production deployments should explicitly set critical values
3. **Validation**: The system validates configuration before the application starts

## Migration from Direct os.getenv Calls

Instead of using `os.getenv()` directly, applications should now use:

```python
# Old way (still works but not recommended)
from os import getenv
db_url = getenv("NEON_CONN_URL")

# New recommended way
from services.config import get_config
config = get_config()
db_url = config.db.neon_conn_url
```

This provides better type safety, validation, and centralized management of configuration values.

## Testing

Configuration can be tested using the validate_config function:

```python
from services.config import validate_config
result = validate_config()
print(result)  # Shows validation results
```

## Environment-Specific Behavior

- **Development**: More permissive settings, debug information
- **Production**: Strict validation, security-focused defaults
- **Sandbox**: Development-like with some production features