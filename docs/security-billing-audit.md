# InstaAuto — Security & Billing Audit (Phase 1)

**Date:** 2026-10-12
**Scope:** Subscription enforcement, billing provider, admin surface, CI/CD, and general app security.
**Method:** Static code review only. No production database queries, no live payment operations, no
destructive commands were run while producing this audit. Every finding below is cited to a
specific file/line so it can be re-verified independently.

---

## A. Actual architecture

Verified against the current `main` branch (what's actually deployed at
`instaautomation-1da00.web.app`):

- **Backend**: Node.js + Express + TypeScript, `apps/functions/src`. Deployed as a single Firebase
  Cloud Function (2nd gen) wrapping the Express app (`app.ts`).
- **Data access**: Prisma ORM → PostgreSQL, hosted on Supabase (`apps/functions/prisma/schema.prisma`,
  connection string host is `*.pooler.supabase.com`).
- **Frontend**: React + TypeScript + Vite + Tailwind, `apps/web/src`. Deployed to Firebase Hosting.
- **Auth**: Google OAuth (`authService.loginWithGoogle`) + email/password (bcrypt, 12 rounds) +
  JWT access/refresh tokens. Access tokens are 15 minutes, carry only `{sub, email}` — **no role
  claim** (`lib/jwt.ts:14-16`). Refresh tokens are 7 days, hashed at rest, bound to a `Session` row,
  rotated on every use, with reuse detection that revokes the session
  (`authService.ts:141-145`).
- **Billing**: **Stripe is a real, working integration**, not just documentation —
  `stripeService.ts` implements checkout session creation, a billing portal, invoice listing, and
  signature-verified webhook handling for `checkout.session.completed` and
  `customer.subscription.updated|deleted`. This matters for Phase 3 below.
- **Instagram integration**: Meta Graph API via direct Instagram Login, webhook-driven comment/DM
  automation, access tokens encrypted at rest (AES-256-GCM, `lib/crypto.ts`).

---

## B & C. Why a user can currently use paid features without paying — root cause

**Root cause: entitlement enforcement was never implemented, on any feature.** This is not a
regression — there is no code path, past or present, that has ever checked a user's plan before
letting them create an automation, connect an Instagram account, or send a DM.

Evidence:

1. The canonical plan catalogue **already exists and is correct** —
   `packages/shared/src/constants.ts:3-65` (`PLAN_TIERS`) defines exactly the limits in your spec
   (Starter 3 automations / 500 DMs / 1 account; Pro 15 / 5,000 / 3; Business unlimited).
2. `PLAN_TIERS` is used in exactly two places: `stripeService.ts` (to look up a Stripe price ID at
   checkout time) and two frontend display components
   (`apps/web/src/components/landing/PricingSection.tsx`, `apps/web/src/pages/BillingPage.tsx`).
3. A full-repo search for `automationLimit`, `dmLimitPerMonth`, `subscriptionPlan`, or `PLAN_TIERS`
   inside `apps/functions/src/services` returns **zero matches outside `stripeService.ts`**.
4. Specifically: `automationService.createAutomation` (`automationService.ts:96-144`) inserts a new
   `Automation` row with no prior count check against the user's `automationLimit`.
   `instagramConnectService`'s account-connect flow (`persistConnectedAccount`,
   `instagramConnectService.ts`) upserts a connected account with no check against the plan's
   account limit. `dmService.sendAutomationReply`/`attemptSend` sends a DM with no check against
   `dmLimitPerMonth` or any monthly usage counter.
5. New users correctly default to `STARTER`/`NONE` (`schema.prisma:117-118`,
   `subscriptionPlan SubscriptionPlan @default(STARTER)`) — so the *default* is right. The problem
   is that `STARTER` (and even an unpaid/`NONE`-status account) currently has the exact same
   practical capabilities as `BUSINESS`, because nothing ever reads the plan to restrict anything.

This directly answers part C of the brief: **not** missing webhook handling (webhooks look sound —
see below), **not** incorrect defaults, **not** stale subscription state, **not** mock mode (that
toggle is Instagram-specific and unrelated to billing), **not** frontend-only checks presenting a
false sense of security (the frontend doesn't attempt to gate either — it's an honest gap, not a
spoofable one). It is a straightforwardly missing server-side authorization layer.

**The checkout → entitlement grant pipeline itself looks sound** and is not the bypass vector:
- `billing.controller.ts:checkout` creates a Stripe Checkout Session scoped to `req.userId` (never
  a client-supplied id) and the server's own `priceIdFor(plan, billingCycle)` lookup — a client can
  request *starting* a checkout for any plan (completely normal), but can't grant themselves the
  plan without Stripe confirming actual payment.
- The webhook route (`webhooks.routes.ts:16-21`) correctly preserves the raw body via
  `express.raw()` *before* the global `express.json()` parser is mounted (`app.ts:36-40`), and
  `stripeService.constructWebhookEvent` verifies the Stripe signature before trusting anything in
  the payload (`stripeService.ts:82-86`). `checkout.session.completed`'s handler only trusts
  `session.metadata.{userId,plan}` — data *we* set server-side at checkout-creation time, not
  client input echoed back.

## D. Is Stripe real, and what does that mean for Razorpay?

**Yes — Stripe is a real, functioning billing provider in this codebase**, not an abandoned
experiment and not just documentation. It is fully wired: checkout, customer portal, invoice
history, and webhook-driven entitlement sync are all implemented and look correct.

**I cannot tell you whether it currently has real paying customers** — that's a database fact
(count of `User` rows with a non-null `stripeCustomerId` and `subscriptionStatus = ACTIVE`), and I
was explicitly directed not to query the production database myself. Per your own rule 7, here is
exactly what I'd need:

- **Query**: `SELECT COUNT(*) FROM "User" WHERE "stripeCustomerId" IS NOT NULL AND "subscriptionStatus" = 'ACTIVE';`
  (read-only, aggregate count only — no row-level personal data).
- **Minimum permission**: a single read-only `SELECT` against one table, or equivalently, open
  Prisma Studio (already running locally for you at the point this audit was written) and look at
  the `User` table's `stripeCustomerId`/`subscriptionStatus` columns, filtering/sorting as needed.
- **Why it matters**: if the count is 0, adopting Razorpay cleanly (new integration, same shape as
  the existing Stripe one, both could even coexist per-plan or you fully cut over) is low-risk. If
  it's non-zero, those customers' billing lifecycle must be preserved — Stripe subscriptions don't
  transfer to Razorpay, so you'd need either a dual-provider period (existing customers stay on
  Stripe, new ones go to Razorpay) or a deliberate, customer-communicated migration, neither of
  which I'll start building speculatively.

**This is the one genuine blocker in this engagement** (per your rule 13) — I'm stopping at it
rather than guessing. Razorpay implementation work (Phase 3) is paused pending your answer; I'm
proceeding with everything else below that doesn't depend on it.

---

## E. Security findings

### Critical
- **No server-side entitlement/quota enforcement** (see B/C above). Any authenticated user —
  including one who has never paid — can create unlimited automations, connect unlimited Instagram
  accounts, and trigger unlimited DMs. This is the direct cause of the reported issue.

### High
- **No branch protection on `main`** (verified via `gh api repos/.../branches/main/protection` →
  404 "Branch not protected"). Nothing currently prevents a direct push to `main` bypassing CI,
  code review, or the `deploy` job's own gating logic. This is a manual GitHub setting I can't
  change from a commit — listed in the Phase 7 checklist below.
- **No admin role exists yet** (`User` has no `isAdmin`/role column) — addressed in Phase 5 below,
  implemented as a DB-verified-per-request flag, never trusted from a JWT claim or client input.

### Medium
- **Rate limiting is in-memory, per-instance** (`middleware/rateLimiter.ts` uses
  `express-rate-limit`'s default in-memory store). Cloud Functions/Cloud Run can and does scale to
  multiple concurrent instances, each with its own independent counter — so the effective limit
  under load is `limit × (number of warm instances)`, not the configured `limit`. Not exploitable
  for privilege escalation, but weaker brute-force/abuse protection than the numbers suggest.
  Fixing this needs a shared store (e.g. Redis/Upstash) — flagged, not fixed in this pass, since it
  needs new infrastructure provisioning I shouldn't add unprompted.
- **No CI step for dependency vulnerability scanning, secret scanning, or static analysis**
  (`ci.yml` only runs lint/typecheck/test/build). GitHub's native secret scanning + push protection
  are free for public repos but are a repo *setting*, not a committable file — listed in the Phase
  7 checklist.
- **No `.github/dependabot.yml`** — added in this pass (npm + github-actions ecosystems).
- **No `CODEOWNERS`** — added in this pass, covering migrations, billing, auth, admin
  authorization, and workflow files.
- **GitHub Actions not pinned to commit SHAs** (`actions/checkout@v4`, `actions/setup-node@v4` use
  mutable major-version tags) — pinned to SHAs in this pass.
- **No explicit `permissions:` block** in `ci.yml` — defaults to whatever the repository's default
  `GITHUB_TOKEN` permission setting is (itself a repo setting, could be overly broad). Added an
  explicit least-privilege `contents: read` block in this pass.

### Low / informational (no code change needed — confirmed safe)
- **No mass-assignment vector found.** Every mutating route I checked (`PATCH /me`,
  `PATCH /me/notifications-prefs`, automation create/update) applies `validateRequest(...)`
  (`middleware/validateRequest.ts:13`, `req.body = schema.parse(req.body)`) *before* the handler
  runs, and Zod's `.object()` strips unrecognized keys by default. None of the relevant schemas
  declare `isAdmin`, `subscriptionPlan`, or `subscriptionStatus` as settable fields. A client
  cannot currently grant itself admin or a paid plan by adding extra JSON keys to a normal request.
- **Stripe webhook signature verification is correctly implemented** (raw body preserved pre-JSON-
  parser, signature checked before any event data is trusted).
- **JWTs carry no role/plan claim**, so there's no "stale admin claim surviving token expiry"
  failure mode to design around — admin checks will be a live DB read per request (see Phase 5).
- **`.gitignore` properly excludes env files and common credential patterns**, and a filename-level
  scan of the full git history found no evidence of an `.env`, service-account JSON, `.pem`, or
  `.jks` file ever having been committed. (This is a filename-pattern check, not a full
  content/entropy secret scan — I'd still recommend enabling GitHub's native secret scanning, which
  does that properly; see checklist.)

---

## F. Phased remediation plan (this engagement)

| Phase | What | Status |
|---|---|---|
| 1 | This audit | ✅ Done |
| 2 | Canonical entitlement checks wired into automation create, Instagram connect, DM send | → Next, proceeding now |
| 3 | Razorpay integration | ⏸️ Paused — blocked on the Stripe-customer-count question above |
| 4 | Reconciliation dry-run report | ⏸️ Depends on Phase 3's outcome (same underlying data) |
| 5 | Admin bootstrap + read-only admin API/UI | → Proceeding now (design already confirmed with you: boolean `isAdmin`, `/admin` in the existing web app) |
| 6 | Admin mutation layer (plan changes with reason + audit trail) | → Proceeding after read-only portion |
| 7 | CI/CD hardening | → Proceeding now (code-only parts); manual checklist for the rest |
| 8 | Tests | → Proceeding alongside each phase |
| 9 | Docs | This file + inline additions |

No production migration, seed, or write of any kind has been run. The schema changes below are
hand-authored SQL migration files (same pattern already established in this repo for prior
changes), committed to this branch, and will only take effect in production via the existing
CI `prisma migrate deploy` step on an eventual merge to `main` — never run directly against the
live database from this session.

---

## Manual checklist — GitHub repository settings (owner-only, not committable)

None of these can be set from a commit. Every item below is something only you can do, in the
repo's Settings tab:

- [ ] **Branch protection on `main`** (Settings → Branches → Add rule): require a pull request
  before merging, require the `lint-typecheck-test-build` status check to pass, and enable
  "Require review from Code Owners" so `.github/CODEOWNERS` actually blocks merges to the paths it
  lists rather than just documenting intent.
- [ ] **Create the `production` GitHub Environment** (Settings → Environments → New environment,
  name it exactly `production`) and add yourself as a required reviewer. This makes the
  `environment: production` line now in `ci.yml`'s `deploy` job actually pause for your approval
  before `FUNCTIONS_ENV_PRODUCTION`/`WEB_ENV_PRODUCTION`/`FIREBASE_SERVICE_ACCOUNT` become available
  to that run — without this step, the `environment:` line is a no-op.
- [ ] **Enable secret scanning + push protection** (Settings → Code security → Secret scanning).
  Free for public repos, catches a committed credential at push time rather than after the fact —
  does the content-level scanning the filename-pattern check in this audit couldn't do.
- [ ] **Enable Dependabot security updates** (Settings → Code security → Dependabot) alongside the
  `dependabot.yml` added in this PR, so known-vulnerable dependency versions get flagged
  automatically, not just version-bump PRs.
- [ ] **Confirm who has write access to the repo.** CODEOWNERS and required reviews only matter if
  there's more than one person who could otherwise merge unreviewed — worth a quick check under
  Settings → Collaborators even if you expect the answer to be "just me."

## Manual checklist — before Razorpay/Phase 3 can start

- [ ] Answer the one blocking question in section D above (real Stripe customers: yes/no).
- [ ] If yes: decide dual-provider vs. migration approach for existing subscribers.
- [ ] Either way: Razorpay test-mode API keys + webhook secret, so integration work can proceed
  against test mode only, per your own rule 5/6.
