/**
 * Admin session token: "<expiry>.<signature>", signed with HMAC-SHA256.
 * Web Crypto only, so it works in the proxy and in route handlers alike.
 *
 * The signing key comes from ADMIN_SESSION_SECRET, or from ADMIN_PASSWORD if that is not set —
 * so changing the password logs everyone out.
 */

export const SESSION_COOKIE = "afnar_admin";
export const SESSION_DAYS = 7;

const enc = new TextEncoder();

const b64url = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

export const adminConfigured = () => !!process.env.ADMIN_PASSWORD?.trim();

async function key(): Promise<CryptoKey | null> {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim() || process.env.ADMIN_PASSWORD?.trim();
  if (!secret) return null;
  return crypto.subtle.importKey("raw", enc.encode(`afnar-admin:${secret}`), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

async function sign(value: string): Promise<string | null> {
  const k = await key();
  return k ? b64url(await crypto.subtle.sign("HMAC", k, enc.encode(value))) : null;
}

/** Compares two strings in constant time (for equal lengths). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(): Promise<string> {
  const exp = String(Date.now() + SESSION_DAYS * 86_400_000);
  const sig = await sign(exp);
  if (!sig) throw new Error("ADMIN_PASSWORD is not set");
  return `${exp}.${sig}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  const expected = await sign(exp);
  return !!expected && safeEqual(sig, expected);
}

/** Checks the admin password without leaking its length or content through timing. */
export async function checkPassword(input: string): Promise<boolean> {
  const real = process.env.ADMIN_PASSWORD?.trim();
  if (!real || !input) return false;
  const [a, b] = await Promise.all([sign(`pw:${input}`), sign(`pw:${real}`)]);
  return !!a && !!b && safeEqual(a, b);
}
