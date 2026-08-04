import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";

/**
 * robots.txt généré (§7). L'interdiction d'indexation pré-lancement est
 * portée par la balise meta robots (layout), pas par ce fichier.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
