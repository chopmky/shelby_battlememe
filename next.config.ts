import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.shelbynet.shelby.xyz',
        pathname: '/shelby/v1/blobs/**',
      },
    ],
  },
  transpilePackages: [
    '@aptos-labs/wallet-adapter-react',
    '@aptos-labs/wallet-adapter-core',
    '@aptos-labs/wallet-standard',
    '@aptos-labs/ts-sdk',
    '@aptos-connect/wallet-adapter-plugin',
    'petra-plugin-wallet-adapter',
  ],
  turbopack: {},
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve?.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    return config
  },
};

export default nextConfig;
