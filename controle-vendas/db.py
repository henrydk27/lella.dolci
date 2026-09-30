import sqlite3
import os
import sys


def _pasta_base():
    """Pasta onde o banco deve ficar: ao lado do .exe quando empacotado
    (PyInstaller extrai o codigo para uma pasta temporaria a cada execucao,
    entao __file__ nao pode ser usado nesse caso), ou ao lado deste
    arquivo quando rodando via `python gui.py`/`python main.py`."""
    if getattr(sys, "frozen", False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))


DB_PATH = os.path.join(_pasta_base(), "lella_dolci.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS ingredientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL UNIQUE,
            unidade TEXT NOT NULL,
            quantidade_estoque REAL NOT NULL DEFAULT 0,
            preco_unitario REAL NOT NULL DEFAULT 0
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS embalagens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL UNIQUE,
            custo_total REAL NOT NULL DEFAULT 0,
            rendimento INTEGER NOT NULL DEFAULT 1
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL UNIQUE,
            preco REAL NOT NULL,
            descricao TEXT,
            categoria TEXT,
            taxa_overhead REAL NOT NULL DEFAULT 10
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS produto_ingredientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            produto_id INTEGER NOT NULL,
            ingrediente_id INTEGER NOT NULL,
            quantidade REAL NOT NULL,
            FOREIGN KEY (produto_id) REFERENCES produtos (id) ON DELETE CASCADE,
            FOREIGN KEY (ingrediente_id) REFERENCES ingredientes (id) ON DELETE CASCADE
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS produto_embalagens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            produto_id INTEGER NOT NULL,
            embalagem_id INTEGER NOT NULL,
            quantidade REAL NOT NULL DEFAULT 1,
            FOREIGN KEY (produto_id) REFERENCES produtos (id) ON DELETE CASCADE,
            FOREIGN KEY (embalagem_id) REFERENCES embalagens (id) ON DELETE CASCADE
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS clientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            telefone TEXT,
            email TEXT,
            endereco TEXT,
            aniversario TEXT,
            como_conheceu TEXT,
            notas TEXT
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS pedidos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cliente TEXT NOT NULL,
            cliente_id INTEGER,
            data_pedido TEXT NOT NULL,
            data_entrega TEXT,
            forma_pagamento TEXT,
            status TEXT NOT NULL DEFAULT 'pendente',
            observacoes TEXT,
            FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE SET NULL
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS pedido_itens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pedido_id INTEGER NOT NULL,
            produto_id INTEGER NOT NULL,
            quantidade INTEGER NOT NULL,
            preco_unitario REAL NOT NULL,
            FOREIGN KEY (pedido_id) REFERENCES pedidos (id) ON DELETE CASCADE,
            FOREIGN KEY (produto_id) REFERENCES produtos (id)
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS gastos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            data TEXT NOT NULL,
            tipo_pagamento TEXT,
            categoria TEXT,
            valor REAL NOT NULL DEFAULT 0
        )
    """)

    _migrar_colunas_pedidos(cur)
    _migrar_colunas_produtos(cur)
    _migrar_status_pedidos(cur)
    _migrar_clientes_dos_pedidos(cur)

    conn.commit()
    conn.close()


def _migrar_colunas_pedidos(cur):
    """Adiciona colunas novas em bancos criados por versoes anteriores do programa."""
    colunas_existentes = {linha[1] for linha in cur.execute("PRAGMA table_info(pedidos)").fetchall()}
    if "data_entrega" not in colunas_existentes:
        cur.execute("ALTER TABLE pedidos ADD COLUMN data_entrega TEXT")
    if "forma_pagamento" not in colunas_existentes:
        cur.execute("ALTER TABLE pedidos ADD COLUMN forma_pagamento TEXT")
    if "cliente_id" not in colunas_existentes:
        cur.execute("ALTER TABLE pedidos ADD COLUMN cliente_id INTEGER REFERENCES clientes(id)")


def _migrar_colunas_produtos(cur):
    colunas_existentes = {linha[1] for linha in cur.execute("PRAGMA table_info(produtos)").fetchall()}
    if "categoria" not in colunas_existentes:
        cur.execute("ALTER TABLE produtos ADD COLUMN categoria TEXT")
    if "taxa_overhead" not in colunas_existentes:
        cur.execute("ALTER TABLE produtos ADD COLUMN taxa_overhead REAL NOT NULL DEFAULT 10")


def _migrar_status_pedidos(cur):
    """O status de pedido evoluiu de nao_pago/pago para um fluxo completo
    (pendente -> pronto -> entregue -> pago). Pedidos antigos com status
    'pago' continuam pagos; qualquer outro status antigo vira 'pendente'."""
    cur.execute("UPDATE pedidos SET status = 'pendente' WHERE status NOT IN ('pendente', 'pronto', 'entregue', 'pago')")


def _migrar_clientes_dos_pedidos(cur):
    """O cliente do pedido era so um texto solto; agora vira uma entidade
    propria (aba Clientes). Para pedidos antigos sem cliente_id, cria (ou
    reaproveita) um cliente com o mesmo nome e faz o vinculo, sem duplicar
    clientes com o mesmo nome (comparando sem espacos extras e sem case)."""
    pendentes = cur.execute(
        "SELECT id, cliente FROM pedidos WHERE cliente_id IS NULL AND cliente IS NOT NULL AND TRIM(cliente) <> ''"
    ).fetchall()
    if not pendentes:
        return

    cache_nome_para_id = {}
    for linha in cur.execute("SELECT id, nome FROM clientes").fetchall():
        cache_nome_para_id[linha[1].strip().lower()] = linha[0]

    for pedido_id, nome_cliente in pendentes:
        chave = nome_cliente.strip().lower()
        cliente_id = cache_nome_para_id.get(chave)
        if cliente_id is None:
            cur.execute("INSERT INTO clientes (nome) VALUES (?)", (nome_cliente.strip(),))
            cliente_id = cur.lastrowid
            cache_nome_para_id[chave] = cliente_id
        cur.execute("UPDATE pedidos SET cliente_id = ? WHERE id = ?", (cliente_id, pedido_id))
