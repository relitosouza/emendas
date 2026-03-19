import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import VLibras from "@/components/shared/vlibras";
import AccessibilityBar from "@/components/shared/accessibility-bar";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://emendas.osasco.sp.gov.br";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Portal das Emendas — Prefeitura de Osasco",
    template: "%s | Portal das Emendas de Osasco",
  },
  description:
    "Acompanhe em tempo real a execução das emendas parlamentares da Câmara Municipal de Osasco. Transparência total sobre reservas, empenhos, liquidações e pagamentos.",
  keywords: [
    "emendas parlamentares",
    "transparência pública",
    "Osasco",
    "Câmara Municipal",
    "orçamento público",
    "execução financeira",
    "portal transparência",
    "vereadores Osasco",
  ],
  authors: [{ name: "Prefeitura Municipal de Osasco" }],
  creator: "Prefeitura Municipal de Osasco",
  publisher: "Prefeitura Municipal de Osasco",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName: "Portal das Emendas de Osasco",
    title: "Portal das Emendas — Prefeitura de Osasco",
    description:
      "Acompanhe em tempo real a execução das emendas parlamentares da Câmara Municipal de Osasco.",
    images: [
      {
        url: "/brasao-osasco.png",
        width: 512,
        height: 512,
        alt: "Brasão da Prefeitura Municipal de Osasco",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Portal das Emendas — Prefeitura de Osasco",
    description:
      "Acompanhe em tempo real a execução das emendas parlamentares da Câmara Municipal de Osasco.",
    images: ["/brasao-osasco.png"],
  },
  icons: {
    icon: "/brasao-osasco.ico",
    apple: "/brasao-osasco.png",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "GovernmentOrganization",
  name: "Prefeitura Municipal de Osasco",
  url: siteUrl,
  logo: `${siteUrl}/brasao-osasco.png`,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Osasco",
    addressRegion: "SP",
    addressCountry: "BR",
  },
  sameAs: ["https://www.osasco.sp.gov.br"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body
        className={`${plusJakarta.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {/* Skip navigation — eMAG 2.1 / WCAG 2.4.1 */}
        <a href="#conteudo-principal" className="skip-link">
          Pular para o conteúdo principal
        </a>
        <AccessibilityBar />
        <div id="conteudo-principal" tabIndex={-1}>
          {children}
        </div>
        <VLibras />
      </body>
    </html>
  );
}
