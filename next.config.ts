import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true, // Amplify handles CDN-level optimization
  },
};

export default nextConfig;
