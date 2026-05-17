# Demo Plan - StudyAI Student Success Platform

## 1. Project Introduction

StudyAI is a student success platform that helps students plan study work, ask AI-powered questions, save useful answers, and organize revision in one protected workspace.

The app is designed for:

- students
- pupils
- anyone who wants a more organized study workflow

The problem it solves:

- study information is often scattered across many tools
- students need a simple place to save and revisit useful explanations
- revision tasks and deadlines are easy to forget

The solution:

- one workspace for AI answers, saved notes, summaries, pinned items, and exam plans

## 2. Main Demo Flow

### Authentication

- Open the app and log in
- Show that the dashboard is protected
- Log out and confirm protected access redirects to login

### Ask AI

- Enter a study question, for example: `Explain photosynthesis in simple steps`
- Click `Generate answer`
- Show the loading state
- Review the generated answer

### Save and Organize

- Add a subject, for example `Biology`
- Save the answer
- Show that the note appears in the saved library
- Search and filter by subject
- Pin the note

### Revision Summary

- Select a saved note
- Click `Summary`
- Show the generated revision summary

### Edit and Delete

- Edit a saved question or subject
- Delete a saved note with confirmation

### AI Exam Planner

- Add an exam subject and exam date
- Add an optional goal
- Generate a practical AI study plan
- Show that the plan is saved in the dashboard
- Open the plan as a study note draft if it should be stored in the notes library

## 3. Technical Points

Briefly mention:

- Next.js App Router for routes and API endpoints
- Supabase Authentication for user accounts
- Supabase Database with Row Level Security
- Groq API for AI responses
- Protected `/api/chat` endpoint that requires a logged-in user
- React state and reusable dashboard components

## 4. Pre-Demo Checklist

- Login and signup work
- Session restore works after refresh
- `/api/chat` returns valid AI responses only for authenticated users
- Save, edit, delete, pin, and summary flows work
- AI exam plans can be created, saved, opened as note drafts, and deleted
- Supabase tables and RLS policies are installed
- UI works on desktop and mobile sizes
- Production build passes with `npm run build`

## 5. Backup Plan

If the live demo fails:

- use the local development server
- show the source code and database schema
- explain the flow manually using the demo plan
- show screenshots if available

## Demo Goal

Show that StudyAI is not just a landing page, but a complete study workflow with authentication, AI answers, saved notes, revision summaries, and exam planning.
