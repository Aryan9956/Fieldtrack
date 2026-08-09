# FieldTrack — Production SaaS Deployment & Infrastructure Guide

This guide explains how to deploy **FieldTrack** as a real, public-facing, multi-tenant SaaS application available on a custom domain with HTTPS.

---

## 1. Hosting Architecture Options

FieldTrack is built on Next.js 14+ (App Router) and can be deployed to zero-cost or scalable production infrastructure:

### Option A: Vercel + Managed PostgreSQL (Recommended for ₹0 Start)
- **Frontend & API Routes**: Hosted on **Vercel** (Free Hobby Tier / Pro).
- **Database**: Managed **PostgreSQL** on **Neon.tech** or **Supabase** (Free Tiers include 0.5 GiB storage and 100 max connections).
- **Realtime Updates**: Uses Server-Sent Events (SSE) `/api/sse/dashboard`, which runs natively on Vercel serverless functions without requiring persistent WebSocket containers.

### Option B: Railway / Render / DigitalOcean App Platform
- **All-in-One**: Hosts Next.js App, Node.js environment, and PostgreSQL container on a unified platform.

---

## 2. Managed PostgreSQL Database Setup

1. Create a free PostgreSQL database on [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com).
2. Copy the PostgreSQL connection URI. It will look like:
   ```env
   DATABASE_URL="postgresql://username:password@ep-host.region.aws.neon.tech/fieldtrack?sslmode=require"
   ```
3. Update `prisma/schema.prisma` if deploying to PostgreSQL:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
4. Run Prisma database migrations to create all production tables and indexes:
   ```bash
   npx prisma db push
   # OR for production migration history tracking:
   npx prisma migrate deploy
   ```

---

## 3. Environment Variables Setup

Configure the following environment variables in your deployment platform settings (Vercel Project Settings -> Environment Variables, or Railway Variables):

| Environment Variable | Production Value | Description |
|:---|:---|:---|
| `DATABASE_URL` | `postgresql://...` | Connection URI to production PostgreSQL database |
| `AUTH_SECRET` | High entropy string (32+ chars) | Generate via `openssl rand -base64 32` |
| `EMAIL_PROVIDER` | `resend` (or `smtp`) | Production email provider |
| `RESEND_API_KEY` | `re_live_xxxxxxxx` | Resend API key for verification emails |
| `EMAIL_FROM` | `FieldTrack <noreply@yourdomain.com>` | Sender email header |
| `PRICE_PER_EMPLOYEE` | `19` | Commercial pricing per employee (INR) |
| `PAYMENTS_ENABLED` | `false` | Inactive payment mode (₹0 MVP) |
| `NEXT_PUBLIC_APP_URL` | `https://fieldtrack.yourdomain.com` | Public canonical HTTPS domain |
| `NEXT_PUBLIC_APP_NAME` | `FieldTrack` | Brand display name |
| `NEXT_PUBLIC_ENABLE_DEMO_CREDENTIALS` | `false` | Disables demo quick-login buttons on public site |
| `ADMIN_EMAIL` | `admin@yourdomain.com` | Initial Super Admin email |
| `ADMIN_PASSWORD` | `StrongAdminPass123!` | Initial Super Admin password |

---

## 4. Production Email Provider Setup (Resend)

To send real transactional verification emails to business owners:

1. Sign up for a free account at [Resend.com](https://resend.com) (Free tier includes 3,000 emails/month).
2. Add your custom domain (e.g. `yourdomain.com`) and add the DNS TXT/DKIM records to your domain provider (Cloudflare, Namecheap, GoDaddy).
3. Create an API Key in Resend and set environment variables:
   ```env
   EMAIL_PROVIDER="resend"
   RESEND_API_KEY="re_live_xxxxxxxxxxxxxxxx"
   EMAIL_FROM="FieldTrack <noreply@yourdomain.com>"
   ```

---

## 5. Domain Configuration & HTTPS Setup

1. In Vercel / Railway, go to **Domains** and add your custom domain (e.g. `fieldtrack.yourdomain.com` or `yourdomain.com`).
2. Update your DNS settings at your domain registrar:
   - **CNAME Record**: `fieldtrack` pointing to `cname.vercel-dns.com` (or platform equivalent).
3. Vercel automatically issues an SSL certificate for HTTPS.
4. Ensure `NEXT_PUBLIC_APP_URL` is set to `https://fieldtrack.yourdomain.com`.
5. Next.js middleware will automatically enforce HTTP-Only, `SameSite=lax`, and `secure` cookie flags in production.

---

## 6. Creating the First Super Admin Account

Once the database is migrated and environment variables are set:

Run the administrative creation command:

```bash
npm run create-admin
```

This command reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your production environment variables, hashes the password using bcrypt (12 rounds), and creates the initial `SUPER_ADMIN` user in the PostgreSQL database.

Log in to the Super Admin portal at:
`https://fieldtrack.yourdomain.com/admin/login`

---

## 7. Disabling Development & Demo Accounts

In production (`NODE_ENV === "production"`):
- The **⚡ Demo Quick Logins** box on the login page is hidden automatically because `NEXT_PUBLIC_ENABLE_DEMO_CREDENTIALS="false"`.
- The development email inbox endpoint `/api/dev/emails` returns `403 Forbidden`.
- The seed script (`npx prisma db seed`) automatically skips creating demo managers or demo employees unless `SEED_DEMO_DATA="true"` is explicitly set.

---

## 8. Customer Access & Payment Workflow

### Current State (`PAYMENTS_ENABLED="false"`)
1. **Public Visit**: Business owner visits `https://yourdomain.com`, views ₹19 pricing, and clicks **Start Tracking**.
2. **Registration**: Owner signs up on `/register`.
3. **Email Verification**: Owner receives email with verification link -> clicks to verify email.
4. **Access Approval**: Owner is directed to `/access-pending`.
5. **Super Admin Approval**: You log into `https://yourdomain.com/admin`, review the pending owner, and click **Grant Access** (selecting access duration e.g. 30/365 days and employee limit e.g. 25).
6. **Active Access**: Owner can now log in, add employees, assign tasks, and track field staff.

### Future Activation (`PAYMENTS_ENABLED="true"`)
When ready to accept online credit card/UPI/netbanking payments:
1. Register on Razorpay / Stripe and obtain production credentials.
2. Set environment variables:
   ```env
   PAYMENTS_ENABLED="true"
   RAZORPAY_KEY_ID="rzp_live_xxxxxxxx"
   RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxxxx"
   RAZORPAY_WEBHOOK_SECRET="whsec_xxxxxxxx"
   ```
3. The billing engine will automatically enable gateway checkout calls without requiring any frontend or architectural redesign.

---

## 9. Database Backup & Disaster Recovery

If using **Neon.tech** or **Supabase**:
- **Point-in-Time Recovery (PITR)** is automatically built into Neon/Supabase projects.
- **Manual Backups**:
  ```bash
  # Take a database snapshot pg_dump:
  pg_dump "postgresql://user:pass@ep-host.region.aws.neon.tech/fieldtrack" > backup_$(date +%Y%m%d).sql

  # Restore from SQL snapshot:
  psql "postgresql://user:pass@ep-host.region.aws.neon.tech/fieldtrack" < backup_20260809.sql
  ```

---

## 10. Health Check Monitoring

Monitor application availability by pointing uptime monitoring services (UptimeRobot, Better Stack, Pingdom) to:

`https://fieldtrack.yourdomain.com/api/health`

**Expected Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2026-08-09T09:30:00.000Z",
  "uptimeSeconds": 12450,
  "environment": "production",
  "services": {
    "database": {
      "status": "healthy",
      "latencyMs": 14
    },
    "paymentSystem": {
      "status": "INACTIVE (₹0 Mode)",
      "enabled": false
    },
    "emailProvider": "resend"
  }
}
```
