import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite carga archivos .wasm desde node_modules: no se debe empaquetar
  serverExternalPackages: ["@electric-sql/pglite"],
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
