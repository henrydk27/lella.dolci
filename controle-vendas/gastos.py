from db import get_connection

TIPOS_PAGAMENTO = ["", "pix", "dinheiro", "cartao_debito", "cartao_credito", "outro"]
CATEGORIAS = ["", "ingredientes", "embalagem", "mercado", "confeitaria", "outro"]


def listar_gastos():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM gastos ORDER BY data DESC").fetchall()
    conn.close()
    return rows


def buscar_gasto(gasto_id):
    conn = get_connection()
    row = conn.execute("SELECT * FROM gastos WHERE id = ?", (gasto_id,)).fetchone()
    conn.close()
    return row


def adicionar_gasto(nome, data, tipo_pagamento, categoria, valor):
    conn = get_connection()
    conn.execute(
        "INSERT INTO gastos (nome, data, tipo_pagamento, categoria, valor) VALUES (?, ?, ?, ?, ?)",
        (nome, data, tipo_pagamento, categoria, valor),
    )
    conn.commit()
    conn.close()


def atualizar_gasto(gasto_id, nome, data, tipo_pagamento, categoria, valor):
    conn = get_connection()
    conn.execute(
        "UPDATE gastos SET nome = ?, data = ?, tipo_pagamento = ?, categoria = ?, valor = ? WHERE id = ?",
        (nome, data, tipo_pagamento, categoria, valor, gasto_id),
    )
    conn.commit()
    conn.close()


def remover_gasto(gasto_id):
    conn = get_connection()
    conn.execute("DELETE FROM gastos WHERE id = ?", (gasto_id,))
    conn.commit()
    conn.close()


def filtrar_gastos(data_inicio=None, data_fim=None):
    conn = get_connection()
    query = "SELECT * FROM gastos WHERE 1=1"
    params = []
    if data_inicio:
        query += " AND data >= ?"
        params.append(data_inicio)
    if data_fim:
        query += " AND data <= ?"
        params.append(data_fim)
    query += " ORDER BY data DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return rows


def total_gastos(data_inicio=None, data_fim=None):
    return sum(g["valor"] for g in filtrar_gastos(data_inicio, data_fim))


def resumo_por_categoria(data_inicio=None, data_fim=None):
    totais = {}
    for g in filtrar_gastos(data_inicio, data_fim):
        chave = g["categoria"] or "sem categoria"
        totais[chave] = totais.get(chave, 0) + g["valor"]
    return sorted(totais.items(), key=lambda item: item[1], reverse=True)


def resumo_por_tipo_pagamento(data_inicio=None, data_fim=None):
    totais = {}
    for g in filtrar_gastos(data_inicio, data_fim):
        chave = g["tipo_pagamento"] or "sem forma"
        totais[chave] = totais.get(chave, 0) + g["valor"]
    return sorted(totais.items(), key=lambda item: item[1], reverse=True)
