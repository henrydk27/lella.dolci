"use client";

import { useId, useState } from "react";

const PRESETS: { nome: string; cor: string }[] = [
  { nome: "Padrão", cor: "" },
  { nome: "Natal", cor: "#b3283d" },
  { nome: "Natal (verde)", cor: "#2f6b45" },
  { nome: "Páscoa", cor: "#d9a441" },
  { nome: "Festa Junina", cor: "#c1483a" },
  { nome: "Dia das Mães", cor: "#d6708f" },
  { nome: "Namorados", cor: "#a3324a" },
  { nome: "Verão", cor: "#3d8fb0" },
];

export function SeletorCor({ rotulo, name, defaultValue }: { rotulo?: string; name: string; defaultValue?: string | null }) {
  const [cor, setCor] = useState(defaultValue ?? "");
  const id = useId();

  return (
    <div>
      {rotulo && <span className="mb-1 block text-xs font-semibold text-texto">{rotulo}</span>}
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={cor || "#f7eada"}
          onChange={(e) => setCor(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded-lg border border-borda bg-transparent p-0.5"
        />
        <span className="text-xs text-texto-suave">{cor || "cor padrão do cartão"}</span>
        {cor && (
          <button
            type="button"
            onClick={() => setCor("")}
            className="text-xs font-bold text-alerta hover:underline"
          >
            limpar
          </button>
        )}
      </div>
      <input type="hidden" name={name} value={cor} />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.nome}
            type="button"
            title={p.nome}
            onClick={() => setCor(p.cor)}
            className="h-6 w-6 rounded-full border border-borda"
            style={{ backgroundColor: p.cor || "#f7eada" }}
          />
        ))}
      </div>
    </div>
  );
}
