import { NextRequest, NextResponse } from "next/server";
import { generateSessionToken, verifyPassword } from "@/lib/auth";
import crypto from "crypto";

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const PENALTY_COOKIE = "login-penalty";

function getPenaltySecret(): string {
    return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "fallback-penalty";
}

function signPenalty(payload: string): string {
    return crypto.createHmac("sha256", getPenaltySecret()).update(payload).digest("hex");
}

function readPenaltyCookie(req: NextRequest): { count: number; blockedUntil: number } | null {
    const raw = req.cookies.get(PENALTY_COOKIE)?.value;
    if (!raw) return null;
    try {
        const [data, sig] = raw.split("|");
        if (signPenalty(data) !== sig) return null;
        return JSON.parse(Buffer.from(data, "base64").toString("utf-8"));
    } catch {
        return null;
    }
}

function makePenaltyCookieValue(count: number, blockedUntil: number): string {
    const data = Buffer.from(JSON.stringify({ count, blockedUntil })).toString("base64");
    return `${data}|${signPenalty(data)}`;
}

function setPenaltyCookie(response: NextResponse, count: number, blockedUntil: number) {
    const isProduction = process.env.NODE_ENV === "production";
    response.cookies.set(PENALTY_COOKIE, makePenaltyCookieValue(count, blockedUntil), {
        httpOnly: true,
        secure: isProduction,
        sameSite: "strict",
        path: "/api/auth",
        maxAge: BLOCK_DURATION_MS / 1000,
    });
}

export async function POST(req: NextRequest) {
    try {
        const penalty = readPenaltyCookie(req);
        const now = Date.now();

        // Block if still within penalty window
        if (penalty && penalty.blockedUntil > now) {
            const minutesLeft = Math.ceil((penalty.blockedUntil - now) / 60000);
            return NextResponse.json(
                { error: `Muitas tentativas. Tente novamente em ${minutesLeft} minuto(s).` },
                { status: 429 }
            );
        }

        const { email, password } = await req.json();

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            return NextResponse.json(
                { error: "Credenciais de admin não configuradas no servidor." },
                { status: 500 }
            );
        }

        if (email === adminEmail && verifyPassword(password, adminPassword)) {
            const token = generateSessionToken();
            const response = NextResponse.json({ success: true });

            response.cookies.set("admin-session", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                path: "/",
                maxAge: 60 * 60 * 8,
            });

            // Clear penalty cookie on successful login
            response.cookies.delete(PENALTY_COOKIE);

            return response;
        }

        // Increment failure count
        const currentCount = (penalty?.count ?? 0) + 1;
        const blockedUntil = currentCount >= MAX_ATTEMPTS ? now + BLOCK_DURATION_MS : 0;

        const response = NextResponse.json(
            { error: "E-mail ou senha incorretos." },
            { status: 401 }
        );
        setPenaltyCookie(response, currentCount, blockedUntil);
        return response;

    } catch {
        return NextResponse.json(
            { error: "Erro interno do servidor." },
            { status: 500 }
        );
    }
}
