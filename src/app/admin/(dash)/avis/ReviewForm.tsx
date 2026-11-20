"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CITIES } from "@/lib/cities";
import type { Product } from "@/lib/products";
import type { Review } from "@/lib/reviews";
import { deleteReview, saveReview, type ReviewInput } from "../../actions";
import { AudioInput, Btn, Card, ConfirmButton, Field, ImagesInput, Notice, Toggle, inputCls, useSaved } from "../../_ui/ui";

function toInput(r?: Review): ReviewInput {
  return {
    id: r ? Number(r.id) : undefined,
    name: r?.name ?? "",
    city: r?.city ?? "",
    date: r?.date ?? new Date().toISOString().slice(0, 10),
    rating: r?.rating ?? 5,
    lang: r?.lang ?? "fr",
    text: r?.text ?? "",
    photos: (r?.photos ?? []).flatMap((p) => ("src" in p ? [p.src] : [])),
    voice: r?.voice ? { src: r.voice.src, duration: r.voice.duration, transcript: r.voice.transcript ?? "" } : null,
    productSlug: r?.product?.slug ?? "",
    productColor: r?.product?.color ?? "",
    productSize: r?.product?.size ?? "",
    verified: r?.verified ?? true,
    published: r?.published ?? true,
  };
}

export default function ReviewForm({ review, products }: { review?: Review; products: Product[] }) {
  const router = useRouter();
  const [v, setV] = useState<ReviewInput>(() => toInput(review));
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saved, flashSaved] = useSaved();
  const set = <K extends keyof ReviewInput>(k: K, val: ReviewInput[K]) => setV((s) => ({ ...s, [k]: val }));
  const product = products.find((p) => p.slug === v.productSlug);
  const rtl = v.lang === "ar";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setError("");
          setFields({});
          const r = await saveReview(v);
          if (!r.ok) {
            setError(r.error);
            setFields(r.fields ?? {});
            return;
          }
          flashSaved();
          if (!review && r.id) router.replace(`/admin/avis/${r.id}`);
          else router.refresh();
        });
      }}
      className="space-y-6"
    >
      <Card title="Cliente">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom + initiale *" error={fields.name} hint="Ex. : Salma B.">
            {(id) => <input id={id} dir="auto" className={inputCls} value={v.name} aria-invalid={!!fields.name} onChange={(e) => set("name", e.target.value)} />}
          </Field>
          <Field label="Ville">
            {(id) => (
              <select id={id} className={inputCls} value={v.city} onChange={(e) => set("city", e.target.value)}>
                <option value="">—</option>
                {CITIES.map((c) => (
                  <option key={c.fr} value={c.fr}>
                    {c.fr}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Date">{(id) => <input id={id} type="date" className={inputCls} value={v.date} onChange={(e) => set("date", e.target.value)} />}</Field>
          <Field label="Note *" error={fields.rating}>
            {() => (
              <div className="flex gap-1" role="radiogroup" aria-label="Note">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={v.rating === n}
                    aria-label={`${n} sur 5`}
                    onClick={() => set("rating", n)}
                    className={`h-11 w-11 rounded-md text-2xl leading-none transition-colors ${n <= v.rating ? "text-gold" : "text-stone"} hover:bg-sand`}
                  >
                    ★
                  </button>
                ))}
              </div>
            )}
          </Field>
        </div>
      </Card>

      <Card title="Avis : texte, photos et/ou vocal">
        {fields.content && (
          <div className="mb-4">
            <Notice>{fields.content}</Notice>
          </div>
        )}
        <div className="space-y-5">
          <Field label="Langue de l'avis">
            {(id) => (
              <select id={id} className={`${inputCls} sm:w-60`} value={v.lang} onChange={(e) => set("lang", e.target.value as "fr" | "ar")}>
                <option value="fr">Français</option>
                <option value="ar">Arabe / darija</option>
              </select>
            )}
          </Field>
          <Field label="Texte">{(id) => <textarea id={id} rows={4} dir={rtl ? "rtl" : "ltr"} className={inputCls} value={v.text} onChange={(e) => set("text", e.target.value)} />}</Field>
          <div>
            <p className="mb-1.5 text-xs text-muted">Photos</p>
            <ImagesInput value={v.photos} onChange={(photos) => set("photos", photos)} folder="reviews" max={10} />
          </div>
          <div>
            <p className="mb-1.5 text-xs text-muted">Message vocal</p>
            <AudioInput value={v.voice} onChange={(x) => set("voice", x ? { ...x, transcript: v.voice?.transcript ?? "" } : null)} />
            {v.voice && (
              <Field label="Transcription (facultatif)" hint="Ce qu'elle dit — affiché sous le lecteur, utile aussi pour l'accessibilité." className="mt-3">
                {(id) => (
                  <textarea
                    id={id}
                    rows={3}
                    dir={rtl ? "rtl" : "ltr"}
                    className={inputCls}
                    value={v.voice?.transcript ?? ""}
                    onChange={(e) => set("voice", v.voice ? { ...v.voice, transcript: e.target.value } : null)}
                  />
                )}
              </Field>
            )}
          </div>
        </div>
      </Card>

      <Card title="Pièce commandée (facultatif)">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Produit">
            {(id) => (
              <select
                id={id}
                className={inputCls}
                value={v.productSlug}
                onChange={(e) => setV((s) => ({ ...s, productSlug: e.target.value, productColor: "", productSize: "" }))}
              >
                <option value="">—</option>
                {products.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Couleur">
            {(id) => (
              <select id={id} className={inputCls} value={v.productColor} disabled={!product} onChange={(e) => set("productColor", e.target.value)}>
                <option value="">—</option>
                {product?.colors.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Taille">
            {(id) => (
              <select id={id} className={inputCls} value={v.productSize} disabled={!product} onChange={(e) => set("productSize", e.target.value)}>
                <option value="">—</option>
                {product?.sizes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
      </Card>

      <Card title="Publication">
        <Toggle checked={v.published} onChange={(x) => set("published", x)} label="Publié sur le site" hint="Désactivé : gardé en brouillon, invisible pour les clientes." />
        <Toggle checked={v.verified} onChange={(x) => set("verified", x)} label="Badge « Achat vérifié »" hint="Uniquement si elle a réellement commandé chez vous." />
        <p className="mt-3 text-xs text-muted">Ne publiez que des avis réellement reçus, avec l&apos;accord de la cliente.</p>
      </Card>

      {error && !fields.content && <Notice>{error}</Notice>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {review ? (
          <ConfirmButton
            label="Supprimer l'avis"
            onConfirm={async () => {
              const r = await deleteReview(Number(review.id));
              if (r.ok) router.push("/admin/avis");
              else setError(r.error);
            }}
          />
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-emerald-700">Enregistré ✓</span>}
          <Btn type="submit" disabled={pending} className="px-6">
            {pending ? "Enregistrement…" : review ? "Enregistrer" : "Ajouter l'avis"}
          </Btn>
        </div>
      </div>
    </form>
  );
}
