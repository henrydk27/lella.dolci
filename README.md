# Lella Dolci

Site e sistema de vendas da confeitaria Lella Dolci.

## Estrutura do projeto

- `lella-dolci.html` — pagina principal do site.
- `lella-dolci-fidelidade.html` — pagina do programa de fidelidade.
- `prototipo/` — prototipos do site.
- `controle-vendas/` — programa em Python para controle de vendas (produtos, ingredientes, pedidos e historico).

## Controle de vendas (Python)

Programa para gerenciar o dia a dia da confeitaria: cadastro de produtos e precos, lista de ingredientes com estoque, registro de pedidos e historico de vendas.

Requisitos: Python 3 (usa apenas a biblioteca padrao, incluindo `tkinter` para a interface grafica).

### Interface grafica (recomendada)

```bash
python controle-vendas/gui.py
```

Abre uma janela com tema dark e detalhes lilas neon, com abas para Produtos, Ingredientes, Pedidos e Historico.

### Executavel (.exe)

Ja existe um executavel gerado em `controle-vendas/dist/LellaDolci-ControleDeVendas.exe`, que roda no Windows sem precisar ter Python instalado. Basta dar dois cliques nele.

Para gerar novamente o .exe apos alterar o codigo:

```bash
pip install pyinstaller
cd controle-vendas
python -m PyInstaller --noconfirm --onefile --windowed --name "LellaDolci-ControleDeVendas" gui.py
```

O executavel final fica em `controle-vendas/dist/`. O banco de dados (`lella_dolci.db`) e criado na mesma pasta onde o .exe for executado.

### Interface via terminal

```bash
python controle-vendas/main.py
```

Menu interativo no terminal com as mesmas funcionalidades.

### Funcionalidades

- **Produtos**: cadastro, edicao, remocao e ficha tecnica (ingredientes usados e custo estimado).
- **Ingredientes**: cadastro, edicao, remocao e controle de estoque.
- **Pedidos**: criacao com multiplos itens, atualizacao de status (pendente, em_preparo, concluido, cancelado) e remocao.
- **Historico**: consulta de vendas por periodo e status, com resumo de pedidos concluidos e total vendido.

Os dados ficam armazenados em `controle-vendas/lella_dolci.db` (SQLite), criado automaticamente na primeira execucao.
