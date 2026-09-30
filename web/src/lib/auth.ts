import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const NOME_COOKIE = "lella_sessao";
const DURACAO_SESSAO = "12h";

function getSegredo() {
  const segredo = process.env.SESSION_SECRET;
  if (!segredo) {
    throw new Error("SESSION_SECRET nao configurado. Defina essa variavel de ambiente.");
  }
  return new TextEncoder().encode(segredo);
}

export function credenciaisValidas(usuario: string, senha: string): boolean {
  const usuarioEsperado = process.env.ADMIN_USER;
  const senhaEsperada = process.env.ADMIN_PASSWORD;
  if (!usuarioEsperado || !senhaEsperada) {
    throw new Error("ADMIN_USER / ADMIN_PASSWORD nao configurados.");
  }
  return usuario === usuarioEsperado && senha === senhaEsperada;
}

export async function criarSessao(usuario: string) {
  const token = await new SignJWT({ usuario })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(DURACAO_SESSAO)
    .sign(getSegredo());

  const store = await cookies();
  store.set(NOME_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function encerrarSessao() {
  const store = await cookies();
  store.delete(NOME_COOKIE);
}

export async function sessaoAtual() {
  const store = await cookies();
  const token = store.get(NOME_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSegredo());
    return payload as { usuario: string };
  } catch {
    return null;
  }
}

export async function verificarTokenEdge(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSegredo());
    return payload as { usuario: string };
  } catch {
    return null;
  }
}

export const NOME_COOKIE_SESSAO = NOME_COOKIE;
