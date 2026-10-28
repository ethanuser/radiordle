import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import CookieConsent from "@/components/CookieConsent";
import { SITE_URL, withBasePath } from "@/lib/paths";

// Body + display font — a sober, report-like grotesque
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Monospace for report labels, case metadata and DICOM-style annotations
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const DESCRIPTION =
  "Daily radiology puzzles and configurable teaching sessions: identify the diagnosis from the image with progressive findings.";

export const metadata: Metadata = {
  title: {
    default: "Radiordle",
    template: "%s | Radiordle",
  },
  description: DESCRIPTION,
  keywords: ["radiology", "medical imaging", "radiology education", "medical quiz", "teaching cases", "diagnostic imaging"],
  category: "Education",
  metadataBase: new URL(SITE_URL),
  other: {
    "theme-color": "#0c0c0d",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black",
  },
  openGraph: {
    title: "Radiordle",
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Radiordle",
    locale: "en_US",
    type: "website",
  },
  icons: {
    icon: [
      { url: withBasePath("/favicon.png"), type: "image/png" },
      { url: withBasePath("/icon.svg"), type: "image/svg+xml" },
    ],
    apple: withBasePath("/apple-touch-icon.png"),
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plexSans.variable} ${plexMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
