import { NextResponse } from "next/server";
import { isAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { runFinancialSync } from "@/lib/sync-logic";
import { readJsonFile } from "@/lib/json-storage";

export async function GET() {
    try {
        const info = await readJsonFile<{ lastSync: string }>("sync_info.json");
        return NextResponse.json({ lastSync: info[0]?.lastSync || null });
    } catch {
        return NextResponse.json({ lastSync: null });
    }
}

export async function POST(request: Request) {
    const authHeader = request.headers.get("authorization");
    const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (!isCron && !(await isAuthenticated())) {
        return unauthorizedResponse();
    }

    try {
        console.log("[Sync] Iniciando sincronização financeira...");
        const updatedCount = await runFinancialSync();
        
        console.log(`[Sync] Sincronização concluída: ${updatedCount} emendas atualizadas.`);

        return NextResponse.json({
            success: true,
            message: "Sincronização concluída com sucesso",
            updatedCount
        });

    } catch (error) {
        console.error("Critical error during sync execution:", error);
        return NextResponse.json({ 
            success: false, 
            error: "Falha ao executar sincronização",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
