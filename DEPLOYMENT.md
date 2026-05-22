# DebateHub Deployment Guide

Welcome to the polished, production-ready, AI-powered social debate platform. This guide outlines how to deploy DebateHub, configure environmental keys, initialize the Supabase database schema, and run tests.

---

## 🛠️ Technology Stack & Environment Config

DebateHub is built using:
- **Core**: Next.js 14+ (App Router), React, TypeScript.
- **Database**: Supabase (PostgreSQL with RLS, Triggers, and functions).
- **Styling**: Vanilla Tailwind CSS with custom glassmorphism and animations.
- **AI Engine**: Groq SDK (utilizing `llama-3.3-70b-specdec` for high speed) with OpenRouter fallback (`llama-3-8b-instruct:free`).

---

## 🚀 Setup & Launch Options

DebateHub features a **premium offline fallback mode**. If no Supabase connection is established, the application seamlessly switches to a stateful browser client utilizing memory caches and `localStorage` to simulate all social and database interactions.

### Option 1: Stateful Offline Fallback (Evaluation)
1. Do not configure real Supabase environment variables (leave placeholders from `.env.example`).
2. Run `npm install` and `npm run dev`.
3. Go to [http://localhost:3000](http://localhost:3000).
4. All actions (creating debates, voting on stances, bookmarking, commenting, replies, follows, user levels, leaderboard points, notifications, and simulated AI) are fully interactive and persist in local storage.

### Option 2: Live Supabase Integration (Production)
To deploy with a live Supabase backend:

1. Create a project at [Supabase](https://supabase.com).
2. Go to the SQL Editor in the Supabase Dashboard.
3. Paste the contents of [schema.sql](file:///c:/Users/jojin/Downloads/v0-debatehub-ui-design-main/v0-debatehub-ui-design-main/db/schema.sql) and execute the queries. This will create:
   - Tables (`profiles`, `categories`, `debates`, `votes`, `bookmarks`, `comments`, `comment_votes`, `follows`, `notifications`, `trending_topics`).
   - Trigger handlers for syncing new user signups.
   - Points award functions that grant reputation on votes (+5), comments (+10), and debates (+20).
   - RLS (Row Level Security) policies protecting user data.
4. Copy your **Project URL** and **Anon Key** into `.env` or `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
5. Configure your Groq/OpenRouter keys:
   ```bash
   GROQ_API_KEY=your-groq-key
   ```

---

## 🤖 AI Features Configuration

- **Toxicity Guard**: Scans statements and comments for hate speech or uncivil behavior. Can be enabled/disabled via user settings.
- **Debate Summarizer**: Generates argument synthesis blocks and conflict highlights on-demand.
- **Rebuttal suggestions**: Suggests counter-arguments in the argument draft drawer based on the stance and reference comment.

Provide a `GROQ_API_KEY` (highly recommended for sub-100ms responses) or `OPENROUTER_API_KEY`. If neither is provided, the platform automatically switches to premium simulated AI handlers.

---

## ⚡ Verification & Build Commands

Run these commands inside the root directory to verify types and build the production bundle:

```bash
# Typecheck files
npx tsc --noEmit

# Production build
npm run build

# Start production server
npm run start
```
