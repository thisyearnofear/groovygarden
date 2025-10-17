# DegenDancing 🎭

**AI-Powered Dance Chain Platform** - Create viral dance sequences with real-time move verification. Join collaborative challenges, add your unique moves, and watch your creations go viral!

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/thisyearnofear/groovygarden)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Table of Contents
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Docker Deployment](#docker-deployment)

## ✨ Features

- 🎬 **AI-Powered Challenges**: Generate creative dance challenges with Cerebras Llama
- 🤖 **Real-Time Verification**: Computer vision validates dance moves using MediaPipe
- 🎭 **Sequential Playback**: Watch dance chains evolve move by move
- 👥 **Social Collaboration**: Join chains, vote on moves, follow creators
- 📱 **Mobile-First Design**: Responsive UI optimized for all devices
- 🚀 **Performance Optimized**: Fast loading with smooth animations

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Python FastAPI with async endpoints
- **Database**: PostgreSQL with connection pooling (Neon.tech)
- **AI**: Cerebras Llama models for content generation
- **Computer Vision**: MediaPipe for pose analysis
- **Deployment**: Docker + Railway/E2B
- **Authentication**: Solar platform OAuth integration

### Core Components
- **Dance Chain Engine**: Sequence validation and progression
- **AI Service Layer**: Challenge generation and feedback
- **Video Processing**: Pose extraction and analysis
- **Social Features**: Voting, following, leaderboards

## Prerequisites
- Node.js (v20+)
- Python (3.10+)
- pnpm (or npm/yarn)
- uv (Python package manager)

## 🚀 Quick Start

### Prerequisites
- Node.js (v20+) and pnpm
- Python (3.10+) with uv
- Neon.tech account (free PostgreSQL)
- Cerebras API key (for AI features)

### 1. Clone & Setup
```bash
git clone https://github.com/thisyearnofear/groovygarden.git
cd groovygarden
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration (see Environment Variables section below)
```

### 3. Database Setup (Neon.tech)
1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string
4. Add it to your `.env` file as `NEON_CONN_URL`

### 4. Backend Setup
```bash
cd services
uv sync                    # Install Python dependencies
python setup_database.py  # Create database tables and seed data
python main.py           # Start the API server (http://localhost:8000)
```

### 5. Frontend Setup
```bash
cd ../app
pnpm install     # Install Node dependencies
pnpm dev        # Start development server (http://localhost:5173)
```

### 6. Access the Application
- **Frontend**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/docs (HEAD request)

### First Time Setup
The application includes a comprehensive onboarding flow for new users. The database setup script creates sample data to help you explore all features immediately.

## Production Deployment

### Railway Deployment (Recommended)
The project is configured for Railway deployment:

1. The `railway.toml` configures the deployment
2. Uses the `railway.Dockerfile` which:
   - Builds the frontend React app
   - Sets up a Python FastAPI backend
   - Configures nginx to serve static files and proxy API requests
   - Runs both services in a single container
3. Exposes the service on port 8000

### E2B Sandbox
The project can also be deployed on E2B sandbox platform as configured in `e2b.toml`.

## 📁 Project Structure

```
.
├── app/                    # React frontend application
│   ├── docs/              # Documentation and planning
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # React components by domain
│   │   │   ├── auth/      # Authentication components
│   │   │   ├── layout/    # Layout components (Navbar, etc.)
│   │   │   ├── onboarding/# Welcome modal and feature tours
│   │   │   ├── pages/     # Page-level components
│   │   │   ├── ui/        # Reusable UI components
│   │   │   └── video/     # Video recording components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # SDK and utilities
│   │   └── types/         # TypeScript type definitions
│   ├── index.css          # Global styles + animations
│   ├── package.json       # Frontend dependencies
│   └── vite.config.ts     # Vite configuration
├── services/              # Python backend services
│   ├── core/              # Business logic modules
│   │   ├── ai_service.py  # AI integration (Cerebras)
│   │   ├── chain_service.py # Dance chain logic
│   │   ├── user_service.py # User management
│   │   └── voting_service.py # Voting system
│   ├── api/               # FastAPI application
│   │   ├── routes.py      # API endpoints
│   │   ├── models.py      # Pydantic models
│   │   └── bootstrap.py   # App initialization
│   ├── solar/             # Database ORM framework
│   ├── setup_database.py  # Database initialization
│   ├── test_*.py          # Test utilities
│   └── main.py            # Application entry point
├── ROADMAP.md             # Development roadmap
├── .env.example           # Environment template
├── railway.Dockerfile     # Railway deployment
├── e2b.Dockerfile         # E2B sandbox deployment
└── README.md              # This file
```

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

### Required for Basic Functionality

```env
# Database - Neon.tech (Required)
NEON_CONN_URL=postgresql://your-neon-connection-string

# AI Service - Cerebras (Required for AI features)
CEREBRAS_API_KEY=your-cerebras-api-key

# Authentication (Required)
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
```

### Optional/Advanced Configuration

```env
# Solar Platform Integration (for authentication)
ROUTER_BASE_URL=https://your-solar-router-url.com
OPENROUTER_API_KEY=your-openrouter-api-key-fallback

# Application URLs
ENV=development  # development | sandbox | production
FRONTEND_URL=http://localhost:5173
API_BASE_URL=http://localhost:8000

# Media Storage (AWS S3)
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your-dance-videos-bucket
AWS_S3_KEY=your-aws-access-key-id
AWS_S3_SECRET=your-aws-secret-access-key

# SEO & External Services
PRERENDER_TOKEN=your-prerender-io-token
```

### Quick Setup Guide

1. **Database (Neon.tech)**:
   - Visit [neon.tech](https://neon.tech)
   - Create free account → New project
   - Copy connection string to `NEON_CONN_URL`

2. **AI (Cerebras)**:
   - Visit [cloud.cerebras.ai](https://cloud.cerebras.ai)
   - Get API key → Add to `CEREBRAS_API_KEY`

3. **Authentication**:
   - Generate a secure JWT key for `JWT_SECRET_KEY`
   - Example: `openssl rand -hex 32`

### Environment Validation

The application validates required environment variables on startup. Missing critical variables will show clear error messages with setup instructions.

## Docker Deployment

### Building the Docker Image
```bash
# For Railway deployment
docker build -f railway.Dockerfile -t degendancing .

# Run the container
docker run -p 8000:8000 degendancing
```

The production Dockerfile:
- Builds the React frontend using pnpm
- Sets up the Python backend using uv
- Configures nginx to serve static files and proxy API requests
- Provides SEO support via prerender.io integration

## 🛠️ Development Scripts

### Database Management
```bash
cd services

# Initialize database with tables and seed data
python setup_database.py

# Test database connection
python -c "from solar.table import get_pool; pool = get_pool(); print('✅ DB connected')"
```

### AI Service Testing
```bash
cd services

# Test all AI features (requires CEREBRAS_API_KEY)
python test_ai.py

# Individual AI tests
python -c "from core.ai_service import ai_service; print(ai_service.generate_challenge('hip-hop', 'easy'))"
```

### Build & Development
```bash
# Frontend
cd app
pnpm install    # Install dependencies
pnpm dev       # Start dev server (http://localhost:5173)
pnpm build     # Production build
pnpm preview   # Preview production build

# Backend
cd services
uv sync        # Install Python dependencies
python main.py # Start API server (http://localhost:8000)
```

## 📊 API Endpoints

### Core Features
- `POST /api/chain_service/create_dance_chain` - Create new dance chain
- `POST /api/chain_service/add_move_to_chain` - Add move to existing chain
- `GET /api/chain_service/get_dance_chains` - List chains with filtering
- `GET /api/chain_service/get_chain_moves/{chain_id}` - Get moves in sequence

### AI Features
- `POST /api/ai/generate_challenge` - AI-generated dance challenges
- `POST /api/ai/coach_commentary` - Real-time performance feedback
- `POST /api/ai/describe_move` - Natural language move descriptions
- `POST /api/ai/viral_caption` - Social media caption generation

### Social Features
- `POST /api/voting_service/vote_on_move` - Vote on dance moves
- `GET /api/voting_service/get_top_moves` - Popular moves leaderboard
- `POST /api/user_service/get_user_profile` - User profiles and stats

## 🎯 Testing Strategy

### Unit Tests
- Component tests for React components
- Service tests for business logic
- AI integration tests with mock responses

### Integration Tests
- API endpoint testing
- Database operation validation
- Cross-service communication

### End-to-End Tests
- Complete user journeys (create → join → complete chain)
- Video upload and processing workflows
- AI feature integration testing

Run tests:
```bash
# Frontend tests (when implemented)
cd app && pnpm test

# Backend tests (when implemented)
cd services && python -m pytest
```

## Scripts

### Frontend Scripts
- `pnpm dev`: Start development server
- `pnpm build`: Build for production
- `pnpm preview`: Preview production build

### API Endpoints
The backend provides REST APIs for:
- Authentication
- Dance chain management
- Video upload and verification
- User profiles
- Voting and rankings

## 🏗️ Architecture Principles

This project follows strict architectural principles for maintainability and scalability:

### Core Principles
- **ENHANCEMENT FIRST**: Always enhance existing components over creating new ones
- **AGGRESSIVE CONSOLIDATION**: Delete unnecessary code rather than deprecating
- **PREVENT BLOAT**: Systematic audits prevent feature creep
- **DRY**: Single source of truth for all shared logic
- **CLEAN**: Clear separation of concerns with explicit dependencies
- **MODULAR**: Composable, testable, independent modules
- **PERFORMANT**: Adaptive loading, caching, and optimization
- **ORGANIZED**: Predictable file structure with domain-driven design

### Design Decisions
- **Database**: PostgreSQL with custom ORM for type safety and performance
- **AI Integration**: Direct Cerebras API for speed and reliability
- **Frontend**: Component-based architecture with clear domain separation
- **Styling**: Utility-first CSS with consistent design tokens
- **Testing**: Comprehensive test coverage with clear success criteria

## 🤝 Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Follow** core principles when making changes
4. **Test** thoroughly: database, AI services, UI components
5. **Commit** with clear messages: `git commit -m 'Add amazing feature'`
6. **Push** to branch: `git push origin feature/amazing-feature`
7. **Open** a Pull Request with detailed description

### Code Quality
- Follow existing patterns and architectural decisions
- Add tests for new functionality
- Update documentation for API changes
- Ensure mobile responsiveness
- Validate performance impact

### Getting Help
- 📖 **Documentation**: Check this README and ROADMAP.md
- 🐛 **Issues**: Use GitHub issues for bugs and feature requests
- 💬 **Discussions**: Join community discussions for questions
- 📧 **Contact**: Reach out for architectural guidance

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Cerebras**: For ultra-fast AI inference enabling real-time features
- **Neon.tech**: For reliable, serverless PostgreSQL hosting
- **MediaPipe**: For robust computer vision pose analysis
- **Solar Platform**: For authentication and user management infrastructure

---

**Ready to dance?** 🎭 Start building the future of collaborative dance creation!

For questions or contributions, please see our [Contributing Guide](#-contributing) above.