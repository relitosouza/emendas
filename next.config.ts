import type { NextConfig } from "next";

const securityHeaders = [
    // Impede que a página seja carregada dentro de iframes (clickjacking)
    { key: "X-Frame-Options", value: "SAMEORIGIN" },
    // Impede que o browser faça sniffing do Content-Type
    { key: "X-Content-Type-Options", value: "nosniff" },
    // Controla informações de referência enviadas ao navegar para outros sites
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // Restringe recursos que o browser pode carregar (CSP básico)
    {
        key: "Content-Security-Policy",
        value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval necessário para Next.js dev
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https://lh3.googleusercontent.com https://storage.googleapis.com https://i.imgur.com https://images.unsplash.com https://upload.wikimedia.org",
            "font-src 'self'",
            "connect-src 'self' https://vlibras.gov.br",
            "frame-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ].join("; "),
    },
    // Habilita proteção XSS do browser (legado, mas ainda útil em browsers antigos)
    { key: "X-XSS-Protection", value: "1; mode=block" },
    // Permissões de APIs do browser
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
];

const nextConfig: NextConfig = {
    headers: async () => [
        {
            source: "/:path*",
            headers: securityHeaders,
        },
    ],
};

export default nextConfig;
