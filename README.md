# AFNAR — Maison d'abayas

Online store for abayas in the Moroccan market, built with **Next.js 16 (App Router), TypeScript and Tailwind CSS v4**.

- **In Arabic (right-to-left)**, written for Muslim women. Prices in **درهم**, a list of Moroccan cities, and validation for Moroccan mobile numbers (06/07…)
- **Cash on delivery only**: no online payment
- **Orders are sent to the store's Telegram in the background**: the customer confirms on the site and goes straight to the thank-you page. Each Telegram order has a one-tap link to the customer's WhatsApp, with a confirmation message already written in their language.
- Colour and size selection on the product page. Unavailable products, colours and sizes are **grayed out and crossed with a red line**
- Minimalist luxury design: Cormorant Garamond + Jost, Moroccan arch frames, zellige star motif, hover and scroll animations

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill it in: database, admin password, Telegram (see below)
npm run dev                  # shop: http://localhost:3000 · admin: http://localhost:3000/admin
```

Production: `npm run build && npm start`. Hosted on Vercel (database: Neon Postgres, files: Vercel Blob).

## Admin dashboard (`/admin`)

Products, categories, reviews and orders are managed at **`/admin`** (in French, works on phone and computer), protected by one password.

- **Commandes:** every order placed on the site, newest first. Filter by status, search by reference, name, phone or city. On an order: one tap to confirm the customer on WhatsApp (pre-filled in her language), call her, move the order through *Nouvelle → Confirmée → Expédiée → Livrée*, or mark it *Annulée / Retournée*, and keep a private note.
- **Stock follows the orders:** a new order takes its pieces out of stock. *Annulée*, *Retournée* or deleting the order puts them back.
- **Produits:** create or edit products. Names and descriptions are in French and Arabic. Set the price and an optional crossed-out old price, the sizes, and the colours with their photos and stock per size. A product can be put online or hidden, featured on the home page, or given a "Nouveau" badge.
- **Catégories:** add, rename, reorder and delete. Each category can have a photo, otherwise an illustration is shown.
- **Avis:** add customer reviews with text, photos, a voice note or any mix. They can be published or kept as a draft.
- Every change appears on the shop immediately.

### Setting it up on Vercel (once)

1. **Database:** Vercel → your project → *Storage* → *Create* → **Neon (Postgres)** → connect it to the project. This adds `DATABASE_URL` automatically.
2. **Files (photos, voice notes):** *Storage* → *Create* → **Blob** → connect it. This adds `BLOB_READ_WRITE_TOKEN`.
3. **Password:** *Settings → Environment Variables* → add `ADMIN_PASSWORD` (a long password only you know).
4. Redeploy. The tables are created automatically on first start, and the original catalogue is imported if the database is empty.

**For local development**, copy `DATABASE_URL` and `BLOB_READ_WRITE_TOKEN` into `.env.local`, plus your `ADMIN_PASSWORD`.
- Use a separate Neon branch (e.g. `dev`) so tests don't touch real orders.
- Without `BLOB_READ_WRITE_TOKEN`, local uploads are saved in `public/uploads/`. That folder is only for testing; online, Blob is required.

Changing `ADMIN_PASSWORD` logs out every open session.

## Configuration

| What | Where |
|---|---|
| Store WhatsApp (contact links) | `NEXT_PUBLIC_WHATSAPP_NUMBER` in `.env.local` (format `2126XXXXXXXX`) |
| Database, uploads, admin password | `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `ADMIN_PASSWORD` in `.env.local` / Vercel |
| Where orders are sent (Telegram bot) | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` in `.env.local` |
| Telegram message and the customer's confirmation text | `src/lib/server/telegram.ts` |
| Delivery fees, free-delivery threshold, delivery times | `src/lib/config.ts` → `SHIPPING` |
| Products, categories, stock, reviews | Admin dashboard → `/admin` |
| Cities | `src/lib/cities.ts` |
| UI text (Arabic) | `src/i18n/dictionaries/ar.ts` |
| Colours and fonts | `src/app/globals.css` → `@theme` |

### Stock and availability
Each colour has a stock number for each size, edited in **Admin → Produits**.
- A **size** at 0 is crossed out for that colour.
- A **colour** with no stock in any size is crossed out and can't be selected.
- A **product** with no stock at all shows as "Épuisé" (sold out), crossed out and sorted to the end of the shop.

### Product photos
Add photos per colour in **Admin → Produits**. They are resized automatically before upload. The first photo is the front view; the second is the detail view, which also appears on hover in the shop. Until a colour has photos, the shop shows an illustration tinted in that colour.

## Language
The shop is **in Arabic only** (right-to-left), at clean addresses: `afnar.ma/boutique`, `afnar.ma/produit/...`.

- **Old links:** `/ar/...` and `/fr/...` links (from the time the site was bilingual) are permanently redirected to the same page at its clean address by `src/proxy.ts`, with filters kept.
- **UI text:** `src/i18n/dictionaries/ar.ts`. Its keys are listed in `types.ts` (TypeScript checks that none is missing).
- **Product and category text:** fill in the **Arabic fields** in the admin forms: they are what customers see. The French fields stay as your internal reference (dashboard, Telegram) and are only shown if an Arabic field is left empty. City names in Arabic are in `src/lib/cities.ts`.
- **For the team, French stays:** the admin dashboard and the Telegram order notice are in French. The WhatsApp confirmation sent to the customer is in Arabic.
- **Fonts:** Arabic text uses Amiri (titles) and Tajawal (body); the AFNAR logo and numbers keep Cormorant Garamond and Jost.
- **SEO:** each page declares its canonical URL.

## Pages
- `/`: home (hero, trust points, collections, featured pieces, La Maison, how to order)
- `/boutique`: shop with category filter (`?categorie=<category slug>`), sorting and an "in stock only" filter
- `/produit/[slug]`: product page (gallery, colours, sizes, size guide, quantity)
- `/commande`: checkout (cash on delivery + WhatsApp)
- `/merci`: order confirmation
- `/avis`: customer reviews (text, photos, voice notes)

And `/admin` for the dashboard (see above).

## How orders reach you (Telegram)
1. The customer fills in the checkout and taps **Confirmer la commande**.
2. The browser sends the cart and the customer details to `POST /api/order` ([src/app/api/order/route.ts](src/app/api/order/route.ts)).
3. The server checks everything again against the catalogue: prices, stock, city and Moroccan phone number. Prices sent by the browser are never trusted.
4. Your Telegram bot sends you the order ([src/lib/server/telegram.ts](src/lib/server/telegram.ts)):
   - the customer's phone number is a **wa.me link**,
   - a **✅ Confirmer sur WhatsApp** button sits under the message.

   Both open WhatsApp with the customer, with a confirmation message already written in Arabic: their name, the reference, the items, the total and the address. Tap Send and you're done.
5. The customer sees the thank-you page. If sending fails, they stay on the checkout with their cart, see a message and can try again. The full order is also written to the server logs.

Basic protection: 5 orders per 10 minutes per visitor, plus a hidden anti-spam field.

### Setting up the bot (once, about 3 minutes)
1. In Telegram, open **@BotFather**, send `/newbot`, choose a name (e.g. "AFNAR Commandes") and a username ending in `bot`. Copy the **token**.
2. Put it in `.env.local`: `TELEGRAM_BOT_TOKEN=...`
3. Open your new bot (link given by BotFather) and press **Start**.
4. Run `npm run telegram:chat-id`. It prints your id. Put it in `.env.local`: `TELEGRAM_CHAT_ID=...`
   - `npm run telegram:chat-id -- --test` also sends you a test message.
   - For a team: add the bot to a Telegram group, write in the group, run the command again and use the group's id (it starts with `-`). Several ids can be separated by commas.
5. Restart the site. When you deploy, add the same two variables in your hosting provider's settings (e.g. Vercel → Settings → Environment Variables).

Keep the token secret. Anyone who has it can send messages as your bot. If it leaks, use `/revoke` in @BotFather.
