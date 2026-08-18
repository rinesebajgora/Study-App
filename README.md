# StudyAI - Student Success Platform

StudyAI is a student success workspace that helps students plan their study work, ask AI-powered questions, save useful notes, and track progress from one protected dashboard.

## Features

- User signup, login, logout, and protected dashboard access
- AI tutor question and answer flow powered by Groq
- Save, edit, delete, search, filter, pin, export, and print study notes
- Generate revision summaries from saved answers
- Organize notes by subject
- AI exam planner with saved preparation plans
- Responsive UI built with Next.js and Tailwind CSS

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase Authentication and Database
- Groq API
- Vercel deployment

## Local Setup

```bash
npm install
npm run dev
```

Open the local URL shown by Next.js.

## Environment Variables

Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Database Setup

Run the SQL in [docs/supabase-schema.sql](docs/supabase-schema.sql) inside the Supabase SQL editor. It creates the required tables and Row Level Security policies for:

- `questions`
- `pinned_questions`
- `revision_summaries`
- `exam_plans`
- flashcards, quizzes, document search, and AI rate limiting

## Useful Scripts

```bash
npm run lint
npm run build
```

## Live Demo

https://study-app-rinesa1.vercel.app

## Author

Rinesa Bajgora
