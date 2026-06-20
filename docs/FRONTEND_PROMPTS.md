# Frontend Prompts — Collaborative Learning Platform

A record of the prompts used to generate the React frontend for this project,
plus the backend integration details the frontend must connect to.

> Backend is already built, deployed, and verified live at
> **https://secapstone.onrender.com** (see the repo root `README.md`).

---

## Prompt 1 — Master build prompt (full app)

> Act as a Senior Frontend Architect, UI/UX Designer, Product Designer, and React Expert with 15+ years of experience.
>
> Build a complete production-ready React.js website with premium UI/UX comparable to Apple, Stripe, Linear, Notion, Vercel, Airbnb, and Framer.
>
> **Tech Stack**
> - React 19
> - TypeScript
> - Vite
> - Tailwind CSS
> - Shadcn UI
> - Framer Motion
> - React Query
> - Zustand
> - React Router
> - React Hook Form
> - Zod
> - Axios
>
> **UI/UX Requirements** — create an ultra-modern interface featuring:
> Glassmorphism · Neumorphism · Smooth animations · Micro interactions · Scroll animations · Animated gradients · Floating elements · Premium typography · Skeleton loading · Responsive design · Mobile-first approach · Dark Mode · Light Mode · Accessibility support · SEO optimization
>
> **Landing Page** — design:
> Premium Hero Section · Animated Statistics · Feature Showcase · Product Demonstration · Benefits Section · Testimonials · Pricing Section · FAQ · Contact Section · Modern Footer
>
> **Animations** — use Framer Motion extensively:
> Page transitions · Card hover effects · Smooth scrolling · Animated counters · Animated charts · Loading animations · Button interactions · Image reveals
>
> **Components** — build reusable components:
> Navbar · Sidebar · Footer · Buttons · Forms · Cards · Tables · Charts · Modals · Drawers · Dropdowns · Tooltips · Notifications
>
> **Dashboard** — create an enterprise-grade dashboard:
> Analytics · Statistics · Charts · Reports · User Management · Settings · Activity Tracking
>
> **Design System** — generate:
> Typography Scale · Color Palette · Spacing System · Component Library · Design Tokens
>
> **Performance** — implement:
> Code Splitting · Lazy Loading · Image Optimization · Route Optimization · Lighthouse Score 95+

---

## Backend integration context (append to any frontend prompt)

Paste this block after the master prompt so the generated frontend talks to the
real backend instead of mock data.

```text
This frontend connects to an existing deployed backend.

BASE API URL (production): https://secapstone.onrender.com
BASE API URL (local dev):  http://localhost:5000

AUTH: Firebase Authentication (Email/Password). The frontend signs the user in
with the Firebase Web SDK, then sends the Firebase ID token on every API call as:
    Authorization: Bearer <firebase_id_token>

Firebase web config:
    apiKey:            "AIzaSyDm2RDaYjY2nz7-dMCr82sHs14aMAf0Cgk"
    authDomain:        "secapstone-e2d78.firebaseapp.com"
    projectId:         "secapstone-e2d78"
    storageBucket:     "secapstone-e2d78.firebasestorage.app"
    messagingSenderId: "1081210169091"
    appId:             "1:1081210169091:web:224213018838497769ab36"

REAL-TIME: Socket.IO client connects to the same base URL:
    const socket = io("https://secapstone.onrender.com", {
      transports: ["websocket", "polling"]
    });

REST endpoints (all /api/* require the Bearer token):
    POST /api/auth/register            { name }
    GET  /api/auth/me
    POST /api/classrooms               { name }
    GET  /api/classrooms
    POST /api/classrooms/join/:code
    POST /api/classrooms/:id/end
    POST /api/problems                 { classroom_id, title, description, language, test_cases }
    GET  /api/problems/classroom/:classroom_id
    POST /api/submissions              { problem_id, code, language, input }
    GET  /api/submissions

Socket.IO events the client emits:
    join_classroom   { classroom_id, user_id, user_name }
    code_change      { classroom_id, code }
    cursor_position  { classroom_id, user_id, position }
    send_message     { classroom_id, user_name, message }

Socket.IO events the client listens for:
    sync_code        { code }          // initial code on join
    code_update      { code }          // live code from others
    cursor_update    { user_id, position }
    receive_message  { user_name, message, timestamp }
    user_joined      { user_name, participants }
    user_left        { participants }

Use Axios with an interceptor that attaches the Firebase ID token automatically,
and React Query for all data fetching/mutations. Put the base URL in
VITE_API_URL and the Firebase config in VITE_FIREBASE_* env vars.
```

---

## Suggested follow-up prompts (the build in stages)

Large single-shot generations often truncate. These break the master prompt into
focused passes — run them in order.

### Prompt 2 — Project scaffold + design system
> Scaffold a Vite + React 19 + TypeScript project with Tailwind, Shadcn UI, React
> Router, React Query, Zustand, Axios, React Hook Form, and Zod. Set up the design
> system first: typography scale, color palette (with light/dark tokens via CSS
> variables), spacing system, and design tokens. Add a theme provider with a
> dark/light toggle persisted in Zustand. Configure path aliases, ESLint, Prettier,
> and the folder structure (features/, components/ui/, lib/, hooks/, store/, pages/).

### Prompt 3 — Auth + API layer
> Implement Firebase Email/Password auth (web SDK) with login, register, logout,
> and a protected-route wrapper. Create an Axios instance with a request
> interceptor that attaches the current Firebase ID token. Wire React Query for
> `/api/auth/register` and `/api/auth/me`. Use the backend integration context above.

### Prompt 4 — Landing page
> Build the marketing landing page: premium hero with animated gradient, animated
> statistics (counters), feature showcase, product demonstration, benefits,
> testimonials, pricing, FAQ accordion, contact form (React Hook Form + Zod), and a
> modern footer. Use Framer Motion for scroll reveals, page transitions, and hover
> micro-interactions. Mobile-first, fully responsive, accessible, SEO meta tags.

### Prompt 5 — Dashboard shell
> Build the enterprise dashboard: responsive sidebar + topbar layout, analytics
> overview with animated charts (Recharts), statistics cards with skeleton loading,
> reports table with sorting/pagination, user management, settings, and an activity
> feed. Reuse the component library (cards, tables, modals, drawers, dropdowns,
> tooltips, notifications/toasts).

### Prompt 6 — Classroom / live coding (core feature)
> Build the classroom experience: create/join classroom by code, problem list,
> and a collaborative code editor (Monaco) that syncs in real time via Socket.IO
> using the events listed in the backend context. Include a participants panel,
> live cursors, a chat panel, a "Run / Submit" action that calls
> `POST /api/submissions`, and a results panel showing Judge0 output/status.

### Prompt 7 — Performance + polish pass
> Add route-based code splitting and lazy loading, image optimization, skeleton
> states everywhere, error boundaries, and 404/500 pages. Audit and tune for a
> Lighthouse score of 95+ on performance, accessibility, best practices, and SEO.

---

## Notes / reminders

- Set `FRONTEND_URL` on Render to the deployed frontend origin (currently `*`)
  once the frontend is hosted, for tighter CORS.
- Render free tier sleeps after 15 min idle — show a friendly loading state for
  the first (cold-start) request, which can take ~30–50s.
- Keep the Firebase **web** config (above) in the frontend; never put the Firebase
  **admin** service-account JSON in the frontend.
</content>
