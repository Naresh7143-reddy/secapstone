# Collaborative Learning Platform — Backend

Express + Socket.IO API with Firebase auth, Supabase (Postgres) storage, and Judge0 code execution.

## Quick start (local)

```bash
npm install
cp .env.example .env   # then fill in your values
npm run dev            # http://localhost:5000/health
```

## Environment variables

See `.env.example`. Required for full functionality:

| Var | Purpose |
| --- | --- |
| `FRONTEND_URL` | CORS / Socket.IO origin |
| `FIREBASE_PROJECT_ID` | Firebase project id |
| `FIREBASE_SERVICE_ACCOUNT` | Full service-account JSON (one line). Locally you may instead place `firebase-admin-config.json` in the root. |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase key (bypasses RLS) |
| `JUDGE0_API_URL` / `JUDGE0_API_KEY` | Judge0 (RapidAPI) |

The server still boots if some are missing — `/health` works, and protected routes return a clear 503 until configured.

## Database

Run [`db/schema.sql`](db/schema.sql) in the Supabase SQL Editor.

## REST endpoints

- `GET  /health`
- `POST /api/auth/register` · `GET /api/auth/me`
- `POST /api/classrooms` · `GET /api/classrooms` · `POST /api/classrooms/join/:code` · `POST /api/classrooms/:id/end`
- `POST /api/problems` · `GET /api/problems/classroom/:classroom_id`
- `POST /api/submissions` · `GET /api/submissions`

All `/api/*` routes require an `Authorization: Bearer <firebase_id_token>` header.

## Socket.IO events

`join_classroom`, `code_change` → `code_update`, `cursor_position` → `cursor_update`, `send_message` → `receive_message`, plus `user_joined` / `user_left` / `sync_code`.

## Deploy to Render

This repo includes [`render.yaml`](render.yaml) (Blueprint). See deployment steps in the project notes, or:

1. Push to GitHub.
2. Render → **New → Blueprint** → select the repo.
3. Fill in the `sync:false` secret env vars in the dashboard.
4. Deploy. URL: `https://collaborative-learning-api.onrender.com`
