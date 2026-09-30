import { criarCliente } from "../actions";
import { Cartao } from "@/components/ui/Cartao";
import { Campo, CampoArea } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";

export default function NovoClientePage() {
  return (
    <Cartao titulo="Novo cliente" className="max-w-lg">
      <form action={criarCliente} className="space-y-4">
        <Campo rotulo="Nome" name="nome" placeholder="Nome do cliente" required />
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Telefone" name="telefone" placeholder="Ex: 11999990000" />
          <Campo rotulo="Aniversário" name="aniversario" placeholder="DD/MM" />
        </div>
        <Campo rotulo="E-mail" name="email" type="email" placeholder="Opcional" />
        <Campo rotulo="Endereço" name="endereco" placeholder="Rua, bairro, cidade" />
        <Campo rotulo="Como conheceu a loja" name="comoConheceu" placeholder="Ex: Instagram, indicação" />
        <CampoArea rotulo="Notas" name="notas" placeholder="Preferências, restrições, etc." rows={3} />
        <Botao type="submit">Salvar</Botao>
      </form>
    </Cartao>
  );
}
