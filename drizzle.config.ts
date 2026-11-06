import { defineConfig } from "drizzle-kit";

// Solo se usa para generar migraciones: `npm run db:generate`
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
});
