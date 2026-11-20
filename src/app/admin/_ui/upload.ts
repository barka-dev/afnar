"use client";

import { upload } from "@vercel/blob/client";

export type Folder = "products" | "categories" | "reviews";

let modePromise: Promise<"blob" | "local" | "none"> | null = null;
const getMode = () =>
  (modePromise ??= fetch("/api/admin/upload")
    .then((r) => (r.ok ? r.json() : { mode: "none" }))
    .then((d) => d.mode)
    .catch(() => {
      modePromise = null;
      return "none" as const;
    }));

/** Phone photos are often 4000px / 5 MB: resize to 2000px max and re-encode as WebP before uploading. */
async function shrinkImage(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 400_000) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.86));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
  } catch {
    return file;
  }
}

/** Uploads a file and returns its public URL. */
export async function uploadFile(original: File, folder: Folder, onProgress?: (pct: number) => void): Promise<string> {
  const file = await shrinkImage(original);
  const mode = await getMode();
  if (mode === "none") throw new Error("Les envois de fichiers ne sont pas configurés (Vercel Blob).");

  if (mode === "blob") {
    const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").slice(-60) || "fichier";
    const res = await upload(`${folder}/${safe}`, file, {
      access: "public",
      handleUploadUrl: "/api/admin/upload",
      contentType: file.type || undefined,
      multipart: file.size > 8 * 1024 * 1024,
      onUploadProgress: (p) => onProgress?.(p.percentage),
    });
    return res.url;
  }

  const body = new FormData();
  body.set("file", file);
  body.set("folder", folder);
  const r = await fetch("/api/admin/upload", { method: "POST", body });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.url) throw new Error(data.error || "Échec de l'envoi.");
  onProgress?.(100);
  return data.url;
}

/** Reads an audio file's length in seconds (for the voice-note player). */
export function audioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const a = new Audio();
    const done = (d: number) => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(d) && d > 0 ? Math.round(d) : 0);
    };
    a.preload = "metadata";
    a.onloadedmetadata = () => {
      if (Number.isFinite(a.duration)) return done(a.duration);
      // Some recordings (webm/ogg) report Infinity until seeked to the end
      a.currentTime = 1e7;
      a.ontimeupdate = () => done(a.duration);
    };
    a.onerror = () => done(0);
    setTimeout(() => done(0), 8000);
    a.src = url;
  });
}
