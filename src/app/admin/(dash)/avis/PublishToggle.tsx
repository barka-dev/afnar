"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { setReviewPublished } from "../../actions";

export default function PublishToggle({ id, published }: { id: number; published: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [on, setOn] = useOptimistic(published);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          setOn(!on);
          await setReviewPublished(id, !on);
          router.refresh();
        })
      }
      className={`rounded-full px-2.5 py-1 text-xs ring-1 ring-inset transition-colors ${on ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-stone/30 text-muted ring-stone"}`}
    >
      {on ? "Publié" : "Brouillon"}
    </button>
  );
}
