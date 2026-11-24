# CLAUDE.md

AFNAR: a bilingual (French / Arabic RTL) abaya store for Morocco, with an admin dashboard. Cash on delivery only; orders are saved in Postgres and pushed to the owner's Telegram. `README.md` is the owner-facing guide (setup, Telegram bot, Vercel); this file is for working on the code.

## Stack

- **Next.js 16** (App Router), **React 19**, **TypeScript 7** (strict), **Tailwind CSS v4** (configured in CSS via `@theme` in `src/app/globals.css`; there is no `tailwind.config`).
- **Postgres** via the `postgres` npm package (Neon on Vercel). No ORM, no migration tool.
- **Vercel Blob** for uploaded photos and voice notes.
- Path alias: `@/*` → `src/*`.

## Commands

```bash
npm run dev                 # shop: http://localhost:3000, admin: /admin
npm run build               # production build
npm run lint                # = tsc --noEmit (the only check; there are no tests and no ESLint)
npm run telegram:chat-id    # prints the Telegram chat id for TELEGRAM_BOT_TOKEN (add `-- --test` to send a test message)
```

Run `npm run lint` after changes. Both `package-lock.json` and `pnpm-lock.yaml` exist; npm is what the README uses.

### Windows gotchas
- **Run `next build` from PowerShell, not Git Bash.** From Bash the cwd gets a lowercase `c:\`, React is loaded twice, and prerendering fails with "Invalid hook call / reading 'useContext'". Use: `Set-Location C:\Users\abdel\Downloads\afnar-store\afnar; $env:NODE_ENV='production'; npx next build`.
- Source files are UTF-8 with lots of accented and Arabic text. Windows PowerShell 5.1 `Get-Content` shows mojibake unless you pass `-Encoding utf8`. When editing, keep the file UTF-8.

## Environment (`.env.local`, see `.env.example`)

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Required. Without it, `db()` throws `DatabaseNotConfigured`. Use a separate Neon branch for development. |
| `ADMIN_PASSWORD` | Admin login. Also the session signing key unless `ADMIN_SESSION_SECRET` is set, so changing it logs everyone out. |
| `BLOB_READ_WRITE_TOKEN` | Uploads. Without it, dev saves to `public/uploads/` (gitignored); production refuses uploads. |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Order notifications; chat id can be a comma-separated list. If unset: dev logs orders to the terminal, production refuses them. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Store WhatsApp for contact links (`2126XXXXXXXX`). |
| `SITE_URL` | Optional; base for the dashboard link in Telegram messages. |

## Layout

```
src/
  proxy.ts                 Next 16 "proxy" (formerly middleware): admin auth gate + locale redirect
  app/
    [lang]/                The shop, every page under /fr or /ar
      layout.tsx           Root <html> per locale; loads catalogue from DB into CatalogProvider
      page.tsx             Home
      boutique/            Shop (?categorie=<slug>, sorting, in-stock filter)
      produit/[slug]/      Product page
      commande/            Checkout (CheckoutForm → POST /api/order)
      merci/               Thank-you page (reads last order from sessionStorage)
      avis/                Reviews
      echange/             Exchange policy (uses EXCHANGE in lib/config.ts)
      [...rest]/           Catch-all → localized 404
    admin/                 Dashboard (French only, no [lang])
      (dash)/              Authenticated pages: commandes, produits, categories, avis + dashboard charts
      login/
      actions.ts           ALL admin mutations, as server actions
      _ui/                 Shared admin UI, formatting, client upload helper
    api/order/route.ts     Public order endpoint
    api/admin/upload/      Upload token (Blob) or local-file upload (dev)
  components/              Shop UI (Header, Footer, CartDrawer, ProductCard, reviews/…)
  context/                 CartContext (localStorage "afnar-cart-v1"), CatalogContext
  i18n/                    config.ts (locales), index.ts (helpers), I18nProvider (useI18n), dictionaries/
  lib/                     Shared types & pure helpers (client-safe)
    config.ts              STORE, SHIPPING (fees, free threshold, delays), EXCHANGE
    products.ts            Catalogue types, SIZES, CUTS, stock helpers, size guide
    order.ts, order-status.ts, cities.ts, format.ts, reviews.ts
    server/                Server-only modules (`import "server-only"`)
      db.ts                Connection + schema creation + first-run seeding
      catalog.ts           Row mappers, uncached reads (admin), cached reads (shop)
      orders.ts            Order CRUD and stock reservation
      auth.ts, session.ts  Admin session (HMAC-signed cookie, Web Crypto)
      telegram.ts          Telegram message + customer WhatsApp confirmation text
      seed-data.ts         Original catalogue, imported into an empty database
```

## How things work

### Database
- No migrations: `migrate()` in `src/lib/server/db.ts` runs `create table if not exists …` on first `db()` call, under a Postgres advisory lock, and seeds from `seed-data.ts` if `categories` is empty. **To change the schema, edit `migrate()`** and make it idempotent (e.g. `alter table … add column if not exists`), since existing databases already have the tables.
- Tables: `categories`, `products`, `reviews`, `orders`. Nested data is `jsonb`: product `colors` (each with `name`, `nameAr`, `hex`, `images`, `stock` per size), `sizes`, `details`, `ar` (Arabic copy); order `lines` and `history`.
- Always `await db()` to get the `sql` tag. Map rows with `toProduct` / `toCategory` / `toReview` / `toOrder`; DB columns are snake_case, TS types camelCase.
- `prepare: false` is required for Neon's pooler; keep it.

### Caching
- The shop reads through `getProducts` / `getCategories` / `getReviews` (`unstable_cache`, tags `TAGS.catalog` and `TAGS.reviews` in `catalog.ts`). The admin uses the uncached `read*` functions.
- After any mutation that affects the shop, call `refreshShop([...tags])` in `admin/actions.ts` (it calls `updateTag` and `revalidatePath("/", "layout")`). The order API calls `revalidateTag(TAGS.catalog)` because stock changes.

### Stock
- Stock lives per colour per size inside `products.colors[].stock`. A colour's French `name` is its id in the cart and in orders.
- `createOrder` reserves stock in a transaction (`moveStock`, rows locked `for update`). Moving an order to `cancelled` / `returned` (`RELEASES_STOCK`) or deleting it gives the stock back; leaving those states takes it again.

### Orders (`POST /api/order`)
The browser sends only slugs, colours, sizes, quantities and customer details. The server re-validates everything against the DB (prices, stock, city in `MOROCCAN_CITIES`, Moroccan phone via `normalizeMoroccanPhone`), computes shipping with `shippingFee`, saves the order, then notifies Telegram. It succeeds if either the DB save or the Telegram send works. Spam protection: honeypot field `website` plus an in-memory rate limit (5 per 10 min per IP). **Never trust client prices.**

### Admin auth
- `src/proxy.ts` redirects unauthenticated `/admin/*` requests to `/admin/login`, and sets `noindex` / `no-store` headers.
- The proxy alone is not enough: every server action goes through `guarded()`, which calls `assertAdmin()`, and API routes check `isAdmin()`. Keep that pattern for new mutations.
- Admin UI text is French only (`STATUS_LABEL` etc.); it does not use the i18n dictionaries.

### i18n
- Locales: `fr` (default, LTR) and `ar` (RTL), in `src/i18n/config.ts`. The proxy redirects paths without a locale using the cookie `afnar-locale`, then `Accept-Language`, then French.
- `dictionaries/fr.ts` is the source of truth and exports the `Dictionary` type; `ar.ts` must match it (tsc enforces this). Some entries are functions for interpolation, e.g. `t.shipping.hours(n)`. **Add every new UI string to both files.**
- Server components: `getDictionary(lang)`. Client components: `const { t, locale, dir, price, href } = useI18n()`.
- Internal links must keep the locale: `href("/boutique")` on the client, `localePath(locale, path)` on the server. Pages set `alternates(lang, "/path")` in `generateMetadata` for canonical URLs and hreflang.
- Product and category copy: French fields plus `nameAr`, `descriptionAr` and the `ar` jsonb object. Telegram/WhatsApp order text for the team stays in French; the customer's confirmation is in their language.
- Prices and dates go through `formatPrice` / `formatDate` (deterministic, so no hydration mismatch). Don't use `toLocaleString`.
- RTL: prefer logical Tailwind utilities (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`) over `ml-` / `left-`.

### Next 16 conventions used here
- `params` and `searchParams` are Promises: `const { lang } = await params`. Pages and layouts use the global `PageProps<"/[lang]/…">` / `LayoutProps<"/[lang]">` types.
- Every `[lang]` page validates with `hasLocale(lang)` and calls `notFound()` otherwise.
- Middleware is `src/proxy.ts` (exported `proxy` function), not `middleware.ts`.

### Styling
- Design tokens are in `@theme` in `globals.css`: colours `ivory`, `sand`, `stone`, `ink`, `muted`, `gold`, `gold-dark`, `sold` (red for sold out); fonts `font-serif` (Cormorant Garamond / Amiri) and `font-sans` (Jost / Tajawal). Fonts are self-hosted with `@fontsource`, imported in `[lang]/layout.tsx`.
- Products without photos fall back to an SVG illustration (`AbayaArt`), picked by `cut` and tinted with the colour's `hex`.
- Remote images are allowed only from `*.public.blob.vercel-storage.com` (`next.config.ts`).

## Where to change common things

| Change | File |
|---|---|
| Delivery fees, free-delivery threshold, delays | `src/lib/config.ts` → `SHIPPING` |
| Exchange policy numbers | `src/lib/config.ts` → `EXCHANGE` (wording in the dictionaries' `exchange` block) |
| Cities and their Arabic names | `src/lib/cities.ts` |
| Shop UI text | `src/i18n/dictionaries/fr.ts` and `ar.ts` |
| Telegram / WhatsApp message formats | `src/lib/server/telegram.ts` |
| Order statuses and their labels | `src/lib/order-status.ts` |
| Available sizes, size guide | `src/lib/products.ts` |
| Products, categories, reviews, stock | Data in the DB, edited through `/admin`, not in code |
