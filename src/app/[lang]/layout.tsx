import type { Metadata } from "next";
import { Bodoni_Moda, Manrope } from "next/font/google";
import { notFound } from "next/navigation";
import { isLocale, locales } from "@/i18n/config";
import { skyTheme, themeToCss } from "@/lib/sky/theme";
import "../globals.css";

export const metadata: Metadata = {
  title: "Weather App",
  description: "The sky of any city, right now.",
};

// Latin-ext covers city names such as "Łódź".
const display = Bodoni_Moda({
  subsets: ["latin", "latin-ext"],
  variable: "--font-bodoni",
});
const sans = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-manrope",
});

// Golden hour, the sky in the design. Pages that know the real sky override it.
const DEFAULT_SKY = themeToCss(skyTheme(4, 0, false));

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <html lang={lang} className={`${display.variable} ${sans.variable}`}>
      <head>
        <style>{DEFAULT_SKY}</style>
      </head>
      <body className="min-h-dvh bg-linear-to-b from-(--sky-top) via-(--sky-mid) to-(--sky-bottom) text-(--ink-mid)">
        {children}
      </body>
    </html>
  );
}
