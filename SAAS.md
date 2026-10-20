# Kaalvanta SaaS layer

This document covers the multi-tenant SaaS foundation added on top of the
astrology + trading product: roles, plans, invites, publishing, billing and
per-tenant MT5 account mapping.

## Roles

| Role | Can |
|---|---|
| `MEMBER` | Read public + members-only posts, use their own charts, manage their profile |
| `ANALYST` | Everything a member can, plus create / publish / archive posts in `/studio` |
| `ADMIN` | Everything, plus `/admin` (users, roles, plans, invites, waitlist) |

Role and plan are read from the database on every protected call — changing
them takes effect immediately, no re-login required.

## Plans

| Plan | Price / month | Unlocks |
|---|---|---|
| `FREE` | ₹0 | Personal chart, daily climate, public feed |
| `BASIC` | ₹499 | Member-only ideas, market state, narrative engine |
| `PREMIUM` | ₹1,499 | Premium trade ideas, parliament, tension network |
| `ENTERPRISE` | ₹4,999 | Connected MT5 account, operator lab, priority support |

Post visibility maps onto this: `PUBLIC` → everyone, `MEMBERS` → any active
account, `PREMIUM` → `PREMIUM`/`ENTERPRISE` only. Enforcement lives in
`canRead()` in `src/server/api/routers/post.ts` and is applied server-side —
the client never receives a locked body.

## Routes

| Route | Access | Purpose |
|---|---|---|
| `/ideas` | public | Published ideas feed |
| `/ideas/[slug]` | public (paywalled body) | Single idea |
| `/studio` | analyst / admin | Compose, publish, archive posts |
| `/admin` | admin | Users, roles, plans, invites, waitlist |
| `/register` | public | Sign-up, optional invite code |
| `/dashboard`, `/market`, … | authenticated | Existing product surfaces |

## API (tRPC)

- `user.me` — identity + entitlements for the current session
- `invite.validate` / `joinWaitlist` (public), `invite.create|list|revoke|claim` (admin/claim)
- `post.listPublic` / `getBySlug` (public), `post.mine|create|update|publish|archive|remove` (analyst), `post.listAll` (admin)
- `billing.plans` (public), `billing.me|createSubscription|verifyPayment|cancel` (account)
- `tradingAccount.mine|create|setDefault|remove` (account; `create` requires `ENTERPRISE`)
- `admin.overview|listUsers|updateUser|deleteUser|listWaitlist|approveWaitlist` (admin)

Procedure guards live in `src/server/api/trpc.ts`:
`accountProcedure` (active account), `adminProcedure`, `analystProcedure`,
`planProcedure("PREMIUM")`.

## Setup

1. **Push the schema** (adds fields + the Invite/Waitlist/Subscription/Post/TradingAccount collections):

   ```bash
   npx prisma db push
   npx prisma generate
   ```

2. **Bootstrap the first admin** — set your email before registering:

   ```env
   ADMIN_EMAILS=you@example.com
   ```

   Registration checks `ADMIN_EMAILS` and creates that account as
   `ADMIN` + `ENTERPRISE`. (No dev-mode bypass anymore.)

3. **Invite-only mode** (optional):

   ```env
   INVITE_ONLY=true
   ```

   Then mint codes in `/admin → invites` and share them.

4. **Billing** (optional — the UI degrades gracefully without it):

   ```env
   RAZORPAY_KEY_ID=rzp_live_xxx
   RAZORPAY_SECRET=xxx
   RAZORPAY_WEBHOOK_SECRET=xxx
   RAZORPAY_PLAN_BASIC=plan_xxx
   RAZORPAY_PLAN_PREMIUM=plan_xxx
   RAZORPAY_PLAN_ENTERPRISE=plan_xxx
   ```

   Webhook endpoint: `POST /api/razorpay/webhook` (verifies
   `x-razorpay-signature`, activates the plan on `subscription.charged`).

   ⚠️ Never use the `NEXT_PUBLIC_RAZORPAY_SECRET` style vars — the secret must
   stay server-side.

## What is deliberately stubbed

- **Per-tenant MT5 execution.** `TradingAccount` stores the mapping
  (user → terminal/bridge) and masks the login on read, but execution still
  runs through the `trading/` MCP server. One MT5 terminal per broker account
  is the open infrastructure decision (see `trading/README.md`).
- **Email delivery.** Invites and waitlist approvals are shown in `/admin`;
  nothing is emailed yet.
- **Password reset.** Not implemented — accounts are created with a bcrypt
  hash, but there is no reset flow.

## Auth

Passwords are bcrypt-hashed on registration and verified in both the
credentials provider (`src/server/auth/config.ts`) and `user.login`. Legacy
accounts whose hash looks like `hashed_<plaintext>` are still accepted once so
nobody is locked out, but every new account is properly hashed.

Suspended accounts (`status = SUSPENDED`) cannot sign in.

### Admin login (environment-backed)

Admins sign in at **`/admin/login`**, which uses a second NextAuth provider
(`admin-credentials`) that reads credentials from the server environment:

```env
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=a-long-random-secret
```

- Both values are server-only — never use `NEXT_PUBLIC_*` for the password.
- Comparison is constant-time (`timingSafeEqual`).
- On success the matching database user is created, or promoted to
  `role=ADMIN` / `status=ACTIVE`, so RBAC keeps reading from the database.
- If either variable is unset, the admin route cannot authenticate anyone.
- `/admin` redirects guests to `/admin/login`; non-admin members still see the
  "Admins only" gate.

`ADMIN_EMAILS` (comma-separated) still controls which emails are created as
admins at registration.

