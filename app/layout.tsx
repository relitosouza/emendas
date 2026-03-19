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

export const metadata: Metadata = {
  title: "Portal das Emendas - Prefeitura Municipal de Osasco",
  description: "Portal de Transparência e Gestão de Emendas Parlamentares",
  icons: {
    icon: "/brasao-osasco.ico",
  },
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
