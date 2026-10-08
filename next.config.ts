import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server in .next/standalone. scripts/finalize-standalone.mjs
  // then copies .next/static, public/ and prisma/ into it — Next deliberately
  // leaves those out, and the app does not work without them.
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  // Production builds MUST fail on TypeScript errors — never silently ship broken types.
  typescript: {
    ignoreBuildErrors: false,
  },
  // Compress responses in production.
  compress: true,

  // Keep Prisma out of the server bundle.
  //
  // The generated client resolves a native query engine by path at runtime.
  // Bundled, that resolution is performed against a synthetic module path and
  // fails at first use with "PrismaClient is unable to run in this browser
  // environment" — after the deploy has already been reported healthy. Marking
  // it external makes it a plain require() from node_modules, which is what the
  // standalone trace then copies across.
  serverExternalPackages: ["@prisma/client", "prisma"],

  // Security headers applied via the host's proxy as well; this is defense-in-depth.
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
