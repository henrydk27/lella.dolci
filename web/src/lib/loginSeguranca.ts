import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tentativasLogin } from "@/db/schema";

const MAX_TENTATIVAS = 5;
const BLOQUEIO_MINUTOS = 15;

function nowIso(): string {
  return new Date().toISOString();
}

export async function verificarBloqueio(ip: string): Promise<{ bloqueado: boolean; minutosRestantes?: number }> {
  const [linha] = await db.select().from(tentativasLogin).where(eq(tentativasLogin.ip, ip));
  if (!linha?.bloqueadoAte) return { bloqueado: false };

  const restanteMs = new Date(linha.bloqueadoAte).getTime() - Date.now();
  if (restanteMs <= 0) return { bloqueado: false };

  return { bloqueado: true, minutosRestantes: Math.ceil(restanteMs / 60000) };
}

export async function registrarTentativaFalha(ip: string) {
  const [linha] = await db.select().from(tentativasLogin).where(eq(tentativasLogin.ip, ip));
  const tentativas = (linha?.tentativas ?? 0) + 1;
  const bloqueadoAte =
    tentativas >= MAX_TENTATIVAS ? new Date(Date.now() + BLOQUEIO_MINUTOS * 60000).toISOString() : null;

  await db
    .insert(tentativasLogin)
    .values({ ip, tentativas, bloqueadoAte, ultimaTentativa: nowIso() })
    .onConflictDoUpdate({
      target: tentativasLogin.ip,
      set: { tentativas, bloqueadoAte, ultimaTentativa: nowIso() },
    });
}

export async function registrarTentativaSucesso(ip: string) {
  await db
    .insert(tentativasLogin)
    .values({ ip, tentativas: 0, bloqueadoAte: null, ultimaTentativa: nowIso() })
    .onConflictDoUpdate({
      target: tentativasLogin.ip,
      set: { tentativas: 0, bloqueadoAte: null, ultimaTentativa: nowIso() },
    });
}
