import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  perigo?: boolean;
  variante?: "solido" | "fantasma";
};

export function Botao({ perigo, variante = "solido", className = "", ...props }: Props) {
  const base =
    "rounded-full px-5 py-2.5 text-sm font-bold font-corpo transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const cores = perigo
    ? "bg-alerta hover:bg-alerta-hover text-[#FFF9F0]"
    : variante === "fantasma"
    ? "bg-transparent border border-borda text-texto hover:bg-selecao"
    : "bg-terracota hover:bg-terracota-hover text-[#FFF9F0]";

  return <button className={`${base} ${cores} ${className}`} {...props} />;
}
