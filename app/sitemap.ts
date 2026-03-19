import { MetadataRoute } from "next";
import { getAmendmentsFromSheet } from "@/lib/json-storage";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://emendas.osasco.sp.gov.br";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date();

    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: siteUrl,
            lastModified: now,
            changeFrequency: "daily",
            priority: 1.0,
        },
        {
            url: `${siteUrl}/projetos`,
            lastModified: now,
            changeFrequency: "daily",
            priority: 0.9,
        },
    ];

    try {
        const amendments = await getAmendmentsFromSheet();
        const dynamicRoutes: MetadataRoute.Sitemap = amendments.map((a) => ({
            url: `${siteUrl}/projetos/${a.id}`,
            lastModified: now,
            changeFrequency: "weekly" as const,
            priority: 0.7,
        }));
        return [...staticRoutes, ...dynamicRoutes];
    } catch {
        return staticRoutes;
    }
}
