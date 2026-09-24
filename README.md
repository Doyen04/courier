# Courier

Courier connects people who need an item with travelers already going that way. The initial app is a Next.js App Router project with TypeScript, REST route handlers under `/api/v1`, PostgreSQL, and Prisma.

## Local setup

1. Install the application dependencies listed at the end of this document. If Prisma ORM 7 is used, set the package to ESM with `npm pkg set type=module`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to a PostgreSQL database you can use locally. Replace the example authentication secret before configuring an authentication provider.
3. Generate the Prisma client and apply the first migration:

   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

The health endpoint is available at `http://localhost:3000/api/v1/health`. Its response is an application liveness check and does not verify database connectivity.

## Project structure

- `src/app` — Next.js pages and REST route handlers.
- `src/lib/http` — shared REST response and request ID helpers.
- `src/lib/db` — database client boundary.
- `src/lib/logging` — structured server log helper.
- `src/lib/env.ts` — validated environment configuration.
- `prisma/schema.prisma` — users, requests, itineraries, matches, agreements, payment records, delivery confirmations, and audit events.
- `plan.md` — staged product implementation roadmap and acceptance criteria.

All browser-to-server mutations and reads use HTTP APIs under `/api/v1`; Server Actions are not used for API requests. Keep business rules in server-side domain services and keep authentication and payment provider code behind adapters.

## Dependencies to install

The project uses Prisma ORM 7 with PostgreSQL's Node driver adapter:

```bash
npm install zod dotenv @prisma/client@7 @prisma/adapter-pg@7 pg
npm install --save-dev prisma@7 @types/pg
```

After installing, run the Prisma generation and migration commands in Local setup. These commands require a configured PostgreSQL database. Authentication and payment provider packages are intentionally deferred until those providers are selected.
