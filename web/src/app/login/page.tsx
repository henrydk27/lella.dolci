"use client";

import { useActionState } from "react";
import { entrar } from "./actions";
import { Campo } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";
import { Cartao } from "@/components/ui/Cartao";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(entrar, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-fundo px-4">
      <Cartao className="w-full max-w-sm">
        <h1 className="mb-1 font-titulo text-3xl text-terracota-vibrante">Lella Dolci</h1>
        <p className="mb-6 text-sm text-texto-suave">Entre para acessar o controle de vendas</p>

        <form action={formAction} className="space-y-4">
          <Campo rotulo="Usuário" name="usuario" autoComplete="username" required />
          <Campo rotulo="Senha" name="senha" type="password" autoComplete="current-password" required />
          {state?.erro && <p className="text-sm font-semibold text-alerta">{state.erro}</p>}
          <Botao type="submit" disabled={pending} className="w-full">
            {pending ? "Entrando..." : "Entrar"}
          </Botao>
        </form>
      </Cartao>
    </div>
  );
}
