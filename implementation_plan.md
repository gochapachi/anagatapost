# Anagatapost — Production Implementation Plan

**Status:** awaiting your approval — no code has been changed yet.
**Date:** 2026-09-26 · **Branch:** `main` @ `ec83777`
**Stack:** Next.js 15.1.7 (App Router) · NextAuth v4.24.11 (JWT sessions) · Prisma 6.4.1 + Postgres 16 · Tailwind v3.4.17 · TypeScript 5.7 · Docker/Coolify · Cashfree PG (v3) · n8n + Evolution API

---

## 0. Read this first: two findings that expand the scope

The original brief assumed "the DB layer has a hardcoded `usr_demo`, and the dashboard needs polish". The audit found the reality is deeper.

### Finding A — the application never touches the database. Nothing.

`src/lib/db.ts:20` creates and exports a `PrismaClient`, and `prisma/schema.prisma` defines 11 models. **There is not one single `prisma.<model>` call anywhere in `src/`** (repo-wide regex `prisma\.\w+\.` → 0 matches). Every read and write goes through `class InMemoryStore` (`src/lib/db.ts:45`), a set of `Map`s populated by its own constructor with demo rows:

| Store | Seeded with | Consumed by |
|---|---|---|
| `users: Map` | `usr_admin` (`admin123`), `usr_demo` (`user123`) | login, register, admin users, wallet |
| `letters: Map` | 2 fake letters | letters, send, track, print, admin queue, analytics |
| `addressBook` / `templates` / `invoices` / `auditLogs` | demo rows; logs capped at 500 in RAM | their respective routes |

Consequences in production today:

1. **Every deploy, restart, crash or scale event erases all users, letters, wallet balances and invoices.** `Dockerfile:51` runs standalone `node server.js`, and the store is only cached on `globalThis` when `NODE_ENV !== "production"` (`src/lib/db.ts:665`), so production re-seeds demo data on every cold start.
2. **Multi-replica = split brain.** Two containers hold two different worlds; a customer's letter is invisible to the admin fulfilment queue.
3. **Registered accounts do not survive.** `api/auth/register` writes to a Map; `lib/auth.ts:39` `authorize()` reads that Map. The Postgres `User` table stays empty forever.
4. **Paid money is written to RAM.** A Cashfree top-up raises `balancePaise` in a Map only — a restart means the customer paid and got nothing, with no record.
5. Analytics is partly hardcoded anyway: `db.ts:610` SLA falls back to `"99.4"`, `db.ts:643` reports `Math.max(zones, 18)` postal zones, `db.ts:647-651` returns literal fake "Jan / Feb / Mar 2026" trends.

So the job is not "remove `usr_demo`" — it is **"make the system persistent with one source of truth"**, and that must be Phase 0, because Google login, payments and the new dashboards all sit on top of it.

### Finding B — `/api/v1` is a public, unauthenticated, spend-money API

`public/skill.md:13`, `README.md:107` and the landing page all advertise `Authorization: Bearer ap_live_...`. **No route under `src/app/api/v1/**` ever reads the `Authorization` header** (repo-wide grep: only `developers/page.tsx` display strings and the Evolution-API client). The `ApiKey` model exists in Prisma (`schema.prisma:108`) but is unused; `developers/page.tsx:7` shows a hardcoded `ap_live_bharat_post_demo123`.

Therefore **anyone on the internet can already `POST /api/v1/letters` and `/api/v1/letters/:id/send`**, which debits the balance of an attacker-chosen user (`user_id` in the body, `usr_demo` default) and dispatches real, chargeable India Post mail through your print partner plus WhatsApp notifications. On top of that `/api/v1/admin/users` dumps every account and accepts `PATCH` to change roles and balances. `middleware.ts` does not exist, so nothing gates any of it.

Worse, **none of the pages have any gate at all.** `useSession()` appears exactly once in the whole codebase — in `src/components/Navbar.tsx:9`. The dashboards are `"use client"` components that just `fetch()` the public endpoints: `admin/page.tsx:17` loads **every letter of every user** from `/api/v1/letters`, `admin/users/page.tsx:18` loads every account, `admin/users/page.tsx:36` promotes anyone to ADMIN, `dashboard/page.tsx:22-23` loads the same unscoped letter list for a logged-out visitor. Client-side session checks would only be cosmetic anyway; the server is the only place authorization counts.

### Finding C — three working "free money" buttons

| Entry point | What an attacker (or any logged-out visitor) does | Result |
|---|---|---|
| `POST /api/v1/wallet` (`route.ts:13`) | `{ amount_inr: 999999 }` — no auth, no payment | Balance credited instantly. Wired to the UI at `dashboard/page.tsx:48` ("Top-up" modal) |
| `UpiPaymentModal.tsx:39` | Scan QR (`anagatapost@icici`), click "I have paid" | Same unauthenticated `POST /api/v1/wallet` → instant credit. No UPI intent/Paymap verification whatsoever |
| `POST /api/v1/payments/cashfree/verify` (`route.ts:31-33`) | `{ order_id: "anything", user_id: "any", amount_inr: 1 }` | Credits the client-supplied `amount_inr`, ignoring the real order amount |

So wallet top-up today requires no payment at all. Any redesign of billing must start by deleting these paths.

---

## 1. Your locked decisions (from the design review)

| # | Topic | Decision |
|---|---|---|
| 1 | **Payments** | Real Cashfree **v3 JS SDK** checkout; credit **only** from the signed webhook; sandbox keys first |
| 2 | **Auth & data** | Strict session scoping (`usr_demo` deleted), `middleware.ts` guards, `ADMIN_EMAILS` bootstrap, seed script migrates demo rows to the real admin |
| 3 | **E-signature** | Internal only: canvas draw **or** PNG upload → base64 on `Letter` → rendered on the print sheet. No third-party e-sign API |
| 4 | **Layout** | **Full visual redesign**: new palette + typography, persistent **sidebar** shell for user & admin dashboards (replacing duplicated top-tab bars), rewritten landing/auth pages |

---

## 2. Target architecture

```
Browser ── next-auth JWT cookie ──► middleware.ts        (cheap gate: signed in? role?)
                                        │
                                        ▼
                                   route.ts / page.tsx
                                        │ requireUser() / requireAdmin()   ← the enforcement point
                                        ▼
                                   src/lib/data/*        (Prisma repositories + mappers)
                                        │
                                        ▼
                                     Postgres

Agents / n8n / MCP ─ Authorization: Bearer ap_live_… ─► requireApiAccess(req)   (ApiKey table)

Cashfree ─ signed webhook ─► POST /api/v1/payments/cashfree/webhook   (sole writer of wallet credits)
```

Four rules every phase below follows:

- **R1 — Postgres is the only state.** No `Map`, no `globalThis` cache of business data. `inMemoryStore` is deleted, not hidden behind a flag.
- **R2 — Server decides money.** Amount, identity and "was it paid" come from the DB and from Cashfree's servers — never from a request body.
- **R3 — Two-layer authorization.** `middleware.ts` for redirects (cheap, not authoritative) + `requireUser()/requireAdmin()` in every route handler and server component (authoritative).
- **R4 — Numbers are real or hidden.** Fake SLAs, hardcoded KPIs, hardcoded "Jan/Feb/Mar 2026" chart points and simulated "WhatsApp sent" badges are removed or explicitly labelled `simulated`. Trust is the product: an advocate mailing legal summons will notice a fabricated SLA.

---

## 3. Phase 0 — Make it real: Postgres becomes the source of truth

**Goal:** restart the container and nothing is lost; two replicas agree; `usr_demo` cannot exist.

### 3.1 New data layer — `src/lib/data/`

| File | Responsibility |
|---|---|
| `db.ts` | the single `PrismaClient` singleton (moved out of `lib/db.ts`) |
| `mappers.ts` | Prisma row ⇄ existing `src/lib/types.ts` shapes. Required because `Letter.address` is nested in the TS type while the schema stores flat `recipientStreet/City/State/Pincode` columns, and Prisma returns `Date` where the UI expects ISO strings. Mappers keep every page's props identical, so Phase 0 touches no UI |
| `users.ts` | `findByEmail`, `findById`, `create`, `setRole`, `creditWallet`, `debitWallet` — all balance movement lives here |
| `letters.ts` | `listForUser`, `findOwnedById`, `create`, `updateStatus`, `attachSignature`, `countsByStatus` |
| `addressBook.ts`, `templates.ts` | owner-scoped CRUD; `userId` always from session, never from the request body |
| `invoices.ts` | `createInvoice` with GST split and sequential `INV-YYYY-####` |
| `payments.ts` | `PaymentOrder` lifecycle (§5) |
| `analytics.ts` | real `groupBy` aggregations; month series derived from actual rows |
| `audit.ts` | `writeAudit(action, { userId, details, ip })`, `listAudit(limit)` |

`src/lib/db.ts` is kept only as a temporary re-export shim so the diff stays reviewable, then deleted in the same phase once all 14 call sites are migrated: `api/auth/register`, `api/v1/letters` (+ `[id]`, `[id]/send`), `address-book`, `templates`, `wallet`, `invoices`, `payments/cashfree/{order,verify,webhook}`, `admin/{users,analytics,batch-print,fulfill}`, and `lib/auth.ts:39` `authorize()`.

### 3.2 Money correctness

Wallet mutation becomes a guarded conditional update inside one transaction — this is what removes double-spend and cross-replica races:

```ts
// data/letters.ts → debitForSend()
await prisma.$transaction(async (tx) => {
  const spent = await tx.user.updateMany({
    where: { id: userId, balancePaise: { gte: costPaise } },
    data: { balancePaise: { decrement: costPaise } },
  });
  if (spent.count === 0) throw new InsufficientFundsError();      // → HTTP 402
  await tx.transaction.create({ data: { userId, type: "DEBIT", amountPaise: -costPaise,
                                        referenceId: letterId, description } });
  await tx.letter.update({ where: { id: letterId },
                           data: { status: "QUEUED", queuedAt: new Date(), walletDebited: true } });
});
```

- The unused `Transaction` model becomes the wallet ledger: **every** balance change writes a row (type, reason, reference). Balances become reconcilable, and the admin finance screen can be computed honestly instead of guessed.
- `InsufficientFunds` → `HTTP 402` with a body the UI turns into a top-up prompt instead of a generic red banner.
- `GET /api/v1/wallet` keeps its response shape but reads the session user's real balance (it currently answers anyone with `50000` paise default — `db.ts:415`).

### 3.3 Schema additions (one `prisma db push`, see §10.3)

```prisma
model Letter {
  signatureData     String?  @db.Text   // base64 data URL (Phase 3)
  signatureName     String?             // signer's printed name
  signatureSignedAt DateTime?
  walletDebited     Boolean  @default(false)   // idempotency guard for the debit above
}

model PaymentOrder {                     // NEW — server-authoritative amount + idempotency
  id               String   @id @default(uuid())
  userId           String
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  orderId          String   @unique      // cf_order_…
  paymentSessionId String?  @db.Text
  amountPaise      Int                   // server-set; the webhook credits THIS, never the payload
  currency         String   @default("INR")
  purpose          String   @default("WALLET_TOPUP")   // WALLET_TOPUP | LETTER_FEE
  letterId         String?
  status           String   @default("CREATED")        // CREATED|PAID|FAILED|CANCELLED|EXPIRED
  creditedAt       DateTime?             // written inside the credit tx → the idempotency key
  invoiceId        String?
  rawPayload       String?  @db.Text     // last webhook body, for support
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  @@index([userId])
  @@index([status])
}

model Transaction {
  cashfreeOrderId String?
  @@index([referenceId])
}
```

### 3.3.1 What is in the tree now (PR-1, storage layer)

Landed:

- `src/lib/data/types.ts` — the `Store` interface every route talks to. Money
  methods (`createLetterCharged`, `sendDraftCharged`, `settlePaidOrder`,
  `deductBalance`, `topupBalance`, `adjustUserBalance`) return results instead of
  throwing, so handlers never re-implement a balance check.
- `src/lib/data/postgres.ts` — `PostgresStore`. Every balance change is a
  conditional `UPDATE` plus its `Transaction` ledger row in the same
  `prisma.$transaction`, so `User.balancePaise` always equals the newest
  `Transaction.balanceAfterPaise`.
- `src/lib/data/memory.ts` — the old in-memory store, now a `Store`
  implementation used only when `DATABASE_URL` is absent (`src/lib/db.ts`
  chooses; `src/lib/env.ts` forbids that in production).
- `PaymentEvent.orderId` is unique, and `settlePaidOrder` inserts it **first**:
  a Cashfree retry or a double-clicked verify trips the index, the transaction
  rolls back and the wallet is credited exactly once — across restarts, which
  the PR-0 in-process array could not do.
- `prisma/seed.js` (idempotent) creates the two demo accounts, the five system
  templates and a sample address-book entry.

```bash
npx prisma migrate deploy   # apply prisma/migrations/0_init
npm run prisma:seed         # demo users + templates
npm run smoke:store         # money-path invariants on the in-memory store
```

Still open in this phase: the `PaymentOrder` model above (order amounts stay
server-read from Cashfree in the verify route, and `PaymentEvent` carries the
raw payload), the letter signature fields, and API keys. `usr_demo` survives
only as demo data inside `src/lib/data/memory.ts` and `prisma/seed.js`.

### 3.4 Acceptance for Phase 0

1. Register → send a letter → `docker compose restart` → user, balance and letter all still there, and no `usr_demo` row anywhere.
2. `grep -rn "usr_demo" src/` → 0 hits; `grep -rn "inMemoryStore" src/` → 0 hits.
3. Two concurrent `POST /api/v1/letters/:id/send` for one letter debit the wallet **once**.
4. `npx tsc --noEmit` and `npm run build` clean; every page renders the same data as today — only the storage engine moved.

---

## 4. Phase 1 — Authentication, authorization, session scoping

### 4.1 `src/middleware.ts` (new)

`next-auth/jwt`'s `getToken({ req, secret })` — no DB hit per request:

| Path | Rule |
|---|---|
| `/dashboard*` | no token → `302 /login?callbackUrl=…` |
| `/admin*` | role ≠ `ADMIN` → `302 /dashboard?denied=1`; `PRINT_PARTNER` allowed only on the fulfilment queue + `/api/v1/admin/fulfill|batch-print` |
| `/letters/*/print` | session + ownership enforced in the page's data fetch |
| `/track/[id]` | stays public — a shareable tracking link is the product |
| matcher | `["/dashboard/:path*", "/admin/:path*", "/letters/:path*"]` |

Middleware is a redirect convenience only. Every API route *also* calls `requireUser()` / `requireAdmin()`, so a bypassed middleware can never leak data. That double layer is the direct answer to §0-Finding-B.

### 4.2 `src/lib/session.ts` (new) — the enforcement point

```ts
requireUser()          // getServerSession → { id, role, email } | throw 401
requireAdmin()         // + role check → throw 403
requireApiAccess(req)  // session OR `Authorization: Bearer ap_live_…` → ApiKey row
                       // (sha256 lookup, active = true, touches lastUsedAt)
```

`requireApiAccess` matters because `public/skill.md:13`, `README.md:107` and `/api/mcp` promise a bearer-token API for agents and n8n; cookie-only auth would silently break that product line. Machine callers must therefore get real keys:

- new `GET/POST/DELETE /api/v1/api-keys` generating `ap_live_<40 random bytes>`, storing **only the sha256 hash**, revealing plaintext exactly once at creation.
- `developers/page.tsx:7`'s hardcoded `ap_live_bharat_post_demo123` is replaced by the signed-in user's own keys.
- Per-key rate limit kept in Postgres (works across replicas) so a leaked agent key cannot burn a wallet in a loop.

### 4.3 De-single-tenanting (the mechanical half)

Remove every fallback identity and take it from the session: `address-book/route.ts:7,19,65`, `letters/route.ts:101`, `templates/route.ts:20,61`, `payments/cashfree/order/route.ts:26-28`, `payments/cashfree/verify/route.ts:31`, `payments/cashfree/webhook/route.ts:24`, `admin/analytics`, `admin/batch-print`, `admin/users`, `wallet`. Then enforce ownership everywhere: `GET/PATCH /api/v1/letters/:id` and the print view return **404 (not 403)** for another user's letter, so IDs cannot be probed for existence.

Client pages stop sending `userId` in query strings/bodies at all — the server derives it. That also shrinks every `fetch()` call in the dashboards.

### 4.4 Admin bootstrap + Google OAuth

- `ADMIN_EMAILS` env (comma-separated, lower-cased) promotes on `register` **and** in NextAuth's `signIn` callback for Google. This replaces the seeded `usr_admin / admin123` login (`db.ts:63-76`) and the `user123` demo user.
- Google is wired at `lib/auth.ts:16-26` but unreachable twice over: no button in any UI, and `docker-compose.yml:9-16` passes none of `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — so `isGoogleConfigured()` is false and the provider silently disappears. Fix the compose env block (§10.1) and add a shared `<GoogleButton />` to `login/page.tsx` and `register/page.tsx` with `callbackUrl` preserved.
- **Account linking:** advocates already registered with passwords. If they later click "Continue with Google" on the same email, NextAuth throws `OAuthAccountNotLinked` and they conclude their account vanished. Plan: link the `Account` row when Google reports `email_verified: true`; never link otherwise. Documented trade-off — we then rely on Google's email verification, which is the industry norm for this flow.
- Delete fallback secrets: `lib/auth.ts:92` (`"anagatapost_super_secret_jwt_key_2026_prod"`) and the `ADMIN_SECRET_KEY` default in `docker-compose.yml:16`. Missing in production must throw at boot: a known JWT secret equals forged ADMIN sessions.
- `balancePaise` currently travels inside the JWT (`auth.ts:71,85`), so it goes stale after any payment. Keep `id/role/email/company` in the token; read the balance from Postgres in the app shell and refresh it after top-up/send.

### 4.5 `prisma/seed.js` (new — `npm run prisma:seed` already points at it)

Idempotent, in one transaction:

1. Upsert admin users from `ADMIN_EMAILS` (`role: ADMIN`, no password — Google-only).
2. Upsert the three demo templates as `isSystem: true` (they are genuinely useful product content).
3. Re-parent the three demo address-book entries + two demo letters + `INV-2026-1001` to the **first** admin email, tagged `description: "migrated demo data"`, **only when the target user has zero letters** — so re-running the seed never duplicates samples.
4. Insert `usr_demo`/`usr_admin` **never**; instead print a summary of what was migrated.

### 4.6 Acceptance for Phase 1

| Test | Expected |
|---|---|
| `curl https://host/api/v1/admin/users` (no cookie) | `401` |
| `curl -X PATCH …/admin/users {userId, role:"ADMIN"}` | `401` |
| Logged-in `USER` opens `/admin` | redirect `/dashboard?denied=1` **and** `403` from the API if the UI is bypassed |
| User B opens `/api/v1/letters/<user A's id>` | `404` |
| "Continue with Google" on an email that already has a password account | signs in, one `User`, one `Account` row |
| `docker compose up` with no `NEXTAUTH_SECRET` | container refuses to boot with a clear message |

---

## 5. Phase 2 — Cashfree v3, webhook-only settlement

### 5.1 Flow (the only path money moves)

```
1  POST /api/v1/payments/cashfree/order      requireUser()
     amount ∈ {250, 500, 1000, 2500, 5000, custom 100…50000}   ← server-side allow-check, never the client's number
     creates PaymentOrder (amountPaise from OUR math) + Cashfree order via lib/cashfree.ts:48
     returns { order_id, payment_session_id, mode }             ← no balance touched
2  Browser loads https://sdk.cashfree.com/js/v3/cashfree.js (next/script, once)
     cashfree.checkout({ paymentSessionId, redirectTarget: "_self" })
3  Cashfree returns to /dashboard/billing?order_id=…&status=…   ← treated as "processing", never as "paid"
4  GET  /api/v1/payments/cashfree/orders/:id                   ← DB status + server-side Cashfree re-fetch; UI polling only
5  POST /api/v1/payments/cashfree/webhook  (the single writer)
     verify signature (lib/cashfree.ts:127) + reject timestamp older than 5 min
     look up PaymentOrder by orderId (unknown order → 200 + audit warning, no credit)
     $transaction { updateMany(where { orderId, creditedAt: null }, data { status, creditedAt }) }
        count === 0 → duplicate delivery → 200 ack, no double credit
     credit paymentOrder.amountPaise → Transaction(CREDIT) → TaxInvoice (18 % GST) → AuditLog → n8n event
6  UI sees status PAID + new balance on the next poll
```

`amount_inr`, `user_id` and `customer_id` are removed from the `verify` request contract; `customer_details.customer_id` sent to Cashfree is the session user's id, which is what the webhook maps back from (`webhook/route.ts:24` stops defaulting to `usr_demo`).

### 5.2 Files

| File | Change |
|---|---|
| `src/components/CashfreeModal.tsx` | rewrite: `next/script` v3 SDK, sandbox/production from `NEXT_PUBLIC_CASHFREE_ENVIRONMENT`, amount presets, states `idle → creating → checkout → processing → paid / failed`, no optimistic balance |
| `src/components/UpiPaymentModal.tsx` | **delete.** It is a "free money" button (§0-Finding-C) and it renders a QR via a third-party service (`api.qrserver.com`) with no verification. If UPI must stay for enterprise clients, it becomes an admin-marked manual bank transfer with a pending row — never self-service credit |
| `src/app/api/v1/wallet/route.ts` | `POST` becomes admin-only manual adjustment (audited, writes `Transaction`), no longer a public credit endpoint |
| `src/app/dashboard/page.tsx:45-60` | top-up modal calls the order endpoint + SDK instead of `/wallet` |
| `src/lib/cashfree.ts` | keep REST order create/status/signature-verify; add `getCashfreeOrderStatus` hardening (currently returns a **fake PAID object** when unconfigured, `cashfree.ts:157-159` — must return `null`/throw instead, or a misconfigured prod "pays" everyone), add webhook timestamp check |
| `webhook/route.ts` | today it credits the **payload's** `order_amount` (`:23`, `:33`), maps the customer with a `usr_demo` fallback (`:24`), decides wallet-vs-letter by sniffing `orderId.includes("_ltr_")` (`:36`) and stamps a hard-coded GSTIN `29AAAAA0000A1Z5` on every invoice (`:53`). Rewritten: amount and purpose come from the `PaymentOrder` row, user from `PaymentOrder.userId`, GSTIN from the `GSTIN` env; idempotent per 5.1 step 5; `200` for well-formed unknown events (stop retry storms), `401` for bad signature |
| `verify/route.ts` | becomes `GET /orders/:orderId` (status only). Kept as a thin legacy `POST` that returns the same status and credits nothing, so any old agent build cannot mint balance |

### 5.3 Local/sandbox reality check

Cashfree sandbox cannot reach `localhost`, and "webhook-only credit" means a sandbox card payment looks stuck until an event arrives. So: `POST /api/v1/payments/cashfree/dev/simulate-webhook` that builds the same signed payload as Cashfree and calls the same internal handler — **mounted only when `NODE_ENV !== "production"`**, plus a visible "SANDBOX" badge in the billing UI whenever `NEXT_PUBLIC_CASHFREE_ENVIRONMENT=sandbox`. This keeps the production code path single-source while letting you actually test end-to-end.

### 5.4 Acceptance for Phase 2

1. Sandbox payment succeeds → webhook delivered twice (Cashfree does retry) → **one** credit, one invoice, one `Transaction`.
2. Replay the captured webhook body 30 s later → `200`, no second credit.
3. `POST /cashfree/verify {order_id:"fake", amount_inr:50000, user_id:"<admin>"}` → no credit, `404/400`.
4. Kill the container between Cashfree redirect and webhook → on restart the webhook replay credits exactly once (order state lives in Postgres).
5. Balance never changes before step 5 of the flow — verified by the ledger (`SUM(amountPaise)` of `Transaction` equals `balancePaise − opening credit`).

---

## 6. Phase 3 — Internal e-signature (no external API)

### 6.1 Storage

`Letter.signatureData` (base64 data-URL, `@db.Text`), `signatureName`, `signatureSignedAt` (§3.3). At a 720 × 260 canvas the PNG is ~20-40 KB → ~55 KB base64, comfortably inside Postgres `TEXT` and inside the `next/server` body limit. Validated server-side anyway: reject non-`image/png`, reject `> 400 KB`, reject non-owners, reject statuses past `QUEUED` (you cannot sign a letter that is already printed).

Why base64 in a column instead of object storage: the print sheet stays self-contained, no S3/B2 credentials are needed, and one signature per letter is a bounded blob. Scanned enclosures/attachments would belong in object storage — flagged in §12.

### 6.2 `src/components/SignaturePad.tsx` (new)

```ts
<SignaturePad value={dataUrl | null} onChange={(dataUrl | null) => void}
              defaultName={session.user.name} required />
```

- **Draw:** `<canvas>` with Pointer Events (mouse + touch + stylus; `touch-action: none`), high-DPI backing store via `devicePixelRatio`, Undo (stroke stack redraw) and Clear.
- **Upload:** PNG/JPG ≤ 400 KB, redrawn onto the canvas to normalise dimensions, via `createImageBitmap` (no blocking `FileReader`).
- **Type:** render `defaultName` into the canvas with the `Caveat` face already loaded in `layout.tsx:18` (drawn once onto the canvas, so the artefact stays a plain PNG — no font dependency at print time).
- Output: `canvas.toDataURL("image/png")`, cropped to the stroke bounding box.

### 6.3 Wiring

- `POST /api/v1/letters/:id/signature` (`requireApiAccess`, ownership, §6.1 checks, `signatureName`) writes `AuditLog: LETTER_SIGNED` with IP; `DELETE` retracts while `DRAFT`/`QUEUED`.
- `send/page.tsx`: a "Sign & dispatch" step between preview and pay — sign, or explicitly tick "this letter needs no signature".
- `letters/[id]/print/page.tsx`: render `<img src={signatureData}>` above the sign-off block (name, date, place) at print resolution, plus a "digitally signed via AnagataPost · `<signedAt>`" micro-line so the paper carries provenance. Print CSS keeps it inside the `@page` box with `break-inside: avoid`.
- `/dashboard/letters`, `/track/[id]` and the admin queue show a **Signed ✓** badge with `signedAt`, and `/letters/:id/send` blocks unsigned letters when the template is flagged `requiresSignature` (new boolean on `LetterTemplate`, default `true` for legal categories). Unsigned legal notices should not reach the print queue — that is the operational detail a print partner cares about.

---

## 7. Phase 4 — App shell (sidebar) + honest dashboards

### 7.1 Route groups

```
src/app/
  (marketing)/   page.tsx, track/                 → public header/footer
  (auth)/        login/, register/                → split panel, no nav chrome
  (app)/         layout.tsx → <AppShell>          → dashboard/, admin/, send/, letters/, developers/
```

Today all pages inherit the global `<Navbar>` (`src/components/Navbar.tsx`) **and** several pages hand-roll their own tab strip (`dashboard/page.tsx`, `dashboard/billing`, `dashboard/addresses`, `dashboard/templates`, `admin/page.tsx`, `admin/users`, `admin/finance`, `admin/analytics`). Route groups let the shell be defined once and every page drop its local tab bar — that alone removes ~8 duplicated navigations.

### 7.2 `src/components/Sidebar.tsx` (new)

Server-rendered shell with a small client island for active-link state; `lucide-react` icons (already a dependency); collapses to a slide-over drawer under `lg`.

**Workspace** — Overview `/dashboard` · Compose `/send` · Bulk `/send/bulk` · Letters `/dashboard/letters` · Address book `/dashboard/addresses` · Templates `/dashboard/templates` · Tracking `/track` · Billing & GST `/dashboard/billing` · API keys `/developers`

**Operations** (rendered only when the server-rendered session role is `ADMIN`/`PRINT_PARTNER`) — Fulfilment queue `/admin` · Users & wallets `/admin/users` · Finance & GST `/admin/finance` · Analytics `/admin/analytics` · Audit log `/admin/audit`

Top bar: letter search (a plain focusable input — no command-palette dependency), live balance chip with "Top up", avatar menu with role + email + sign-out. Role and balance come from the server, never from a client store.

### 7.3 New user Overview (today `/dashboard` is only the letters table)

Move the table to `/dashboard/letters`; make `/dashboard` answer "what needs me now": balance and spend-this-month (from `Transaction`), letters per status (`countsByStatus`), a **low-balance warning** when `balancePaise` is under ~2 letters' worth, recent ledger activity, four quick actions (compose, bulk CSV, address book, top up), and a first-run empty state that walks a new advocate through their first letter instead of showing a blank table.

### 7.4 Admin screens become real

| Screen | Change |
|---|---|
| `/admin` fulfilment | status tabs (Queued / Printed / In transit / Delivered / Failed), assign consignment + "notify recipient", bulk select → existing `/api/v1/admin/batch-print`. When `EVOLUTION_API_KEY` is missing the UI must read **"notification simulated"** — `admin/page.tsx:54-58` today prints both a simulated and a sent branch, and `evolution-api.ts:43-45` returns success with no key |
| `/admin/users` | real Postgres rows with per-user spend; role change and wallet adjust through the audited admin-only endpoint; search + sort by balance/spend |
| `/admin/finance` | invoices from DB, GSTR-1 CSV export using each invoice's own state → correct place of supply (CGST/SGST vs IGST), plus a reconciliation row (`Σ Transaction` vs `balancePaise`) |
| `/admin/analytics` | delete the fake months (`db.ts:647-651`) and the `"99.4"` / `Math.max(zones, 18)` numbers; render real series as CSS/SVG bars — **no new npm dependency**, since 6-8 data points do not need `recharts` |
| `/admin/audit` (new) | paginated `AuditLog` with action filter — the accountability layer an advocate-facing service needs |

Also: one `<Toaster />` + `<ConfirmDialog>` replace the per-page `alertMsg` banners and any `alert()`/`confirm()`; every list gets a skeleton and a real error state (a failed fetch currently renders a silently empty table — `admin/page.tsx:22-26`).

---

## 8. Phase 5 — Visual redesign

### 8.1 Direction: "Airmail & Ink"

Keep the postal artefact feeling (paper, stamp, perforation, monospace tracking IDs) but move the UI from the current `stone`/serif/red page to a precise, tool-like interface: a deep ink sidebar, warm paper canvas, one decisive red for actions, generous 8-pt spacing rhythm, and a real type hierarchy instead of everything serif.

| Token group | Value | Use |
|---|---|---|
| `ink.50…900` | slate-neutral scale anchored on `#0F1B2D` | sidebar (900), headings (900), body text (700) |
| `canvas` / `surface` | `#F7F6F3` / `#FFFFFF` | page background / cards |
| `stamp` | `#C8102E` (+ `stamp-dark #A50E26`, `stamp-50`) | primary actions, stamps, badge — the brand red, kept but disciplined (one red element per screen) |
| `postal` | `#1F4E79` | links, info, secondary actions, active nav item |
| `transit` `#B45309` · `delivered` `#15803D` · `failed` `#B91C1C` · `draft` `#64748B` | | status pills, consistent in dashboard, queue, tracking, print |
| `hairline` | `#E4E1DA` | borders (replaces ~200 ad-hoc `border-stone-200`s) |
| `radius` `xs sm md lg xl` = 6/8/10/14/20px | | today radii range `rounded-xl`…`rounded-3xl` arbitrarily |
| shadows `card`, `raised`, `focus` | | one elevation vocabulary; `focus:` ring on every control for keyboard users |

Fonts are already self-hosted through `next/font/google` in `layout.tsx:2` (`Playfair_Display`, `Plus_Jakarta_Sans`, `Caveat`, `JetBrains_Mono`) — good, keep that pattern (no runtime CDN, no layout shift). What changes is *which* faces sit in which role, added as `next/font` imports so the build still downloads them:

| Role | Face | Notes |
|---|---|---|
| Display / page titles | **Fraunces** (optical size, 600) | distinctive but quiet; replaces blanket `font-serif` |
| UI body, labels, tables | **Inter** | tabular figures for money columns |
| Tracking IDs, amounts, JSON | **JetBrains Mono** (kept) | already used for consignment numbers |
| Letter content handwriting | **Caveat** (the only handwriting face loaded today, `layout.tsx:18`) | the product's charm; add Kalam/Sacramento as `next/font` imports only if a second style is genuinely wanted |
| **Print sheet only** | **Playfair Display** (kept) | the physical page must still look like official correspondence — the redesign applies to the *app*, not to the paper the recipient receives |

Add `src/lib/cn.ts` (`clsx` + `tailwind-merge` are already dependencies but `src/lib/utils.ts` does not exist — no `cn()` exists today), and primitives in `src/components/ui/`: `Button`, `Card`, `Badge`/`StatusPill`, `Input`/`Field`, `Select`, `Modal`, `Table`, `EmptyState`, `Skeleton`, `Toaster`, `PageHeader`. All hand-rolled on the tokens above — **zero new npm packages**, so the lockfile, Docker layer and cold-start cost stay put.

### 8.2 Landing page rewrite (`src/app/page.tsx`, ~6.5 KB of markup)

Current page is a 26 KB single client component with a fake API-key snippet and hardcoded claims. Rewrite as a server component with sections: hero with a real product visual (an A4 letter + envelope rendered in CSS with a signature), "how it works" 4-step strip (compose → sign → we print & post → tracked proof), live-looking tracking demo (real `/api/v1/pincode/:pincode` lookup — a genuinely working feature), API/agents section quoting `public/skill.md`, pricing from the real ₹99/letter + GST, honest footer. **Remove the "India Post API 99.4%"-style footer badges** and any number we cannot back with our own data (§12 open item: real India Post tracking is not integrated, so tracking must be described as partner-confirmed, not as an India Post feed).

Auth pages: split-panel layout (left = brand/postal artefact, right = form), Google button above the password form with a divider, visible password requirements, no `alert()` on error, `callbackUrl` respected.

---

## 9. Phase 6 — The honesty pass (fake integrations labelled or removed)

These are product-integrity bugs, not cosmetics: an advocate relying on them will mail a client something that never happened.

| Where | Today | Change |
|---|---|---|
| `lib/evolution-api.ts:43-45` | returns success and logs "[Evolution API Simulation]" when no key → UI shows "WhatsApp alert sent" | return `{ success: false, simulated: true }`; admin UI shows an amber **simulated** chip; `admin/page.tsx:54-58` renders exactly one branch |
| `lib/cashfree.ts` — three "graceful simulation" shortcuts | `createCashfreeOrder` returns a fake `sim_session_…` when keys are missing (`:51-60`), `verifyCashfreeWebhookSignature` **returns `true`** when keys are missing (`:132-135`), `getCashfreeOrderStatus` fabricates `order_status: "PAID"` (`:157-164`). Together they mean a deploy that forgets `CASHFREE_*` lets anyone mint balance from a hand-written POST — and today's compose file never passes those vars | All three throw / return `null` in production (`NODE_ENV === "production"`), and only fall back to the explicit dev simulator (§5.3) when `NODE_ENV !== "production"` **and** `CASHFREE_ENVIRONMENT=TEST`. Billing UI shows "payment provider unavailable" instead of a success state |
| Letter status transitions | statuses move only when an admin clicks; `db.ts:610` invents a 99.4 % SLA | status = what the fulfilment team recorded; tracking page shows the last confirmed event **with its timestamp and source = "AnagataPost fulfilment"**, not "India Post" |
| `admin/page.tsx` KPI "+42 % MoM" & `admin/analytics` months | hardcoded | computed from `Transaction`/`Letter` rows, or the widget is not rendered |
| `developers/page.tsx` code samples | `ap_live_bharat_post_demo123` | the user's real key + "rotate" button |
| `README.md` / `public/skill.md` | document an auth scheme that does not exist | rewritten against the implemented endpoints after Phase 1–2 (same commit) |

---

## 10. Deployment, secrets and schema operations

### 10.1 Environment contract (`docker-compose.yml`, `.env.example`, Coolify)

Compose currently passes only 7 vars (`docker-compose.yml:9-16`) — no `NEXTAUTH_*`, no `GOOGLE_*`, no `CASHFREE_*`, no `ADMIN_EMAILS`. New block, all required values fail-fast at boot (`src/lib/env.ts` with zod-free explicit checks + a printed list of what is missing):

```yaml
NEXTAUTH_URL / NEXTAUTH_SECRET
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
CASHFREE_APP_ID / CASHFREE_SECRET_KEY             # v3 webhooks are HMAC-signed with the
CASHFREE_ENVIRONMENT=TEST|PROD                    # secret key (lib/cashfree.ts:138-142), so no
NEXT_PUBLIC_CASHFREE_ENVIRONMENT                  # separate webhook secret var is needed
CASHFREE_API_VERSION=2023-08-01                   # already in .env.example:19
GSTIN                                             # replaces the hard-coded 29AAAAA0000A1Z5
ADMIN_EMAILS
NEXT_PUBLIC_APP_URL                 # existing; used for webhook/return URLs
EVOLUTION_API_URL / EVOLUTION_API_KEY / EVOLUTION_INSTANCE_NAME   # existing
N8N_WEBHOOK_URL                                                  # existing
DATABASE_URL                      # move the hard-coded credential out of the compose file
```

`.env.example` already documents the NextAuth/Google/Cashfree names — the gap is purely that `docker-compose.yml` does not forward them to the container, so they exist in the file and die there. `NEXT_PUBLIC_*` values are inlined at **build** time, so changing them needs a rebuild, not just a restart — noted for the Coolify config. `ADMIN_SECRET_KEY` (`docker-compose.yml:16`) disappears entirely: no route references it (grep: zero hits), so it is a decoy secret that only widens the rotation surface.

### 10.2 Secret rotation checklist (do before re-exposing the subdomain)

Because `.env` is committed to git — one of the 63 tracked files, and `.gitignore:24-28` ignores only the `.env.local` variants, never plain `.env` — rotation is mandatory even after `git rm --cached .env`, since git history keeps the values. Order matters: (1) `git rm --cached .env`, add `.env` / `.env.*` (with `!.env.example`) to `.gitignore`, commit, (2) rotate NextAuth secret (invalidates all sessions — expected), (3) rotate Cashfree **secret key** and re-enter the **webhook secret** in the Cashfree dashboard, (4) rotate the Google client secret, (5) rotate the Postgres password (currently `anagatapost_secret_2026` in plaintext at `docker-compose.yml:10,28`), (6) rotate the Evolution API key, (7) delete the demo accounts' passwords by deleting the seeded users. Then, if the repo must stay public on `github.com/gochapachi/anagatapost`, purge history with `git filter-repo` and force-push — or keep the repo private.

### 10.3 Schema: `db push` → migrations, executed on deploy

`package.json` only has `prisma db push` (`:12`). For a production DB with real customer letters, switch to versioned migrations: `prisma migrate dev` locally, `prisma migrate deploy` on deploy (Coolify "pre-deploy command" or a one-shot container in compose). Add `prisma migrate deploy && node prisma/seed.js` as the documented deploy command in `README.md`. Baseline the current schema as the first migration so existing Coolify data is not wiped (never `prisma db push --force-reset` against production). One catch specific to this Dockerfile: the runner image copies only `public/` and `.next/` (`Dockerfile:41-49`), so **there is no `prisma/` folder or `node_modules/.prisma` inside the running container** — `migrate deploy` and `seed.js` physically cannot run there. They need a one-shot companion (a `migrate` service in compose built from the `builder` stage, or Coolify's pre-deploy command against a source checkout). The alternative — an eager `prisma.$connect()` + version check at app boot that refuses to serve when the schema is behind — is a poor second best and I would add it anyway as a loud failure instead of the current silent "works, then loses data".

### 10.4 Container hardening

`.dockerignore` exists but excludes only the `.env.local` family (`:8-11`) — **plain `.env` is not excluded**, so `COPY . ./` (`Dockerfile:17`) bakes live secrets into a builder layer that survives in the registry cache. Add `.env`, `.env.*`, `!.env.example`, `implementation_plan.md`, `anagatapost-n8n-workflow.json`, `docs/`, `_*.txt`. Replace `RUN npm ci || npm install` (`Dockerfile:11`) with plain `npm ci` — a silent fallback to `npm install` means unreproducible builds (`package-lock.json` is already committed, so `npm ci` will work). Add `HEALTHCHECK CMD wget -qO- http://127.0.0.1:3000/api/health` and a tiny `/api/health` that runs `SELECT 1` — Coolify needs it for zero-downtime deploys and it is also the cheapest way to notice "the app boots but Postgres is unreachable".

### 10.5 Runtime safety

- Login/register throttling: per-email + per-IP counters in Postgres (`LoginAttempt` table, 5 failures → 15 min lock) — in-memory counters break under replicas, so no `Map` here either (R1).
- `AuditLog` writes for: login success/failure, role change, wallet adjustment, letter create/send/status, signature attach/retract, order creation, webhook receipt.
- `next.config.mjs:6-11` sets `images.remotePatterns` to `hostname: "**"` — the image optimizer will happily proxy and cache any URL on the internet through your server. Restrict it to your own host (signatures are inline data-URLs, so nothing needs remote patterns), and keep `output: "standalone"` (`:3`), which the Dockerfile depends on.
- JSON request logging with the letter id + user id; keep Cashfree raw webhook bodies for 30 days (support truth).
- Webhook endpoint excludes itself from any CSRF/body-size defaults that would break signature verification (verify against `req.text()` raw body — already the pattern at `webhook/route.ts:5`).

---

## 11. Build order and review checkpoints

| # | PR | Contents | Depends on | Gate you review |
|---|---|---|---|---|
| 1 | **PR-0 · stop the bleeding** | `.gitignore`/`.dockerignore` fixes, `.env.example` with the new vars, `src/lib/env.ts` fail-fast, `/api/health`, compose env block, `middleware.ts`, `session.ts`, `requireAdmin()` on the admin routes, `ADMIN_EMAILS` bootstrap | — | **A** — probes 1-4, 8-9 of §13 pass against the live box |
| 2 | **PR-1 · Postgres is the source of truth** | Phase 0 in full: `src/lib/data/*`, all 14 routes + 8 pages, ledger writes, `PaymentOrder`/`Transaction`/signature fields, `prisma/seed.js`, delete `inMemoryStore` | PR-0 | **B** — restart-and-still-there demo, §3.4 |
| 3 | **PR-2 · real money** | Cashfree v3 order → SDK → webhook-only credit, `verify` neutered, `UpiPaymentModal` deleted, wallet `POST` admin-only, dev simulator, `/api/v1/api-keys` CRUD + bearer auth | PR-1 | **C** — sandbox payment, double-delivery replay, §5.4 |
| 4 | **PR-3 · Google + hardening** | `<GoogleButton>` on login/register, verified-email linking, `AccountNotLinked` mapping, login throttle, remove JWT-embedded balance | PR-0, PR-1 | **D** — Google sign-in on the real domain |
| 5 | **PR-4 · e-signature** | `SignaturePad`, signature endpoint, compose step, print sheet, `Signed ✓` badges, `requiresSignature` gate | PR-1 | **E** — one letter printed and photographed |
| 6 | **PR-5 · shell + screens** | tokens, `cn`, `ui/*` primitives, `AppShell`/`Sidebar`/`PageHeader`, route groups, dashboard + admin refactor, `Toaster`/`EmptyState`/`Skeleton` | PR-1…PR-4 | **F** — screen-by-screen walkthrough |
| 7 | **PR-6 · surface + truth** | landing + auth rewrite, honesty pass (§9), `README.md`/`public/skill.md` accuracy | PR-5 | **G** — pre-launch review |

Why this order: security first because PR-0 is small (~250 lines) and closes the live exploit without waiting for anything else; storage second because every later phase reads through it; UI last so nobody restyles screens twice. Every PR lands `tsc`-clean and deployable — no long-lived branch, and each gate is a demo you can watch, not a diff you have to trust.

The one dangerous state is a half-migrated PR-1 (some routes on Prisma, some on the Map): I will not open that PR until `grep -rn "inMemoryStore" src/` returns zero.

---

## 12. Decisions I need from you

1. **Confirm there is nothing to migrate.** Because state lives in RAM today, any data a customer ever had is already gone at the first restart — the production Postgres is almost certainly empty. Verify with `select count(*) from "User";` before PR-1. If you believe real customers exist, we need an export/backup story first and that changes PR-1's shape.
2. **Webhook-only credit** (the "payment processing" delay of a few seconds-to-minutes if the customer closes the tab) versus trusting the browser redirect, which is the thing that lets people pay ₹1 for ₹500 of credit. I strongly recommend webhook-only; confirming is enough.
3. **Invoicing truth.** Real GSTIN, legal entity name, address, and the SAC/GST treatment for postal services are accountant questions, not code questions. Right now one demo GSTIN is printed on customer-facing documents from four places — `webhook/route.ts:53`, `cashfree/verify/route.ts:61`, and shown in the billing UI at `billing/page.tsx:136` and `:265` — and `register/page.tsx:201` even uses it as the input placeholder (so customers copy a fake number into their account). All five move to a `GSTIN` env var; until it is set, invoices print "GSTIN: —" rather than a fabricated registration.
4. **Is there a print-partner API, or a human?** The queue is manual today (`/admin` buttons, `batch-print`, `delivery-status` all written by the app itself). If a human carries envelopes to the post office, the right product is a good queue UI and I will not invent an API integration. If there is a partner API, send docs and it becomes PR-7.
5. **Delivery tracking.** `/track/[id]` currently displays whatever an admin wrote. Options: (a) label it "partner-confirmed" and keep manual entry — what I plan; (b) India Post tracking API, which needs credentials and a sanctioned sender account; (c) partner pushes events. Which one is real today?
6. **API surface.** `/developers`, `public/skill.md`, and the MCP framing advertise a programmatic API that does not authenticate anything. Either PR-2 makes it genuinely real (my plan), or we mark those pages "coming soon" and keep `/api/v1` session-only. Say which, because it decides whether `/developers` stays.
7. **Two operators at once.** Cheap to make the print queue safe for concurrent staff (`lockedBy`/`lockedAt` columns) — I intend to add it unless you'd rather keep single-operator simplicity.
8. **Git history purge.** `gochapachi/anagatapost` is public with live secrets in history. My default is rotate + untrack and leave history alone (force-pushing breaks other clones); if you want history purged with `git filter-repo`, say so explicitly.

---

## 13. Verification

After every PR:

```bash
npx tsc --noEmit                              # clean today; must stay clean
npm run build                                 # catches server/client boundary errors in the new shell
npx prisma migrate dev && node prisma/seed.js # local schema + fixtures
npm run dev
```

The attacks that actually matter, as `curl`s (no browser needed) — run against a deployed URL, not just localhost:

| # | Probe | Expected after PR-0/1/2 | Today |
|---|---|---|---|
| 1 | `POST /api/v1/wallet {"amount_inr":999999}` | 401 | **200 + credited** |
| 2 | `GET /api/v1/letters` | 401 | **every letter, every user** |
| 3 | `GET /api/v1/admin/users` | 401 | **full user dump** |
| 4 | `PATCH /api/v1/admin/users {"userId":"me","role":"ADMIN"}` | 401 | self-admin possible |
| 5 | `POST /api/v1/payments/cashfree/verify {"order_id":"x","user_id":"usr_admin","amount_inr":50000}` | credits nothing | **₹50,000 free** |
| 6 | replay one captured webhook twice | one ledger row | double credit |
| 7 | `POST /api/v1/letters` with `Authorization: Bearer bogus` | 401 | — |
| 8 | logged-out `GET /dashboard` | 302 → `/login?callbackUrl=/dashboard` | renders, then client-side redirect |
| 9 | USER-role cookie on `/admin/users` | 302 + 403 data fetch | **renders admin screen** |
| 10 | user B reads user A's letter id | 404 | 200 |
| 11 | restart the container mid-flow | letters, balances, order states intact | **all gone** |
| 12 | print a signed letter to PDF | signature inside the page box, `signedAt` visible | no signature anywhere |

Plus the mechanical greps that prove a phase is finished, not just patched:

```bash
grep -rn "inMemoryStore" src/                     # → 0 after PR-1
grep -rn "usr_demo" src/app/api src/lib           # → 0 after PR-1
grep -rn "simulated: true" src/lib src/app/api    # → 0 outside the dev simulator
grep -rn "usd\|\\$[0-9]" src/app src/components    # → 0 after PR-6 (no USD claims left)
grep -rn "tracking_number" src/app/dashboard      # → 0 (no fabricated numbers)
```

And the two physical checks a screenshot cannot fake: pay ₹1 in Cashfree sandbox and watch the ledger row appear from the webhook alone; print one signed letter on real paper and photograph it (`paperPostType: "REGD"` is a ₹2 experiment that tells you more about the product than a week of UI work).

---

## 14. What this plan deliberately does not do

- No new framework, no shadcn/Radix, no Tailwind v4, no next-intl, no new state library, no new fonts beyond optional `next/font` additions — the existing stack and the Craft-Journal identity carry the product.
- No WhatsApp-sending rebuild in this pass. Phase 0 makes its status field truthful; the Evolution/n8n path keeps working as-is.
- No payment-failure email (needs SMTP and an address policy), no Stripe backup gateway, no subscriptions — wallet top-ups only until volume justifies more.
- No admin analytics beyond what the ledger can answer with a `GROUP BY`.
- No invented fulfillment or tracking integrations: if a partner API exists you will tell me, and it becomes its own PR.

If sections 1-10 look right and you answer the eight questions in section 12, say **"approve"** and I'll start with PR-0 (auth boundary + secret hygiene), which is the smallest change that removes the worst risk.







**Recommendation before anything else:** treat the live deployment as publicly exploitable. Put it behind IP allow-list / Cloudflare Access (or unpublish the subdomain) until Phases 1–2 ship, and rotate every secret (see §10.2 — `.env` is committed to git with live values).

---

## 15. PR-0 delivery log — auth boundary + secret hygiene (shipped, not yet deployed)

### 15.1 New files

| File | Role |
|---|---|
| `src/lib/env.ts` | The only place server env is read. In production the process refuses to boot when `NEXTAUTH_SECRET`, `NEXTAUTH_URL` or `DATABASE_URL` is missing (§10.1) — the old `auth.ts` fallback key meant every deployed instance minted interchangeable JWTs. `NEXT_PHASE === "phase-production-build"` downgrades the throw to a warning, because `next build` imports every server module with `NODE_ENV=production` while the Docker *builder* never receives deploy secrets. `publicEnv` is the sole client-safe export. |
| `src/lib/session.ts` | `requireSession` / `requireStaff` / `requireAdmin` / `requireOwner` returning `{ ok }` unions, so a handler cannot forget to return. Route handlers, not middleware, are the enforcement point (§4.2). |
| `src/middleware.ts` | Cookie-presence only. Public exceptions: Cashfree webhook (authenticated by HMAC, never by cookie), `GET /api/v1/pincode/*`, `GET /api/v1/letters/{id}` (tracking link, redacted downstream). HTML paths redirect to `/login?callbackUrl=…`; `/api/*` answers 401 with `WWW-Authenticate: Session`. |
| `src/app/api/health/route.ts` | Liveness + readiness (`SELECT 1` under a 2 s timeout, 503 when the DB is unreachable). Deliberately outside the middleware matcher so a container healthcheck needs no session. |
| `src/app/dashboard/layout.tsx`, `src/app/admin/layout.tsx` | Server guards (§4.2): no HTML for a signed-out or under-role visitor, so nothing leaks in the bytes-before-redirect window that client redirects leave open. |

### 15.2 Changed

- `src/lib/auth.ts` — signs with `env.nextauthSecret`; the dev-only fallback constant is unreachable in production (`env.ts` throws first). `ADMIN_EMAILS` grants ADMIN inside the JWT callback, which is the bootstrap until roles move to Postgres (§4.4).
- Session scoping in `letters`, `letters/[id]`, `letters/[id]/send`, `invoices`, `templates`, `address-book`; `wallet` POST → ADMIN; `admin/*` → STAFF/ADMIN; `payments/cashfree/order|verify` derive payer identity from the session and the amount from Cashfree's own order response, never from the request body (kills probe 5 in §13).
- `payments/cashfree/webhook` — signature **and** timestamp header are mandatory (`verifyCashfreeWebhookSignature` returns `true` while unconfigured; that simulation path must never reach credit code), ±300 s replay window, production refuses to credit while unconfigured, plus a process-local `processedOrders` guard so Cashfree's at-least-once retries cannot double-credit. Both the guard and the credit target are interim — the durable version is Phase 2 (§5.1).
- `docker-compose.yml` — forwards the full §10.1 contract; `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `POSTGRES_PASSWORD` use `${VAR:?}` so compose aborts instead of booting with the credential that was committed in plaintext. `ADMIN_SECRET_KEY` removed (zero references — a decoy secret). App + Postgres healthchecks, `depends_on: service_healthy`.
- `.env` untracked via `git rm --cached .env`; `.gitignore` and `.dockerignore` both cover `.env` + `.env.*` with `!.env.example`, so credentials stop reaching git *and* the image build context. The local file stays for `next dev`.
- `.env.example` rewritten to the same contract and no longer ships a plausible-looking admin secret.

### 15.3 Verified

- `node node_modules/typescript/bin/tsc --noEmit` → clean.
- `node node_modules/next/dist/bin/next build` → succeeds. `/admin*`, `/dashboard*`, `/letters/[id]/print` now report `ƒ` (dynamic) where they were previously prerenderable — that change of marker is the evidence the layout guards run per request. Middleware bundle 34.3 kB.
- Outstanding: the §13 curl matrix against a deployed target, and one real ₹1 sandbox payment.

### 15.4 Rotation still owed (§10.2 — order matters)

Untracking `.env` is step 1 of 7, not the fix: the values live in git history. Rotate NextAuth secret (logs every session out — expected), Cashfree secret key + re-enter the webhook secret in the Cashfree dashboard, Google client secret, Postgres password, Evolution API key; then delete the seeded demo users. If `github.com/gochapachi/anagatapost` stays public, purge with `git filter-repo` and force-push, or make the repository private.

### 15.5 What PR-0 deliberately leaves open

1. Persistence is untouched: every letter, balance and order still dies with the container (Finding A). `requireOwner` compares against `usr_demo`, so ownership checks are honest but meaningless until Phase 0 gives users real ids.
2. The webhook credits `inMemoryStore.topupBalance()` — one global pool, not `customerId`'s wallet, so a single payer funds every account until the ledger lands.
3. `POST /api/auth/register` is public and mints ₹500 of complimentary credit per signup. Role is hard-coded `USER`, so no escalation — but the welcome credit is an abuse vector the moment data persists; gate it behind a flag or a verified phone in Phase 1.
4. `NEXT_PUBLIC_*` values are inlined at build, so Coolify needs a **rebuild** (not a restart) when they change; and because compose now fails on missing required vars, those three must exist in Coolify before the next deploy.

