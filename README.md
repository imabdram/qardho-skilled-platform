# Qardho Skilled Platform

Qardho Skilled Platform is a local skilled-labor marketplace for Qardho, Somalia. It connects workers such as solar technicians, plumbers, builders, tailors, and teachers with employers, farms, schools, businesses, and households that need local services.

The app supports worker discovery, job posting, applications, connection requests, profile management, reviews, role switching, and a role-based dashboard. Data is stored in a local SQLite database and served through an Express API.

## Main Features

- Worker directory with search, skill filters, and neighborhood filters.
- Job board for local opportunities in Qardho.
- Employer-to-worker connection requests.
- Worker job applications.
- Accepted, declined, and pending status tracking.
- Worker profiles with bio, skill, rate, location, phone, reviews, and SMS notification preference.
- Employer dashboard for posted jobs and received applications.
- Worker dashboard for received hire requests and submitted applications.
- Demo quick-login actions for testing worker and employer flows.
- Persistent local data through `database.sqlite`.

## Technology Stack

### Frontend

| Technology | Where it is used | Why it is used |
| --- | --- | --- |
| React 19 | `src/main.tsx`, `src/App.tsx`, `src/pages/*`, `src/components/*` | Builds the interactive single-page app UI using reusable components and state-driven rendering. |
| React DOM | `src/main.tsx` | Mounts the React application into the browser DOM. |
| TypeScript | `src/*.tsx`, `src/types.ts`, `server.ts` | Adds static typing for users, jobs, applications, reviews, and server code. |
| Vite | `vite.config.ts`, `index.html`, development middleware in `server.ts` | Provides fast local development, frontend bundling, and production frontend builds. |
| Tailwind CSS 4 | `src/index.css`, Tailwind utility classes throughout components | Handles styling directly in the UI components with responsive utility classes. |
| `@tailwindcss/vite` | `vite.config.ts` | Connects Tailwind CSS to the Vite build pipeline. |
| `@vitejs/plugin-react` | `vite.config.ts` | Enables React support in Vite, including JSX transform and React development behavior. |
| Lucide React | Most UI components and pages | Provides consistent icons for navigation, forms, jobs, profiles, status badges, and actions. |

### Backend

| Technology | Where it is used | Why it is used |
| --- | --- | --- |
| Node.js | Runtime for `server.ts` and production `dist/server.cjs` | Runs the backend server and build scripts. |
| Express | `server.ts` | Serves API routes, JSON request handling, Vite middleware in development, and static files in production. |
| SQLite | `database.sqlite` | Stores app data locally without requiring an external database service. |
| `sqlite` | `server.ts` | Provides a promise-based API for SQLite queries. |
| `sqlite3` | `server.ts` | Provides the native SQLite database driver. |
| `tsx` | `npm run dev` | Runs the TypeScript server directly during development. |
| esbuild | `npm run build` | Bundles `server.ts` into `dist/server.cjs` for production. |

### Data Model

The backend creates these SQLite tables automatically when the app starts:

- `users`: workers, employers, pending onboarding users, profile details, and notification preferences.
- `jobs`: job posts created by employers.
- `connections`: employer-to-worker contact requests.
- `applications`: worker applications to posted jobs.
- `reviews`: employer reviews for workers.

If the database is empty, `server.ts` seeds sample workers, jobs, connections, applications, and reviews.

### Installed or Scaffolded Dependencies

These packages are present in `package.json`, but are not currently wired into the runtime app code:

| Technology | Current status | Intended use |
| --- | --- | --- |
| `@google/genai` | Installed, not currently imported | Could be used later for Gemini-powered AI features such as smart job matching or profile writing. |
| Firebase | Installed, not currently imported | Could be used later for hosted authentication, Firestore, storage, or cloud deployment integrations. |
| Motion | Installed, not currently imported | Could be used later for advanced UI animations. |
| dotenv | Installed, not currently imported | Could be used later to load local environment variables from `.env` files. |
| Autoprefixer | Installed as a dev dependency | Can help with CSS vendor prefixing if a PostCSS pipeline is added or expanded. |

## Project Structure

```text
.
+-- src/
|   +-- App.tsx                 # Main app state, routing, API calls, and modal orchestration
|   +-- main.tsx                # React entry point
|   +-- index.css               # Tailwind CSS import
|   +-- types.ts                # Shared TypeScript interfaces
|   +-- components/             # Reusable UI components
|   +-- pages/                  # Main app screens
+-- server.ts                   # Express server, SQLite schema, seed data, and API routes
+-- database.sqlite             # Local SQLite database
+-- vite.config.ts              # Vite, React, Tailwind, and path alias config
+-- package.json                # Scripts and dependencies
+-- tsconfig.json               # TypeScript configuration
+-- index.html                  # Browser entry HTML
```

## API Routes

The frontend calls these local API routes:

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/workers` | List all users with the worker role. |
| `GET` | `/api/jobs` | List all jobs. |
| `GET` | `/api/connections` | List connection requests. |
| `GET` | `/api/applications` | List job applications. |
| `GET` | `/api/reviews` | List worker reviews. |
| `POST` | `/api/auth/register` | Create a new local user account. |
| `POST` | `/api/auth/login` | Log in by email or phone number plus password. |
| `POST` | `/api/profile/update` | Update user profile and role details. |
| `POST` | `/api/jobs` | Create a new job post. |
| `POST` | `/api/connections` | Create a worker connection request. |
| `POST` | `/api/connections/:id/status` | Accept or decline a connection request. |
| `POST` | `/api/applications` | Apply to a job. |
| `POST` | `/api/applications/:id/status` | Accept or decline a job application. |
| `POST` | `/api/reviews` | Add a worker review. |

## Local Setup

### Prerequisites

- Node.js 20 or newer is recommended.
- npm.

### Install Dependencies

```bash
npm install
```

### Environment Variables

The app can run locally without external services because the current implementation uses local SQLite and does not call Gemini or Firebase.

An example environment file is provided at `.env.example`:

```bash
GEMINI_API_KEY="MY_GEMINI_API_KEY"
APP_URL="MY_APP_URL"
```

These values are scaffolded for possible AI Studio, Gemini, or hosted deployment use. They are not required for the current local marketplace flow.

### Run in Development

```bash
npm run dev
```

The Express server starts on:

```text
http://localhost:3000
```

In development, Express also mounts Vite middleware, so the same server handles both the API and the React app.

### Build for Production

```bash
npm run build
```

This creates:

- `dist/` frontend assets from Vite.
- `dist/server.cjs` bundled backend server from esbuild.

### Run the Production Build

```bash
npm start
```

The production server serves the built React app and the API from:

```text
http://localhost:3000
```

### Type Check

```bash
npm run lint
```

This runs TypeScript checking with `tsc --noEmit`.

## Demo Usage

After starting the app, use the quick test actions in the top banner:

- Log in as Ahmed to test the worker experience.
- Log in as Farmer to test the employer experience.

The seeded demo credentials are:

| Role | Email or phone | Password |
| --- | --- | --- |
| Worker | `ahmed.mohamed@example.com` or `+252 90 779 1234` | `demo1234` |
| Employer | `employer1@qardho.com` or `+252 90 700 1122` | `demo1234` |

You can then test the complete marketplace loop:

1. Browse workers.
2. Browse jobs.
3. Post a job as an employer.
4. Apply to a job as a worker.
5. Send a connection request as an employer.
6. Accept or decline requests from the dashboard.
7. Edit profiles and reviews.

## Notes

- Authentication is currently demo/local only. The server stores local SQLite password hashes and validates login passwords, but it does not create production-grade sessions or protect API routes.
- API routes are currently unauthenticated and intended for local prototype use.
- The SQLite database is local to this project folder.
- If `database.sqlite` is deleted, the app recreates the schema and seeds sample data on the next server start.
