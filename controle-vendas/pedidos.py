from datetime import datetime
from db import get_connection


def criar_pedido(cliente, itens, observacoes="", data_entrega=None, forma_pagamento=None):
    """itens: lista de dicts {produto_id, quantidade, preco_unitario}"""
    conn = get_connection()
    cur = conn.cursor()
    data_pedido = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cur.execute(
        """INSERT INTO pedidos (cliente, data_pedido, data_entrega, forma_pagamento, status, observacoes)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (cliente, data_pedido, data_entrega, forma_pagamento, "nao_pago", observacoes),
    )
    pedido_id = cur.lastrowid

    for item in itens:
        cur.execute(
            "INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)",
            (pedido_id, item["produto_id"], item["quantidade"], item["preco_unitario"]),
        )

    conn.commit()
    conn.close()
    return pedido_id


def listar_pedidos():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM pedidos ORDER BY data_pedido DESC").fetchall()
    conn.close()
    return rows


def buscar_pedido(pedido_id):
    conn = get_connection()
    pedido = conn.execute("SELECT * FROM pedidos WHERE id = ?", (pedido_id,)).fetchone()
    itens = conn.execute("""
        SELECT pi.*, p.nome AS produto_nome
        FROM pedido_itens pi
        JOIN produtos p ON p.id = pi.produto_id
        WHERE pi.pedido_id = ?
    """, (pedido_id,)).fetchall()
    conn.close()
    return pedido, itens


def atualizar_status_pedido(pedido_id, status):
    conn = get_connection()
    conn.execute("UPDATE pedidos SET status = ? WHERE id = ?", (status, pedido_id))
    conn.commit()
    conn.close()


def atualizar_dados_pedido(pedido_id, data_entrega=None, forma_pagamento=None, observacoes=None):
    conn = get_connection()
    conn.execute(
        "UPDATE pedidos SET data_entrega = ?, forma_pagamento = ?, observacoes = ? WHERE id = ?",
        (data_entrega, forma_pagamento, observacoes, pedido_id),
    )
    conn.commit()
    conn.close()


def remover_pedido(pedido_id):
    conn = get_connection()
    conn.execute("DELETE FROM pedidos WHERE id = ?", (pedido_id,))
    conn.commit()
    conn.close()


def atualizar_quantidade_item(item_id, quantidade):
    conn = get_connection()
    conn.execute("UPDATE pedido_itens SET quantidade = ? WHERE id = ?", (quantidade, item_id))
    conn.commit()
    conn.close()


def remover_item_pedido(item_id):
    conn = get_connection()
    conn.execute("DELETE FROM pedido_itens WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()


def total_pedido(pedido_id):
    _, itens = buscar_pedido(pedido_id)
    return sum(i["quantidade"] * i["preco_unitario"] for i in itens)


def historico_vendas(data_inicio=None, data_fim=None, status=None):
    conn = get_connection()
    query = "SELECT * FROM pedidos WHERE 1=1"
    params = []
    if data_inicio:
        query += " AND data_pedido >= ?"
        params.append(data_inicio)
    if data_fim:
        query += " AND data_pedido <= ?"
        params.append(data_fim + " 23:59:59")
    if status:
        query += " AND status = ?"
        params.append(status)
    query += " ORDER BY data_pedido DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return rows


def resumo_vendas(data_inicio=None, data_fim=None):
    pedidos = historico_vendas(data_inicio, data_fim, status="pago")
    total = 0
    quantidade_pedidos = len(pedidos)
    for p in pedidos:
        total += total_pedido(p["id"])
    return {"quantidade_pedidos": quantidade_pedidos, "total_vendas": total}


def resumo_mes_atual():
    inicio_mes = datetime.now().strftime("%Y-%m-01")
    return resumo_vendas(data_inicio=inicio_mes)


def quantidade_pedidos_em_aberto():
    conn = get_connection()
    total = conn.execute("SELECT COUNT(*) FROM pedidos WHERE status = 'nao_pago'").fetchone()[0]
    conn.close()
    return total


def produto_mais_vendido():
    conn = get_connection()
    row = conn.execute("""
        SELECT p.nome, SUM(pi.quantidade) AS total_vendido
        FROM pedido_itens pi
        JOIN produtos p ON p.id = pi.produto_id
        GROUP BY pi.produto_id
        ORDER BY total_vendido DESC
        LIMIT 1
    """).fetchone()
    conn.close()
    return row
