import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

/**
 * One family for everything, per §5. Plus Jakarta Sans is geometric with a
 * heavy weight that sits naturally next to the wordmark's grotesque, and it
 * avoids Inter — the default every other product reaches for.
 *
 * next/font self-hosts the files at build time and applies font-display: swap,
 * so there is no request to Google at runtime.
 */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gruhaflow.vercel.app"),
  title: {
    default: "The Urban Firm — property, management, development and interiors",
    template: "%s — The Urban Firm",
  },
  description:
    "Buy, rent and lease property across Hyderabad, and stay with us afterwards for property management, site development, interiors and home services.",
  icons: {
    icon: [
      { url: "/brand/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "The Urban Firm",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
