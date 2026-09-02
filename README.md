# Gowdara Jayadevappa

A saree store — storefront, cart & checkout, customer login, and an admin
panel — built with Next.js. Runs immediately with demo data and Cash on
Delivery; connects to Supabase (database + login) and Razorpay (online
payments) when you're ready. See **SETUP.md** for the step-by-step,
no-coding-required walkthrough to get this live on your own domain.

## Running it locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the storefront.

To use the admin panel at `/admin`, copy `.env.local.example` to `.env.local`
and set `ADMIN_PASSWORD` to anything you like, then restart `npm run dev`.

## What's here

- **Storefront** — home, shop (with category filters), product pages, cart,
  checkout. Product data starts as placeholders in `src/lib/seed-data.ts` —
  edit that file directly, or use the admin panel once it's connected to
  Supabase.
- **Checkout** — Cash on Delivery always works. Online payment (cards/UPI via
  Razorpay) switches on automatically once Razorpay keys are added.
- **Customer login** — email one-time-code login, switches on automatically
  once Supabase is connected.
- **Admin panel** (`/admin`) — add/edit/delete products, update stock, and
  manage order status. Password-protected via `ADMIN_PASSWORD`.
- **Data** — everything runs on a local JSON file by default (zero accounts
  needed). The moment Supabase credentials are set, the whole app reads and
  writes Supabase instead — see `src/lib/db.ts`.

## Project structure

```
src/app/            Pages and API routes (Next.js App Router)
src/components/      Shared UI components
src/lib/             Data layer, types, Supabase/Razorpay integration
src/lib/seed-data.ts Placeholder products — edit this to change what ships
supabase/schema.sql  Run this in Supabase once you create a project
```

## Deploying

See **SETUP.md** for the full walkthrough (Vercel + a domain + Supabase +
Razorpay). Short version: push this to GitHub, import it on
[vercel.com](https://vercel.com/new), add your environment variables from
`.env.local.example`, and deploy.
