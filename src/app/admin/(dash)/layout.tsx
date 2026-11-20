import { requireAdmin } from "@/lib/server/auth";
import { DatabaseNotConfigured } from "@/lib/server/db";
import { orderCounts } from "@/lib/server/orders";
import AdminNav from "./AdminNav";

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  let newOrders = 0;
  let dbError: string | null = null;
  try {
    newOrders = (await orderCounts()).new;
  } catch (err) {
    dbError = err instanceof DatabaseNotConfigured ? err.message : "Impossible de joindre la base de données. Vérifiez DATABASE_URL.";
    if (!(err instanceof DatabaseNotConfigured)) console.error("[admin] database:", err);
  }

  return (
    <div className="min-h-dvh lg:flex">
      <AdminNav newOrders={newOrders} />
      <main className="min-w-0 flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-10">
        <div className="mx-auto max-w-6xl">
          {dbError ? (
            <div className="rounded-lg border border-sold/40 bg-white p-6">
              <h1 className="font-serif text-3xl">Base de données non connectée</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted">{dbError}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">Voir le README, section « Tableau de bord (admin) ».</p>
            </div>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
}
