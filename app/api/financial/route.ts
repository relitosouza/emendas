import { NextResponse } from "next/server";
import { upsertFinancialData } from "@/lib/json-storage";
import { isAuthenticated, unauthorizedResponse } from "@/lib/auth";

export async function POST(request: Request) {
    if (!(await isAuthenticated())) return unauthorizedResponse();

    try {
        const body = await request.json();
        const { amendmentId, empenhado, liquidado, pago, reservado } = body;

        if (!amendmentId) {
            return NextResponse.json({ error: "amendmentId is required" }, { status: 400 });
        }

        // Only include fields that were explicitly sent in the request body.
        // Omitting a field here means upsertFinancialData will preserve the existing value.
        const updateData: Record<string, string> = {};
        if (empenhado !== undefined) updateData.empenhado = empenhado;
        if (liquidado !== undefined) updateData.liquidado = liquidado;
        if (pago !== undefined) updateData.pago = pago;
        if (reservado !== undefined) updateData.reservado = reservado;

        await upsertFinancialData(null, "", amendmentId, updateData);

        return NextResponse.json({ success: true });
    } catch {
        console.error("Error saving financial data");
        return NextResponse.json({ error: "Falha ao salvar dados financeiros" }, { status: 500 });
    }
}
