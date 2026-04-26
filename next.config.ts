import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    cpus: 1,
    workerThreads: true,
  },
};

export default nextConfig;
