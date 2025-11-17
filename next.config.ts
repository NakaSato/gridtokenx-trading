import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "raw.githubusercontent.com", // for GitHub-hosted token logos
      "tomato-rear-quokka-6.mypinata.cloud", // for your Pinata-hosted assets
      "arweave.net", // common for Solana logos
      "shdw.drive.genesysgo.net", // optional: for Shadow Drive if used
    ],
    unoptimized: true,
    formats: [],
  },
  experimental: {
    turbo: {
      root: path.resolve(__dirname),
    },
  },
};

export default nextConfig;
