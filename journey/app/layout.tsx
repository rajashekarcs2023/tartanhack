import React from "react"
import type { Metadata, Viewport } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";
import { JourneyProvider } from "@/store/journey-store";

const pixel = Press_Start_2P({ weight: "400", subsets: ["latin"], variable: "--font-pixel" });

export const metadata: Metadata = { title: "Journey - Financial RPG", description: "A JRPG-styled financial decision companion" };
export const viewport: Viewport = { themeColor: "#2d5a1e", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={pixel.variable}>
      <body className="font-pixel antialiased" style={{ fontFamily: "'Press Start 2P', monospace" }}>
        <JourneyProvider>{children}</JourneyProvider>
      </body>
    </html>
  );
}
