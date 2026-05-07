import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plotline — AI Series Bible & Continuity Checker for Authors",
  description:
    "Stop continuity errors in your fiction series. Plotline reads your manuscripts and builds a living series bible automatically — characters, locations, lore, timelines.",
  openGraph: {
    title: "Plotline — AI Series Bible for Authors",
    description:
      "Auto-generated series bible + continuity checker for serial fiction authors.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
