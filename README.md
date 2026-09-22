# Doctor-back

Backend API for the DentalCare clinic app: Express 4 on Node.js, with a
hand-rolled data layer on top of Node's **built-in `node:sqlite` module**
(no external database server, no ORM, nothing to install for the database
itself). JWT authentication, bcrypt password hashing, role-based access
control (patient / admin), server-side validation on every write endpoint,
and file uploads for reports and emergency-request photos.

## Requirements

- Node.js **22.5.0 or later** (this project uses Node's built-in
  `node:sqlite`, which only exists from Node 22.5+; run `node -v` to check).

## Setup

```bash
npm install
cp .env.example .env   # then edit .env, see "Environment variables" below
npm run seed            # creates data/dev.db and seeds an admin + sample dentists/services
npm run dev              # starts the API on http://localhost:5000 with auto-reload
```

`npm start` runs the same thing without auto-reload (use this in production).

The default seeded admin login is:

- email: `admin@dentalcare.com`
- password: `Admin@123`

**Change this password after your first login in production.**

## Environment variables

Copy `.env.example` to `.env` and fill in real values. Never commit `.env`
(it's already in `.gitignore`).

| Variable | Meaning |
|---|---|
| `PORT` | Port the API listens on. |
| `NODE_ENV` | `development` or `production`. |
| `DATABASE_URL` | SQLite file path, e.g. `file:./data/dev.db`. See note below for production. |
| `JWT_SECRET` | Long random string used to sign login tokens. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. Never reuse the development value in production. |
| `JWT_EXPIRES_IN` | How long a login session lasts, e.g. `7d`. |
| `CORS_ORIGIN` | Comma-separated list of frontend origins allowed to call this API, e.g. `https://your-frontend.vercel.app`. Requests from any other origin are rejected. |

## Database notes

The SQLite database is a single file on disk (`data/dev.db` by default).
This is simple and requires no separate database service, but it means:

- **On most serverless/container platforms the filesystem is wiped on every
  redeploy.** If you deploy this API somewhere like that (Render's free
  tier, Vercel serverless functions, etc.), point `DATABASE_URL` at a
  persistent disk/volume the platform gives you, or your data will reset
  on every deploy. Render and Railway both offer an attachable persistent
  disk for exactly this.
- For heavier production use, the model layer in `src/models/` is a thin
  wrapper around SQL queries and can be swapped for a managed
  Postgres/MySQL service without touching the controllers.

## API overview

All routes are mounted under `/api`. Key resources:

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/services`, `GET /api/dentists`, `GET /api/dentists/:id/availability`
- `GET/POST /api/appointments`, `PUT /api/appointments/:id/status`, `PUT /api/appointments/:id/reschedule`
- `GET/POST /api/emergency`, `PUT /api/emergency/:id/status`
- `GET/POST /api/reports`
- `GET /api/patients` (admin only)
- `GET /api/health` - unauthenticated health check, useful for deployment platforms' health probes

Every route except `/api/health`, `/api/auth/register` and `/api/auth/login`
requires an `Authorization: Bearer <token>` header. Admin-only routes also
check the user's role server-side (not just in the frontend), and a patient
can only ever read or modify their own appointments/reports/emergency
requests - this is enforced in `src/controllers/`, not just hidden in the UI.

## Deploying

This is a standard Node/Express app - it runs on any Node hosting platform
(Render, Railway, Fly.io, a plain VPS, etc.):

1. Push this repo to GitHub (or your host's git integration).
2. Set the environment variables above in the platform's dashboard - **do
   not** commit real secrets.
3. Build command: `npm install`. Start command: `npm start`.
4. Point `DATABASE_URL` at a persistent volume path if the platform's
   filesystem is ephemeral (see "Database notes" above).
5. After the first deploy, run `npm run seed` once (via the platform's
   shell/console, or a one-off job) to create the admin account.
6. Update the frontend's `VITE_API_URL` to this API's public URL, and set
   this API's `CORS_ORIGIN` to the frontend's public URL.

Deployment itself requires your own hosting account and credentials, which
is not something that can be done on your behalf - the steps above are
everything you need to do it yourself.
