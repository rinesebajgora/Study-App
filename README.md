# AI Study Assistant

AI Study Assistant is a Next.js app where students can sign up, log in, ask study questions, get AI-generated answers, and save those answers by subject for later review.

## What the project does

- User authentication with Supabase
- AI-powered question answering through the `/api/chat` route
- Save, update, and delete study questions
- Group saved questions by subject
- Dark mode preference stored in `localStorage`

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file in the project root.

3. Add these environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
```

4. Start the development server:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

## Scripts

- `npm run dev` starts the local dev server
- `npm run build` creates a production build
- `npm run start` runs the production build
- `npm run lint` checks the code with ESLint

## Live demo

- Add your deployed URL here if available: `https://your-app-url`

## Notes

- The app expects a Supabase table named `questions`.
- The `questions` table should include at least `id`, `user_id`, `question`, `answer`, `subject`, and `created_at`.
