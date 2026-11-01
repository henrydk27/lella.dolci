const CORES_CATEGORIA = ["#c9713f", "#8fa377", "#b85c2e", "#748a5d", "#d99a6c", "#637a4f", "#e7b68c", "#9c8468"];

export function GraficoPizza({ dados }: { dados: { rotulo: string; valor: number }[] }) {
  const total = dados.reduce((s, d) => s + d.valor, 0);
  if (total <= 0) {
    return <p className="text-sm text-texto-suave">Sem dados no período.</p>;
  }

  const raio = 80;
  const centro = 90;
  let anguloAtual = -Math.PI / 2;

  const fatias = dados.map((d, i) => {
    const fracao = d.valor / total;
    const anguloInicial = anguloAtual;
    const anguloFinal = anguloAtual + fracao * Math.PI * 2;
    anguloAtual = anguloFinal;
    const x1 = centro + raio * Math.cos(anguloInicial);
    const y1 = centro + raio * Math.sin(anguloInicial);
    const x2 = centro + raio * Math.cos(anguloFinal);
    const y2 = centro + raio * Math.sin(anguloFinal);
    const grandeArco = fracao > 0.5 ? 1 : 0;
    const caminho =
      fracao >= 0.999
        ? `M ${centro - raio} ${centro} A ${raio} ${raio} 0 1 1 ${centro + raio} ${centro} A ${raio} ${raio} 0 1 1 ${centro - raio} ${centro}`
        : `M ${centro} ${centro} L ${x1} ${y1} A ${raio} ${raio} 0 ${grandeArco} 1 ${x2} ${y2} Z`;
    return { caminho, cor: CORES_CATEGORIA[i % CORES_CATEGORIA.length], ...d, fracao };
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <svg viewBox="0 0 180 180" className="h-44 w-44 shrink-0">
        {fatias.map((f) => (
          <path key={f.rotulo} d={f.caminho} fill={f.cor} />
        ))}
      </svg>
      <ul className="w-full space-y-1.5 text-sm">
        {fatias.map((f) => (
          <li key={f.rotulo} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: f.cor }} />
              <span className="truncate">{f.rotulo}</span>
            </span>
            <span className="whitespace-nowrap font-bold text-texto">{(f.fracao * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GraficoBarrasDuplas({
  dados,
  rotuloA,
  rotuloB,
}: {
  dados: { rotulo: string; a: number; b: number }[];
  rotuloA: string;
  rotuloB: string;
}) {
  const maior = Math.max(1, ...dados.map((d) => Math.max(d.a, d.b)));

  return (
    <div>
      <div className="mb-2 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-terracota" /> {rotuloA}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-salvia" /> {rotuloB}
        </span>
      </div>
      <div className="flex h-40 items-end gap-3 overflow-x-auto">
        {dados.map((d) => (
          <div key={d.rotulo} className="flex min-w-[48px] flex-1 flex-col items-center gap-1">
            <div className="flex h-32 w-full items-end gap-0.5">
              <div
                className="flex-1 rounded-t bg-terracota"
                style={{ height: `${Math.max((d.a / maior) * 100, d.a > 0 ? 2 : 0)}%` }}
                title={`${rotuloA}: R$ ${d.a.toFixed(2)}`}
              />
              <div
                className="flex-1 rounded-t bg-salvia"
                style={{ height: `${Math.max((d.b / maior) * 100, d.b > 0 ? 2 : 0)}%` }}
                title={`${rotuloB}: R$ ${d.b.toFixed(2)}`}
              />
            </div>
            <span className="text-[11px] text-texto-suave">{d.rotulo}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GraficoBarrasSimples({ dados }: { dados: { rotulo: string; valor: number }[] }) {
  const maior = Math.max(1, ...dados.map((d) => d.valor));
  if (dados.length === 0) return <p className="text-sm text-texto-suave">Sem dados no período.</p>;

  return (
    <ul className="space-y-2">
      {dados.map((d) => (
        <li key={d.rotulo}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="truncate">{d.rotulo}</span>
            <span className="whitespace-nowrap font-bold text-texto">{d.valor}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-painel-claro">
            <div className="h-2 rounded-full bg-terracota" style={{ width: `${(d.valor / maior) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
