import type { NextConfig } from "next";

/**
 * Export statique conditionnel : activé par NEXT_OUTPUT=export pour le
 * déploiement GitHub Pages (prévisualisation). La cible de production
 * demeure Vercel (CLAUDE.md §4), sans export ni basePath.
 */
const estExport = process.env.NEXT_OUTPUT === "export";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(estExport
    ? {
        output: "export" as const,
        basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
