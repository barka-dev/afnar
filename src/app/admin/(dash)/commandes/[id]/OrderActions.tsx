"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { changeOrderStatus, removeOrder, saveOrderNote } from "../../../actions";
import { ORDER_STATUSES, RELEASES_STOCK, STATUS_LABEL, type OrderStatus } from "@/lib/order-status";
import { Btn, Card, ConfirmButton, Notice, inputCls, useSaved } from "../../../_ui/ui";

/** The usual next step for each status (shown as the main button). */
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = { new: "confirmed", confirmed: "shipped", shipped: "delivered" };

export default function OrderActions({ id, status, note, stockReserved }: { id: number; status: OrderStatus; note: string; stockReserved: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [text, setText] = useState(note);
  const [saved, flashSaved] = useSaved();

  const setStatus = (s: OrderStatus) =>
    start(async () => {
      setError("");
      const r = await changeOrderStatus(id, s);
      if (!r.ok) setError(r.error);
      router.refresh();
    });

  const next = NEXT[status];

  return (
    <>
      <Card title="Statut">
        {next && (
          <Btn className="mb-3 w-full" disabled={pending} onClick={() => setStatus(next)}>
            {pending ? "…" : `Marquer comme « ${STATUS_LABEL[next]} »`}
          </Btn>
        )}
        <div className="grid grid-cols-2 gap-2">
          {ORDER_STATUSES.filter((s) => s !== status && s !== next).map((s) => (
            <Btn key={s} variant="outline" disabled={pending} onClick={() => setStatus(s)} className="text-xs">
              {STATUS_LABEL[s]}
            </Btn>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          {stockReserved
            ? "Les pièces de cette commande sont retirées du stock. « Annulée » ou « Retournée » les remet en stock."
            : "Les pièces de cette commande ont été remises en stock."}
        </p>
        {error && (
          <div className="mt-3">
            <Notice>{error}</Notice>
          </div>
        )}
      </Card>

      <Card title="Note interne">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className={inputCls} placeholder="Ex. : appelée le 12/11, livraison samedi matin…" />
        <div className="mt-2 flex items-center gap-3">
          <Btn
            variant="outline"
            disabled={pending || text === note}
            onClick={() =>
              start(async () => {
                const r = await saveOrderNote(id, text);
                if (r.ok) {
                  flashSaved();
                  router.refresh();
                } else setError(r.error);
              })
            }
          >
            Enregistrer la note
          </Btn>
          {saved && <span className="text-xs text-emerald-700">Enregistrée ✓</span>}
        </div>
      </Card>

      <div className="flex justify-end">
        <ConfirmButton
          label="Supprimer la commande"
          confirmLabel={RELEASES_STOCK.has(status) ? "Confirmer" : "Confirmer (remet en stock)"}
          onConfirm={async () => {
            const r = await removeOrder(id);
            if (r.ok) router.push("/admin/commandes");
            else setError(r.error);
          }}
        />
      </div>
    </>
  );
}
