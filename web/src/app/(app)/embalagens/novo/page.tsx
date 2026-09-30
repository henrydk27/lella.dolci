import { criarEmbalagem } from "../actions";
import { Cartao } from "@/components/ui/Cartao";
import { Campo } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";

export default function NovaEmbalagemPage() {
  return (
    <Cartao titulo="Nova embalagem" className="max-w-lg">
      <form action={criarEmbalagem} className="space-y-4">
        <Campo rotulo="Nome" name="nome" placeholder="Ex: Caixa 6 doces" required />
        <Campo rotulo="Custo total (do rolo/pacote/lote)" name="custoTotal" type="number" step="any" defaultValue={0} />
        <Campo rotulo="Rendimento (quantas unidades saem)" name="rendimento" type="number" defaultValue={1} />
        <Botao type="submit">Salvar</Botao>
      </form>
    </Cartao>
  );
}
