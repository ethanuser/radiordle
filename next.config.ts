import type { NextConfig } from "next";

// Deployed as a static site on GitHub Pages at https://ethanuser.github.io/radiordle.
// NEXT_PUBLIC_BASE_PATH is set to "/radiordle" by the Pages workflow and left
// empty for local development (http://localhost:3000).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: {
    // Static export has no image optimizer; puzzle images are served as-is.
    unoptimized: true,
  },
};

export default nextConfig;
