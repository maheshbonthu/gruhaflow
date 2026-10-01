import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GruhaFlow — real estate sales to Gruha Pravesham to maintenance",
  description:
    "Tele-calling CRM, post-booking handover tracking and apartment maintenance in one platform. Admins control everything; buyers see their own status live.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
