import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isAdmin } from "@/lib/server/auth";

/**
 * Uploads for the admin (product / category photos, review photos and voice notes).
 *  - With BLOB_READ_WRITE_TOKEN (Vercel Blob): the browser uploads straight to Blob; this route only hands out a
 *    short-lived upload token to the logged-in admin. No size limit from the server function.
 *  - Without it, in development only: the file is posted here and saved in public/uploads.
 */

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const AUDIO_TYPES = ["audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/ogg", "audio/opus", "audio/webm", "audio/wav", "audio/x-wav"];
const MAX_BYTES = 25 * 1024 * 1024;

const hasBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;
const mode = () => (hasBlob() ? "blob" : process.env.NODE_ENV !== "production" ? "local" : "none");

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ mode: mode() });
}

export async function POST(request: Request) {
  const m = mode();

  if (m === "blob") {
    const body = (await request.json()) as HandleUploadBody;
    try {
      const result = await handleUpload({
        body,
        request,
        onBeforeGenerateToken: async (pathname) => {
          // Called when the admin's browser asks to upload: must be logged in.
          if (!(await isAdmin())) throw new Error("unauthorized");
          if (!/^(products|categories|reviews)\//.test(pathname)) throw new Error("bad path");
          return { allowedContentTypes: [...IMAGE_TYPES, ...AUDIO_TYPES], maximumSizeInBytes: MAX_BYTES, addRandomSuffix: true };
        },
      });
      return NextResponse.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "upload failed";
      return NextResponse.json({ error: msg }, { status: msg === "unauthorized" ? 401 : 400 });
    }
  }

  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (m === "none") {
    return NextResponse.json({ error: "Les envois de fichiers ne sont pas configurés : connectez un Blob Store dans Vercel (BLOB_READ_WRITE_TOKEN)." }, { status: 503 });
  }

  // Local development: save into public/uploads
  const form = await request.formData();
  const file = form.get("file");
  const folder = String(form.get("folder") ?? "");
  if (!(file instanceof File) || !/^(products|categories|reviews)$/.test(folder)) return NextResponse.json({ error: "Fichier manquant." }, { status: 400 });
  if (![...IMAGE_TYPES, ...AUDIO_TYPES].includes(file.type)) return NextResponse.json({ error: `Type de fichier non accepté (${file.type || "inconnu"}).` }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Fichier trop lourd (25 Mo max)." }, { status: 400 });

  const ext = (file.name.match(/\.([a-z0-9]{2,5})$/i)?.[1] ?? file.type.split("/")[1] ?? "bin").toLowerCase();
  const name = `${Date.now().toString(36)}-${randomBytes(4).toString("hex")}.${ext}`;
  const dir = join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/${folder}/${name}` });
}
