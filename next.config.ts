import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/test',
        destination: '/',
        permanent: false,
      },
      {
        source: '/gratuit',
        destination: '/',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
