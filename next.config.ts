import type { NextConfig } from "next";
import { getEnv } from "./src/lib/env";

// Validate deployment configuration while Next.js loads its build config.
getEnv();

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
