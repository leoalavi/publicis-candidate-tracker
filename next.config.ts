import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Stop `next dev` from generating an AGENTS.md file (instructions for AI
  // coding tools). It isn't needed to run or understand this app.
  agentRules: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
