"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProduct, saveProduct, type ProductInput } from "../../actions";
import { CUTS, SIZES, slugify, type Category, type Product, type ProductColor, type Size } from "@/lib/products";
import { Btn, Card, ConfirmButton, Field, ImagesInput, Notice, Toggle, inputCls, useSaved } from "../../_ui/ui";

const CUT_LABEL: Record<string, string> = { classique: "Classique", brodee: "Brodée", papillon: "Papillon", kimono: "Kimono" };

const emptyColor = (): ProductColor => ({ name: "", nameAr: "", hex: "#141414", images: [], stock: {} });

function toInput(p?: Product): ProductInput {
  return {
    id: p?.id,
    slug: p?.slug ?? "",
    category: p?.category ?? "",
    cut: p?.cut ?? "classique",
    name: p?.name ?? "",
    nameAr: p?.nameAr ?? "",
    price: p?.price ?? "",
    compareAtPrice: p?.compareAtPrice ?? "",
    shortDescription: p?.shortDescription ?? "",
    description: p?.description ?? "",
    fabric: p?.fabric ?? "",
    details: p?.details ?? [],
    ar: p?.ar ?? { shortDescription: "", description: "", fabric: "", details: [] },
    sizes: p?.sizes ?? [...SIZES],
    colors: p?.colors.length ? p.colors.map((c) => ({ ...c, images: c.images ?? [] })) : [emptyColor()],
    isNew: p?.isNew ?? true,
    featured: p?.featured ?? false,
    active: p?.active ?? true,
  };
}

export default function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const router = useRouter();
  const [v, setV] = useState<ProductInput>(() => toInput(product));
  const [slugTouched, setSlugTouched] = useState(!!product);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saved, flashSaved] = useSaved();

  const set = <K extends keyof ProductInput>(k: K, val: ProductInput[K]) => setV((s) => ({ ...s, [k]: val }));
  const setAr = (k: keyof ProductInput["ar"], val: string | string[]) => setV((s) => ({ ...s, ar: { ...s.ar, [k]: val } }));
  const setColor = (i: number, patch: Partial<ProductColor>) => setV((s) => ({ ...s, colors: s.colors.map((c, j) => (j === i ? { ...c, ...patch } : c)) }));
  const moveColor = (i: number, d: -1 | 1) =>
    setV((s) => {
      const c = [...s.colors];
      [c[i], c[i + d]] = [c[i + d], c[i]];
      return { ...s, colors: c };
    });

  const submit = () =>
    start(async () => {
      setError("");
      setFields({});
      const r = await saveProduct(v);
      if (!r.ok) {
        setError(r.error);
        setFields(r.fields ?? {});
        return;
      }
      flashSaved();
      if (!product && r.id) router.replace(`/admin/produits/${r.id}`);
      else router.refresh();
    });

  const lines = (a: string[]) => a.join("\n");
  const unlines = (s: string) => s.split("\n");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-6 pb-24"
    >
      <Card title="Informations">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom (français) *" error={fields.name}>
            {(id) => (
              <input
                id={id}
                className={inputCls}
                value={v.name}
                aria-invalid={!!fields.name}
                onChange={(e) => {
                  set("name", e.target.value);
                  if (!slugTouched) set("slug", slugify(e.target.value));
                }}
              />
            )}
          </Field>
          <Field label="Nom (arabe)">{(id) => <input id={id} dir="rtl" className={inputCls} value={v.nameAr} onChange={(e) => set("nameAr", e.target.value)} />}</Field>
          <Field label="Adresse de la page (slug) *" error={fields.slug} hint={`/fr/produit/${v.slug || "…"}`}>
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
          <Field label="Catégorie">
            {(id) => (
              <select id={id} className={inputCls} value={v.category} onChange={(e) => set("category", e.target.value)}>
                <option value="">— Sans catégorie —</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Prix (DH) *" error={fields.price}>
            {(id) => <input id={id} className={inputCls} inputMode="numeric" value={v.price} aria-invalid={!!fields.price} onChange={(e) => set("price", e.target.value.replace(/\D/g, ""))} />}
          </Field>
          <Field label="Ancien prix barré (DH)" error={fields.compareAtPrice} hint="Facultatif — affiche une « Offre »">
            {(id) => (
              <input
                id={id}
                className={inputCls}
                inputMode="numeric"
                value={v.compareAtPrice ?? ""}
                aria-invalid={!!fields.compareAtPrice}
                onChange={(e) => set("compareAtPrice", e.target.value.replace(/\D/g, ""))}
              />
            )}
          </Field>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Description — Français">
          <div className="space-y-4">
            <Field label="Phrase d'accroche">{(id) => <input id={id} className={inputCls} value={v.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} />}</Field>
            <Field label="Description">{(id) => <textarea id={id} rows={5} className={inputCls} value={v.description} onChange={(e) => set("description", e.target.value)} />}</Field>
            <Field label="Tissu">{(id) => <input id={id} className={inputCls} value={v.fabric} onChange={(e) => set("fabric", e.target.value)} />}</Field>
            <Field label="Détails" hint="Un par ligne">
              {(id) => <textarea id={id} rows={4} className={inputCls} value={lines(v.details)} onChange={(e) => set("details", unlines(e.target.value))} />}
            </Field>
          </div>
        </Card>
        <Card title="Description — العربية">
          <div className="space-y-4" dir="rtl">
            <Field label="الجملة التعريفية">{(id) => <input id={id} className={inputCls} value={v.ar.shortDescription} onChange={(e) => setAr("shortDescription", e.target.value)} />}</Field>
            <Field label="الوصف">{(id) => <textarea id={id} rows={5} className={inputCls} value={v.ar.description} onChange={(e) => setAr("description", e.target.value)} />}</Field>
            <Field label="القماش">{(id) => <input id={id} className={inputCls} value={v.ar.fabric} onChange={(e) => setAr("fabric", e.target.value)} />}</Field>
            <Field label="التفاصيل" hint="سطر لكل تفصيل">
              {(id) => <textarea id={id} rows={4} className={inputCls} value={lines(v.ar.details)} onChange={(e) => setAr("details", unlines(e.target.value))} />}
            </Field>
          </div>
        </Card>
      </div>

      <Card title="Tailles disponibles">
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => {
            const on = v.sizes.includes(s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={on}
                onClick={() => set("sizes", on ? v.sizes.filter((x) => x !== s) : SIZES.filter((x) => x === s || v.sizes.includes(x)))}
                className="h-11 min-w-14 rounded-md border border-stone bg-white px-3 text-sm aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-ivory"
              >
                {s}
              </button>
            );
          })}
        </div>
        {fields.sizes && <p className="mt-2 text-xs text-sold">{fields.sizes}</p>}
      </Card>

      <Card
        title="Couleurs, photos et stock"
        aside={
          <Btn variant="outline" onClick={() => set("colors", [...v.colors, emptyColor()])} className="min-h-9 text-xs">
            + Couleur
          </Btn>
        }
      >
        {fields.colors && <p className="mb-3 text-xs text-sold">{fields.colors}</p>}
        <div className="space-y-4">
          {v.colors.map((c, i) => (
            <div key={i} className={`rounded-md border p-4 ${fields[`color${i}`] ? "border-sold/50" : "border-stone/70"} bg-ivory/40`}>
              <div className="grid gap-3 sm:grid-cols-[auto_1fr_1fr]">
                <Field label="Teinte">
                  {(id) => <input id={id} type="color" value={c.hex} onChange={(e) => setColor(i, { hex: e.target.value })} className="h-11 w-16 cursor-pointer rounded-md border border-stone bg-white p-1" />}
                </Field>
                <Field label="Nom (français) *">{(id) => <input id={id} className={inputCls} value={c.name} placeholder="Noir" onChange={(e) => setColor(i, { name: e.target.value })} />}</Field>
                <Field label="Nom (arabe)">{(id) => <input id={id} dir="rtl" className={inputCls} value={c.nameAr} placeholder="أسود" onChange={(e) => setColor(i, { nameAr: e.target.value })} />}</Field>
              </div>
              {fields[`color${i}`] && <p className="mt-2 text-xs text-sold">{fields[`color${i}`]}</p>}

              <p className="mb-1.5 mt-4 text-xs text-muted">Photos (la première est la photo principale)</p>
              <ImagesInput value={c.images ?? []} onChange={(images) => setColor(i, { images })} folder="products" />

              <p className="mb-1.5 mt-4 text-xs text-muted">Stock par taille</p>
              <div className="flex flex-wrap gap-2">
                {v.sizes.map((s: Size) => (
                  <label key={s} className="w-[4.5rem]">
                    <span className="block text-center text-xs text-muted">T{s}</span>
                    <input
                      inputMode="numeric"
                      className={`${inputCls} text-center tabular-nums`}
                      value={c.stock[s] ?? 0}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setColor(i, { stock: { ...c.stock, [s]: Number(e.target.value.replace(/\D/g, "") || 0) } })}
                    />
                  </label>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <Btn variant="ghost" disabled={i === 0} onClick={() => moveColor(i, -1)} className="min-h-9 text-xs">
                  ↑ Monter
                </Btn>
                <Btn variant="ghost" disabled={i === v.colors.length - 1} onClick={() => moveColor(i, 1)} className="min-h-9 text-xs">
                  ↓ Descendre
                </Btn>
                <Btn variant="ghost" disabled={v.colors.length === 1} onClick={() => set("colors", v.colors.filter((_, j) => j !== i))} className="min-h-9 text-xs text-sold">
                  Retirer la couleur
                </Btn>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Visibilité">
          <Toggle checked={v.active} onChange={(x) => set("active", x)} label="En ligne" hint="Désactivé : le produit est masqué de la boutique." />
          <Toggle checked={v.featured} onChange={(x) => set("featured", x)} label="Mettre en avant" hint="Apparaît dans « Les pièces de la saison » sur l'accueil." />
          <Toggle checked={v.isNew} onChange={(x) => set("isNew", x)} label="Badge « Nouveau »" />
        </Card>
        <Card title="Illustration (sans photo)">
          <Field label="Style de l'illustration" hint="Utilisée tant qu'une couleur n'a pas de photo.">
            {(id) => (
              <select id={id} className={inputCls} value={v.cut} onChange={(e) => set("cut", e.target.value as ProductInput["cut"])}>
                {CUTS.map((c) => (
                  <option key={c} value={c}>
                    {CUT_LABEL[c]}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </Card>
      </div>

      {product && (
        <div className="flex justify-end">
          <ConfirmButton
            label="Supprimer le produit"
            onConfirm={async () => {
              const r = await deleteProduct(product.id);
              if (r.ok) router.push("/admin/produits");
              else setError(r.error);
            }}
          />
        </div>
      )}

      {/* Save bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-stone/70 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:start-60">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0 text-sm">
            {error ? <span className="text-sold">{error}</span> : saved ? <span className="text-emerald-700">Enregistré ✓ — la boutique est à jour.</span> : null}
          </div>
          <Btn type="submit" disabled={pending} className="shrink-0 px-6">
            {pending ? "Enregistrement…" : product ? "Enregistrer" : "Créer le produit"}
          </Btn>
        </div>
      </div>
      {error && Object.keys(fields).length === 0 && <Notice>{error}</Notice>}
    </form>
  );
}
