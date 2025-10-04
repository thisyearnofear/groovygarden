# DegenDancing Frontend

This is the React-based frontend for the DegenDancing application, a platform for creating viral dance chains with AI-powered move verification.

## Overview

This template provides a minimal setup to get React working in Vite with HMR and ESLint rules. It includes:
- React with TypeScript
- Vite for fast builds and development
- Tailwind CSS for styling
- Shadcn/ui components
- React Router for navigation
- Various UI libraries and utilities

## Getting Started

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

### Building for Production

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

## Project Structure

- `src/` - Main source code
  - `components/` - React components organized by feature
    - `auth/` - Authentication-related components
    - `layout/` - Layout components like Navbar
    - `pages/` - Page components
    - `ui/` - Shadcn/ui components
    - `video/` - Video-related components
  - `auth/` - Authentication context and providers
  - `lib/` - Shared libraries and SDK
  - `types/` - TypeScript type definitions

## Dependencies

This project uses:
- React 18 with hooks
- TypeScript for type safety
- Vite for bundling and development
- Tailwind CSS for styling
- React Router for navigation
- Lucide React for icons
- Various shadcn/ui components

## Environment Variables

This application may require environment variables to be set in a `.env` file:

```
VITE_API_BASE_URL=http://localhost:8000
VITE_SENTRY_DSN=your-sentry-dsn
```

## Scripts

- `dev` - Starts the development server
- `build` - Builds the application for production
- `build:prod` - Builds for production with production mode
- `preview` - Locally preview the production build