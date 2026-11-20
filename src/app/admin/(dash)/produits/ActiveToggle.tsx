"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { setProductActive } from "../../actions";

/** On/off switch: shows or hides the product in the shop. */
export default function ActiveToggle({ id, active }: { id: number; active: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [on, setOn] = useOptimistic(active);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={on ? "En ligne (cliquer pour masquer)" : "Masqué (cliquer pour mettre en ligne)"}
      title={on ? "En ligne" : "Masqué"}
      disabled={pending}
      onClick={() =>
        start(async () => {
          setOn(!on);
          await setProductActive(id, !on);
          router.refresh();
        })
      }
      className={`relative h-6 w-10 rounded-full transition-colors ${on ? "bg-emerald-600" : "bg-stone"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "start-[1.125rem]" : "start-0.5"}`} />
    </button>
  );
}
