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

-- Shop categories -- editable from /admin/categories. sort_order controls
-- the display order on the homepage "Shop by Category" tiles and the shop
-- page's filter pills; lower numbers show first.
create table if not exists categories (
  id text primary key default gen_random_uuid()::text,
  slug text unique not null,
  name text not null,
  description text not null default '',
  -- Cover photo (from the "category-images" Storage bucket below). Null
  -- means no photo uploaded yet -- the site shows a styled placeholder.
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table categories enable row level security;

-- Homepage hero banners -- editable from /admin/banners. These auto-slide
-- behind the homepage's top section; sort_order controls slide order
-- (lower first), reordered via that page's move-up/move-down buttons.
create table if not exists banners (
  id text primary key default gen_random_uuid()::text,
  -- Either a Supabase Storage URL (uploaded from /admin/banners) or a
  -- static /public path like /banners/banner-1.jpg (the two starter
  -- banners seeded below) -- either way it's just a URL the homepage
  -- renders directly.
  image_url text not null,
  alt_text text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table banners enable row level security;

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

-- Starter categories -- matches what the site shipped with before
-- categories moved into the database. Add, edit or reorder these any time
-- from /admin/categories; this insert only ever fills in what's missing.
insert into categories (slug, name, description, sort_order)
values
  ('kanjivaram-silk', 'Kanjivaram Silk', 'Temple-border silk sarees woven in Kanchipuram, rich with zari work.', 1),
  ('banarasi-silk', 'Banarasi Silk', 'Brocade sarees from Varanasi featuring intricate gold and silver zari.', 2),
  ('mysore-silk', 'Mysore Silk', 'Lightweight pure silk sarees known for their soft sheen and drape.', 3),
  ('cotton-sarees', 'Cotton Sarees', 'Breathable handloom cotton, perfect for everyday elegance.', 4),
  ('chiffon-georgette', 'Chiffon & Georgette', 'Flowing, lightweight sarees for parties and evening occasions.', 5),
  ('bridal-collection', 'Bridal Collection', 'Statement pieces for weddings and special occasions.', 6)
on conflict (slug) do nothing;

-- Starter homepage banners -- two of Om's real shop signage photos,
-- bundled as static files at /public/banners so the homepage slider has
-- something to show immediately. Replace, reorder or delete them any time
-- from /admin/banners; this insert only runs if the table is empty so it
-- never overwrites banners you've already changed.
insert into banners (image_url, alt_text, sort_order)
select * from (values
  ('/banners/banner-1.jpg', 'Gowdara Jayadevappa Silk Palace storefront banner', 1),
  ('/banners/banner-2.jpg', 'Gowdara Jayadevappa Silks & Sarees storefront banner', 2)
) as starter(image_url, alt_text, sort_order)
where not exists (select 1 from banners);

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

-- Storage bucket for category cover photos uploaded from
-- /admin/categories. Same public-read / server-only-write setup as
-- product-images above.
insert into storage.buckets (id, name, public)
values ('category-images', 'category-images', true)
on conflict (id) do nothing;

-- Storage bucket for homepage banner photos uploaded from /admin/banners.
-- Same public-read / server-only-write setup as product-images above.
insert into storage.buckets (id, name, public)
values ('banner-images', 'banner-images', true)
on conflict (id) do nothing;
