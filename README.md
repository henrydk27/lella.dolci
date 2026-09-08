# Lella Dolci

Site e sistema de vendas da confeitaria Lella Dolci.

## Estrutura do projeto

- `lella-dolci.html` — pagina principal do site.
- `lella-dolci-fidelidade.html` — pagina do programa de fidelidade.
- `prototipo/` — prototipos do site.
- `controle-vendas/` — programa em Python para controle de vendas (produtos, ingredientes, pedidos e historico).

## Controle de vendas (Python)

Programa para gerenciar o dia a dia da confeitaria: cadastro de produtos e precos, receitas com custo automatico (ingredientes + embalagens + taxa de utilidades), controle de estoque, pedidos com fluxo completo (pendente > pronto > entregue > pago), historico de vendas e controle de gastos gerais.

Reescrito com base na planilha de controle usada anteriormente (Excel), trazendo a logica de precificacao (custo dos ingredientes + 10% de utilidades/gas + custo de embalagem) e o controle de despesas para dentro do programa, com o pedido e a venda unificados num unico registro (a planilha antiga exigia lancar cada venda duas vezes, em abas separadas).

Requisitos: Python 3 e a biblioteca `customtkinter` (a interface grafica usa ela para o visual moderno e arredondado).

```bash
pip install customtkinter
```

### Interface grafica (recomendada)

```bash
python controle-vendas/gui.py
```

Abre uma janela com um design organico: fundo creme/areia, detalhes em terracota e verde-salvia, titulos na fonte Caprasimo sobre texto em Figtree, cantos arredondados que viram pilulas em botoes e campos. Abas para Inicio (dashboard), Produtos, Ingredientes, Embalagens, Pedidos, Historico e Gastos. As fontes ficam em `controle-vendas/fontes/` e sao carregadas automaticamente pelo programa (nao precisam estar instaladas no Windows).

### Executavel (.exe)

Ja existe um executavel gerado em `controle-vendas/dist/LellaDolci-ControleDeVendas.exe`, que roda no Windows sem precisar ter Python instalado. Basta dar dois cliques nele.

Para gerar novamente o .exe apos alterar o codigo:

```bash
pip install pyinstaller customtkinter pillow
cd controle-vendas
python -m PyInstaller --noconfirm --onefile --windowed --name "LellaDolci-ControleDeVendas" --icon "icone.ico" --add-data "icone.ico;." --add-data "fontes;fontes" gui.py
```

O executavel final fica em `controle-vendas/dist/`. O banco de dados (`lella_dolci.db`) e criado na mesma pasta onde o .exe for executado.

### Interface via terminal

```bash
python controle-vendas/main.py
```

Menu interativo no terminal com as mesmas funcionalidades.

### Funcionalidades

- **Inicio (dashboard)**: total vendido no mes atual, quantidade de pedidos em aberto (nao pagos) e o produto mais vendido, alem de um resumo de vendas por categoria no ano atual.
- **Produtos**: cadastro, edicao, remocao, categoria, receita (ingredientes usados), embalagens usadas, taxa de utilidades/gas (overhead, padrao 10%) e custo total calculado automaticamente (ingredientes + overhead + embalagens), com margem de lucro (R$ e %) comparando ao preco de venda.
- **Ingredientes**: cadastro, edicao, remocao e controle de estoque.
- **Embalagens**: cadastro de caixas/sacos/etc. com custo total e rendimento (quantas unidades saem de um lote), calculando o custo por unidade automaticamente — usado no custo dos produtos.
- **Pedidos**: criacao com multiplos itens, data de entrega e forma de pagamento (pix, dinheiro, cartao debito, cartao credito, outro); edicao de quantidade ou remocao de itens de um pedido ja criado; fluxo de status **pendente > pronto > entregue > pago**; remocao de pedido.
- **Historico**: consulta de vendas por periodo e status, com resumo de pedidos pagos e total vendido.
- **Gastos**: registro de despesas gerais (mercado, embalagem, ingredientes, etc.) com data, forma de pagamento e categoria, e resumo total por categoria e por forma de pagamento.

Todas as datas sao exibidas e digitadas no formato **DD/MM/AAAA** (ex: 25/08/2026). Internamente o banco guarda em formato ISO para os filtros de periodo funcionarem corretamente.

Confirmacoes de sucesso (produto salvo, item atualizado, pedido criado, etc.) aparecem como um banner discreto na propria janela, sem interromper o fluxo com popups do Windows. Erros e confirmacoes de remocao continuam usando caixas de dialogo, para evitar acao acidental.

Os dados ficam armazenados em `controle-vendas/lella_dolci.db` (SQLite), criado automaticamente na primeira execucao.

O icone do programa (`controle-vendas/icone.ico`) foi gerado a partir da logo `lella sem fundo.png`.

As fontes usadas na interface (`controle-vendas/fontes/Caprasimo-Regular.ttf` e `Figtree-*.ttf`, do Google Fonts) sao carregadas como fontes privadas do processo via `controle-vendas/fontes.py`, sem precisar instalar no sistema. Se por algum motivo o carregamento falhar (fora do Windows, por exemplo), o programa usa Georgia/Segoe UI como alternativa.
