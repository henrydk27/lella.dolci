# Lella Dolci

Site e sistema de vendas da confeitaria Lella Dolci.

## Estrutura do projeto

- `lella-dolci.html` — pagina principal do site.
- `lella-dolci-fidelidade.html` — pagina do programa de fidelidade.
- `prototipo/` — prototipos do site.
- `controle-vendas/` — programa em Python para controle de vendas (produtos, ingredientes, pedidos e historico).

## Controle de vendas (Python)

Programa para gerenciar o dia a dia da confeitaria: cadastro de produtos e precos, lista de ingredientes com estoque, registro de pedidos e historico de vendas.

Requisitos: Python 3 e a biblioteca `customtkinter` (a interface grafica usa ela para o visual moderno e arredondado).

```bash
pip install customtkinter
```

### Interface grafica (recomendada)

```bash
python controle-vendas/gui.py
```

Abre uma janela com um design organico: fundo creme/areia, detalhes em terracota e verde-salvia, titulos na fonte Caprasimo sobre texto em Figtree, cantos arredondados que viram pilulas em botoes e campos. Abas para Inicio (dashboard), Produtos, Ingredientes, Pedidos e Historico. As fontes ficam em `controle-vendas/fontes/` e sao carregadas automaticamente pelo programa (nao precisam estar instaladas no Windows).

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

- **Inicio (dashboard)**: total vendido no mes atual, quantidade de pedidos em aberto (nao pagos) e o produto mais vendido.
- **Produtos**: cadastro, edicao, remocao, ficha tecnica (ingredientes usados, custo estimado) e margem de lucro (R$ e %) calculada a partir do preco de venda menos o custo.
- **Ingredientes**: cadastro, edicao, remocao e controle de estoque.
- **Pedidos**: criacao com multiplos itens, data de entrega e forma de pagamento (pix, dinheiro, cartao debito, cartao credito, outro); edicao de quantidade ou remocao de itens de um pedido ja criado; atualizacao de status (pago/nao_pago), data de entrega e forma de pagamento; remocao de pedido.
- **Historico**: consulta de vendas por periodo e status, com resumo de pedidos pagos e total vendido.

Todas as datas sao exibidas e digitadas no formato **DD/MM/AAAA** (ex: 25/08/2026). Internamente o banco guarda em formato ISO para os filtros de periodo funcionarem corretamente.

Confirmacoes de sucesso (produto salvo, item atualizado, pedido criado, etc.) aparecem como um banner discreto na propria janela, sem interromper o fluxo com popups do Windows. Erros e confirmacoes de remocao continuam usando caixas de dialogo, para evitar acao acidental.

Os dados ficam armazenados em `controle-vendas/lella_dolci.db` (SQLite), criado automaticamente na primeira execucao.

O icone do programa (`controle-vendas/icone.ico`) foi gerado a partir da logo `lella sem fundo.png`.

As fontes usadas na interface (`controle-vendas/fontes/Caprasimo-Regular.ttf` e `Figtree-*.ttf`, do Google Fonts) sao carregadas como fontes privadas do processo via `controle-vendas/fontes.py`, sem precisar instalar no sistema. Se por algum motivo o carregamento falhar (fora do Windows, por exemplo), o programa usa Georgia/Segoe UI como alternativa.
