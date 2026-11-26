import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, hasLocale } from "@/i18n/config";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/server/session";

/**
 * - /admin: only for the logged-in owner (everything else is sent to /admin/login).
 * - Shop: Arabic only, at clean addresses (/boutique, /produit/x). They are rewritten internally to the
 *   pages in src/app/[lang] (locale "ar"). Old /ar/... and /fr/... links redirect to the clean address.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1];

  if (first === "admin") {
    const isLogin = pathname === "/admin/login";
    const loggedIn = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
    let res: NextResponse;
    if (!loggedIn && !isLogin) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = pathname === "/admin" ? "" : `?next=${encodeURIComponent(pathname + request.nextUrl.search)}`;
      res = NextResponse.redirect(url);
    } else if (loggedIn && isLogin) {
      res = NextResponse.redirect(new URL("/admin", request.url));
    } else {
      res = NextResponse.next();
    }
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  }

  const url = request.nextUrl.clone();

  // Old prefixed links: /ar/... (Arabic) and /fr/... (French version, removed) → same page at the clean address.
  // Permanent (308) so search engines move their results to the clean addresses. Query string is kept.
  if (first === "fr" || hasLocale(first)) {
    url.pathname = pathname.slice(first.length + 1) || "/";
    return NextResponse.redirect(url, 308);
  }

  // Clean address (/boutique, /produit/x, /) → served by the Arabic pages in src/app/[lang]. The address bar does not change.
  url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip Next internals, API routes and any file with an extension (icons, images, fonts…)
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
