# Setup Guide — Gowdara Jayadevappa

This walks you from "I have this code" to "my store is live on my own
domain." No coding required — just creating accounts, clicking the buttons
this guide points to, and filling in a few blanks. Do the sections in
order; each one builds on the last.

The site already works right now with demo products and Cash-on-Delivery
only. Sections 4 onward are optional and additive — skip Resend, Razorpay,
or the extras for as long as you like and the store still works.

---

## 1. Put the site on the internet (Vercel)

**What you need:** a GitHub account (free) and a Vercel account (free).

1. Go to [github.com](https://github.com) and create an account if you
   don't have one.
2. Click the **+** in the top right → **New repository**. Name it
   `gowdara-jayadevappa`, keep it Private, click **Create repository**.
3. On the next page, click **uploading an existing file**. Drag the entire
   project folder you were given into the upload box (or the files inside
   it — GitHub will keep the folder structure). Click **Commit changes**.
   - Don't upload the `node_modules` folder if you see one — it's large
     and gets rebuilt automatically. Everything else should go up.
4. Go to [vercel.com](https://vercel.com) and sign up using your GitHub
   account (this makes the next step one click).
5. Click **Add New → Project**, find `gowdara-jayadevappa` in the list, and
   click **Import**.
6. Leave all settings as default and click **Deploy**. In about a minute,
   Vercel gives you a live URL like `gowdara-jayadevappa.vercel.app` — open
   it, that's your store, live on the internet.

Every time you (or I) push a change to GitHub, Vercel automatically
redeploys it — no extra steps.

**Once you have that live URL, come back and do this one thing** (it's
quick, and several other features quietly depend on it):

7. In Vercel, **Settings → Environment Variables**, add
   `NEXT_PUBLIC_SITE_URL` = your live URL, exactly as shown (e.g.
   `https://gowdara-jayadevappa.vercel.app`, no trailing slash). Redeploy.
   - This is what search engines' sitemap, Google/social preview links,
     and every link inside emails (order confirmations, cancellation
     alerts, back-in-stock, abandoned-cart reminders) use to build a real,
     working URL. Leave it unset and those all quietly point at
     `localhost:3000` instead — the site still works, but those links go
     nowhere for anyone else.
   - If you buy a custom domain later (section 6), update this to the new
     domain and redeploy again.

## 2. Turn on the admin panel

1. In your Vercel project, go to **Settings → Environment Variables**.
2. Add one: `ADMIN_PASSWORD` = any password you choose.
3. Go to **Deployments**, click the **···** menu on the latest deployment,
   and click **Redeploy** (environment variables only take effect after a
   redeploy).
4. Visit `your-site.vercel.app/admin` and log in with that password. From
   here you can add/edit products, update stock, and manage orders.

## 3. Connect a database + customer login (Supabase)

Without this, the store still works — it just stores products/orders in a
temporary file instead of a real database, and customer login shows "not
connected yet." This step makes both permanent and turns on login.

1. Go to [supabase.com](https://supabase.com), sign up, click
   **New Project**. Pick any name and a database password (save it
   somewhere), choose a region close to India (e.g. Mumbai/Singapore), and
   create it. It takes a minute or two to provision.
2. Once it's ready, open **SQL Editor** in the left sidebar → **New query**.
   Open the file `supabase/schema.sql` from this project, copy its entire
   contents, paste into the editor, and click **Run**. This creates the
   products/orders/reviews/newsletter/abandoned-cart tables and the photo
   storage buckets.
   - Already connected Supabase before and just updated the code? Re-run
     `schema.sql` again — it's written to be safe to run more than once,
     and will just add whatever's new without touching your existing
     products or orders. **If you've been developing locally with
     Supabase already connected, re-run it now** — a few features added
     recently (reviews with photos, the newsletter signup, abandoned-cart
     reminders) each added a table, and won't work until you do.
3. Go to **Settings → API**. You'll need three values from this page:
   - **Project URL**
   - **anon public** key
   - **service_role** key (click "Reveal" — keep this one secret)
4. Back in Vercel, **Settings → Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = the Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the anon public key
   - `SUPABASE_SERVICE_ROLE_KEY` = the service_role key
5. Redeploy (same **···** → **Redeploy** step as before).
6. Turn on email OTP login: in Supabase, go to
   **Authentication → Sign In / Providers → Email**, and make sure email
   sign-in is enabled. Supabase's dashboard changes its wording from time
   to time — look for anything mentioning "OTP" or "one-time code" for
   email and make sure it's on (rather than only "magic link").
7. **Tell Supabase about your live domain.** This step is easy to miss and
   the failure is confusing when you do (customer login silently sends
   people to `localhost` instead of your real site). In Supabase, go to
   **Authentication → URL Configuration**:
   - Set **Site URL** to your live URL (the same one you put in
     `NEXT_PUBLIC_SITE_URL` above).
   - Under **Redirect URLs**, add your live URL followed by `/**` (e.g.
     `https://gowdara-jayadevappa.vercel.app/**`) — this is a wildcard
     allowlist Supabase checks the magic-link redirect against; without an
     entry matching your live domain here, Supabase blocks the redirect.
   - Keep the `localhost:3000/**` entry too (don't delete it) so login
     still works when you're developing locally.
   - If you later add a custom domain (section 6), come back and add that
     domain here as well — old entries don't need to be removed.

Once redeployed, your admin panel and customer accounts now use this
Supabase database, and it'll keep working even if the site is redeployed or
moved.

### Getting your placeholder products back

The store ships with ~24 placeholder sarees so it's never empty — but those
live in a local demo file, not in Supabase. The moment Supabase is
connected, the store switches over to Supabase's (empty, except for one
starter product) tables instead, which is why it can look like all your
products vanished.

If you want those placeholder products in Supabase too (as a starting
point to edit or delete from `/admin/products`), run
`supabase/seed-demo-products.sql` once in the same SQL Editor — safe to run
any time, and it won't duplicate or overwrite anything you've already added
or changed.

### Adding product photos

Once Supabase is connected, the "Add Product" and "Edit Product" pages in
`/admin/products` have a **Photos** section — pick one or more image files
(JPG/PNG, up to 5MB each) and they upload immediately; the first photo
becomes the product's cover image everywhere on the site. Uploaded photos
are stored in the `product-images` bucket that `schema.sql` creates for
you, so no extra Supabase setup is needed.

Without Supabase connected, photo uploads still work for trying things out
locally, but save to a folder on whatever machine is running the site
rather than to permanent storage — connect Supabase before uploading real
product photos.

### Letting specific emails log straight into the admin panel

By default the admin panel only has one door in: the shared password from
step 2. Once Supabase is connected, you can also let specific email
addresses skip the password entirely — they just log in at `/login` like
any customer, and the site recognizes them as an admin automatically.

1. In Vercel, **Settings → Environment Variables**, add `ADMIN_EMAILS` with
   one or more email addresses, separated by commas — e.g.
   `owner@gowdarajayadevappa.in,manager@example.com`.
2. Redeploy.
3. That email now logs in at `/login` with a one-time code, same as any
   customer. Once logged in, an "Open Admin Panel" button shows up on their
   "My Account" page, and visiting `/admin` directly works too.

The shared `ADMIN_PASSWORD` login still works alongside this — use whichever
is more convenient. This is entirely optional; skip it and the password
login keeps working exactly as before.

### Turning on phone (SMS) login

The login page already has a "Phone" tab alongside "Email" — but unlike
email, Supabase doesn't send SMS itself. You need to connect a paid SMS
provider through Supabase first, or the phone tab will show an error when
someone tries to use it.

1. Pick an SMS provider Supabase supports (Twilio, MessageBird, Vonage, or
   Twilio Verify — check Supabase's current list, as this changes). For
   sending OTPs to Indian numbers specifically, look into whether your
   chosen provider needs India's DLT (sender-ID) registration — this is a
   regulatory step some providers handle for you and others don't, and it's
   worth confirming with the provider *before* signing up, since it can
   take a few days.
2. Create an account with that provider and get its API credentials (exact
   fields vary by provider — Twilio needs an Account SID, Auth Token, and a
   phone/Messaging Service ID, for example).
3. In Supabase: **Authentication → Sign In / Providers → Phone**, enable
   it, pick your provider, and paste in its credentials.
4. That's it — no redeploy needed on your side, since this only changes
   settings inside Supabase, not your environment variables.

Until this is set up, keep the "Email" tab as the primary login method —
it works out of the box the moment Supabase is connected.

## 4. Turn on order and account emails (Resend)

Without this, the site works completely normally — orders still place
fine — but nobody actually receives an email: no order confirmation, no
shipping/status update, no back-in-stock alert, no abandoned-cart
reminder, and no alert to you when an order comes in or a cancellation is
requested. This step turns all of those on at once, through one free
email service (Resend).

Note: this is separate from Supabase's own login emails (the one-time
code/magic link customers get when logging in) — if you already connected
Resend as Supabase's custom SMTP provider for that, this is an additional,
independent step for the *app's own* emails.

1. Go to [resend.com](https://resend.com), sign up for a free account.
2. Go to **API Keys → Create API Key**, give it any name, copy the key
   (it's only shown once).
3. In Vercel, **Settings → Environment Variables**, add:
   - `RESEND_API_KEY` = the key you just copied.
   - `RESEND_FROM_EMAIL` = `onboarding@resend.dev` to start — this works
     immediately with zero setup, but Resend only lets you send *to your
     own inbox* (the one you signed up with) until you verify a domain.
     Once you're ready for real customers to receive these emails, verify
     your own domain in Resend (**Domains → Add Domain**, then add the DNS
     records it shows you — same idea as section 6 below) and change this
     to something like `orders@gowdarajayadevappa.in`.
4. Redeploy.

That's the one thing genuinely required. Two more are optional, both
default to a sensible fallback if you skip them:

- `ERROR_ALERT_EMAIL` — where you get emailed if something breaks on the
  live site (a real-time bug alert, not a customer-facing thing). Defaults
  to the store's own contact address if you don't set it.
- `ADMIN_ORDER_EMAIL` — where the "new order placed" / "cancellation
  requested" alerts (added most recently) go. Also defaults to the store's
  own contact address. Set this if you'd rather those land in a different
  inbox than error alerts — e.g. a shared shop inbox for orders, your own
  personal inbox for bugs.

## 5. Turn on real payments (Razorpay)

Without this, checkout always uses Cash on Delivery. This step adds online
payment (cards, UPI, netbanking). Razorpay requires HTTPS, which you
already have automatically once the site is on Vercel (step 1) — so this
is ready to set up any time after that.

1. Go to [razorpay.com](https://razorpay.com), sign up for a free account.
2. Complete their KYC (business details, bank account, PAN) — this is
   Razorpay's legal requirement before you can accept real payments, and
   can take a day or two to get approved. You can test everything before
   approval using their test mode.
3. In the Razorpay Dashboard, go to **Settings → API Keys → Generate Key**.
   Copy the **Key Id** and **Key Secret**.
4. In Vercel, **Settings → Environment Variables**, add:
   - `RAZORPAY_KEY_ID` = the Key Id
   - `RAZORPAY_KEY_SECRET` = the Key Secret
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID` = the same Key Id again
5. Redeploy. Checkout now offers "Pay Online" alongside Cash on Delivery.

Start with Razorpay's **test mode** keys first (no real money moves) to try
the full flow, then switch to **live mode** keys once your KYC is approved.

## 6. Point your own domain at it

1. Buy a domain from [namecheap.com](https://namecheap.com),
   [godaddy.com](https://godaddy.com), or similar — a `.in` or `.com`
   domain typically runs ₹500–1,200/year.
2. In Vercel, open your project → **Settings → Domains** → enter your
   domain → **Add**.
3. Vercel shows you one or two DNS records to add (usually an A record and
   a CNAME). Log into your domain registrar, find **DNS settings** /
   **Manage DNS**, and add exactly what Vercel showed you.
4. Wait 10 minutes to a few hours for it to take effect (Vercel's page will
   show a green checkmark once it's live). Your store is now reachable at
   your own domain.
5. Update `NEXT_PUBLIC_SITE_URL` in Vercel to the new domain and redeploy
   (see the callout at the end of section 1).
6. Add the new domain to Supabase's **Redirect URLs** too (see step 7 in
   section 3) — otherwise customer login breaks the moment you switch over,
   since Supabase is still only expecting the old `vercel.app` address.

## 7. Optional extras

Everything below is genuinely optional — the store is fully functional
without any of it.

### Google Analytics (traffic/conversion tracking)

Completely inactive (no script, no cookies, nothing sent anywhere) until
you set this. To turn it on: create a free GA4 property at
[analytics.google.com](https://analytics.google.com), find its
**Measurement ID** (looks like `G-XXXXXXX`), and add
`NEXT_PUBLIC_GA_MEASUREMENT_ID` in Vercel with that value. Redeploy.

### Abandoned-cart reminder emails

This needs three things, all already covered above if you've done steps 3
and 4 — plus one more:

- Supabase connected (step 3) and `schema.sql` re-run (it added the table
  this feature needs).
- Resend connected (step 4), since the reminder is an email.
- `CRON_SECRET` — add this in Vercel with any random string you like (it's
  just a password protecting the reminder-sending endpoint from strangers
  on the internet). Without it, the reminder silently never sends, which
  is safe but means the feature does nothing.

The reminder is sent automatically by Vercel's own scheduler (already
configured in this project's `vercel.json`, hourly) — nothing more to set
up on your side once `CRON_SECRET` is added. One thing worth checking once
you're live: Vercel's free/Hobby plan has, in the past, limited how often a
scheduled job can run (sometimes once a day rather than hourly) — check
your plan's current cron limits in Vercel's docs after deploying, and
loosen `vercel.json`'s schedule if hourly isn't available on your plan.

This only actually fires once deployed — Vercel's scheduler doesn't run
while you're developing locally with `npm run dev`, so there's nothing to
test until this step is live.

---

## If something doesn't work

- **Admin login says "ADMIN_PASSWORD is not set"** — you haven't added it
  in Vercel yet, or forgot to redeploy after adding it.
- **Logging in with an email in `ADMIN_EMAILS` doesn't open the admin
  panel** — double check Supabase is connected (step 3) and that the email
  is spelled exactly the same (comma-separated, no spaces needed) as the
  one you log in with, then redeploy after adding/editing the variable.
- **Customer login page says "not connected yet"** — Supabase env vars
  aren't set, or weren't followed by a redeploy.
- **Customer clicks the login link in their email and lands on a broken
  `localhost` page, or gets an error, instead of your live site** —
  Supabase's **Redirect URLs** doesn't have your live domain in it yet;
  see step 7 in section 3.
- **The store looks empty after connecting Supabase** — expected the first
  time; see "Getting your placeholder products back" above, or just add
  real products from `/admin/products`.
- **Uploading a product photo fails** — make sure you've re-run the latest
  `supabase/schema.sql` (it creates the storage buckets the uploads need).
- **`/admin/newsletter` (or anything abandoned-cart related) shows a raw
  error/crash** — same fix, re-run the latest `supabase/schema.sql` (it
  added those tables).
- **No emails are going out at all** (order confirmations, status updates,
  admin alerts) — `RESEND_API_KEY`/`RESEND_FROM_EMAIL` aren't set, or
  weren't followed by a redeploy; see section 4.
- **Emails send, but only to your own inbox, never to customers** —
  expected until you verify your own domain in Resend; see section 4,
  step 3.
- **Sitemap, social-share previews, or links inside emails point at
  `localhost:3000`** — `NEXT_PUBLIC_SITE_URL` isn't set to your live URL;
  see the callout at the end of section 1.
- **Checkout only shows Cash on Delivery** — same idea, for the three
  Razorpay variables (section 5).
- Anything else — come back here and describe what you're seeing; I can
  help debug it directly.
