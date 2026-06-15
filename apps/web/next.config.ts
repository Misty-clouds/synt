import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Hide the dev-tools floating button so it can't overlap UI during demos.
  devIndicators: false,
  // Emit a self-contained server bundle for small Docker images.
  output: "standalone",
  // In a monorepo, trace dependencies from the workspace root so the
  // standalone output includes hoisted node_modules.
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
