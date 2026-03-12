# Haven -- The Anti-Algorithm Social Platform

A privacy-first, ad-free social platform where human connection comes before engagement metrics. No algorithmic feeds, no data harvesting, no dark patterns.

## Tech Stack

| Layer                 | Technology                                |
| --------------------- | ----------------------------------------- |
| Framework             | Next.js 16 (App Router, Turbopack)        |
| Language              | TypeScript 5, React 19                    |
| Styling               | Tailwind CSS v4, shadcn/ui, Framer Motion |
| Database              | Neon PostgreSQL via Drizzle ORM           |
| Auth                  | Clerk                                     |
| Real-time             | Ably                                      |
| File Storage          | UploadThing                               |
| Cache / Rate Limiting | Upstash Redis                             |
| Email                 | Resend                                    |
| GIFs                  | KLIPY                                     |
| PWA                   | Serwist                                   |
| Push Notifications    | Web Push (VAPID)                          |
| Validation            | Zod                                       |
| State                 | Zustand (client), TanStack Query (server) |
| Linting               | ESLint 9, Prettier, Husky + lint-staged   |

## Features

- **Feed** -- Chronological posts with rich Lucide icon reactions, polls, link previews, and media galleries
- **Stories** -- Ephemeral 24-hour content with viewer tracking and auto-cleanup (including UploadThing asset deletion)
- **Chat** -- Real-time direct messaging with GIF picker, media sharing, and message reactions
- **Circles** -- Private friend groups for organizing connections
- **Collections** -- Save and organize bookmarked posts
- **Lists** -- Curated user lists for focused feeds
- **Explore** -- Discover trending hashtags, posts, and users
- **Notifications** -- Real-time push and in-app notifications
- **Drafts** -- Save unfinished posts for later
- **Activity** -- Personal activity log (reactions, comments, follows)
- **Vault** -- Private encrypted media storage
- **Wellbeing** -- Zen mode, daily limits, break reminders, quiet hours
- **Profiles** -- Inline avatar/banner upload (with GIF support), QR codes, badges, highlights, status, profile views, pinned posts
- **Privacy** -- Private accounts, reply/reaction visibility toggles, profile view controls, user restrict/block

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Bun](https://bun.sh/) (recommended) or npm/yarn/pnpm
- A [Neon](https://neon.tech/) PostgreSQL database
- Service accounts for: [Clerk](https://clerk.com/), [Ably](https://ably.com/), [UploadThing](https://uploadthing.com/), [Upstash](https://upstash.com/), [Resend](https://resend.com/), [KLIPY](https://klipy.com/)

### Setup

1. Clone the repository:

```bash
git clone https://github.com/your-username/haven.git
cd haven
```

2. Install dependencies:

```bash
bun install
```

3. Copy the example env file and fill in your keys:

```bash
cp .env.example .env.local
```

See [Environment Variables](#environment-variables) below for details on each key.

4. Push the database schema (first time) or run migrations (subsequent updates):

```bash
# First-time setup -- push schema directly
bun run db:push

# Subsequent updates -- run migration files in order
bun run db:migrate
```

5. Start the dev server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

| Variable                            | Service     | Where to get it                                            |
| ----------------------------------- | ----------- | ---------------------------------------------------------- |
| `DATABASE_URL`                      | Neon        | Neon dashboard > Connection string                         |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk       | Clerk dashboard > API Keys                                 |
| `CLERK_SECRET_KEY`                  | Clerk       | Clerk dashboard > API Keys                                 |
| `CLERK_WEBHOOK_SECRET`              | Clerk       | Clerk dashboard > Webhooks > Signing Secret                |
| `UPLOADTHING_TOKEN`                 | UploadThing | UploadThing dashboard > API Keys                           |
| `ABLY_API_KEY`                      | Ably        | Ably dashboard > App > API Keys                            |
| `UPSTASH_REDIS_REST_URL`            | Upstash     | Upstash console > REST API                                 |
| `UPSTASH_REDIS_REST_TOKEN`          | Upstash     | Upstash console > REST API                                 |
| `RESEND_API_KEY`                    | Resend      | Resend dashboard > API Keys                                |
| `KLIPY_API_KEY`                     | KLIPY       | KLIPY dashboard > API Keys                                 |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`      | Web Push    | Generate with `web-push generate-vapid-keys`               |
| `VAPID_PRIVATE_KEY`                 | Web Push    | Generate with `web-push generate-vapid-keys`               |
| `NEXT_PUBLIC_APP_URL`               | App         | `http://localhost:3000` locally, your domain in production |
| `CRON_SECRET`                       | App         | Any secure random string for cron job auth                 |

## Scripts

| Command                | Description                      |
| ---------------------- | -------------------------------- |
| `bun run dev`          | Start dev server with Turbopack  |
| `bun run build`        | Production build                 |
| `bun run start`        | Start production server          |
| `bun run lint`         | Run ESLint                       |
| `bun run lint:fix`     | Auto-fix lint issues             |
| `bun run format`       | Format with Prettier             |
| `bun run format:check` | Check formatting                 |
| `bun run db:generate`  | Generate Drizzle migrations      |
| `bun run db:migrate`   | Run Drizzle migrations           |
| `bun run db:push`      | Push schema directly to database |
| `bun run db:studio`    | Open Drizzle Studio              |

## Project Structure

```
app/
  (auth)/              Auth pages (sign-in, sign-up, onboarding)
  (main)/              Authenticated app routes (feed, chat, explore, profile, settings, etc.)
  api/                 API routes (webhooks, ably auth, gifs, embed, qr, cron jobs)
components/
  ui/                  shadcn/ui primitives
  {domain}/            Feature components (feed, chat, profile, stories, comments, etc.)
  shared/              Cross-cutting UI (sidebar, navbar, command palette, haven logo)
  providers/           React context providers
lib/
  ably/                Ably real-time: client.ts (Realtime singleton), server.ts (REST publish)
  actions/             Server actions -- all mutations ({domain}.actions.ts)
  db/schema/           Drizzle ORM table definitions (one file per domain)
  db/queries/          Reusable query functions
  db/migrations/       Drizzle migration SQL files (git-tracked)
  emails/              Email templates (Resend)
  uploadthing/         UploadThing: router.ts (file routes), client.ts (useUploadThing hook), server.ts (UTApi + utilities)
  validators/          Zod schemas (shared client/server)
hooks/                 Custom React hooks
stores/                Zustand stores
types/                 Shared TypeScript types
public/                Static assets, PWA icons, manifest
```

## Database Migrations

Drizzle migrations live in `lib/db/migrations/` and are version-controlled. When making schema changes:

```bash
# 1. Edit schema files in lib/db/schema/
# 2. Generate a migration
bun run db:generate -- --name describe-the-change

# 3. Review the generated SQL in lib/db/migrations/
# 4. Apply it
bun run db:migrate
```

For quick local iteration, `bun run db:push` syncs the schema without generating migration files.

## Deployment

Deploy to [Vercel](https://vercel.com/) for the best Next.js experience:

1. Push your repo to GitHub
2. Import the project in Vercel
3. Add all environment variables from `.env.example`
4. Set up cron jobs in `vercel.json` (story cleanup, scheduled posts, memory surfacing)
5. Deploy

Post-deploy checklist:

- Configure the Clerk webhook endpoint to `https://your-domain.com/api/webhooks/clerk`
- Verify `CRON_SECRET` is set for authenticated cron endpoints
- Test real-time features (Ably) and file uploads (UploadThing) in production

## License

Private -- All rights reserved.
