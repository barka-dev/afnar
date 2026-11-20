import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { readReviews } from "@/lib/server/catalog";
import { PageHeader } from "../../_ui/ui";
import { longDate } from "../../_ui/format";
import PublishToggle from "./PublishToggle";

export const metadata: Metadata = { title: "Avis" };
export const dynamic = "force-dynamic";

export default async function ReviewsAdminPage() {
  const reviews = await readReviews();
  return (
    <>
      <PageHeader
        title="Avis clientes"
        subtitle={`${reviews.length} avis · ${reviews.filter((r) => r.published).length} publiés`}
        actions={
          <Link href="/admin/avis/nouveau" className="inline-flex min-h-10 items-center rounded-md bg-ink px-4 text-sm text-ivory hover:bg-gold-dark">
            + Nouvel avis
          </Link>
        }
      />

      {reviews.length === 0 ? (
        <p className="rounded-lg border border-dashed border-stone bg-white/60 px-6 py-16 text-center text-sm leading-relaxed text-muted">
          Aucun avis pour le moment. Quand une cliente vous envoie un message, une photo ou un vocal sur WhatsApp, ajoutez-le ici
          <br />
          (avec son accord) : il apparaîtra sur la page « Avis » et sur l&apos;accueil.
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {reviews.map((r) => {
            const photo = r.photos?.find((p) => "src" in p);
            return (
              <li key={r.id} className="relative flex gap-3 rounded-lg border border-stone/70 bg-white p-4 hover:border-ink">
                {photo && "src" in photo && (
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded bg-sand">
                    <Image src={photo.src} alt="" fill sizes="64px" className="object-cover" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/admin/avis/${r.id}`} className="truncate after:absolute after:inset-0" dir="auto">
                      {r.name}
                    </Link>
                    <span className="shrink-0 text-sm text-gold" aria-label={`${r.rating} sur 5`}>
                      {"★".repeat(r.rating)}
                      <span className="text-stone">{"★".repeat(5 - r.rating)}</span>
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    {r.city || "—"} · {longDate(r.date)}
                  </p>
                  {r.text && (
                    <p dir="auto" className="mt-1.5 line-clamp-2 text-sm text-ink/80">
                      {r.text}
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="flex flex-wrap gap-1.5 text-xs text-muted">
                      {r.text && <span className="rounded bg-sand px-1.5 py-0.5">Texte</span>}
                      {r.photos?.length ? <span className="rounded bg-sand px-1.5 py-0.5">{r.photos.length} photo(s)</span> : null}
                      {r.voice && <span className="rounded bg-sand px-1.5 py-0.5">Vocal {r.voice.duration}s</span>}
                    </span>
                    <span className="relative z-10">
                      <PublishToggle id={Number(r.id)} published={!!r.published} />
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
