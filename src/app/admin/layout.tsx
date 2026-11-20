import type { Metadata, Viewport } from "next";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/jost/300.css";
import "@fontsource/jost/400.css";
import "@fontsource/tajawal/arabic-400.css";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Administration", template: "%s · Admin AFNAR" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#f8f5f0", width: "device-width", initialScale: 1, viewportFit: "cover" };

/** Admin dashboard (French). Separate from the shop: its own root layout, no cart, no shop header. */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" dir="ltr">
      <body className="min-h-screen bg-[#f3efe8] font-sans text-ink">{children}</body>
    </html>
  );
}
