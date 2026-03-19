import { Pool } from "pg";

let _pool: Pool | null = null;

export function getPool(): Pool {
    if (!_pool) {
        _pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DATABASE_SSL === "true"
            ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false" }
            : undefined,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        });

        _pool.on("error", (err) => {
            console.error("[db] Unexpected pool error:", err);
        });
    }
    return _pool;
}
