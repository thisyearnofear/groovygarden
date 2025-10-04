# DegenDancing

Dance Chain is a platform for creating viral dance chains with AI-powered move verification. Users can start dance chains, join existing ones, and compete with others by performing all previous moves accurately before adding their own.

## Table of Contents
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Docker Deployment](#docker-deployment)

## Architecture
The application consists of:
- **Frontend**: React + TypeScript + Vite with Tailwind CSS
- **Backend API**: Python FastAPI with multiple services
- **Database**: PostgreSQL (via psycopg)
- **CDN**: Static assets served via nginx

## Prerequisites
- Node.js (v20+)
- Python (3.10+)
- pnpm (or npm/yarn)
- uv (Python package manager)

## Local Development

### Frontend Development
1. Navigate to the app directory:
   ```bash
   cd app
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```
   The frontend will be available at `http://localhost:5173`

### Backend Development
1. Navigate to the services directory:
   ```bash
   cd services
   ```

2. Install Python dependencies with uv:
   ```bash
   uv sync
   ```

3. Start the API server:
   ```bash
   python main.py
   ```
   The backend API will be available at `http://localhost:8000`

### Running Both Together
For full development, run both the frontend and backend in separate terminals.

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

## Project Structure
```
.
├── app/                    # React frontend application
│   ├── public/             # Static assets
│   ├── src/                # Source code
│   │   ├── components/     # React components
│   │   ├── auth/           # Authentication components
│   │   ├── lib/            # Shared libraries
│   │   └── types/          # TypeScript types
│   ├── package.json        # Frontend dependencies
│   └── vite.config.ts      # Vite configuration
├── services/              # Python backend services
│   ├── api/               # FastAPI application
│   │   ├── routes.py      # API routes
│   │   ├── models.py      # Data models
│   │   └── utils.py       # Utility functions
│   ├── logging-server/    # Logging server
│   └── main.py            # Application entry point
├── railway.Dockerfile     # Production Dockerfile for Railway
├── e2b.Dockerfile         # Dockerfile for E2B sandbox
├── .env                   # Environment variables
└── README.md              # This file
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database configuration
DATABASE_URL=postgresql://user:password@localhost:5432/degendancing

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API Configuration
API_BASE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

# Prerender.io Configuration (for SEO)
PRERENDER_TOKEN=your-prerender-token

# Cloud storage (if needed)
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket
```

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

## Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License
This project is licensed under the MIT License.