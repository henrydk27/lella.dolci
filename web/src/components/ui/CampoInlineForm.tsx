"use client";

import { useRef, useState, useTransition } from "react";

export function CampoEstoqueInline({
  valorInicial,
  action,
}: {
  valorInicial: number;
  action: (formData: FormData) => Promise<void>;
}) {
  const [valor, setValor] = useState(String(valorInicial));
  const [pendente, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function salvar() {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    startTransition(() => {
      action(formData);
    });
  }

  return (
    <form ref={formRef} className="inline-block">
      <input
        type="number"
        step="any"
        name="estoqueProduzido"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onBlur={salvar}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
        }}
        className={`w-16 rounded-lg border border-borda bg-painel-claro px-2 py-1 text-sm text-texto focus:outline-none focus:ring-2 focus:ring-terracota/40 ${
          pendente ? "opacity-50" : ""
        }`}
      />
    </form>
  );
}

export function SeletorStatusInline({
  valorInicial,
  opcoes,
  action,
  className = "",
}: {
  valorInicial: string;
  opcoes: { valor: string; texto: string }[];
  action: (formData: FormData) => Promise<void>;
  className?: string;
}) {
  const [valor, setValor] = useState(valorInicial);
  const [pendente, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function salvar(novoValor: string) {
    setValor(novoValor);
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    formData.set("status", novoValor);
    startTransition(() => {
      action(formData);
    });
  }

  return (
    <form ref={formRef} className="inline-block">
      <select
        name="status"
        value={valor}
        onChange={(e) => salvar(e.target.value)}
        className={`rounded-full border border-borda bg-painel-claro px-3 py-1 text-xs font-bold text-texto focus:outline-none focus:ring-2 focus:ring-terracota/40 ${
          pendente ? "opacity-50" : ""
        } ${className}`}
      >
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
    </form>
  );
}
