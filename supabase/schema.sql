-- Gowdara Jayadevappa storefront -- Supabase schema
--
-- Run this once in your Supabase project's SQL Editor (Dashboard ->
-- SQL Editor -> New Query -> paste -> Run) after creating the project.
-- See SETUP.md for the full walkthrough.

create extension if not exists pgcrypto;

create table if not exists products (
  id text primary key default gen_random_uuid()::text,
  slug text unique not null,
  name text not null,
  category text not null,
  price numeric not null,
  compare_at_price numeric,
  description text not null default '',
  fabric text not null default '',
  color text not null default '',
  stock integer not null default 0,
  featured boolean not null default false,
  -- Photo URLs (from Supabase Storage), in display order. First = cover
  -- photo. Empty array means no real photo uploaded yet.
  images jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- If you ran this schema before the `images` column existed, this adds it
-- without touching anything else -- safe to re-run any time.
alter table products add column if not exists images jsonb not null default '[]'::jsonb;

create table if not exists orders (
  id text primary key default gen_random_uuid()::text,
  items jsonb not null,
  subtotal numeric not null,
  shipping numeric not null,
  total numeric not null,
  customer_name text not null,
  email text not null,
  phone text not null,
  address text not null,
  city text not null,
  state text not null,
  pincode text not null,
  payment_method text not null,
  status text not null default 'pending_payment',
  razorpay_order_id text,
  razorpay_payment_id text,
  notes text,
  created_at timestamptz not null default now()
);

-- Refund tracking, added alongside the Razorpay refund flow. Safe to
-- re-run on a database that already has the `orders` table.
alter table orders add column if not exists razorpay_refund_id text;
alter table orders add column if not exists refund_status text not null default 'none';

create index if not exists orders_email_idx on orders (lower(email));
create index if not exists products_category_idx on products (category);

-- Product reviews & star ratings.
create table if not exists reviews (
  id text primary key default gen_random_uuid()::text,
  product_id text not null references products(id) on delete cascade,
  author_name text not null,
  email text not null,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text not null default '',
  verified_purchase boolean not null default false,
  -- Photo URLs the reviewer attached (from Supabase Storage), in upload
  -- order. Empty array means no photos were attached.
  images jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists reviews_product_idx on reviews (product_id);
alter table reviews enable row level security;

-- If you ran this schema before the `images` column existed on reviews,
-- this adds it without touching anything else -- safe to re-run any time.
alter table reviews add column if not exists images jsonb not null default '[]'::jsonb;

-- "Notify me when back in stock" subscriptions. notified_at is set once an
-- email has gone out for a given restock -- left null means still waiting.
create table if not exists stock_notifications (
  id text primary key default gen_random_uuid()::text,
  product_id text not null references products(id) on delete cascade,
  email text not null,
  notified_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists stock_notifications_product_idx on stock_notifications (product_id);
alter table stock_notifications enable row level security;

-- Saved addresses for logged-in customers (tied to their Supabase auth
-- user, since there's no concept of "an account" without it).
create table if not exists addresses (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  customer_name text not null,
  phone text not null,
  address text not null,
  city text not null,
  state text not null,
  pincode text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists addresses_user_idx on addresses (user_id);
alter table addresses enable row level security;

-- Footer newsletter signups. Deliberately just an address list (export as
-- CSV from /admin/newsletter and paste into whatever email tool you use),
-- not a full marketing-email platform.
create table if not exists newsletter_subscribers (
  id text primary key default gen_random_uuid()::text,
  email text unique not null,
  created_at timestamptz not null default now()
);
create index if not exists newsletter_subscribers_email_idx on newsletter_subscribers (lower(email));
alter table newsletter_subscribers enable row level security;

-- Abandoned-cart snapshots for logged-in customers, taken when they load
-- the checkout page. A cron job (src/app/api/cron/abandoned-carts/route.ts,
-- wired up in vercel.json) emails anyone whose snapshot is old enough and
-- hasn't been reminded yet; the snapshot is cleared as soon as they place
-- an order. One row per customer -- a new checkout visit overwrites the
-- last snapshot rather than piling up history.
create table if not exists abandoned_carts (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  items jsonb not null,
  subtotal numeric not null,
  reminded_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists abandoned_carts_user_idx on abandoned_carts (user_id);
alter table abandoned_carts enable row level security;

-- Row Level Security: the app only ever reads/writes these tables from
-- the server using the service_role key (which bypasses RLS), never
-- directly from the browser with the anon key. Enabling RLS with no
-- policies means the anon/authenticated keys used client-side get zero
-- access to product or order rows, even if someone finds your anon key.
alter table products enable row level security;
alter table orders enable row level security;

-- Optional: seed a couple of categories' worth of starter products so the
-- store isn't empty the moment you switch over from local demo data. Feel
-- free to skip this and add real products from /admin/products instead.
-- (Want the full set of ~24 placeholder products back? Run
-- supabase/seed-demo-products.sql once, any time -- it's safe to re-run.)
insert into products (slug, name, category, price, description, fabric, color, stock, featured)
values
  ('royal-maroon-kanjivaram', 'Royal Maroon Kanjivaram', 'kanjivaram-silk', 12999,
   'A classic maroon Kanjivaram silk saree with a wide gold zari temple border.',
   'Pure Mulberry Silk', 'Maroon & Gold', 6, true)
on conflict (slug) do nothing;

-- Storage bucket for product photos uploaded from the admin panel. Marking
-- it public means uploaded photos are viewable by anyone with the URL (like
-- any normal storefront image) with no extra policy needed -- writes still
-- only happen server-side with the service_role key. Safe to re-run.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Storage bucket for photos customers attach to their reviews. Same
-- public-read / server-only-write setup as product-images above.
insert into storage.buckets (id, name, public)
values ('review-images', 'review-images', true)
on conflict (id) do nothing;
