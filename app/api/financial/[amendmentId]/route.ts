import { NextResponse } from "next/server";
import { getFinancialRecord } from "@/lib/json-storage";

interface RouteParams {
    params: Promise<{ amendmentId: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
    const { amendmentId } = await params;

    try {
        const record = await getFinancialRecord(amendmentId);
        if (!record) {
            return NextResponse.json({
                amendmentId,
                empenhado: "0",
                liquidado: "0",
                pago: "0",
                reservado: "0",
                empenhos: [],
                liquidacoes: [],
                pagamentos: [],
                updatedAt: "",
            });
        }
        return NextResponse.json({
            ...record,
            empenhos: record.empenhos ?? [],
            liquidacoes: record.liquidacoes ?? [],
            pagamentos: record.pagamentos ?? [],
        });
    } catch {
        return NextResponse.json({ error: "Falha ao buscar dados financeiros" }, { status: 500 });
    }
}
