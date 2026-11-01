# Lella Dolci — Controle de Vendas (Web)

Versão web do sistema de controle de vendas da confeitaria Lella Dolci, feita para rodar na Vercel. Substitui o programa desktop (`controle-vendas/`), mantendo a mesma paleta orgânica (creme, terracota, sálvia) e a mesma lógica de negócio (receitas com custo automático, pedidos com fluxo pendente → pronto → entregue → pago, CRM de clientes). Além do cadastro básico (produtos, ingredientes, embalagens, clientes, pedidos), o sistema tem uma camada de precificação (Calculadora) e uma camada financeira (Dashboard + Financeiro) que calculam tudo em cima desses cadastros.

**Em produção:** https://lella-dolci-one.vercel.app (banco Turso, já com todo o histórico de vendas migrado da planilha antiga).

## Stack

- **Next.js 16** (App Router, Server Actions, Turbopack)
- **Drizzle ORM** + **libSQL** — funciona tanto com um arquivo SQLite local (`local.db`, usado em desenvolvimento) quanto com um banco **Turso** hospedado (usado em produção), sem trocar o SQL.
- **Tailwind CSS v4** com o tema visual orgânico (cores/fontes em `src/app/globals.css`).
- Autenticação simples por usuário/senha (variáveis de ambiente), sessão via cookie assinado (JWT com `jose`), com bloqueio de login após tentativas erradas e headers de segurança padrão (ver [Segurança](#segurança)).

## Rodando localmente

```bash
cd web
npm install
npx drizzle-kit migrate   # cria as tabelas em local.db
npm run dev
```

Abra http://localhost:3000 — vai pedir login. As credenciais de desenvolvimento ficam em `.env.local`:

```
DATABASE_URL=file:local.db
SESSION_SECRET=<qualquer string longa e aleatoria>
ADMIN_USER=admin
ADMIN_PASSWORD=lelladolci
```

`.env.local` não é versionado (está no `.gitignore`). Ao clonar o repositório em outra máquina, recrie esse arquivo.

## Segurança

- **Bloqueio de login**: após 5 tentativas erradas do mesmo IP, o login fica bloqueado por 15 minutos (`src/lib/loginSeguranca.ts`, tabela `tentativas_login`). O bloqueio vale mesmo se a senha certa for digitada durante esse período.
- **Headers de segurança**: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` e um `Content-Security-Policy` básico (`frame-ancestors 'none'`), configurados em `next.config.ts`.

## Publicando na Vercel

Isso já foi feito e o site está no ar (URL no topo deste README). Os passos abaixo ficam aqui de referência, para o caso de precisar recriar o banco ou o projeto na Vercel do zero.

### 1. Criar o banco de dados (Turso)

```bash
npm install -g @turso/cli   # ou: curl -sSfL https://get.tur.so/install.sh | bash
turso auth login
turso db create lella-dolci
turso db show lella-dolci --url          # copie esse valor -> DATABASE_URL
turso db tokens create lella-dolci       # copie esse valor -> DATABASE_AUTH_TOKEN
```

### 2. Aplicar as tabelas no banco de producao

Na sua maquina, defina as variaveis apontando para o banco Turso (nao para o `local.db`) e rode a migracao uma unica vez:

```bash
$env:DATABASE_URL="libsql://lella-dolci-xxxx.turso.io"   # PowerShell
$env:DATABASE_AUTH_TOKEN="<token gerado acima>"
npx drizzle-kit migrate
```

### 3. Criar o projeto na Vercel

1. Suba este repositorio no GitHub (se ainda nao estiver).
2. Em https://vercel.com, clique em "Add New Project" e importe o repositorio.
3. Em **Root Directory**, aponte para a pasta `web` (o projeto Next.js fica dentro dela, nao na raiz do repo).
4. Em **Environment Variables**, adicione:
   - `DATABASE_URL` = a URL `libsql://...` do Turso
   - `DATABASE_AUTH_TOKEN` = o token gerado
   - `SESSION_SECRET` = uma string longa e aleatoria (ex: gere com `openssl rand -base64 32`)
   - `ADMIN_USER` = o usuario de login que voce quiser
   - `ADMIN_PASSWORD` = a senha de login que voce quiser
5. Clique em **Deploy**.

A cada `git push` na branch principal, a Vercel publica automaticamente uma nova versao.

### Alerta por e-mail de pedidos em aberto (todo dia 14 e 29)

Um cron job da Vercel (configurado em `vercel.json`) chama `/api/alertas/devedores` nesses dois dias do mes, as 9h (horario de Brasilia), e manda um e-mail pro Gmail configurado com a lista de clientes que ainda tem pedido em aberto (nao pago), detalhado pedido por pedido (data, itens e valor pendente de cada um — ver `listarDevedoresDetalhado` em `src/lib/alertas.ts`). O valor pendente usa os pagamentos ja registrados (parciais inclusive), nao so o status do pedido.

Para habilitar, adicione essas variaveis de ambiente na Vercel (alem das ja listadas acima):

- `GMAIL_USER` = o endereco Gmail que vai enviar (e por padrao tambem recebe) o alerta.
- `GMAIL_APP_PASSWORD` = uma **senha de app** do Google (nao e a senha normal da conta). Gere em [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) — precisa ter a verificacao em duas etapas ativada na conta Google primeiro.
- `ALERTA_EMAIL_PARA` (opcional) = se quiser que o alerta va para um endereco diferente de `GMAIL_USER`.
- `CRON_SECRET` = qualquer string aleatoria (ex: gere com `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`). A Vercel usa esse valor automaticamente pra autenticar a chamada do cron — sem isso, a rota fica aberta pra qualquer um disparar o envio.

Depois de configurar as variaveis, redeploy o projeto (a Vercel so le o `vercel.json` em um novo deploy). Pra testar na hora sem esperar o dia 14/29, acesse `https://seu-projeto.vercel.app/api/alertas/devedores` direto pelo navegador (se `CRON_SECRET` estiver configurado, essa chamada manual sem o header vai retornar 401 — nesse caso, teste com uma ferramenta tipo `curl -H "Authorization: Bearer SEU_CRON_SECRET" https://...`).

### Backup em planilha

O botao "Backup" no topo (`/api/backup`) baixa um `.xlsx` com uma aba pra cada tabela principal do sistema: Clientes, Produtos, Ingredientes, Embalagens, Planejador, Pedidos, Itens dos Pedidos, Receitas (Ingredientes) e Receitas (Embalagens) — essas duas ultimas sao a receita de cada Produto, nao o livro de "Receitas prontas" da Calculadora. Gerado com `exceljs` em `src/lib/backup.ts`. As tabelas novas `pagamentos` e `fechamentos_mensais` ainda nao tem aba nesse backup — ao mexer nessa area de novo, vale considerar incluir.

### Alterando o schema depois

Se no futuro adicionar/mudar uma tabela em `src/db/schema.ts`, gere e aplique a migracao antes de fazer deploy:

```bash
npm run db:generate
DATABASE_URL=... DATABASE_AUTH_TOKEN=... npm run db:migrate
```

## Estrutura do projeto

- `src/db/schema.ts` — tabelas (espelham o banco SQLite do programa desktop, mais as tabelas novas criadas so na versao web: `receitas`/`receita_ingredientes`, `pagamentos`, `fechamentos_mensais`).
- `src/db/index.ts` — conexao com o banco (local ou Turso, conforme `DATABASE_URL`).
- `src/lib/*.ts` — regras de negocio (equivalentes aos modulos Python `produtos.py`, `pedidos.py`, `clientes.py`, etc.), mais `financeiro.ts`, `pagamentos.ts` e `receitas.ts`, que nao tem equivalente no programa desktop.
- `src/lib/auth.ts` + `src/lib/loginSeguranca.ts` + `src/proxy.ts` — login, bloqueio por tentativas e protecao de rotas (todas as paginas exigem sessao, exceto `/login`, `/api/health` e `/api/alertas`).
- `src/app/(app)/` — paginas autenticadas: inicio (`/`), dashboard, clientes, produtos, planejador, pedidos, historico, financeiro, calculadora. Cada modulo de cadastro tem `page.tsx` (lista), `novo/page.tsx` (criar) e `[id]/page.tsx` (editar), com as mutacoes em `actions.ts` (Server Actions).
- `src/app/(app)/planejador/` — organizador de producao diaria: fila de itens a produzir (produto + quantidade), reordenavel por prioridade, mostrando os ingredientes necessarios ja escalados pela quantidade planejada. Ao marcar um item como concluido (informando quanto realmente rendeu), esse valor entra no campo `produtos.estoqueProduzido` (estoque de produto ja pronto, separado do estoque de ingredientes).
- `src/app/login/` — tela de login (fora da area autenticada).
- `src/components/ui/` — componentes visuais compartilhados (botao, cartao, campo, tabela, graficos SVG simples usados no Dashboard).

### Ingredientes e Embalagens ficam dentro da Calculadora

As telas de cadastro `/ingredientes` e `/embalagens` continuam existindo e funcionando normalmente, mas nao tem mais link no menu principal — o acesso e so pelo submenu **Calculadora**, que mostra a mesma lista com os campos de preco/custo editaveis direto ali (sem precisar abrir o cadastro completo) e um link "Editar" por linha pra quando precisar mudar nome, estoque ou excluir.

### Calculadora

Area de precificacao, com 4 telas (`/calculadora/*`), todas somente leitura/edicao de valores — nao alteram a logica de custo ja existente em Produtos:

- **Custo dos ingredientes** — consulta e edicao rapida do preco/peso de cada ingrediente, com um seletor "por peso (g) / por unidade" para ingredientes vendidos por unidade (ex: um abacaxi inteiro) em vez de por grama.
- **Embalagens** — mesma ideia, pra categoria/custo total/rendimento de cada embalagem.
- **Calculadora de precificacao** — simulador interativo (nao salva nada no banco) pra montar uma receita nova, informar ingredientes/embalagens usados e ver o custo e a margem antes de cadastrar como produto de verdade. Segue a formula: 10% de despesas variaveis incide so sobre os ingredientes (nunca sobre embalagem), e o lucro final desconta tudo.
- **Receitas prontas** — livro de receitas salvas (tabelas `receitas`/`receita_ingredientes`), independente do cadastro de Produtos. O custo e preco por unidade sao sempre recalculados na hora a partir do preco atual dos ingredientes, nunca guardados — assim acompanham qualquer reajuste de preco automaticamente, sem afetar vendas ja fechadas.

### Pagamentos, Dashboard e Financeiro

O sistema separa **venda** (quando o pedido foi feito) de **recebimento** (quando o dinheiro entrou de verdade), porque uma encomenda pode ser vendida num mes e paga no mes seguinte (ou em parcelas).

- Tabela `pagamentos`: cada pedido pode ter varios pagamentos (parciais, em datas diferentes), registrados numa secao propria na tela do pedido (`/pedidos/[id]`). A soma desses pagamentos e' o que conta como "recebido" — o campo `pedidos.status` continua controlando so o fluxo de producao/entrega (pendente → pronto → entregue → pago), sem relacao direta com os pagamentos registrados.
- **Dashboard** (`/dashboard`) — indicadores (faturamento, lucro, recebido, pendente, encomendas), graficos (faturamento/lucro por mes, pizza por categoria, produtos mais vendidos, comparativo com o mes anterior) e filtros (mes/ano, periodo personalizado, categoria, situacao do pagamento). E diferente da pagina inicial (`/`), que e' o resumo simples original.
- **Financeiro** (`/financeiro`) — tres visoes do mesmo mes: **lucro gerado** (vendas realizadas, pago ou nao), **dinheiro recebido** (pela data real do pagamento) e **dinheiro pendente**. Calcula a reserva de despesas (10% so sobre o custo de ingredientes das vendas recebidas) e distribui o lucro disponivel entre reserva financeira (8%), funcionaria mae (15%) e proprietaria/reinvestimento (77%) — ver constantes em `src/lib/financeiro.ts`. Tem tambem a lista de recebimentos atrasados e o fechamento mensal (tabela `fechamentos_mensais`), que congela os valores de um mes fechado pra nao mudar retroativamente se o preco de um ingrediente for reajustado depois.

### Pedidos: encomenda x pronta entrega

Cada pedido tem um `tipo`: **encomenda** (personalizado, pede cliente e data de entrega) ou **pronta entrega** (venda de produto ja pronto no estoque — o formulario so mostra produtos com `estoqueProduzido > 0` e debita automaticamente ao vender, restaurando se o item for removido/editado/o pedido for excluido). Pedidos tambem tem `caixa` (texto livre) e `taxa_entrega` (soma ao total do pedido), usados para registrar a caixa escolhida e uma eventual taxa de entrega.

Removendo um produto que ja foi vendido (tem `pedido_itens` apontando pra ele) e' bloqueado de proposito — a acao mostra um aviso em vez de tentar apagar, porque isso corromperia o historico de vendas desse pedido.

Historicamente os IDs dos pedidos de encomenda foram feitos pra bater com o numero "Pedido nº" da planilha antiga (ex: pedido #512 no sistema = "P0512" na planilha), depois de uma reimportacao completa feita direto no banco. Pedidos novos criados pelo app continuam o proximo numero disponivel normalmente.

### Embalagens

Alem de nome/custo total/rendimento, cada embalagem pode ter uma `categoria` (ex: Tecido, Fita, Embalagem, Decoracao) e `observacoes` livres (ex: dimensoes), usados para organizar o catalogo sem perder detalhe.

### Cuidado com consultas N+1

As paginas de listagem (pedidos, historico, clientes, dashboard, financeiro) usam agregacoes SQL (`SUM`/`COUNT`/`GROUP BY`) em vez de fazer uma consulta por linha num loop. Isso ja causou lentidao real (de segundos a travar de vez com erro de timeout na Vercel) duas vezes neste projeto: primeiro com quase mil pedidos (ver `totaisPorPedidoIds` em `src/lib/pedidos.ts` e `estatisticasBasicasTodosClientes` em `src/lib/clientes.ts`), depois no Dashboard/Financeiro assim que o banco de producao (Turso, remoto) passou a ter muitos produtos/pedidos distintos — uma consulta por produto ou por pedido que e' instantanea no banco local vira uma viagem de rede em producao, e centenas delas somadas estouram o tempo da funcao (ver `mapaCustoPorProduto` e `mapaRecebidoPorPedido` em `src/lib/financeiro.ts`). Ao adicionar uma pagina nova que soma/lista dados de varios pedidos, produtos ou clientes, prefira sempre uma consulta agregada (`GROUP BY`) a um `for`/`Promise.all` chamando uma funcao por item — e teste apontando pro banco de producao antes de considerar pronto, nao so pro `local.db`.

## Diferencas em relacao ao programa desktop

- O cadastro de cliente ao criar um pedido usa um campo de texto com sugestoes (`<datalist>`) em vez de um combobox com botao "+ Cliente": digitar um nome novo cria o cliente automaticamente ao salvar.
- Datas usam o seletor nativo do navegador (`<input type="date">`) em vez do formato digitado DD/MM/AAAA.
- Todas as paginas ficam atras de login (usuario/senha unicos, definidos por variavel de ambiente) — nao existe cadastro de multiplos usuarios.
