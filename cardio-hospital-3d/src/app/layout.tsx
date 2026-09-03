import type { Metadata, Viewport } from "next";
import PwaClient from "@/components/pwa-client";
import "./globals.css";
import "./clinical.css";
import "./clinical-ecg.css";
import "./mobile.css";
import "./mobile-clinical.css";
import "./pager.css";

export const metadata: Metadata = {
  title: "Pediatric Hospital | Clinical Simulation",
  applicationName: "Pediatric Hospital",
  description: "An immersive pediatric clinical reasoning simulation.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/hospital-icon.svg",
  },
  appleWebApp: {
    capable: true,
    title: "Pediatric Hospital",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b1215",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <PwaClient />
      </body>
    </html>
  );
}
