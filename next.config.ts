import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // L'aperçu des projets (/api/preview/<slug>/) dépend du slash final pour
  // que les URL relatives des sites générés se résolvent dans l'iframe.
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
