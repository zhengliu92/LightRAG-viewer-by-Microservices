import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  publicRuntimeConfig: {
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://192.168.1.100:8090",
    ragUrl: process.env.NEXT_PUBLIC_RAG_URL || "http://192.168.1.100:8091",
  },
};

export default nextConfig;
