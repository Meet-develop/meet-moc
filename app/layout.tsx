import type { Metadata, Viewport } from "next";
import { Sora, Space_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Meet & Moc",
  description: "Smart event coordination with friend-first scheduling.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Meet & Moc",
  },
  icons: {
    icon: [
      { url: "/pwa-icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/line_120.png", sizes: "120x120", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#ff6b4a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,300..700,0..1,0"
        />
      </head>
      <body
        className={`${sora.variable} ${spaceMono.variable} bg-[var(--background)] antialiased pb-24 md:pb-0`}
      >
        <Providers>
          {children}
          <MobileBottomNav />
        </Providers>
      </body>
    </html>
  );
}
