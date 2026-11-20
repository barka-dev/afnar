"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import AbayaArt from "@/components/AbayaArt";
import { CUTS, slugify, type Category } from "@/lib/products";
import { deleteCategory, moveCategory, saveCategory, type CategoryInput } from "../../actions";
import { Btn, ConfirmButton, Field, Notice, SingleImageInput, inputCls } from "../../_ui/ui";

const CUT_LABEL: Record<string, string> = { classique: "Classique", brodee: "Brodée", papillon: "Papillon", kimono: "Kimono" };

export default function CategoryManager({ categories, counts }: { categories: Category[]; counts: Record<string, number> }) {
  const router = useRouter();
  const [editing, setEditing] = useState<number | "new" | null>(categories.length ? null : "new");
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  const move = (id: number, d: -1 | 1) =>
    start(async () => {
      const r = await moveCategory(id, d);
      if (!r.ok) setError(r.error);
      router.refresh();
    });

  return (
    <div className="space-y-3">
      {error && <Notice>{error}</Notice>}

      {editing === "new" ? (
        <CategoryForm
          onDone={() => {
            setEditing(null);
            router.refresh();
          }}
          onCancel={categories.length ? () => setEditing(null) : undefined}
        />
      ) : (
        <Btn onClick={() => setEditing("new")}>+ Nouvelle catégorie</Btn>
      )}

      <ul className="space-y-2">
        {categories.map((c, i) =>
          editing === c.id ? (
            <li key={c.id}>
              <CategoryForm
                category={c}
                productCount={counts[c.slug] ?? 0}
                onDone={() => {
                  setEditing(null);
                  router.refresh();
                }}
                onCancel={() => setEditing(null)}
              />
            </li>
          ) : (
            <li key={c.id} className="flex items-center gap-3 rounded-lg border border-stone/70 bg-white p-3">
              <Thumb c={c} />
              <div className="min-w-0 flex-1">
                <p className="truncate">
                  {c.name} {c.nameAr && <span className="text-muted">· {c.nameAr}</span>}
                </p>
                <p className="truncate text-xs text-muted">
                  {counts[c.slug] ?? 0} produit(s) · /boutique?categorie={c.slug}
                </p>
              </div>
              <div className="flex shrink-0 items-center">
                <Btn variant="ghost" disabled={pending || i === 0} onClick={() => move(c.id, -1)} className="min-h-9 w-9 px-0" aria-label="Monter">
                  ↑
                </Btn>
                <Btn variant="ghost" disabled={pending || i === categories.length - 1} onClick={() => move(c.id, 1)} className="min-h-9 w-9 px-0" aria-label="Descendre">
                  ↓
                </Btn>
                <Btn variant="outline" onClick={() => setEditing(c.id)} className="ms-1 min-h-9">
                  Modifier
                </Btn>
              </div>
            </li>
          )
        )}
      </ul>
    </div>
  );
}

function Thumb({ c }: { c: Pick<Category, "image" | "color" | "cut"> }) {
  return (
    <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-t-full bg-sand">
      {c.image ? <Image src={c.image} alt="" fill sizes="44px" className="object-cover" /> : <AbayaArt color={c.color} cut={c.cut} className="h-full w-full" />}
    </div>
  );
}

function CategoryForm({ category, productCount = 0, onDone, onCancel }: { category?: Category; productCount?: number; onDone: () => void; onCancel?: () => void }) {
  const [v, setV] = useState<CategoryInput>({
    id: category?.id,
    slug: category?.slug ?? "",
    name: category?.name ?? "",
    nameAr: category?.nameAr ?? "",
    description: category?.description ?? "",
    descriptionAr: category?.descriptionAr ?? "",
    image: category?.image ?? null,
    cut: category?.cut ?? "classique",
    color: category?.color ?? "#1C2541",
  });
  const [slugTouched, setSlugTouched] = useState(!!category);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const set = <K extends keyof CategoryInput>(k: K, val: CategoryInput[K]) => setV((s) => ({ ...s, [k]: val }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setError("");
          const r = await saveCategory(v);
          if (!r.ok) {
            setError(r.error);
            setFields(r.fields ?? {});
          } else onDone();
        });
      }}
      className="rounded-lg border border-ink/30 bg-white p-4 shadow-sm sm:p-6"
    >
      <p className="mb-4 text-xs uppercase tracking-[0.18em] text-gold-dark">{category ? "Modifier la catégorie" : "Nouvelle catégorie"}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom (français) *" error={fields.name}>
          {(id) => (
            <input
              id={id}
              className={inputCls}
              value={v.name}
              autoFocus
              aria-invalid={!!fields.name}
              onChange={(e) => {
                set("name", e.target.value);
                if (!slugTouched) set("slug", slugify(e.target.value));
              }}
            />
          )}
        </Field>
        <Field label="Nom (arabe)">{(id) => <input id={id} dir="rtl" className={inputCls} value={v.nameAr} onChange={(e) => set("nameAr", e.target.value)} />}</Field>
        <Field label="Description (français)">{(id) => <input id={id} className={inputCls} value={v.description} onChange={(e) => set("description", e.target.value)} />}</Field>
        <Field label="Description (arabe)">{(id) => <input id={id} dir="rtl" className={inputCls} value={v.descriptionAr} onChange={(e) => set("descriptionAr", e.target.value)} />}</Field>
        <Field label="Identifiant (slug) *" error={fields.slug} hint="Utilisé dans l'adresse : /boutique?categorie=…">
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
        <div>
          <p className="mb-1.5 text-xs text-muted">Photo (accueil)</p>
          <SingleImageInput value={v.image ?? null} onChange={(x) => set("image", x)} folder="categories" />
          {!v.image && (
            <div className="mt-3 flex items-end gap-3">
              <Field label="Sinon : illustration">
                {(id) => (
                  <select id={id} className={inputCls} value={v.cut} onChange={(e) => set("cut", e.target.value as CategoryInput["cut"])}>
                    {CUTS.map((c) => (
                      <option key={c} value={c}>
                        {CUT_LABEL[c]}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <input type="color" value={v.color} onChange={(e) => set("color", e.target.value)} aria-label="Couleur de l'illustration" className="h-11 w-14 cursor-pointer rounded-md border border-stone bg-white p-1" />
              <Thumb c={v as Category} />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4">
          <Notice>{error}</Notice>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        {category ? (
          <ConfirmButton
            label="Supprimer"
            confirmLabel={productCount ? `Supprimer (${productCount} produit(s) deviendront « sans catégorie »)` : "Confirmer la suppression"}
            onConfirm={async () => {
              const r = await deleteCategory(category.id);
              if (r.ok) onDone();
              else setError(r.error);
            }}
          />
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          {onCancel && (
            <Btn variant="ghost" onClick={onCancel}>
              Annuler
            </Btn>
          )}
          <Btn type="submit" disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Btn>
        </div>
      </div>
    </form>
  );
}
