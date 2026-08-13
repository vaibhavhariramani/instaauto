# InstaAuto

Automate Instagram DM replies when someone comments a trigger keyword on one of your Reels —
built on the official Meta Graph API, Instagram Messaging API, and Instagram Webhooks.

> Comment **"send me"** on a Reel → InstaAuto automatically sends:
> _"Hey 👋 Thanks for commenting! Here is the guide you requested. https://your-link.com"_

---

## Stack

| Layer      | Tech                                                                                     |
| ---------- | ----------------------------------------------------------------------------------------- |
| Frontend   | React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, React Router, React Query, Zustand, React Hook Form + Zod, shadcn/ui-style components, Recharts, Lucide |
| Backend    | Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JWT auth, Google OAuth, Stripe       |
| Deployment | Firebase Hosting (frontend) + Firebase Cloud Functions v2 (backend), GitHub Actions CI     |

## Monorepo layout

```
automation/
├── apps/
│   ├── web/                 # React + Vite frontend
│   └── functions/           # Express API, wrapped as a Firebase Cloud Function
├── packages/
│   └── shared/              # Shared Zod schemas, enums, constants, DTO types
├── firebase.json            # Hosting rewrites + Functions config
└── .github/workflows/ci.yml
```

---

## Why Instagram automation is built this way

Instagram does **not** allow arbitrary automated DMs from generic bots. InstaAuto only works
within Meta's supported, compliant surface:

- Requires an **Instagram Professional (Business or Creator)** account, connected via **Instagram
  Login** (no linked Facebook Page required).
- Uses the **Instagram Webhooks** `comments` field to detect new comments in real time.
- Replies via the **Private Replies API** (`POST /{ig-comment-id}/private_replies`) — the
  endpoint Meta specifically built for "reply to this comment via DM," rather than the generic
  Send API (which is restricted outside a 24-hour customer-service window).
- Verifies every inbound webhook with the `X-Hub-Signature-256` HMAC signature before processing.
- Never scrapes, automates a browser, or touches unofficial endpoints.

Because a live Meta App requires App Review and a real Instagram Business account, the backend
ships with an **`INSTAGRAM_MOCK_MODE`** (on by default) that fabricates a connected account and
lets you fire synthetic comments through the *real* automation/matching/DM pipeline from the UI
(Automations → **Simulate comment**). Flip it off once you have real Meta credentials.

---

## Local development

### 1. Prerequisites

- Node.js 20+
- A Postgres database — create a free one on [Neon](https://neon.tech) or [Supabase](https://supabase.com)
  and copy its connection string (used locally and in production, so no local Postgres install needed)

### 2. Install

```bash
npm install
```

### 3. Configure environment

```bash
cp apps/functions/.env.example apps/functions/.env
cp apps/web/.env.example apps/web/.env
```

Generate the required secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # JWT_ACCESS_SECRET
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # ENCRYPTION_KEY (32 bytes)
```

Set `DATABASE_URL` in `apps/functions/.env` to your Neon/Supabase connection string.

Set `GOOGLE_CLIENT_ID` (backend) and `VITE_GOOGLE_CLIENT_ID` (frontend) from a Google Cloud
[OAuth 2.0 Client ID](https://console.cloud.google.com/apis/credentials) of type **Web application**.
Leave `INSTAGRAM_MOCK_MODE=true` and the Meta/Stripe vars empty to run in demo mode.

### 4. Database

```bash
npm run prisma:generate -w apps/functions
npm run prisma:migrate -w apps/functions
npm run prisma:seed -w apps/functions
```

The seed script creates a demo user, a mock-connected Instagram account, sample templates,
automations, messages, and 30 days of analytics so the dashboard isn't empty on first run.

### 5. Run

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:4000 (proxied through Vite at `/api`)

Sign in with any Google account, complete onboarding, click **Connect Instagram** (instant in
mock mode), create an automation, then use **Simulate comment** on the Automations page to watch
a comment flow through matching → dedupe → DM send → Messages inbox → notification, end to end.

---

## Going live with real Instagram automation

1. Create a [Meta App](https://developers.facebook.com/apps) with the **Instagram** product (API
   with Instagram Login) and **Webhooks** added.
2. Add scopes: `instagram_business_basic`, `instagram_business_manage_comments`,
   `instagram_business_manage_messages`.
3. Submit for **App Review** for the above permissions (required for anything beyond your own
   test accounts).
4. Set a webhook subscription (`comments` field) pointing at
   `https://<your-domain>/api/webhooks/instagram`, with a `META_VERIFY_TOKEN` of your choosing.
5. Set in `apps/functions/.env`:
   ```
   INSTAGRAM_MOCK_MODE=false
   META_APP_ID=...
   META_APP_SECRET=...
   META_VERIFY_TOKEN=...
   META_REDIRECT_URI=https://<your-domain>/api/instagram/oauth/callback
   ```
   And set `VITE_INSTAGRAM_MOCK_MODE=false` in `apps/web/.env` too — the two flags are independent
   and both must be `false` together, or the frontend's mock-only "Simulate comment" affordance can
   still appear even though the backend is live.
6. Connect an Instagram **Professional** account via Instagram Login from the app's Instagram
   settings page.

## Stripe billing (optional)

1. Create products/prices in Stripe for each plan tier (Starter/Pro/Business × monthly/yearly).
2. Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and the six `STRIPE_PRICE_*` env vars.
3. Point a Stripe webhook at `https://<your-domain>/api/webhooks/stripe` listening for
   `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.

Until these are set, billing routes respond `503` with a clear message instead of crashing.

---

## Deploying to Firebase

```bash
npm install -g firebase-tools
firebase login
firebase use --add          # select/create your Firebase project, update .firebaserc
```

Set production secrets on the Functions runtime (2nd-gen functions read `.env` files per
codebase, or use `firebase functions:secrets:set` for sensitive values):

```bash
firebase functions:secrets:set JWT_ACCESS_SECRET
firebase functions:secrets:set JWT_REFRESH_SECRET
firebase functions:secrets:set ENCRYPTION_KEY
firebase functions:secrets:set DATABASE_URL
# ...repeat for GOOGLE_CLIENT_ID, META_*, STRIPE_* as needed
```

Then build and deploy:

```bash
npm run build
firebase deploy --only hosting,functions
```

`firebase.json` rewrites `/api/**` to the `api` function and serves the SPA for everything else,
so frontend and backend share one domain in production — no CORS configuration needed.

**Database**: Cloud Functions are stateless/serverless, so point `DATABASE_URL` at a
connection-pooled managed Postgres (e.g. [Neon](https://neon.tech) or
[Supabase](https://supabase.com)) rather than a self-managed instance — the same one you set up
for local dev works fine, or create a separate production database. Run
`npm run prisma:deploy -w apps/functions` against production before your first deploy.

---

## Scripts (run from repo root)

| Command                  | Description                                  |
| ------------------------- | --------------------------------------------- |
| `npm run dev`              | Run frontend + API concurrently in watch mode |
| `npm run build`            | Build shared package, frontend, and API       |
| `npm run lint`              | ESLint across both apps                        |
| `npm run typecheck`         | Strict TypeScript project builds               |
| `npm run test`              | Vitest unit tests for both apps                |
| `npm run prisma:migrate`    | Create/apply a dev migration                   |
| `npm run prisma:seed`       | Seed demo data                                 |

## Security notes

Helmet, scoped CORS, per-route rate limiting, Zod validation on every mutating endpoint,
parameterized Prisma queries, AES-256-GCM encryption of stored Instagram access tokens, rotating
JWT refresh sessions (revocable via the `Session` table), an `AuditLog` for sensitive actions, and
signature verification (HMAC for Meta, Stripe SDK verification for Stripe) before any webhook
payload is processed.
