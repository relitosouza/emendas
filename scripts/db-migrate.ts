/**
 * Script de migração do banco de dados PostgreSQL
 * Cria as tabelas necessárias para o Portal de Emendas
 *
 * Uso: npx tsx scripts/db-migrate.ts
 */

import { Pool } from "pg";
import * as dotenv from "fs";

// Carregar variáveis de ambiente do .env.local se existir
try {
    const envFile = dotenv.readFileSync(".env.local", "utf-8");
    for (const line of envFile.split("\n")) {
        const [key, ...rest] = line.split("=");
        if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
    }
} catch {
    // .env.local não encontrado, ignorar
}

async function migrate() {
    if (!process.env.DATABASE_URL) {
        console.error("Erro: variável de ambiente DATABASE_URL não definida.");
        process.exit(1);
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    const client = await pool.connect();
    try {
        console.log("[migrate] Iniciando migração...");

        await client.query("BEGIN");

        // Tabela de emendas principais
        await client.query(`
            CREATE TABLE IF NOT EXISTS amendments (
                id TEXT PRIMARY KEY,
                data JSONB NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        // Tabela de emendas externas
        await client.query(`
            CREATE TABLE IF NOT EXISTS external_amendments (
                id TEXT PRIMARY KEY,
                data JSONB NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        // Tabela de registros financeiros com histórico de eventos
        await client.query(`
            CREATE TABLE IF NOT EXISTS financial_records (
                amendment_id TEXT PRIMARY KEY,
                empenhado TEXT NOT NULL DEFAULT '0',
                liquidado TEXT NOT NULL DEFAULT '0',
                pago TEXT NOT NULL DEFAULT '0',
                reservado TEXT NOT NULL DEFAULT '0',
                empenhos JSONB NOT NULL DEFAULT '[]',
                liquidacoes JSONB NOT NULL DEFAULT '[]',
                pagamentos JSONB NOT NULL DEFAULT '[]',
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        // Tabela de cards do dashboard
        await client.query(`
            CREATE TABLE IF NOT EXISTS dashboard_cards (
                id TEXT PRIMARY KEY,
                "order" INTEGER NOT NULL DEFAULT 0,
                data JSONB NOT NULL,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        // Tabela de controle de sincronização
        await client.query(`
            CREATE TABLE IF NOT EXISTS sync_info (
                id INTEGER PRIMARY KEY DEFAULT 1,
                last_sync TIMESTAMPTZ,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        // Índices para melhorar performance de consultas frequentes
        await client.query(`
            CREATE INDEX IF NOT EXISTS amendments_data_autor_idx
                ON amendments USING GIN ((data -> 'autor'))
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS amendments_updated_at_idx
                ON amendments (updated_at DESC)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS financial_records_updated_at_idx
                ON financial_records (updated_at DESC)
        `);

        await client.query("COMMIT");

        console.log("[migrate] Migração concluída com sucesso.");
        console.log("  ✓ Tabela: amendments");
        console.log("  ✓ Tabela: external_amendments");
        console.log("  ✓ Tabela: financial_records");
        console.log("  ✓ Tabela: dashboard_cards");
        console.log("  ✓ Tabela: sync_info");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("[migrate] Erro durante migração:", err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
