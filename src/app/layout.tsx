import "../styles/globals.css";

import { type Metadata } from "next";
import { Manrope, Cormorant_Garamond, Geist_Mono } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { SessionProvider } from "next-auth/react";
// import TheatreStudio from "./components/TheatreStudio";
// import TheatreStudio from '@/components/TheatreStudio'; // Adjust path as needed
export const metadata: Metadata = {
  title: "Kaalvanta",
  description:
    "Unlock the secrets of your destiny with AI-powered astrology. Enter your birth details to receive a comprehensive life map revealing your personality, career path, relationships, and spiritual journey.",
  keywords: [
    "astrology",
    "AI astrology",
    "birth chart",
    "life map",
    "cosmic blueprint",
    "destiny",
    "zodiac",
  ],
  icons: [
    { rel: "icon", url: "/logo.png", type: "image/png" },
    { rel: "apple-touch-icon", url: "/logo.png" },
    { rel: "icon", url: "/favicon.ico" },
  ],
};

/* ═══════════════════════════════════════════════════════════════════════════
   FONT CONFIG — the only place typefaces are loaded.
   Each family publishes a CSS variable that src/styles/globals.css consumes,
   so swapping a typeface = changing one family here and nothing else.

     --font-body     → body copy + UI      (globals.css --font-sans)
     --font-display  → serif italic accents (globals.css --font-serif)
     --font-code     → mono labels + code   (globals.css --font-mono)

   To experiment: swap the family below, e.g.
     Manrope → Plus_Jakarta_Sans | Inter | Sora | Figtree
   ═══════════════════════════════════════════════════════════════════════════ */
const bodyFont = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
});

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const codeFont = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-code",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${displayFont.variable} ${codeFont.variable}`}
    >
      <body>
        <SessionProvider>
          {/* <TheatreStudio /> */}
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
