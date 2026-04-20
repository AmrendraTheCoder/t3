# T3 — Team Task Tracker

A project management tool for organizing weekly tasks across team members. Built with Next.js 14, Supabase, and Gemini AI.

## Features

- **AI Smart Planner** — Describe your project and team roles, AI generates a complete weekly plan with tasks
- **GitHub Import** — Connect a GitHub repo, AI analyzes the codebase and auto-generates a project plan
- **Week-based Task Board** — Organize tasks by week with per-person columns
- **Role-Based Access** — Admins manage everything, members update their own task status
- **Admin Dashboard** — Stats, per-member progress, per-week breakdown
- **Email Notifications** — Send team updates via Resend
- **Profile Management** — Avatar color, password change, GitHub token

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database / Auth:** Supabase (PostgreSQL + RLS)
- **AI:** Google Gemini 2.0 Flash
- **Email:** Resend
- **Design:** Google Material Design (dark theme)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env` to `.env.local` and fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
RESEND_API_KEY=your_resend_api_key
```

### 3. Run the database schema

Open your Supabase Dashboard → SQL Editor → paste the contents of `supabase-schema.sql` → Run.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

1. **First user** to sign up automatically becomes **admin**
2. Admin creates projects (manually or via AI Smart Create)
3. Admin adds team members and weeks
4. Members log in and update their task status
5. Admin monitors progress on the Dashboard

See [SETUP.md](SETUP.md) for the full guide.

## License

MIT
