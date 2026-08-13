import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/data/:path*",
        destination: `${backendUrl}/data/:path*`,
      },
      {
        source: "/health",
        destination: `${backendUrl}/health`,
      },
    ];
  },
};

export default nextConfig;
