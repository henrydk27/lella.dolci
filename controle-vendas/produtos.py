from db import get_connection


def listar_produtos():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM produtos ORDER BY nome").fetchall()
    conn.close()
    return rows


def buscar_produto(produto_id):
    conn = get_connection()
    row = conn.execute("SELECT * FROM produtos WHERE id = ?", (produto_id,)).fetchone()
    conn.close()
    return row


def adicionar_produto(nome, preco, descricao=""):
    conn = get_connection()
    cur = conn.execute(
        "INSERT INTO produtos (nome, preco, descricao) VALUES (?, ?, ?)",
        (nome, preco, descricao),
    )
    produto_id = cur.lastrowid
    conn.commit()
    conn.close()
    return produto_id


def atualizar_produto(produto_id, nome, preco, descricao=""):
    conn = get_connection()
    conn.execute(
        "UPDATE produtos SET nome = ?, preco = ?, descricao = ? WHERE id = ?",
        (nome, preco, descricao, produto_id),
    )
    conn.commit()
    conn.close()


def remover_produto(produto_id):
    conn = get_connection()
    conn.execute("DELETE FROM produtos WHERE id = ?", (produto_id,))
    conn.commit()
    conn.close()


def listar_ingredientes_do_produto(produto_id):
    conn = get_connection()
    rows = conn.execute("""
        SELECT pi.id, i.nome, i.unidade, pi.quantidade, i.preco_unitario
        FROM produto_ingredientes pi
        JOIN ingredientes i ON i.id = pi.ingrediente_id
        WHERE pi.produto_id = ?
    """, (produto_id,)).fetchall()
    conn.close()
    return rows


def adicionar_ingrediente_ao_produto(produto_id, ingrediente_id, quantidade):
    conn = get_connection()
    conn.execute(
        "INSERT INTO produto_ingredientes (produto_id, ingrediente_id, quantidade) VALUES (?, ?, ?)",
        (produto_id, ingrediente_id, quantidade),
    )
    conn.commit()
    conn.close()


def remover_ingrediente_do_produto(produto_ingrediente_id):
    conn = get_connection()
    conn.execute("DELETE FROM produto_ingredientes WHERE id = ?", (produto_ingrediente_id,))
    conn.commit()
    conn.close()


def calcular_custo_produto(produto_id):
    ingredientes = listar_ingredientes_do_produto(produto_id)
    return sum(i["quantidade"] * i["preco_unitario"] for i in ingredientes)


def calcular_margem_produto(produto_id, preco_venda):
    """Retorna (margem_reais, margem_percentual) com base no custo da ficha tecnica."""
    custo = calcular_custo_produto(produto_id)
    margem_reais = preco_venda - custo
    margem_percentual = (margem_reais / preco_venda * 100) if preco_venda else 0
    return margem_reais, margem_percentual
