-- Gowdara Jayadevappa -- restore the full placeholder catalog
--
-- Run this once in Supabase's SQL Editor any time you want the original
-- ~24 demo sarees back in your store (e.g. if the store looks empty after
-- connecting Supabase, because schema.sql only seeds one starter product).
-- Safe to run more than once -- products are matched by slug, so this
-- never creates duplicates or overwrites products you've already edited or
-- added for real.
--
-- These are the same placeholder products from src/lib/seed-data.ts. Feel
-- free to edit, replace, or delete any of them from /admin/products
-- whenever you're ready with real products and photos.

insert into products (slug, name, category, price, compare_at_price, description, fabric, color, stock, featured)
values
  ('royal-maroon-kanjivaram', 'Royal Maroon Kanjivaram', 'kanjivaram-silk', 12999, 15999,
   'A classic maroon Kanjivaram silk saree with a wide gold zari temple border and contrast pallu. Woven by master weavers in Kanchipuram.',
   'Pure Mulberry Silk', 'Maroon & Gold', 6, true),

  ('emerald-green-kanjivaram', 'Emerald Green Kanjivaram', 'kanjivaram-silk', 13499, null,
   'Deep emerald green Kanjivaram with a checkered pallu and traditional peacock motifs in zari.',
   'Pure Mulberry Silk', 'Emerald Green', 4, true),

  ('mustard-yellow-kanjivaram', 'Mustard Yellow Kanjivaram', 'kanjivaram-silk', 11999, 13999,
   'Bright mustard yellow saree with a maroon temple border, ideal for festive occasions.',
   'Pure Mulberry Silk', 'Mustard Yellow', 5, false),

  ('royal-blue-kanjivaram', 'Royal Blue Kanjivaram', 'kanjivaram-silk', 14499, null,
   'Rich royal blue Kanjivaram with a contrasting coral pallu and gold zari border.',
   'Pure Mulberry Silk', 'Royal Blue', 3, false),

  ('banarasi-rani-pink', 'Banarasi Rani Pink', 'banarasi-silk', 9999, 11999,
   'Rani pink Banarasi silk saree with an all-over gold butta weave and heavy zari pallu.',
   'Banarasi Katan Silk', 'Rani Pink', 7, true),

  ('banarasi-ivory-gold', 'Banarasi Ivory & Gold', 'banarasi-silk', 10999, null,
   'Elegant ivory Banarasi saree with dense gold zari brocade, perfect for receptions.',
   'Banarasi Katan Silk', 'Ivory & Gold', 5, false),

  ('banarasi-wine-red', 'Banarasi Wine Red', 'banarasi-silk', 10499, 12499,
   'Wine red Banarasi silk with a jaal pattern and a richly woven gold pallu.',
   'Banarasi Katan Silk', 'Wine Red', 4, false),

  ('banarasi-peacock-teal', 'Banarasi Peacock Teal', 'banarasi-silk', 10999, null,
   'Peacock teal Banarasi saree with a contrasting magenta border and floral motifs.',
   'Banarasi Katan Silk', 'Peacock Teal', 6, false),

  ('mysore-silk-classic-purple', 'Mysore Silk Classic Purple', 'mysore-silk', 6999, 7999,
   'Lightweight pure Mysore silk in a deep purple with a slim gold border -- easy to drape and carry all day.',
   'Pure Mysore Silk', 'Purple', 8, true),

  ('mysore-silk-sunset-orange', 'Mysore Silk Sunset Orange', 'mysore-silk', 7299, null,
   'Sunset orange Mysore silk saree, soft and glossy with a simple zari border.',
   'Pure Mysore Silk', 'Sunset Orange', 5, false),

  ('mysore-silk-teal-blue', 'Mysore Silk Teal Blue', 'mysore-silk', 6799, 7599,
   'Teal blue Mysore silk with a delicate silver zari border and plain pallu.',
   'Pure Mysore Silk', 'Teal Blue', 9, false),

  ('mysore-silk-blush-pink', 'Mysore Silk Blush Pink', 'mysore-silk', 7099, null,
   'Soft blush pink Mysore silk with a fine gold border, understated and elegant.',
   'Pure Mysore Silk', 'Blush Pink', 6, false),

  ('handloom-cotton-indigo-check', 'Handloom Cotton Indigo Check', 'cotton-sarees', 1899, 2299,
   'Everyday indigo checked handloom cotton saree, soft and breathable.',
   'Handloom Cotton', 'Indigo', 12, true),

  ('handloom-cotton-white-red-border', 'Handloom Cotton White & Red Border', 'cotton-sarees', 1699, null,
   'Crisp white handloom cotton with a classic red temple border.',
   'Handloom Cotton', 'White & Red', 15, false),

  ('handloom-cotton-mustard-stripe', 'Handloom Cotton Mustard Stripe', 'cotton-sarees', 1799, 1999,
   'Mustard striped handloom cotton saree, light and easy for daily wear.',
   'Handloom Cotton', 'Mustard', 10, false),

  ('handloom-cotton-olive-green', 'Handloom Cotton Olive Green', 'cotton-sarees', 1899, null,
   'Olive green handloom cotton with a thin black border, minimal and versatile.',
   'Handloom Cotton', 'Olive Green', 11, false),

  ('georgette-dusty-rose', 'Georgette Dusty Rose', 'chiffon-georgette', 3499, 3999,
   'Dusty rose georgette saree with delicate sequin work, light for evening wear.',
   'Georgette', 'Dusty Rose', 8, true),

  ('chiffon-midnight-black', 'Chiffon Midnight Black', 'chiffon-georgette', 3299, null,
   'Midnight black chiffon saree with a subtle silver border, flowy drape.',
   'Chiffon', 'Midnight Black', 7, false),

  ('georgette-lavender-floral', 'Georgette Lavender Floral', 'chiffon-georgette', 3599, 3999,
   'Lavender georgette with a printed floral pattern and lace border.',
   'Georgette', 'Lavender', 6, false),

  ('chiffon-sea-green', 'Chiffon Sea Green', 'chiffon-georgette', 3199, null,
   'Sea green chiffon saree, plain body with a sequinned border.',
   'Chiffon', 'Sea Green', 9, false),

  ('bridal-red-kanjivaram', 'Bridal Red Kanjivaram', 'bridal-collection', 24999, 28999,
   'Heavy bridal red Kanjivaram silk with dense gold zari work covering the body and pallu.',
   'Pure Mulberry Silk', 'Bridal Red', 2, true),

  ('bridal-maroon-gold-banarasi', 'Bridal Maroon & Gold Banarasi', 'bridal-collection', 21999, null,
   'Maroon and gold heavy Banarasi bridal saree with a richly worked pallu.',
   'Banarasi Katan Silk', 'Maroon & Gold', 3, false),

  ('bridal-champagne-gold', 'Bridal Champagne Gold', 'bridal-collection', 23499, 26999,
   'Champagne gold bridal silk saree with fine zari and stone work border.',
   'Pure Silk', 'Champagne Gold', 2, false),

  ('bridal-deep-magenta', 'Bridal Deep Magenta', 'bridal-collection', 22999, null,
   'Deep magenta bridal silk saree with a heavily embroidered gold pallu.',
   'Pure Silk', 'Deep Magenta', 3, false)

on conflict (slug) do nothing;
