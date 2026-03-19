"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
    email: z
        .string()
        .nonempty("O e-mail é obrigatório.")
        .email("Informe um e-mail válido."),
    password: z
        .string()
        .nonempty("A senha é obrigatória.")
        .min(6, "A senha deve ter no mínimo 6 caracteres."),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [loginError, setLoginError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        mode: "onTouched",
    });

    const onSubmit = async (data: LoginForm) => {
        setLoading(true);
        setLoginError("");

        try {
            const res = await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await res.json();

            if (res.ok) {
                window.location.href = "/admin/dashboard";
            } else {
                setLoginError(result.error || "E-mail ou senha incorretos.");
                setLoading(false);
            }
        } catch {
            setLoginError("Erro ao conectar com o servidor.");
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 font-sans text-slate-800">
            <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05),0_2px_10px_-2px_rgba(0,0,0,0.03)] border border-slate-100">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-6 flex size-20 items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/brasao-osasco.png"
                            alt="Brasão de Osasco"
                            className="h-full w-full object-contain drop-shadow-md"
                        />
                    </div>
                    <h1 className="text-2xl font-heading font-bold text-slate-800">Portal das Emendas</h1>
                    <p className="text-sm text-slate-500">Prefeitura Municipal de Osasco</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                            E-mail
                        </label>
                        <input
                            type="email"
                            {...register("email")}
                            aria-invalid={!!errors.email}
                            className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-all ${
                                errors.email
                                    ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                    : "border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                            }`}
                            placeholder="seu@email.com"
                        />
                        {errors.email && (
                            <p className="mt-1 text-xs text-red-500 font-medium">{errors.email.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                            Senha
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                {...register("password")}
                                aria-invalid={!!errors.password}
                                className={`w-full rounded-lg border px-4 py-2.5 pr-10 text-sm outline-none transition-all ${
                                    errors.password
                                        ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                        : "border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                                }`}
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="mt-1 text-xs text-red-500 font-medium">{errors.password.message}</p>
                        )}
                    </div>

                    {loginError && (
                        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                            <p className="text-xs text-red-600 font-bold">{loginError}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : "Entrar"}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link href="/" className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">
                        Voltar para o Portal
                    </Link>
                </div>
            </div>
        </div>
    );
}
