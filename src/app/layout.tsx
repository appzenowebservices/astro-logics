import "../styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { SessionProvider } from "next-auth/react";
// import TheatreStudio from "./components/TheatreStudio";
// import TheatreStudio from '@/components/TheatreStudio'; // Adjust path as needed
export const metadata: Metadata = {
  title: "Astrologics",
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
    { rel: "icon", url: "/astrologics_logo.png", type: "image/png" },
    { rel: "apple-touch-icon", url: "/astrologics_logo.png" },
    { rel: "icon", url: "/favicon.ico" },
  ],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <SessionProvider>
          {/* <TheatreStudio /> */}
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
