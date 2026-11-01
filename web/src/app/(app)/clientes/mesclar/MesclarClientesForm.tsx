"use client";

import { useMemo, useState } from "react";
import { mesclarClientesAction } from "../actions";
import { Botao } from "@/components/ui/Botao";
import { Cartao } from "@/components/ui/Cartao";

interface ClienteParaMesclar {
  id: number;
  nome: string;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  notas: string | null;
  totalGasto: number;
  quantidadePedidos: number;
}

const CAMPOS_PREVIA: { chave: keyof ClienteParaMesclar; rotulo: string }[] = [
  { chave: "telefone", rotulo: "Telefone" },
  { chave: "email", rotulo: "E-mail" },
  { chave: "endereco", rotulo: "Endereço" },
];

export function MesclarClientesForm({ clientes }: { clientes: ClienteParaMesclar[] }) {
  const [busca, setBusca] = useState("");
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [principalId, setPrincipalId] = useState<number | null>(null);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return clientes;
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(termo) ||
        (c.telefone ?? "").toLowerCase().includes(termo) ||
        (c.email ?? "").toLowerCase().includes(termo)
    );
  }, [busca, clientes]);

  const selecionadosInfo = clientes.filter((c) => selecionados.includes(c.id));
  const duplicadosInfo = selecionadosInfo.filter((c) => c.id !== principalId);
  const principal = selecionadosInfo.find((c) => c.id === principalId) ?? null;

  function alternarSelecao(id: number) {
    setSelecionados((atual) => {
      const novo = atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id];
      if (!novo.includes(principalId ?? -1)) {
        setPrincipalId(novo[0] ?? null);
      }
      return novo;
    });
  }

  function valorMesclado(campo: keyof ClienteParaMesclar): string {
    if (!principal) return "-";
    const direto = principal[campo];
    if (typeof direto === "string" && direto.trim() !== "") return direto;
    const deDuplicado = duplicadosInfo.map((c) => c[campo]).find((v) => typeof v === "string" && v.trim() !== "");
    return typeof deDuplicado === "string" ? `${deDuplicado} (vindo de duplicado)` : "-";
  }

  return (
    <div className="space-y-6">
      <Cartao titulo="1. Selecione os clientes duplicados">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, telefone ou e-mail"
          className="mb-4 w-full rounded-full border border-borda bg-painel-claro px-4 py-2 text-sm"
        />
        <div className="max-h-96 overflow-y-auto rounded-xl border border-borda">
          {filtrados.length === 0 && (
            <p className="p-4 text-sm text-texto-suave">Nenhum cliente encontrado.</p>
          )}
          {filtrados.map((c) => (
            <label
              key={c.id}
              className="flex cursor-pointer items-center gap-3 border-b border-borda/60 px-4 py-3 last:border-b-0 hover:bg-selecao"
            >
              <input
                type="checkbox"
                checked={selecionados.includes(c.id)}
                onChange={() => alternarSelecao(c.id)}
                className="h-4 w-4 accent-terracota"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-texto">{c.nome}</p>
                <p className="truncate text-xs text-texto-suave">
                  {[c.telefone, c.email].filter(Boolean).join(" · ") || "sem contato cadastrado"}
                  {" · "}
                  {c.quantidadePedidos} pedido(s) · R$ {c.totalGasto.toFixed(2)}
                </p>
              </div>
            </label>
          ))}
        </div>
      </Cartao>

      {selecionadosInfo.length >= 2 && (
        <Cartao titulo="2. Escolha qual cadastro deve ser mantido">
          <p className="mb-3 text-sm text-texto-suave">
            Os outros serão removidos e seus pedidos passam a aparecer no cadastro escolhido.
          </p>
          <div className="space-y-2">
            {selecionadosInfo.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-3 rounded-xl border border-borda px-4 py-3 hover:bg-selecao"
              >
                <input
                  type="radio"
                  name="principalVisual"
                  checked={principalId === c.id}
                  onChange={() => setPrincipalId(c.id)}
                  className="h-4 w-4 accent-terracota"
                />
                <div>
                  <p className="font-bold text-texto">{c.nome}</p>
                  <p className="text-xs text-texto-suave">
                    {[c.telefone, c.email].filter(Boolean).join(" · ") || "sem contato cadastrado"}
                    {" · "}
                    {c.quantidadePedidos} pedido(s) · R$ {c.totalGasto.toFixed(2)}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </Cartao>
      )}

      {principal && duplicadosInfo.length > 0 && (
        <Cartao titulo="3. Confira como fica o cadastro final">
          <p className="mb-3 text-sm text-texto-suave">
            Nome mantido: <strong className="text-texto">{principal.nome}</strong>. Campos em branco no principal
            são preenchidos com o que existir nos duplicados; nada é perdido.
          </p>
          <div className="space-y-1 text-sm">
            {CAMPOS_PREVIA.map(({ chave, rotulo }) => (
              <p key={chave}>
                <span className="text-texto-suave">{rotulo}: </span>
                <span className="font-bold text-texto">{valorMesclado(chave)}</span>
              </p>
            ))}
            <p>
              <span className="text-texto-suave">Pedidos reatribuídos: </span>
              <span className="font-bold text-texto">
                {duplicadosInfo.reduce((soma, c) => soma + c.quantidadePedidos, 0)}
              </span>
            </p>
          </div>

          <form action={mesclarClientesAction} className="mt-5">
            <input type="hidden" name="principalId" value={principal.id} />
            {duplicadosInfo.map((c) => (
              <input key={c.id} type="hidden" name="duplicadoIds" value={c.id} />
            ))}
            <Botao type="submit" perigo>
              Mesclar {duplicadosInfo.length === 1 ? "1 duplicado" : `${duplicadosInfo.length} duplicados`} em{" "}
              {principal.nome}
            </Botao>
          </form>
        </Cartao>
      )}
    </div>
  );
}
