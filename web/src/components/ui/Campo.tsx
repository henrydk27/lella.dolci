import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const estiloBase =
  "w-full rounded-full border border-borda bg-painel-claro px-4 py-2 text-sm text-texto placeholder:text-texto-suave focus:outline-none focus:ring-2 focus:ring-terracota/40";

type PropsCampo = { rotulo?: string } & InputHTMLAttributes<HTMLInputElement>;

export function Campo({ rotulo, className = "", ...props }: PropsCampo) {
  return (
    <label className="block">
      {rotulo && <span className="mb-1 block text-xs font-semibold text-texto">{rotulo}</span>}
      <input className={`${estiloBase} ${className}`} {...props} />
    </label>
  );
}

type PropsSelect = { rotulo?: string; opcoes: { valor: string; texto: string }[] } & SelectHTMLAttributes<HTMLSelectElement>;

export function CampoSelect({ rotulo, opcoes, className = "", ...props }: PropsSelect) {
  return (
    <label className="block">
      {rotulo && <span className="mb-1 block text-xs font-semibold text-texto">{rotulo}</span>}
      <select
        className={`${estiloBase} rounded-2xl bg-[length:16px] bg-[right_12px_center] bg-no-repeat ${className}`}
        {...props}
      >
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
    </label>
  );
}

type PropsArea = { rotulo?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function CampoArea({ rotulo, className = "", ...props }: PropsArea) {
  return (
    <label className="block">
      {rotulo && <span className="mb-1 block text-xs font-semibold text-texto">{rotulo}</span>}
      <textarea
        className={`w-full rounded-2xl border border-borda bg-painel-claro px-4 py-2 text-sm text-texto placeholder:text-texto-suave focus:outline-none focus:ring-2 focus:ring-terracota/40 ${className}`}
        {...props}
      />
    </label>
  );
}
