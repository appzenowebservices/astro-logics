import "../styles/globals.css";

import { type Metadata } from "next";
import {
  Poppins,
  Kalam,
  Tiro_Devanagari_Hindi,
  Geist_Mono,
} from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { SessionProvider } from "next-auth/react";
import { ActiveProfileProvider } from "./components/profile/ActiveProfileProvider";
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
     --font-hand     → handwritten display (globals.css --font-serif / --font-poster / --font-script)
     --font-devanagari → Hindi accents     (globals.css --font-hindi)
     --font-code     → mono labels + code   (globals.css --font-mono)

   To experiment: swap the family below, e.g.
     Poppins → Plus_Jakarta_Sans | Manrope | Inter | Sora | Figtree
   ═══════════════════════════════════════════════════════════════════════════ */
const bodyFont = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-body",
});

/** Handwritten display face — supports Latin + Devanagari in one family. */
const handFont = Kalam({
  subsets: ["latin", "devanagari"],
  weight: ["300", "400", "700"],
  variable: "--font-hand",
});

/** Devanagari text face for Hindi accents and short content lines. */
const hindiFont = Tiro_Devanagari_Hindi({
  subsets: ["devanagari", "latin"],
  weight: "400",
  variable: "--font-devanagari",
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
      className={`${bodyFont.variable} ${handFont.variable} ${hindiFont.variable} ${codeFont.variable}`}
    >
      <body>
        <SessionProvider>
          {/* <TheatreStudio /> */}
          <TRPCReactProvider>
            <ActiveProfileProvider>{children}</ActiveProfileProvider>
          </TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
