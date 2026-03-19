import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Emendas Parlamentares",
    description:
        "Explore todas as emendas parlamentares da Câmara Municipal de Osasco. Filtre por setor, status e valor. Transparência total sobre os investimentos públicos.",
    openGraph: {
        title: "Emendas Parlamentares | Portal das Emendas de Osasco",
        description:
            "Explore todas as emendas parlamentares da Câmara Municipal de Osasco. Filtre por setor, status e valor.",
        images: [{ url: "/brasao-osasco.png", width: 512, height: 512 }],
    },
    alternates: {
        canonical: "/projetos",
    },
};

export default function ProjetosLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
