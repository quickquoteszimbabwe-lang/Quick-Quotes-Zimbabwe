# Quick Quotes Zimbabwe (QQZ)

## Overview

A full-stack service marketplace connecting customers with verified professionals in Zimbabwe. Built on a pnpm monorepo with TypeScript.

## Tech Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS
- **Auth**: JWT (bcryptjs + jsonwebtoken)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (JWT auth, all routes)
│   └── qqz/                # React frontend (Splash, Login, Register, Home, Jobs, etc.)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
└── package.json            # Root package
```

## User Roles

- **Customer**: Creates job requests, selects quotes, approves completion, leaves reviews
- **Professional**: Views open jobs, submits quotes, manages profile
- **Admin**: Manages users (approve/suspend), views all jobs and payments

## Service Categories

- Construction (building, plumbing, electrical, painting, tiling)
- Borehole Services (drilling, deepening, pump installation)
- Transport (moving, truck hire, delivery)
- Cleaning (home, office, post-construction)
- Agriculture (irrigation, farm labor)
- Property Services (inspection, supervision, diaspora management)

## Payment Methods (Simulated)

- EcoCash
- Bank Transfer
- Paynow

## Color Scheme

- Primary: #0A3D62 (Deep Blue)
- Secondary: #1ABC9C (Emerald)
- Accent: #F4B400 (Gold)
- Background: #F8F9FA

## Test Accounts

- Customer: customer@test.com / password123
- Professional: professional@test.com / password123
- Admin: admin@qqz.com / (bcrypt hash for "admin123" — created via SQL)

## Database Tables

- users (id, name, email, phone, password_hash, role, suspended, created_at)
- professionals (id, user_id, services[], rating, verified, completed_jobs, bio, location)
- jobs (id, customer_id, category, service, description, location, timeline, status, selected_professional_id)
- quotes (id, job_id, professional_id, price, timeline, message)
- payments (id, job_id, amount, status, method)
- reviews (id, job_id, customer_id, professional_id, rating, comment)

## API Routes

All routes prefixed with `/api`:
- POST /auth/register, /auth/login, GET /auth/me
- GET/PATCH /users/profile, GET/POST/PATCH /users/professional
- GET/POST /jobs, GET/PATCH /jobs/:id, POST /jobs/:id/select-quote, /jobs/:id/complete
- POST /quotes, GET /quotes/my
- GET/POST /payments, PATCH /payments/:id/status
- POST /reviews, GET /reviews/professional/:id
- Admin: GET /admin/users, POST /admin/users/:id/suspend, GET /admin/jobs, GET /admin/payments, POST /admin/professionals/:id/approve
