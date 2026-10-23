import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Product images (max 5 MB) are uploaded through a Server Action.
    serverActions: { bodySizeLimit: "6mb" },
    // Pages opened in the last 30 s show again instantly instead of reloading.
    // Saving anything (server actions call revalidatePath) clears this cache.
    staleTimes: { dynamic: 30 },
    agentUpgrade: "security",
  },
  images: {
    remotePatterns: supabaseUrl
      ? [new URL(`${supabaseUrl}/storage/v1/object/public/**`)]
      : [],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
