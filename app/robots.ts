import { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://emendas.osasco.sp.gov.br";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: ["/", "/projetos", "/projetos/"],
                disallow: [
                    "/admin/",        // Área administrativa
                    "/api/",          // Endpoints internos
                    "/projetos/*/relatorio", // Relatórios (conteúdo duplicado)
                ],
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
        host: siteUrl,
    };
}
