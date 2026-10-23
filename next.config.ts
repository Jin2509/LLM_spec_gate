import type { NextConfig } from "next";

// spec_gate_backend (FastAPI). /api/backend/* is proxied there; every other /api route stays local.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  async rewrites() {
    return [{ source: "/api/backend/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
};

export default nextConfig;
