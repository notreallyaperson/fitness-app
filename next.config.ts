import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle (.next/standalone) so the Docker
  // runtime image only needs the traced dependencies, not all of node_modules.
  output: "standalone",
};

export default nextConfig;
