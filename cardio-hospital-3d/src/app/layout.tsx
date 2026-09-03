import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./clinical.css";
import "./clinical-ecg.css";
import "./mobile.css";

export const metadata: Metadata = {
  title: "Pediatric Hospital | Clinical Simulation",
  description: "An immersive pediatric clinical reasoning simulation.",
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
      <body>{children}</body>
    </html>
  );
}
