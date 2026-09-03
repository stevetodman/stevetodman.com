import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/hospital",
  trailingSlash: true,
  reactStrictMode: true,
};

export default nextConfig;
