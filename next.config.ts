import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  // Production builds MUST fail on TypeScript errors — never silently ship broken types.
  typescript: {
    ignoreBuildErrors: false,
  },
  // Compress responses in production.
  compress: true,
  // Security headers applied via Caddy as well; this is defense-in-depth.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
