import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, hasLocale, matchAcceptLanguage } from "@/i18n/config";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/server/session";

/**
 * - /admin: only for the logged-in owner (everything else is sent to /admin/login).
 * - Shop: every page lives under /fr or /ar. Requests without a locale prefix
 *   (e.g. old links to /boutique) are redirected to the visitor's language:
 *   saved choice (cookie) → browser language → French.
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

  if (hasLocale(first)) return;

  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = hasLocale(saved) ? saved : matchAcceptLanguage(request.headers.get("accept-language"));

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals, API routes and any file with an extension (icons, images, fonts…)
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
