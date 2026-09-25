# Operations and release notes

This runbook describes the application-side release and support checks. The hosting platform and payment provider are not selected yet, so provider-specific deployment, webhook, reconciliation, and payout instructions must be added after those decisions.

## Environment and deployment

- Store `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, SMTP settings (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, optional paired `SMTP_USER`/`SMTP_PASSWORD`, and `SMTP_FROM`), and `COURIER_SUPPORT_USER_IDS` in the deployment platform's secret/configuration manager. Never place real values in source control or browser-exposed variables.
- The Next.js build and production startup validate database/auth configuration, complete SMTP sender configuration, and an HTTPS public application URL. Use a distinct, high-entropy `AUTH_SECRET` for each environment.
- Install locked dependencies with `npm ci`. The `postinstall` hook generates Prisma Client; `npm run build` also runs Prisma generation before the Next.js build.
- Apply committed database migrations as an explicit release step with `npx prisma migrate deploy`. Do not use `migrate dev` in production. Take a restorable database backup before schema releases that need one.
- Keep web instances stateless. Persist operational data in PostgreSQL and secrets in the platform's secret store.

## Health and database readiness

- `GET /api/v1/health` is a liveness check. It confirms that the application process responds without depending on PostgreSQL.
- `GET /api/v1/ready` checks the database connection and returns `503` when the application cannot serve database-backed requests.
- Configure the host to remove an instance from service when readiness fails. Alert on sustained readiness failure; do not include database URLs, SQL details, or credentials in public health responses.

## Authentication and support access

- Configure `COURIER_SUPPORT_USER_IDS` as comma-separated local user UUIDs for staff allowed to read and triage disputes. Keep this list minimal and review it when staff access changes.
- Support actions are written to `AuditEvent`. Review access and audit records through restricted operational tooling; do not expose the support API to ordinary users.
- Login failures are throttled by a keyed hash of the normalized email address. Add deployment-aware network throttling before opening public registration broadly.
- Email verification and password recovery use one-time random tokens, store only token hashes, and enforce expiry. Recovery request responses are generic to avoid exposing account existence; each account also has a token resend cooldown.
- Password reset invalidates previous JWT sessions through the user's session version. Reset pages suppress referrer headers so query-string tokens are not sent to third-party pages.
- Verify SMTP delivery and DNS sender authentication (SPF/DKIM/DMARC) in the chosen hosting environment before launch. Configure IP/network-level abuse controls at the edge.

## Handoff and dispute handling

- A traveler can start handoff only when the agreement is funded, has a locked terms snapshot, and has exactly one captured/held payment.
- Only the requester can confirm receipt. Confirmation records the actor and time and moves the payment to `RELEASE_PENDING`; this records release eligibility for a future provider adapter and does not itself transfer funds.
- Opening a dispute changes the agreement to `DISPUTED`. No release operation is provided while a dispute exists. Configured support staff can list disputes and mark one `UNDER_REVIEW`.
- Dispute outcome and financial settlement procedures are pending provider and support-policy decisions. Do not manually edit payment or agreement rows to release or refund funds.

## Backup, restore, and monitoring checklist

- Configure encrypted, automated PostgreSQL backups and define retention according to the chosen hosting and data-retention policy.
- Schedule restore rehearsals in a non-production environment. Verify that the application can start against the restored database and that migrations are applied in order.
- Collect structured application logs with request IDs. Exclude passwords, authentication tokens, provider secrets, full payment credentials, and unnecessary personal data.
- Add alerts for repeated readiness failures, authentication abuse, stuck `REQUIRES_ACTION`/`AUTHORIZED`/`RELEASE_PENDING` payments, webhook processing failures, and disputes without an owner.
- Assign an operational owner for account issues, handoff incidents, dispute triage, database restore, and eventual payment reconciliation.

## Launch gates still open

- Select and configure a payment provider whose product supports the intended markets and hold/release workflow; verify its legal and compliance fit before accepting transactions.
- Implement and test signed, idempotent webhooks, payment reconciliation, refunds, and payout release checks with the provider's sandbox.
- Complete edge-level authentication throttling, dispute resolution policy, monitoring/alert wiring, and automated critical-path coverage for verification, recovery, session invalidation, and mail-delivery errors.
- Configure production domain/TLS, secret storage, backups, support access, rollback steps, and market-specific legal/compliance review.
