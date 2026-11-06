import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export type DB = NodePgDatabase<typeof schema>;

/**
 * Conexión a la base de datos.
 * - Con DATABASE_URL: PostgreSQL de verdad (Neon, Supabase, local...).
 * - Sin DATABASE_URL: PGlite, un PostgreSQL que corre dentro del proyecto y
 *   guarda los datos en la carpeta .data/. Cero configuración para desarrollar.
 * En los dos casos las migraciones se aplican solas la primera vez.
 */

const MIGRATIONS = path.join(process.cwd(), "drizzle");

async function connect(): Promise<DB> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    const { Pool } = await import("pg");
    const db = drizzle(new Pool({ connectionString: url, max: 5 }), { schema });
    await migrate(db, { migrationsFolder: MIGRATIONS });
    return db as DB;
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const dir = process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite");
  fs.mkdirSync(dir, { recursive: true });
  const client = new PGlite(dir);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS });
  // Las dos versiones tienen la misma API de consultas; se usa un solo tipo.
  return db as unknown as DB;
}

// Una sola conexión aunque Next recargue los módulos en desarrollo
const g = globalThis as unknown as { __corteDb?: Promise<DB> };

export function getDb(): Promise<DB> {
  if (!g.__corteDb) {
    g.__corteDb = connect().catch((e) => {
      g.__corteDb = undefined;
      throw e;
    });
  }
  return g.__corteDb;
}

export { schema };
