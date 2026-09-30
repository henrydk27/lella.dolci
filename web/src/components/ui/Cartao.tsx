import { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & { titulo?: string };

export function Cartao({ titulo, className = "", children, ...props }: Props) {
  return (
    <div className={`rounded-2xl border border-borda bg-painel p-5 ${className}`} {...props}>
      {titulo && <h3 className="mb-3 font-titulo text-lg text-terracota-vibrante">{titulo}</h3>}
      {children}
    </div>
  );
}
