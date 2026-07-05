# Qardho Skilled Platform

**Live Demo:** [https://qardho-skilled-platform.onrender.com/](https://qardho-skilled-platform.onrender.com/)

Qardho Skilled Platform is a local skilled-labor marketplace for Qardho, Somalia. It helps households, farms, schools, businesses, and employers find local workers such as solar technicians, plumbers, builders, tailors, teachers, electricians, and general trade professionals.

The project is currently an MVP/demo app with a real React frontend, Express API, and PostgreSQL database. It supports the core marketplace loop: browse workers, browse jobs, post a job, apply to a job, send hire connection requests, manage requests from a dashboard, edit profiles, and leave worker reviews.

## Current Status

- **Fully Migrated to Native PostgreSQL:** The database layer communicates directly using native parameterized queries (`$1`, `$2`, etc.) and quoted camelCase identifiers. The old SQLite dynamic translation layer and leftover `.sqlite` files have been completely removed.
- Demo quick-login flows for both worker and employer roles.
- Production build and TypeScript check currently pass.
- Authentication is demo/local only: users sign in by registered phone or email plus password, but the app does not create production-grade sessions or protect all API routes.
- API routes are intended for local prototype use and are not production-hardened.
- SMS preferences are stored in profiles, but real SMS delivery is not integrated yet.

## Features

- Worker directory with search, skill filters, neighborhood filters, and availability filters.
- Worker cards with skill, location, rate, availability, verified badge, and review summary.
- Public worker profile view with bio, direct contact details, ratings, reviews, and trust signals.
- Job board with search, neighborhood filtering, and lifecycle status filtering.
- Job lifecycle statuses: `open`, `in_progress`, `completed`, and `closed`.
- Employer job posting flow.
- Worker job application flow.
- Employer-to-worker connection request flow.
- Accepted, declined, and pending status tracking.
- Role-based dashboard for workers and employers.
- Dashboard metrics, tabs, action confirmations, and status updates.
- Notification menu for recent connection and application activity.
- Profile editing with role-specific fields.
- Worker availability and SMS notification preference settings.
- Review submission by employers with accepted hire connections.
- Demo role switching for testing both sides of the marketplace.
- Local seed data for workers, jobs, connections, applications, and reviews.

## Tech Stack

| Area | Technology | Purpose |
| --- | --- | --- |
| Frontend | React 19 | Interactive single-page app UI. |
| Frontend | TypeScript | Shared typing for users, jobs, applications, connections, reviews, and server code. |
| Frontend | Vite | Development middleware and frontend production build. |
| Frontend | Tailwind CSS 4 | Utility-first styling. |
| Frontend | Lucide React | Icons for navigation, actions, status badges, forms, and dashboards. |
| Backend | Node.js | Runtime for the local server. |
| Backend | Express | API routes, JSON handling, Vite middleware in development, and static serving in production. |
| Database | PostgreSQL | Persistent hosted data store, tested for Neon-style connection strings. |
| Database | `pg` | Node PostgreSQL client used by the Express API. |
| Build | esbuild | Bundles `server.ts` into `dist/server.mjs`. |

## Data Model

The backend creates these PostgreSQL tables when the app starts:

- `users`: workers, employers, pending onboarding users, profile details, availability, verification, and notification preferences.
- `jobs`: job posts created by employers.
- `connections`: employer-to-worker hire/contact requests.
- `applications`: worker applications to posted jobs.
- `reviews`: employer reviews for workers.

If the database has no users, the server seeds sample workers, jobs, connections, applications, and reviews.

## Project Structure

```text
.
+-- src/
|   +-- App.tsx                 # Main app state, routing, API calls, and modal orchestration
|   +-- main.tsx                # React entry point
|   +-- index.css               # Tailwind CSS import
|   +-- types.ts                # Shared TypeScript interfaces
|   +-- constants.ts            # Local constants such as Qardho neighborhoods
|   +-- components/             # Reusable UI components
|   +-- pages/                  # Main app screens
+-- server.ts                   # Express server, PostgreSQL schema, seed data, and API routes
+-- vite.config.ts              # Vite, React, Tailwind, and path alias config
+-- package.json                # Scripts and dependencies
+-- tsconfig.json               # TypeScript configuration
+-- index.html                  # Browser entry HTML
```

## API Routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/workers` | List all worker users. |
| `GET` | `/api/jobs` | List all jobs. |
| `GET` | `/api/connections` | List connection requests. |
| `GET` | `/api/applications` | List job applications. |
| `GET` | `/api/reviews` | List worker reviews. |
| `POST` | `/api/auth/register` | Create a new local user account. |
| `POST` | `/api/auth/login` | Log in by email or phone number plus password. |
| `POST` | `/api/profile/update` | Update user profile and role details. |
| `POST` | `/api/jobs` | Create a new job post. |
| `POST` | `/api/jobs/:id/status` | Update a job lifecycle status. |
| `POST` | `/api/connections` | Create a worker connection request. |
| `POST` | `/api/connections/:id/status` | Accept or decline a connection request. |
| `POST` | `/api/applications` | Apply to a job. |
| `POST` | `/api/applications/:id/status` | Accept or decline a job application. |
| `POST` | `/api/reviews` | Add a worker review. |

## Local Setup

### Prerequisites

- Node.js 20 or newer.
- npm.

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a local `.env` file or set this variable in your deployment provider:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST/neondb?sslmode=require"
```

Keep the real Neon URL in local/deployment secrets. Do not commit it to Git.

### Run in Development

```bash
npm run dev
```

The app runs at:

```text
http://localhost:3000
```

In development, Express mounts Vite middleware, so the same server handles the API and the React app.

### Build for Production

```bash
npm run build
```

This creates:

- `dist/` frontend assets from Vite.
- `dist/server.mjs` bundled backend server from esbuild.

### Run the Production Build

```bash
npm start
```

The production server serves the built React app and API from:

```text
http://localhost:3000
```

### Type Check

```bash
npm run lint
```

This runs TypeScript checking with `tsc --noEmit`.

## Deployment

The application is built to run as a single monolithic service that serves the React frontend compiled static files and endpoints from the same Node.js/Express server.

### Deploying to Render.com
1. Create a new **Web Service** on Render and link your GitHub repository.
2. Select the **Node** runtime environment.
3. Configure the following build settings:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. Under **Environment Variables**, add:
   - `DATABASE_URL`: `your_neon_postgresql_connection_string`
   - `NODE_ENV`: `production`
5. In **Advanced settings**, set the **Health Check Path** to `/`.

### Deploying to Railway.app
1. Create a new project on Railway and click **Deploy from GitHub repo**.
2. Select your repository.
3. Add the following environment **Variables** in the service settings panel:
   - `DATABASE_URL`: `your_neon_postgresql_connection_string`
   - `NODE_ENV`: `production`
4. Railway will automatically build the assets and start the service.

## Demo Usage

After starting the app, use the quick test actions in the top demo banner:

- Log in as Ahmed to test the worker experience.
- Log in as Farmer to test the employer experience.

The seeded demo credentials are:

| Role | Email or phone | Password |
| --- | --- | --- |
| Worker | `ahmed.mohamed@example.com` or `+252 90 779 1234` | `demo1234` |
| Employer | `employer1@qardho.com` or `+252 90 700 1122` | `demo1234` |

Suggested demo loop:

1. Browse the worker directory.
2. View a worker profile and reviews.
3. Log in as an employer.
4. Send a connection request to a worker.
5. Post a job.
6. Switch to a worker account.
7. Browse jobs and submit an application.
8. Open the dashboard to accept, decline, or track requests.
9. Edit a profile and update availability or notification preferences.

## Verification

The current app has been checked with:

```bash
npm run build
npm run lint
```

Both commands pass in the current workspace.

## Production Gaps

Before using this for real users, the app needs:

- Real authentication, password or OTP flow, and server-side sessions.
- Stronger authorization that does not trust client-supplied `actorId`.
- Input validation and rate limiting on public routes.
- Real SMS or WhatsApp notification integration if notification preferences are meant to send messages.
- Deployment configuration for hosting, database backups, and environment management.
- More formal automated tests for the main worker, employer, application, and connection flows.
