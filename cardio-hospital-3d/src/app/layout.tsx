import type { Metadata } from "next";
import "./globals.css";
import "./clinical.css";
import "./clinical-ecg.css";

export const metadata: Metadata = {
  title: "Cardio Hospital | Pediatric Cardiology Simulation",
  description: "An immersive pediatric cardiology clinical reasoning simulation.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
