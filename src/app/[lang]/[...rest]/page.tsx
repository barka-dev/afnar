import { notFound } from "next/navigation";

// Any unknown path under /fr or /ar renders the localised [lang]/not-found page.
export default function CatchAll() {
  notFound();
}
