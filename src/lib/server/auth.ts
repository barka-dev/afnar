import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "./session";

export async function isAdmin(): Promise<boolean> {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

/** For admin pages: sends visitors who aren't logged in to the login page. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

export class Unauthorized extends Error {
  constructor() {
    super("Session expirée : reconnectez-vous.");
  }
}

/** For server actions and API routes: throws when not logged in (every mutation checks this, not only the proxy). */
export async function assertAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new Unauthorized();
}
