import { NextResponse } from "next/server";
import { getDashboardCards, saveDashboardCards, DashboardCard } from "@/lib/json-storage";
import { isAuthenticated, unauthorizedResponse } from "@/lib/auth";

export async function GET() {
    try {
        const cards = await getDashboardCards();
        return NextResponse.json(cards);
    } catch {
        console.error("Error fetching dashboard cards");
        return NextResponse.json([], { status: 200 });
    }
}

export async function POST(request: Request) {
    if (!(await isAuthenticated())) return unauthorizedResponse();

    try {
        const body = await request.json();
        const cards: DashboardCard[] = body.cards;

        if (!Array.isArray(cards)) {
            return NextResponse.json({ error: "cards must be an array" }, { status: 400 });
        }

        await saveDashboardCards(cards);
        return NextResponse.json({ success: true, count: cards.length });
    } catch {
        console.error("Error saving dashboard cards");
        return NextResponse.json({ error: "Falha ao salvar cards" }, { status: 500 });
    }
}
