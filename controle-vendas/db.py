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
        CREATE TABLE IF NOT EXISTS produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL UNIQUE,
            preco REAL NOT NULL,
            descricao TEXT
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
        CREATE TABLE IF NOT EXISTS pedidos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cliente TEXT NOT NULL,
            data_pedido TEXT NOT NULL,
            data_entrega TEXT,
            forma_pagamento TEXT,
            status TEXT NOT NULL DEFAULT 'nao_pago',
            observacoes TEXT
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

    _migrar_colunas_pedidos(cur)

    conn.commit()
    conn.close()


def _migrar_colunas_pedidos(cur):
    """Adiciona colunas novas em bancos criados por versoes anteriores do programa."""
    colunas_existentes = {linha[1] for linha in cur.execute("PRAGMA table_info(pedidos)").fetchall()}
    if "data_entrega" not in colunas_existentes:
        cur.execute("ALTER TABLE pedidos ADD COLUMN data_entrega TEXT")
    if "forma_pagamento" not in colunas_existentes:
        cur.execute("ALTER TABLE pedidos ADD COLUMN forma_pagamento TEXT")
