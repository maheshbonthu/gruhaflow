import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["mongodb", "bcryptjs"],
  images: {
    // Placeholder photography only. Every URL is registered in
    // src/data/placeholders.ts and is meant to be replaced before launch.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
