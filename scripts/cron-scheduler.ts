/**
 * Agendador de tarefas para execução em servidor próprio
 * Substitui o sistema de cron da Vercel por um agendador baseado em node-cron
 *
 * Uso:
 *   npx tsx scripts/cron-scheduler.ts
 *
 * Para executar em produção (recomendado via PM2 ou systemd):
 *   pm2 start "npx tsx scripts/cron-scheduler.ts" --name emendas-cron
 *
 * Alternativa via crontab do sistema operacional (Linux):
 *   Adicione a linha abaixo no crontab (crontab -e):
 *   0 9 * * * cd /caminho/para/o/projeto && npx tsx scripts/sync-financial-osasco.ts
 */

import cron from "node-cron";
import { runFinancialSync } from "../lib/sync-logic";

// Carregar variáveis de ambiente
import { readFileSync } from "fs";
try {
    const envFile = readFileSync(".env.local", "utf-8");
    for (const line of envFile.split("\n")) {
        const [key, ...rest] = line.split("=");
        if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
    }
} catch {
    // .env.local não encontrado, prosseguir com variáveis de ambiente do sistema
}

async function executarSincronizacao() {
    const agora = new Date().toISOString();
    console.log(`[cron] ${agora} — Iniciando sincronização financeira...`);
    try {
        const atualizado = await runFinancialSync();
        console.log(`[cron] Sincronização concluída: ${atualizado} emendas atualizadas.`);
    } catch (err) {
        console.error("[cron] Erro durante sincronização financeira:", err);
    }
}

// Executa diariamente às 09:00 (horário do servidor)
// Ajuste o fuso horário conforme necessário: cron.schedule("0 9 * * *", ..., { timezone: "America/Sao_Paulo" })
const job = cron.schedule("0 9 * * *", executarSincronizacao, {
    timezone: "America/Sao_Paulo",
});

console.log("[cron] Agendador iniciado. Sincronização financeira será executada diariamente às 09:00 (BRT).");
console.log("[cron] Pressione Ctrl+C para encerrar.");

// Encerrar graciosamente ao receber sinal de término
process.on("SIGTERM", () => {
    console.log("[cron] Recebido SIGTERM — encerrando agendador.");
    job.stop();
    process.exit(0);
});

process.on("SIGINT", () => {
    console.log("[cron] Recebido SIGINT — encerrando agendador.");
    job.stop();
    process.exit(0);
});
