import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    // Explicitly expose the environment variable to both server and client
    AIP_DATASTREAM_TOKEN: process.env.AIP_DATASTREAM_TOKEN || '',
  },
};

export default nextConfig;
