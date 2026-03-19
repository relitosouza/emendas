"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
    { href: "/", label: "Painel" },
    { href: "/projetos", label: "Emendas" },
];

export default function Navbar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    return (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group" aria-label="Portal das Emendas — Página inicial">
                    <div className="w-10 h-10 flex items-center justify-center shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/brasao-osasco.png"
                            alt="Brasão da Prefeitura Municipal de Osasco"
                            className="h-full w-full object-contain drop-shadow"
                        />
                    </div>
                    <div>
                        <span className="block text-sm font-bold uppercase tracking-tight leading-tight">Portal das Emendas</span>
                        <span className="block text-[10px] text-slate-500 uppercase font-medium">Prefeitura Municipal de Osasco</span>
                    </div>
                </Link>

                {/* Desktop Nav */}
                <nav aria-label="Navegação principal" className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-full">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            aria-current={isActive(link.href) ? "page" : undefined}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${
                                isActive(link.href)
                                    ? "bg-white shadow-sm font-semibold text-blue-500"
                                    : "text-slate-600 hover:text-blue-500"
                            }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Right side */}
                <div className="flex items-center gap-4">
                    <button
                        aria-label="Notificações"
                        className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                    >
                        <span className="material-symbols-outlined" aria-hidden="true">notifications</span>
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white">
                            <span className="sr-only">Novas notificações disponíveis</span>
                        </span>
                    </button>
                    <div
                        className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-full"
                        aria-label="Status do sistema: Online — Beta Teste"
                    >
                        <span className="w-2 h-2 bg-emerald-500 rounded-full" aria-hidden="true"></span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500" aria-hidden="true">Sistema Online</span>
                        <span className="text-[11px] font-black uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full" aria-hidden="true">Beta Teste</span>
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        className="md:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-expanded={mobileOpen}
                        aria-controls="mobile-nav"
                        aria-label={mobileOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
                    >
                        <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
                            {mobileOpen ? "close" : "menu"}
                        </span>
                    </button>
                </div>
            </div>

            {/* Mobile Nav Dropdown */}
            <div
                id="mobile-nav"
                role="navigation"
                aria-label="Navegação mobile"
                hidden={!mobileOpen}
                className="md:hidden border-t border-slate-100 bg-white px-4 pb-4 pt-2 space-y-1"
            >
                {navLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        aria-current={isActive(link.href) ? "page" : undefined}
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${
                            isActive(link.href)
                                ? "bg-blue-50 font-semibold text-blue-600"
                                : "text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                        {link.label}
                    </Link>
                ))}
            </div>
        </header>
    );
}
