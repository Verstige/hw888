import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "HW888 — Holistic World",
  description: "Sales platform for Holistic World field teams",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0D1F15",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {/* Halo background */}
          <div className="halo-bg">
            <div className="halo-orb halo-orb-center" />
            <div className="halo-orb halo-orb-gold" />
          </div>
          {/* Content */}
          <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
