# Qardho Skilled Platform

**Live Demo:** [https://qardho-skilled-platform.onrender.com/](https://qardho-skilled-platform.onrender.com/)

Qardho Skilled Platform is a local skilled-labor marketplace for Qardho, Somalia. It connects households, farms, schools, businesses, and employers directly with local workers such as solar technicians, plumbers, builders, tailors, teachers, electricians, and trade professionals.

The application features a React frontend, Express API backend, Clerk authentication, and PostgreSQL database. It supports the complete marketplace loop: browse workers, browse jobs, post jobs, submit applications, send hire connection requests, manage workflows via a role-based dashboard, edit profiles, and leave worker reviews.

---

## Recent Platform Upgrades.

- **Dynamic Homepage Hero Carousel**: Rotates WebP trade photography from `/public/assets` with smooth 700ms cross-fade transitions, tab visibility auto-pausing, touch swipe gesture support, and dual-mode contrast overlays.
- **Aligned Worker Directory (`/workers`)**: Matched grid layout, search filters, active chips, sorting dropdowns, and card container metrics with the jobs board (`/jobs`).
- **Route Scroll Isolation**: SPA page navigation automatically resets window scroll to `(0, 0)` so each page starts fresh at the top.
- **Central Theme System & Royal Blue Palette**: Centralized color configuration in `src/theme.ts` and `src/index.css` with documented theme tokens and a Royal Blue (`#2563eb`) brand palette.

---

## Current Technical Architecture.

- **Clerk Authentication Integration**: Identity, email registration, OTP verification, password login, password reset, logout, and secure browser sessions handled by Clerk (`@clerk/react` and `@clerk/express`).
- **PostgreSQL Authorization & Data**: PostgreSQL owns user roles (`pending`, `worker`, `employer`, `admin`), profiles, Somali phone numbers, WhatsApp numbers, pricing, jobs, applications, connections, reviews, notifications, and verification status.
- **Identity Mapping**: Clerk `userId` maps to `users.clerkUserId` in PostgreSQL with automatic profile linking on email match.
- **Somali Phone Normalization**: Phone and WhatsApp numbers are validated to ensure international Somali formatting (`+252...`).
- **Production Build & Test Suite**: All unit tests pass, TypeScript typechecks cleanly (`tsc --noEmit`), and Vite + esbuild production builds execute without errors.

---

## Key Features.

- **Worker Directory**: Search, skill filters, neighborhood filters, availability filters, rating summaries, and verified badges.
- **Job Board**: Search and neighborhood filtering with status tracking.
- **Public Profiles**: Bio, ratings, reviews, trust signals, optimized avatars, and contact detail request flow.
- **Role-Based Dashboard**: Metrics, status tracking, action confirmations, and connection/application management.
- **Job Lifecycle**: Two-party completion requests, confirmation, disputes, audit events, and notifications.
- **Theme Customization**: Centralized color tokens in `src/theme.ts` for quick platform-wide theme updates.

---

## Project Structure

```text
.
├── src/
│   ├── theme.ts                # Central brand palette and theme class mappings
│   ├── App.tsx                 # Main app state, routing, scroll reset, and modal orchestration
│   ├── main.tsx                # React entry point
│   ├── index.css               # Tailwind CSS, theme tokens, and global styles
│   ├── types.ts                # Shared TypeScript interfaces
│   ├── constants.ts            # Local constants (e.g. Qardho neighborhoods)
│   ├── components/             # Reusable UI components (Navbar, JobCard, WorkerCard, etc.)
│   └── pages/                  # Main app screens (Landing, Workers, Jobs, Profile, etc.)
├── server.ts                   # Express server, PostgreSQL schema, seed data, and API routes
├── vite.config.ts              # Vite, React, Tailwind, and path alias config
├── package.json                # Scripts and dependencies
├── tsconfig.json               # TypeScript configuration
└── index.html                  # Browser entry HTML
```

---

## API Routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/workers` | List all worker users |
| `GET` | `/api/jobs` | List all jobs |
| `GET` | `/api/connections` | List connection requests |
| `GET` | `/api/applications` | List job applications |
| `GET` | `/api/reviews` | List worker reviews |
| `GET` | `/api/auth/me` | Restore current secure session |
| `POST` | `/api/profile/update` | Update user profile and role details |
| `POST` | `/api/jobs` | Create a new job post |
| `POST` | `/api/jobs/:id/status` | Update job lifecycle status |
| `POST` | `/api/connections` | Create a worker connection request |
| `POST` | `/api/connections/:id/status` | Accept or decline a connection request |
| `POST` | `/api/applications` | Apply to a job |
| `POST` | `/api/applications/:id/status` | Accept or decline a job application |
| `POST` | `/api/reviews` | Add a worker review |

---

## Local Setup

### Prerequisites

- Node.js 20 or newer
- npm

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST/neondb?sslmode=verify-full"
```

Optional variables:
- `PUBLIC_APP_URL`: Public origin used for links.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Cloudinary profile image storage.

### Development Mode

```bash
npm run dev
```

Runs at `http://localhost:3000`. Express mounts Vite middleware in development.

### Production Build

```bash
npm run build
npm start
```

### Type Checking & Testing

```bash
npm run lint
npm test
```

---

## Deployment

The application is deployed to Render as a single web service that serves both static frontend assets and backend API endpoints.

- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
