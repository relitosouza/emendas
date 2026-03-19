/**
 * Sincroniza dados financeiros do Portal de Transparência de Osasco
 * 
 * Uso:
 *   npx tsx scripts/sync-financial-osasco.ts
 */

import { runFinancialSync } from "../lib/sync-logic";

async function main() {
    try {
        console.log("Iniciando sincronização através da biblioteca compartilhada...");
        const count = await runFinancialSync();
        console.log(`✓ Sincronização concluída: ${count} emendas atualizadas no banco de dados.`);
    } catch (error) {
        console.error("Erro fatal durante a sincronização:", error);
        process.exit(1);
    }
}

main();
