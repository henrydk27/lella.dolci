# Lella Dolci — Controle de Vendas (Web)

Versão web do sistema de controle de vendas da confeitaria Lella Dolci, feita para rodar na Vercel. Substitui o programa desktop (`controle-vendas/`), mantendo a mesma paleta orgânica (creme, terracota, sálvia) e a mesma lógica de negócio (receitas com custo automático, pedidos com fluxo pendente → pronto → entregue → pago, CRM de clientes, gastos).

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

### Alterando o schema depois

Se no futuro adicionar/mudar uma tabela em `src/db/schema.ts`, gere e aplique a migracao antes de fazer deploy:

```bash
npm run db:generate
DATABASE_URL=... DATABASE_AUTH_TOKEN=... npm run db:migrate
```

## Estrutura do projeto

- `src/db/schema.ts` — tabelas (espelham o banco SQLite do programa desktop).
- `src/db/index.ts` — conexao com o banco (local ou Turso, conforme `DATABASE_URL`).
- `src/lib/*.ts` — regras de negocio (equivalentes aos modulos Python `produtos.py`, `pedidos.py`, `clientes.py`, etc.).
- `src/lib/auth.ts` + `src/lib/loginSeguranca.ts` + `src/proxy.ts` — login, bloqueio por tentativas e protecao de rotas (todas as paginas exigem sessao, exceto `/login`).
- `src/app/(app)/` — paginas autenticadas: dashboard (`/`), clientes, produtos, ingredientes, embalagens, planejador, pedidos, historico, gastos. Cada modulo tem `page.tsx` (lista), `novo/page.tsx` (criar) e `[id]/page.tsx` (editar), com as mutacoes em `actions.ts` (Server Actions).
- `src/app/(app)/planejador/` — organizador de producao diaria: fila de itens a produzir (produto + quantidade), reordenavel por prioridade, mostrando os ingredientes necessarios ja escalados pela quantidade planejada. Ao marcar um item como concluido (informando quanto realmente rendeu), esse valor entra no campo `produtos.estoqueProduzido` (estoque de produto ja pronto, separado do estoque de ingredientes).
- `src/app/login/` — tela de login (fora da area autenticada).
- `src/components/ui/` — componentes visuais compartilhados (botao, cartao, campo, tabela).

### Pedidos: encomenda x pronta entrega

Cada pedido tem um `tipo`: **encomenda** (personalizado, pede cliente e data de entrega) ou **pronta entrega** (venda de produto ja pronto no estoque — o formulario so mostra produtos com `estoqueProduzido > 0` e debita automaticamente ao vender, restaurando se o item for removido/editado/o pedido for excluido). Pedidos tambem tem `caixa` (texto livre) e `taxa_entrega` (soma ao total do pedido), usados para registrar a caixa escolhida e uma eventual taxa de entrega.

### Embalagens

Alem de nome/custo total/rendimento, cada embalagem pode ter uma `categoria` (ex: Tecido, Fita, Embalagem, Decoracao) e `observacoes` livres (ex: dimensoes), usados para organizar o catalogo sem perder detalhe.

### Cuidado com consultas N+1

As paginas de listagem (pedidos, historico, clientes, dashboard) usam agregacoes SQL (`SUM`/`COUNT`/`GROUP BY`) em vez de fazer uma consulta por linha num loop. Isso ja causou lentidao real de varios segundos assim que o banco passou a ter quase mil pedidos (ver `totaisPorPedidoIds` em `src/lib/pedidos.ts` e `estatisticasBasicasTodosClientes` em `src/lib/clientes.ts`). Ao adicionar uma pagina nova que soma/lista dados de varios pedidos ou clientes, prefira uma consulta agregada a um `for`/`Promise.all` chamando `totalPedido`/`estatisticasCliente` por item.

## Diferencas em relacao ao programa desktop

- O cadastro de cliente ao criar um pedido usa um campo de texto com sugestoes (`<datalist>`) em vez de um combobox com botao "+ Cliente": digitar um nome novo cria o cliente automaticamente ao salvar.
- Datas usam o seletor nativo do navegador (`<input type="date">`) em vez do formato digitado DD/MM/AAAA.
- Todas as paginas ficam atras de login (usuario/senha unicos, definidos por variavel de ambiente) — nao existe cadastro de multiplos usuarios.
