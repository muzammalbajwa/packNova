import type { Metadata, Viewport } from "next";
import DebugOverlay from "@/components/ui/DebugOverlay";
import { site } from "@/content/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.brand.url),
  title: site.seo.title,
  description: site.seo.description,
  openGraph: {
    type: "website",
    siteName: site.brand.name,
    title: site.seo.title,
    description: site.seo.description,
    images: [{ url: site.seo.ogImage, width: 1200, height: 630, alt: site.brand.tagline }],
  },
  twitter: {
    card: "summary_large_image",
    title: site.seo.title,
    description: site.seo.description,
    images: [site.seo.ogImage],
  },
};

export const viewport: Viewport = {
  themeColor: "#F5F0E8",
  width: "device-width",
  initialScale: 1,
};

// Fonts, colors and layout belong to the templates (src/templates/<name>); the root only provides the shell.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={site.lang} dir={site.dir} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        {children}
        <DebugOverlay />
      </body>
    </html>
  );
}
