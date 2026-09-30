import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Em desenvolvimento local usa um arquivo SQLite (local.db).
// Em producao (Vercel), aponte DATABASE_URL para um banco Turso (libsql://...)
// e DATABASE_AUTH_TOKEN para o token gerado por `turso db tokens create`.
const client = createClient({
  url: process.env.DATABASE_URL ?? "file:local.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
