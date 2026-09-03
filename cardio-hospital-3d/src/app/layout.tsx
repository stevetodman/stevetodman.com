import type { Metadata } from "next";
import "./globals.css";
import "./clinical.css";
import "./clinical-ecg.css";

export const metadata: Metadata = {
  title: "Pediatric Hospital | Clinical Simulation",
  description: "A persistent pediatric hospital clinical reasoning simulation.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
