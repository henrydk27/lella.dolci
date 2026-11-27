"use client";

import { useState, useTransition } from "react";
import { Botao } from "@/components/ui/Botao";
import { enviarAlertaDevedoresAction } from "./actions";

export function BotaoEnviarAlertaDevedores() {
  const [pendente, startTransition] = useTransition();
  const [mensagem, setMensagem] = useState<{ ok: boolean; texto: string } | null>(null);

  function enviar() {
    setMensagem(null);
    startTransition(async () => {
      const resultado = await enviarAlertaDevedoresAction();
      if (resultado.ok) {
        setMensagem({
          ok: true,
          texto:
            resultado.enviados === 0
              ? "E-mail enviado — nenhum pedido em aberto no momento."
              : `E-mail enviado com ${resultado.enviados} cliente(s) devendo, totalizando R$ ${resultado.totalGeral.toFixed(2)}.`,
        });
      } else {
        setMensagem({ ok: false, texto: `Falha ao enviar: ${resultado.erro}` });
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Botao variante="fantasma" onClick={enviar} disabled={pendente}>
        {pendente ? "Enviando..." : "Enviar e-mail de pedidos em aberto"}
      </Botao>
      {mensagem && (
        <p className={`text-sm ${mensagem.ok ? "text-salvia" : "text-alerta"}`}>{mensagem.texto}</p>
      )}
    </div>
  );
}
