import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  output: "standalone",
  env: {
    NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID:
      process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID,
    NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID:
      process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN:
      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "example.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
