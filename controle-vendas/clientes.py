from datetime import datetime
from db import get_connection

# Cliente e considerado inativo se nao compra ha mais que isso.
DIAS_INATIVIDADE = 60
# Cliente e considerado VIP a partir desse total gasto (pedidos pagos).
LIMITE_VIP = 300


def listar_clientes():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM clientes ORDER BY nome").fetchall()
    conn.close()
    return rows


def buscar_cliente(cliente_id):
    conn = get_connection()
    row = conn.execute("SELECT * FROM clientes WHERE id = ?", (cliente_id,)).fetchone()
    conn.close()
    return row


def adicionar_cliente(nome, telefone=None, email=None, endereco=None, aniversario=None, como_conheceu=None, notas=None):
    conn = get_connection()
    cur = conn.execute(
        """INSERT INTO clientes (nome, telefone, email, endereco, aniversario, como_conheceu, notas)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (nome, telefone, email, endereco, aniversario, como_conheceu, notas),
    )
    cliente_id = cur.lastrowid
    conn.commit()
    conn.close()
    return cliente_id


def atualizar_cliente(cliente_id, nome, telefone=None, email=None, endereco=None, aniversario=None, como_conheceu=None, notas=None):
    conn = get_connection()
    conn.execute(
        """UPDATE clientes SET nome = ?, telefone = ?, email = ?, endereco = ?,
           aniversario = ?, como_conheceu = ?, notas = ? WHERE id = ?""",
        (nome, telefone, email, endereco, aniversario, como_conheceu, notas, cliente_id),
    )
    conn.commit()
    conn.close()


def remover_cliente(cliente_id):
    conn = get_connection()
    conn.execute("DELETE FROM clientes WHERE id = ?", (cliente_id,))
    conn.commit()
    conn.close()


def _estatisticas_cliente(conn, cliente_id):
    pedidos_pagos = conn.execute(
        "SELECT id, data_pedido FROM pedidos WHERE cliente_id = ? AND status = 'pago'", (cliente_id,)
    ).fetchall()

    total_gasto = 0
    for p in pedidos_pagos:
        subtotal = conn.execute(
            "SELECT COALESCE(SUM(quantidade * preco_unitario), 0) FROM pedido_itens WHERE pedido_id = ?",
            (p["id"],),
        ).fetchone()[0]
        total_gasto += subtotal

    quantidade_pedidos = len(pedidos_pagos)
    ticket_medio = (total_gasto / quantidade_pedidos) if quantidade_pedidos else 0
    ultima_compra = max((p["data_pedido"] for p in pedidos_pagos), default=None)

    produto_favorito = conn.execute("""
        SELECT p.nome, SUM(pi.quantidade) AS total
        FROM pedido_itens pi
        JOIN pedidos pe ON pe.id = pi.pedido_id
        JOIN produtos p ON p.id = pi.produto_id
        WHERE pe.cliente_id = ? AND pe.status = 'pago'
        GROUP BY pi.produto_id
        ORDER BY total DESC
        LIMIT 1
    """, (cliente_id,)).fetchone()

    return {
        "total_gasto": total_gasto,
        "quantidade_pedidos": quantidade_pedidos,
        "ticket_medio": ticket_medio,
        "ultima_compra": ultima_compra,
        "produto_favorito": produto_favorito["nome"] if produto_favorito else None,
    }


def calcular_status(estatisticas):
    if estatisticas["quantidade_pedidos"] == 0:
        return "novo"
    if estatisticas["total_gasto"] >= LIMITE_VIP:
        return "vip"
    if estatisticas["ultima_compra"]:
        dias = (datetime.now() - datetime.strptime(estatisticas["ultima_compra"][:10], "%Y-%m-%d")).days
        if dias > DIAS_INATIVIDADE:
            return "inativo"
    return "recorrente"


def perfil_cliente(cliente_id):
    """Dados cadastrais + estatisticas calculadas + status, tudo junto para a ficha do cliente."""
    conn = get_connection()
    cliente = conn.execute("SELECT * FROM clientes WHERE id = ?", (cliente_id,)).fetchone()
    if not cliente:
        conn.close()
        return None
    estatisticas = _estatisticas_cliente(conn, cliente_id)
    conn.close()
    estatisticas["status"] = calcular_status(estatisticas)
    return {"cliente": cliente, **estatisticas}


def historico_pedidos_cliente(cliente_id):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM pedidos WHERE cliente_id = ? ORDER BY data_pedido DESC", (cliente_id,)
    ).fetchall()
    conn.close()
    return rows


def listar_clientes_com_status():
    """Usado na lista principal da aba Clientes: cada cliente com seu resumo."""
    conn = get_connection()
    clientes = conn.execute("SELECT * FROM clientes ORDER BY nome").fetchall()
    resultado = []
    for c in clientes:
        estatisticas = _estatisticas_cliente(conn, c["id"])
        estatisticas["status"] = calcular_status(estatisticas)
        resultado.append({"cliente": c, **estatisticas})
    conn.close()
    return resultado


def buscar_ou_criar_cliente_por_nome(nome):
    """Usado ao criar um pedido rapido: reaproveita cliente existente com
    o mesmo nome (comparando sem espacos/case) ou cria um novo."""
    nome = nome.strip()
    conn = get_connection()
    row = conn.execute(
        "SELECT id FROM clientes WHERE LOWER(TRIM(nome)) = ?", (nome.lower(),)
    ).fetchone()
    if row:
        conn.close()
        return row["id"]
    cur = conn.execute("INSERT INTO clientes (nome) VALUES (?)", (nome,))
    cliente_id = cur.lastrowid
    conn.commit()
    conn.close()
    return cliente_id


def aniversariantes_do_mes():
    """aniversario e guardado como DD/MM ou AAAA-MM-DD; comparamos so o mes."""
    mes_atual = datetime.now().strftime("%m")
    conn = get_connection()
    todos = conn.execute(
        "SELECT * FROM clientes WHERE aniversario IS NOT NULL AND TRIM(aniversario) <> ''"
    ).fetchall()
    conn.close()

    resultado = []
    for c in todos:
        aniversario = c["aniversario"]
        partes = aniversario.replace("/", "-").split("-")
        mes = None
        if len(partes) == 3:
            mes = partes[1] if len(partes[0]) == 4 else partes[1]
        elif len(partes) == 2:
            mes = partes[1] if len(partes[0]) <= 2 and len(partes[1]) <= 2 else partes[0]
        if mes and mes.zfill(2) == mes_atual:
            resultado.append(c)
    return resultado


def clientes_inativos(dias=DIAS_INATIVIDADE):
    conn = get_connection()
    clientes = conn.execute("SELECT * FROM clientes ORDER BY nome").fetchall()
    resultado = []
    for c in clientes:
        estatisticas = _estatisticas_cliente(conn, c["id"])
        if estatisticas["quantidade_pedidos"] == 0:
            continue
        dias_sem_compra = (datetime.now() - datetime.strptime(estatisticas["ultima_compra"][:10], "%Y-%m-%d")).days
        if dias_sem_compra > dias:
            resultado.append({"cliente": c, "dias_sem_compra": dias_sem_compra, **estatisticas})
    conn.close()
    resultado.sort(key=lambda item: item["dias_sem_compra"], reverse=True)
    return resultado


def cliente_maior_gasto(data_inicio=None, data_fim=None):
    conn = get_connection()
    query = """
        SELECT c.id, c.nome, SUM(pi.quantidade * pi.preco_unitario) AS total_gasto
        FROM pedidos pe
        JOIN pedido_itens pi ON pi.pedido_id = pe.id
        JOIN clientes c ON c.id = pe.cliente_id
        WHERE pe.status = 'pago'
    """
    params = []
    if data_inicio:
        query += " AND pe.data_pedido >= ?"
        params.append(data_inicio)
    if data_fim:
        query += " AND pe.data_pedido <= ?"
        params.append(data_fim + " 23:59:59")
    query += " GROUP BY pe.cliente_id ORDER BY total_gasto DESC LIMIT 1"
    row = conn.execute(query, params).fetchone()
    conn.close()
    return row
