import type { Metadata } from "next";
import LoginForm from "./LoginForm";
import { STORE } from "@/lib/config";
import { adminConfigured } from "@/lib/server/session";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <p dir="ltr" className="text-center font-serif text-4xl tracking-[0.38em] ps-[0.38em]">
          {STORE.name}
        </p>
        <p className="mt-2 text-center text-xs uppercase tracking-[0.3em] text-gold-dark">Administration</p>
        <div className="mt-8 rounded-lg border border-stone/70 bg-white p-6 shadow-sm">
          <LoginForm next={typeof next === "string" ? next : ""} configured={adminConfigured()} />
        </div>
      </div>
    </div>
  );
}
