import Navbar from "@/components/shared/navbar";
import Link from "next/link";
import { WizardForm } from "@/components/admin/wizard-form";

export default function WizardPage() {
    return (
        <div className="flex flex-col min-h-screen bg-[#f8fafc] font-sans text-slate-800 antialiased">
            <Navbar />

            <main className="flex-1">
                <div className="mx-auto max-w-[1400px] p-6 lg:p-10 space-y-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-2">
                                <Link href="/admin/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
                                <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                                <span className="text-slate-700 font-bold">Nova Emenda</span>
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900">Cadastrar Nova Emenda</h1>
                            <p className="text-sm text-slate-500 mt-0.5">Preencha os dados da emenda parlamentar passo a passo.</p>
                        </div>
                        <Link
                            href="/admin/dashboard"
                            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                            Voltar ao Painel
                        </Link>
                    </div>

                    {/* Form */}
                    <WizardForm />
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white px-6 py-8 lg:px-8">
                <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 md:flex-row">
                    <p className="font-mono text-xs text-slate-400">© 2026 Portal das Emendas Osasco • Painel Administrativo</p>
                    <div className="flex gap-6 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        <a href="#" className="transition-colors hover:text-blue-600">Transparência</a>
                        <a href="#" className="transition-colors hover:text-blue-600">Termos</a>
                        <a href="#" className="transition-colors hover:text-blue-600">Contato</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
