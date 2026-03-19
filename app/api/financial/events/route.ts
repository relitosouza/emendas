import { NextResponse } from "next/server";
import { addFinancialEvent, updateFinancialEvent, deleteFinancialEvent, FinancialEventType } from "@/lib/json-storage";
import { isAuthenticated, unauthorizedResponse } from "@/lib/auth";

const VALID_TYPES: FinancialEventType[] = ["empenho", "liquidacao", "pagamento"];

export async function POST(request: Request) {
    if (!(await isAuthenticated())) return unauthorizedResponse();

    try {
        const body = await request.json();
        const { amendmentId, tipo, event } = body;

        if (!amendmentId || !tipo || !event) {
            return NextResponse.json({ error: "amendmentId, tipo, and event are required" }, { status: 400 });
        }
        if (!VALID_TYPES.includes(tipo)) {
            return NextResponse.json({ error: `tipo must be one of: ${VALID_TYPES.join(", ")}` }, { status: 400 });
        }

        const updated = await addFinancialEvent(amendmentId, tipo, event);
        return NextResponse.json({ success: true, record: updated }, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Falha ao adicionar evento" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    if (!(await isAuthenticated())) return unauthorizedResponse();

    try {
        const body = await request.json();
        const { amendmentId, tipo, eventId, event } = body;

        if (!amendmentId || !tipo || !eventId || !event) {
            return NextResponse.json({ error: "amendmentId, tipo, eventId, and event are required" }, { status: 400 });
        }
        if (!VALID_TYPES.includes(tipo)) {
            return NextResponse.json({ error: `tipo must be one of: ${VALID_TYPES.join(", ")}` }, { status: 400 });
        }

        const updated = await updateFinancialEvent(amendmentId, tipo, eventId, event);
        return NextResponse.json({ success: true, record: updated });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found")) {
            return NextResponse.json({ error: msg }, { status: 404 });
        }
        return NextResponse.json({ error: "Falha ao atualizar evento" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    if (!(await isAuthenticated())) return unauthorizedResponse();

    try {
        const body = await request.json();
        const { amendmentId, tipo, eventId } = body;

        if (!amendmentId || !tipo || !eventId) {
            return NextResponse.json({ error: "amendmentId, tipo, and eventId are required" }, { status: 400 });
        }
        if (!VALID_TYPES.includes(tipo)) {
            return NextResponse.json({ error: `tipo must be one of: ${VALID_TYPES.join(", ")}` }, { status: 400 });
        }

        const updated = await deleteFinancialEvent(amendmentId, tipo, eventId);
        return NextResponse.json({ success: true, record: updated });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found")) {
            return NextResponse.json({ error: msg }, { status: 404 });
        }
        return NextResponse.json({ error: "Falha ao remover evento" }, { status: 500 });
    }
}
