"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { deleteProduct, saveEnsemble, type EnsembleInput } from "../../actions";
import { ONE_SIZE, slugify, type Product } from "@/lib/products";
import { formatDH } from "@/lib/format";
import { Btn, Card, ConfirmButton, Field, ImagesInput, Notice, Toggle, inputCls, useSaved } from "../../_ui/ui";

/**
 * Admin form for a set (الأطقم): pick one abaya + its colour and one khimar + its matching colour, set the price.
 * The set's sizes and stock come from the two pieces; the crossed-out price is the two bought separately.
 */

function toInput(p?: Product): EnsembleInput {
  return {
    id: p?.id,
    slug: p?.slug ?? "",
    name: p?.name ?? "",
    nameAr: p?.nameAr ?? "",
    abaya: p?.bundle?.abaya ?? { slug: "", color: "" },
    khimar: p?.bundle?.khimar ?? { slug: "", color: "" },
    price: p?.price ?? "",
    shortDescription: p?.shortDescription ?? "",
    ar: { shortDescription: p?.ar.shortDescription ?? "", description: p?.ar.description ?? "" },
    // only the set's own photos, not the pieces' photos the shop shows as a fallback
    images: p?.bundleImages ?? [],
    isNew: p?.isNew ?? true,
    featured: p?.featured ?? false,
    active: p?.active ?? true,
  };
}

export default function EnsembleForm({ ensemble, abayas, khimars }: { ensemble?: Product; abayas: Product[]; khimars: Product[] }) {
  const router = useRouter();
  const [v, setV] = useState<EnsembleInput>(() => toInput(ensemble));
  const [slugTouched, setSlugTouched] = useState(!!ensemble);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saved, flashSaved] = useSaved();
  const set = <K extends keyof EnsembleInput>(k: K, val: EnsembleInput[K]) => setV((s) => ({ ...s, [k]: val }));

  const abaya = abayas.find((p) => p.slug === v.abaya.slug);
  const khimar = khimars.find((p) => p.slug === v.khimar.slug);
  const abayaColor = abaya?.colors.find((c) => c.name === v.abaya.color);
  const khimarColor = khimar?.colors.find((c) => c.name === v.khimar.color);

  // Preview of what the shop will show: sizes with their stock, and the saving
  const preview = useMemo(() => {
    if (!abaya || !abayaColor || !khimar || !khimarColor) return null;
    const khimarStock = khimarColor.stock[ONE_SIZE] ?? 0;
    const sizes = abaya.sizes.map((s) => ({ s, n: Math.min(abayaColor.stock[s] ?? 0, khimarStock) }));
    const separate = abaya.price + khimar.price;
    return { sizes, separate, khimarStock };
  }, [abaya, abayaColor, khimar, khimarColor]);
  const price = Number(v.price) || 0;

  const pickPiece = (role: "abaya" | "khimar", slug: string) => {
    const list = role === "abaya" ? abayas : khimars;
    const first = list.find((p) => p.slug === slug)?.colors[0]?.name ?? "";
    set(role, { slug, color: first });
  };

  const submit = () =>
    start(async () => {
      setError("");
      setFields({});
      const r = await saveEnsemble(v);
      if (!r.ok) {
        setError(r.error);
        setFields(r.fields ?? {});
        return;
      }
      flashSaved();
      if (!ensemble && r.id) router.replace(`/admin/produits/${r.id}`);
      else router.refresh();
    });

  const piece = (role: "abaya" | "khimar", label: string, list: Product[], value: { slug: string; color: string }, empty: string) => (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={`${label} *`} error={fields[role]}>
        {(id) => (
          <select id={id} className={inputCls} value={value.slug} aria-invalid={!!fields[role]} onChange={(e) => pickPiece(role, e.target.value)}>
            <option value="">— Choisir —</option>
            {list.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name} · {formatDH(p.price)}
                {p.active ? "" : " (masqué)"}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Couleur *">
        {(id) => (
          <select id={id} className={inputCls} value={value.color} disabled={!value.slug} onChange={(e) => set(role, { ...value, color: e.target.value })}>
            {(list.find((p) => p.slug === value.slug)?.colors ?? []).map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
                {c.nameAr ? ` / ${c.nameAr}` : ""}
              </option>
            ))}
          </select>
        )}
      </Field>
      {list.length === 0 && <p className="text-xs text-sold sm:col-span-2">{empty}</p>}
    </div>
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-6 pb-24"
    >
      <Card title="Composition de l'ensemble">
        <div className="space-y-6">
          {piece("abaya", "Abaya", abayas, v.abaya, "Aucune abaya : créez d'abord une abaya (tailles 52 à 60) dans Produits.")}
          {piece("khimar", "Khimar assorti", khimars, v.khimar, "Aucun khimar : créez d'abord un produit en « Taille unique » dans Produits.")}
        </div>

        {preview && (
          <div className="mt-6 rounded-md border border-stone/70 bg-ivory/50 p-4 text-sm">
            <p className="font-medium">Ce que la boutique affichera</p>
            <p className="mt-1 text-muted">
              Couleur : {abayaColor!.name} + {khimarColor!.name} · Prix séparé : {formatDH(preview.separate)}
              {price > 0 && price < preview.separate && <span className="text-emerald-700"> · économie {formatDH(preview.separate - price)}</span>}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {preview.sizes.map(({ s, n }) => (
                <span key={s} className={`rounded border px-2.5 py-1 text-xs tabular-nums ${n === 0 ? "border-stone/60 text-muted line-through" : "border-stone"}`}>
                  T{s} : {n}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              Stock par taille = le plus petit entre l&apos;abaya dans cette taille et le khimar ({preview.khimarStock}). Une commande retire une abaya et un khimar.
            </p>
          </div>
        )}
      </Card>

      <Card title="Informations">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom (français, interne) *" error={fields.name}>
            {(id) => (
              <input
                id={id}
                className={inputCls}
                value={v.name}
                placeholder="Ensemble Nour noir"
                aria-invalid={!!fields.name}
                onChange={(e) => {
                  set("name", e.target.value);
                  if (!slugTouched) set("slug", slugify(e.target.value));
                }}
              />
            )}
          </Field>
          <Field label="Nom (arabe, affiché dans la boutique)">
            {(id) => <input id={id} dir="rtl" className={inputCls} value={v.nameAr} placeholder="طقم نور الأسود" onChange={(e) => set("nameAr", e.target.value)} />}
          </Field>
          <Field label="Adresse de la page (slug) *" error={fields.slug} hint={`/produit/${v.slug || "…"}`}>
            {(id) => (
              <input
                id={id}
                className={inputCls}
                value={v.slug}
                aria-invalid={!!fields.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
                }}
              />
            )}
          </Field>
          <Field label="Prix de l'ensemble (DH) *" error={fields.price} hint={preview ? `Séparément : ${formatDH(preview.separate)}` : undefined}>
            {(id) => <input id={id} className={inputCls} inputMode="numeric" value={v.price} aria-invalid={!!fields.price} onChange={(e) => set("price", e.target.value.replace(/\D/g, ""))} />}
          </Field>
        </div>
      </Card>

      <Card title="Description — العربية">
        <div className="space-y-4" dir="rtl">
          <Field label="الجملة التعريفية">
            {(id) => <input id={id} className={inputCls} value={v.ar.shortDescription} placeholder="عباية وخمار منسّقان بثمن خاص" onChange={(e) => set("ar", { ...v.ar, shortDescription: e.target.value })} />}
          </Field>
          <Field label="الوصف">{(id) => <textarea id={id} rows={4} className={inputCls} value={v.ar.description} onChange={(e) => set("ar", { ...v.ar, description: e.target.value })} />}</Field>
        </div>
      </Card>

      <Card title="Photos de l'ensemble">
        <p className="mb-2 text-xs text-muted">Facultatif : une photo de l&apos;abaya et du khimar portés ensemble. Sans photo, la boutique montre celles de l&apos;abaya puis du khimar.</p>
        <ImagesInput value={v.images} onChange={(images) => set("images", images)} folder="products" />
      </Card>

      <Card title="Visibilité">
        <Toggle checked={v.active} onChange={(x) => set("active", x)} label="En ligne" hint="Désactivé : l'ensemble est masqué de la boutique." />
        <Toggle checked={v.featured} onChange={(x) => set("featured", x)} label="Mettre en avant" hint="Apparaît dans « Les pièces de la saison » sur l'accueil." />
        <Toggle checked={v.isNew} onChange={(x) => set("isNew", x)} label="Badge « Nouveau »" />
      </Card>

      {ensemble && (
        <div className="flex justify-end">
          <ConfirmButton
            label="Supprimer l'ensemble"
            onConfirm={async () => {
              const r = await deleteProduct(ensemble.id);
              if (r.ok) router.push("/admin/produits");
              else setError(r.error);
            }}
          />
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-stone/70 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:start-60">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0 text-sm">
            {error ? <span className="text-sold">{error}</span> : saved ? <span className="text-emerald-700">Enregistré ✓ — la boutique est à jour.</span> : null}
          </div>
          <Btn type="submit" disabled={pending} className="shrink-0 px-6">
            {pending ? "Enregistrement…" : ensemble ? "Enregistrer" : "Créer l'ensemble"}
          </Btn>
        </div>
      </div>
      {error && Object.keys(fields).length === 0 && <Notice>{error}</Notice>}
    </form>
  );
}
