import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import type { CSSProperties } from "react";
import { getMenu } from "@/lib/menu/data";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getMenu();
  const base = settings.publicUrl || process.env.NEXT_PUBLIC_SITE_URL;
  return {
    title: { default: `${settings.restaurantName} — Menú`, template: `%s · ${settings.restaurantName}` },
    description: settings.tagline || `Menú digital de ${settings.restaurantName}`,
    metadataBase: base ? new URL(base) : undefined,
    openGraph: { type: "website", siteName: settings.restaurantName, locale: "es_MX" },
  };
}

export const viewport: Viewport = {
  themeColor: "#0A2A36",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { settings } = await getMenu();
  const t = settings.theme;
  const style = {
    "--brand": t.primary,
    "--brand-dark": t.primaryDark,
    "--accent": t.accent,
    "--surface": t.surface,
  } as CSSProperties;

  return (
    <html lang="es-MX" className={`${inter.variable} ${playfair.variable} antialiased`} style={style}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
