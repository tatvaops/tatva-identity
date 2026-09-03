import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { AppProviders } from "@/components/providers/app-providers";
import { product } from "@/lib/config";
import { LOCALE_COOKIE, parseLocale } from "@/lib/i18n";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: product.name,
    template: `%s · ${product.name}`,
  },
  description: product.tagline,
};

export const viewport: Viewport = {
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  return (
    <html lang={locale}>
      <body className={`${inter.variable} font-sans`}>
        <AppProviders locale={locale}>{children}</AppProviders>
      </body>
    </html>
  );
}
