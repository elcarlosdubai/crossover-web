import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/consulta/", "/recibo/"],
      },
    ],
    sitemap: "https://www.crossoverrd.com/sitemap.xml",
  };
}
