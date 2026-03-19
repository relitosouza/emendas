import { NextRequest, NextResponse } from "next/server";
import { appendAmendmentToSheet, getAmendmentsFromSheet, deleteAmendmentFromSheet, updateAmendmentInSheet } from "@/lib/json-storage";
import { isAuthenticated, unauthorizedResponse } from "@/lib/auth";

export async function GET() {
    try {
        const amendments = await getAmendmentsFromSheet();
        return NextResponse.json(amendments);
    } catch (error: unknown) {
        console.error("API GET Error:", error);
        const message = error instanceof Error ? error.message : "";
        if (message.includes("Missing")) {
            return NextResponse.json({ warning: "Missing Credentials", data: [] });
        }
        return NextResponse.json({ error: "Failed to fetch amendments" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    if (!(await isAuthenticated())) return unauthorizedResponse();

    try {
        const body = await req.json();

        if (!body.objeto && !body.title) {
            return NextResponse.json({ error: "Missing required fields: objeto/title is required" }, { status: 400 });
        }

        const amendment = {
            ...body,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
        };

        try {
            await appendAmendmentToSheet(amendment);
            return NextResponse.json({ success: true, amendment }, { status: 201 });
        } catch (sheetError: unknown) {
            console.error("Google Sheets Error during save:", sheetError);
            const message = sheetError instanceof Error ? sheetError.message : "";

            if (message.includes("Missing")) {
                console.warn("Falling back to simulated success for demo purposes (Credentials missing).");
                return NextResponse.json({
                    success: true,
                    amendment,
                    warning: "Data not saved to Sheet (Missing Credentials)."
                }, { status: 201 });
            }

            return NextResponse.json({ error: "Falha ao salvar dados" }, { status: 500 });
        }
    } catch {
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    if (!(await isAuthenticated())) return unauthorizedResponse();

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        try {
            await deleteAmendmentFromSheet(id);
            return NextResponse.json({ success: true });
        } catch (error: unknown) {
            console.error("Delete Error:", error);
            const message = error instanceof Error ? error.message : "";
            if (message.includes("Missing")) {
                return NextResponse.json({ success: true, warning: "Missing Credentials" });
            }
            if (message.includes("Amendment not found") || message.includes("No data found")) {
                return NextResponse.json({ success: true, warning: "Amendment not found in Sheets, but proceeding." });
            }
            return NextResponse.json({ error: "Falha ao excluir" }, { status: 500 });
        }
    } catch {
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    if (!(await isAuthenticated())) return unauthorizedResponse();

    try {
        const body = await req.json();

        if (!body.id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        try {
            await updateAmendmentInSheet(body.id, body);
            return NextResponse.json({ success: true, amendment: body });
        } catch (error: unknown) {
            console.error("Update Error:", error);
            const message = error instanceof Error ? error.message : "";
            if (message.includes("Amendment not found")) {
                return NextResponse.json({ error: "Amendment not found" }, { status: 404 });
            }
            return NextResponse.json({ error: "Falha ao atualizar" }, { status: 500 });
        }
    } catch {
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
    }
}
