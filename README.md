# WheelsOnRent Frontend

React + TypeScript + Vite frontend for the ScootyOnRent vehicle rental platform.

## Project Structure

This project supports **two separate applications** from a single codebase:

| App | Domain | Description |
|-----|--------|-------------|
| **Main** | `scootyonrent.com` | Customer-facing rental website |
| **Admin** | `admin.scootyonrent.com` | Admin dashboard for management |

The apps are separated at **build time** using the `VITE_APP_TYPE` environment variable.

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running at `https://app.scootyonrent.com` (or localhost for dev)

## Installation

```bash
npm install
```

## Development

### Run Main App (Customer Website)

```bash
npm run dev:main
```
Opens at `http://localhost:5173` with customer routes.

### Run Admin App (Admin Dashboard)

```bash
npm run dev:admin
```
Opens at `http://localhost:5173` with admin routes.

### Run Default (Main App)

```bash
npm run dev
```

## Production Build

### Build Main App

```bash
npm run build:main
```
Output: `dist/` folder configured for main website deployment.

### Build Admin App

```bash
npm run build:admin
```
Output: `dist/` folder configured for admin dashboard deployment.

### Preview Production Build

```bash
npm run preview
```

## Environment Variables

This project uses **mode-based environment files** instead of `.env.production`:

| File | Used By | Purpose |
|------|---------|---------|
| `.env` | All modes | Default/shared variables |
| `.env.main` | `npm run dev:main` / `build:main` | Main app config |
| `.env.admin` | `npm run dev:admin` / `build:admin` | Admin app config |

> **Note**: We don't use `.env.production` because builds are mode-specific (`--mode main` or `--mode admin`).

### .env.main
```env
VITE_APP_TYPE=main
VITE_API_BASE_URL=https://app.scootyonrent.com/api
```

### .env.admin
```env
VITE_APP_TYPE=admin
VITE_API_BASE_URL=https://app.scootyonrent.com/api
```

## How App Separation Works

1. **Build-time detection**: `VITE_APP_TYPE` determines which routes to include
2. **Route files**:
   - `src/routes/mainRoutes.tsx` - Customer routes (home, vehicles, bookings)
   - `src/routes/adminRoutes.tsx` - Admin routes (dashboard, management)
3. **Layouts**:
   - `MainLayout` - Customer website layout with navbar/footer
   - `AdminLayout` - Admin dashboard layout with sidebar

## Deployment (Vercel)

### Main App (scootyonrent.com)
```json
{
  "buildCommand": "npm run build:main",
  "outputDirectory": "dist"
}
```

### Admin App (admin.scootyonrent.com)
```json
{
  "buildCommand": "npm run build:admin",
  "outputDirectory": "dist"
}
```

## Authentication

- Uses **HttpOnly cookies** for secure token storage
- Cookies are cross-subdomain (`.scootyonrent.com`)
- Admin app requires `admin` or `superadmin` role

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (default mode) |
| `npm run dev:main` | Start dev server for main app |
| `npm run dev:admin` | Start dev server for admin app |
| `npm run build` | Production build (default mode) |
| `npm run build:main` | Production build for main app |
| `npm run build:admin` | Production build for admin app |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |



## Tech Stack

- **React 18** with TypeScript
- **Vite** for bundling
- **RTK Query** for API calls
- **React Router v6** for routing
- **Tailwind CSS** for styling
- **shadcn/ui** components
