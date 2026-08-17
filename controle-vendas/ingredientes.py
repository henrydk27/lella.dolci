from db import get_connection


def listar_ingredientes():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM ingredientes ORDER BY nome").fetchall()
    conn.close()
    return rows


def buscar_ingrediente(ingrediente_id):
    conn = get_connection()
    row = conn.execute("SELECT * FROM ingredientes WHERE id = ?", (ingrediente_id,)).fetchone()
    conn.close()
    return row


def adicionar_ingrediente(nome, unidade, quantidade_estoque, preco_unitario):
    conn = get_connection()
    conn.execute(
        "INSERT INTO ingredientes (nome, unidade, quantidade_estoque, preco_unitario) VALUES (?, ?, ?, ?)",
        (nome, unidade, quantidade_estoque, preco_unitario),
    )
    conn.commit()
    conn.close()


def atualizar_ingrediente(ingrediente_id, nome, unidade, quantidade_estoque, preco_unitario):
    conn = get_connection()
    conn.execute(
        "UPDATE ingredientes SET nome = ?, unidade = ?, quantidade_estoque = ?, preco_unitario = ? WHERE id = ?",
        (nome, unidade, quantidade_estoque, preco_unitario, ingrediente_id),
    )
    conn.commit()
    conn.close()


def remover_ingrediente(ingrediente_id):
    conn = get_connection()
    conn.execute("DELETE FROM ingredientes WHERE id = ?", (ingrediente_id,))
    conn.commit()
    conn.close()


def ajustar_estoque(ingrediente_id, delta):
    conn = get_connection()
    conn.execute(
        "UPDATE ingredientes SET quantidade_estoque = quantidade_estoque + ? WHERE id = ?",
        (delta, ingrediente_id),
    )
    conn.commit()
    conn.close()
