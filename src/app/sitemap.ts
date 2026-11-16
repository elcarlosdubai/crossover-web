import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://www.crossoverrd.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/colegio`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/instituto`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/infotep`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/inscripcion`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/deportes`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/noticias`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/nosotros`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/contacto`, changeFrequency: "monthly", priority: 0.7 },
  ];

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) return staticRoutes;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: noticias } = await supabase
      .from("noticias")
      .select("slug, created_at")
      .not("etiquetas", "cs", '{"SYSTEM_SLIDE"}')
      .order("created_at", { ascending: false })
      .limit(100);

    const newsRoutes: MetadataRoute.Sitemap = (noticias || [])
      .filter((n: any) => Boolean(n?.slug))
      .map((n: any) => ({
        url: `${BASE_URL}/noticias/${n.slug}`,
        lastModified: n.created_at ? new Date(n.created_at) : undefined,
        changeFrequency: "monthly",
        priority: 0.6,
      }));

    return [...staticRoutes, ...newsRoutes];
  } catch {
    return staticRoutes;
  }
}
