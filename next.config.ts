import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // playwright ships a native binary + dynamic requires that Next's bundler
  // shouldn't try to trace/bundle — keep it as a plain runtime dependency.
  serverExternalPackages: ["playwright"],
};

export default nextConfig;
