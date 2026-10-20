import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // Render terminates TLS at its proxy, so allow Server Actions from the public app host.
    // The list is intentionally exact; do not use a wildcard for the public workspace.
    serverActions: {
      allowedOrigins: ['clubpulse-live.onrender.com'],
    },
  },
};

export default nextConfig;
