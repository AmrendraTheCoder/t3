# Team Task Tracker — Complete Setup & Usage Guide

## Table of Contents
1. [Initial Setup (One-time)](#1-initial-setup)
2. [Getting Admin Access](#2-getting-admin-access)
3. [Admin Workflow](#3-admin-workflow)
4. [Member Workflow](#4-member-workflow)
5. [Email Notifications](#5-email-notifications)
6. [Deploy to Vercel](#6-deploy-to-vercel)

---

## 1. Initial Setup

### Prerequisites
- A **Supabase** account (free) — [supabase.com](https://supabase.com)
- **Node.js** installed on your machine
- The project files (already created)

### Step 1: Configure Supabase

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Open your project (or create a new one)
3. Go to **Settings → API** and copy:
   - `Project URL` → paste into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → paste into `.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 2: Run the Database Schema

1. In Supabase Dashboard → click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open the file `supabase-schema.sql` from this project
4. **Copy the ENTIRE contents** and paste into the SQL Editor
5. Click **Run** (the green play button)
6. You should see "Success. No rows returned" — this means all 6 tables, RLS policies, and triggers are created

### Step 3: Disable Email Confirmation (Recommended for Dev)

1. In Supabase Dashboard → **Authentication** (left sidebar)
2. Click **Providers** tab
3. Under **Email** provider → click to expand
4. Toggle OFF **"Confirm email"**
5. Click **Save**

> This lets you sign up and log in immediately without checking your email.

### Step 4: Start the App

```bash
cd "project management"
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## 2. Getting Admin Access

### If you're the FIRST user to sign up:
You automatically become **admin**. The database trigger checks if any profiles exist — if none, the first signup gets `role = 'admin'`.

### If you already signed up BEFORE running the SQL schema:
The schema script (Step 6 in `supabase-schema.sql`) automatically creates your profile and makes you admin. Just refresh the page after running the SQL.

### If you need to manually make someone admin:
1. Go to Supabase Dashboard → **Table Editor**
2. Click on the **profiles** table
3. Find the user's row
4. Change the `role` column from `member` to `admin`
5. Click **Save**

### How to verify you're admin:
- Login to the app
- You should see a **"+ New Project"** button on the home page
- Inside a project, you should see **"Dashboard"** and **"Settings"** links in the top nav

---

## 3. Admin Workflow

### Creating a Project

1. **Login** → you land on the home page
2. Click **"+ New Project"** (top right)
3. Fill in:
   - **Project Name** (required) — e.g., "Stiché v2"
   - **Description** — optional summary
   - **Kickoff Date** — when work starts
   - **Target Date** — deadline
4. Click **"Create Project"**
5. You are automatically added as a member of this project

### Adding Team Members

Team members must **sign up first** (they need a Supabase account).

1. Ask your team members to go to your app URL and click **"Sign Up"**
2. They enter their name, email, and password
3. Once they've signed up, go to your project → **Settings** (top nav)
4. Under **"Team Members"** → click **"+ Add Member"**
5. Select the user from the dropdown (shows all registered users)
6. Enter their **Role Title** — e.g., "Frontend Dev", "AI Engineer"
7. Click **"Add Member"**

> Members will now see this project on their home page when they log in.

### Adding Weeks

1. Go to your project page → click **"+ Week"** (next to the week pills)
2. Fill in:
   - **Week Number** — auto-incremented
   - **Title** — e.g., "Foundation & Setup"
   - **Date Range** — e.g., "June 1–7"
   - **Theme** — optional, e.g., "Project scaffolding, dev environment"
3. Click **"Add Week"**

### Adding Tasks

1. Go to your project page → select a week
2. Under each team member's column, click **"+ Add Task"**
3. Fill in:
   - **Task Title** (required)
   - **Description** — details about the task
   - **Assign To** — pick a team member
   - **Mark as Deliverable** — check if this task has a key deliverable
   - **Deliverable Description** — what the delivered output should be
4. Click **"Add Task"**

### Viewing the Admin Dashboard

1. Go to your project → click **"Dashboard"** in the top nav
2. You'll see:
   - **Stats Cards** — total tasks, completed, in-progress, to-do
   - **Overall Progress** — progress bar
   - **Per-Member Progress** — bar chart showing each person's completion %
   - **Per-Week Breakdown** — grid showing completion by week
   - **Email Composer** — send notifications to team members

### Changing Task Status (Admin)

As admin, you can change ANY task's status:
- Click the status badge on any task card (e.g., "To Do")
- It cycles: **To Do → In Progress → Done → To Do**

### Deleting Tasks/Weeks/Members

- **Tasks**: Hover over a task card → click the ✕ button (top right)
- **Weeks**: Go to Settings → Weeks section → click "Delete" next to a week
- **Members**: Go to Settings → Members section → click "Remove"
- **Project**: Go to Settings → Danger Zone → "Delete Project"

---

## 4. Member Workflow

### Signing Up

1. Go to the app URL (e.g., http://localhost:3000)
2. Click **"Sign Up"** at the bottom of the login form
3. Enter your **Full Name**, **Email**, and **Password**
4. Click **"Create Account"**
5. You'll be redirected to the home page

### Viewing Your Projects

1. After login, you'll see all projects you've been added to
2. If you see "No projects yet" — ask your admin to add you to a project

### Updating Task Status

1. Open a project → navigate to the correct week
2. Find your task card in your column
3. Click the **status badge** to cycle through:
   - **To Do** → **In Progress** → **Done**
4. You can ONLY change the status of tasks assigned to you

### What Members CANNOT Do

- ❌ Create projects
- ❌ Add/remove team members
- ❌ Add/delete weeks
- ❌ Add/delete tasks
- ❌ Access the Dashboard or Settings pages
- ❌ Change other members' task statuses
- ❌ Send email notifications

---

## 5. Email Notifications

### Setup (One-time)

1. Go to [resend.com](https://resend.com) and create a free account
2. Get your API key from the dashboard
3. Add it to `.env.local`:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```
4. Restart the dev server

### Sending Notifications (Admin only)

1. Go to your project → **Dashboard** → scroll to "Notifications"
2. Click on team members to **select recipients** (or "Select All")
3. Edit the **Subject** line
4. Write your **Message** (e.g., "Please update your task progress for Week 3")
5. Click **"Send"**

> Without a Resend API key, emails run in "dry-run" mode — they're logged but not actually sent.

---

## 6. Deploy to Vercel

### Step 1: Push to GitHub

```bash
cd "project management"
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/team-task-tracker.git
git push -u origin main
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Import Project"** → select your repo
3. Add **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` → your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → your Supabase anon key
   - `RESEND_API_KEY` → your Resend API key
4. Click **Deploy**

### Step 3: Update Supabase Auth Settings

1. In Supabase Dashboard → **Authentication** → **URL Configuration**
2. Set **Site URL** to your Vercel domain (e.g., `https://your-app.vercel.app`)
3. Add your Vercel domain to **Redirect URLs**

---

## Common Issues

| Problem | Solution |
|---------|----------|
| "No projects yet" after login | You're not admin or not added to any project. Check `profiles` table in Supabase |
| Can't see "+ New Project" button | Your profile `role` is not `admin`. Change it in the `profiles` table |
| Signup gives "email rate limit" | Supabase free tier limits signups. Wait a few minutes or use a different email |
| Tasks don't save | Make sure you ran the full SQL schema including RLS policies |
| "Invalid supabaseUrl" error | Check `.env.local` has the correct Supabase URL (must start with https://) |
