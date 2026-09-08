from db import get_connection
import embalagens as embalagens_mod

CATEGORIAS_SUGERIDAS = [
    "Geleia", "Brigadeiro", "Palha Italiana", "Alfajor", "Bombom Red Velvet",
    "Pao de Mel", "Biscoito", "Bombom", "Pudim", "Trufa", "Bem Casado",
    "Pastel de Nata", "Cones", "Canudinhos", "Biscoito Gengibre", "Ovinho",
    "Brigadeiro Personalizado", "Caixa",
]


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


def listar_categorias():
    """Categorias ja usadas em produtos cadastrados + sugestoes padrao, sem duplicar."""
    conn = get_connection()
    rows = conn.execute(
        "SELECT DISTINCT categoria FROM produtos WHERE categoria IS NOT NULL AND categoria <> '' ORDER BY categoria"
    ).fetchall()
    conn.close()
    existentes = [r["categoria"] for r in rows]
    todas = existentes + [c for c in CATEGORIAS_SUGERIDAS if c not in existentes]
    return todas


def adicionar_produto(nome, preco, descricao="", categoria=None, taxa_overhead=10):
    conn = get_connection()
    cur = conn.execute(
        "INSERT INTO produtos (nome, preco, descricao, categoria, taxa_overhead) VALUES (?, ?, ?, ?, ?)",
        (nome, preco, descricao, categoria, taxa_overhead),
    )
    produto_id = cur.lastrowid
    conn.commit()
    conn.close()
    return produto_id


def atualizar_produto(produto_id, nome, preco, descricao="", categoria=None, taxa_overhead=10):
    conn = get_connection()
    conn.execute(
        "UPDATE produtos SET nome = ?, preco = ?, descricao = ?, categoria = ?, taxa_overhead = ? WHERE id = ?",
        (nome, preco, descricao, categoria, taxa_overhead, produto_id),
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


def listar_embalagens_do_produto(produto_id):
    conn = get_connection()
    rows = conn.execute("""
        SELECT pe.id, e.nome, e.custo_total, e.rendimento, pe.quantidade
        FROM produto_embalagens pe
        JOIN embalagens e ON e.id = pe.embalagem_id
        WHERE pe.produto_id = ?
    """, (produto_id,)).fetchall()
    conn.close()
    return rows


def adicionar_embalagem_ao_produto(produto_id, embalagem_id, quantidade):
    conn = get_connection()
    conn.execute(
        "INSERT INTO produto_embalagens (produto_id, embalagem_id, quantidade) VALUES (?, ?, ?)",
        (produto_id, embalagem_id, quantidade),
    )
    conn.commit()
    conn.close()


def remover_embalagem_do_produto(produto_embalagem_id):
    conn = get_connection()
    conn.execute("DELETE FROM produto_embalagens WHERE id = ?", (produto_embalagem_id,))
    conn.commit()
    conn.close()


def calcular_custo_ingredientes(produto_id):
    ingredientes = listar_ingredientes_do_produto(produto_id)
    return sum(i["quantidade"] * i["preco_unitario"] for i in ingredientes)


def calcular_custo_embalagens(produto_id):
    total = 0
    for e in listar_embalagens_do_produto(produto_id):
        custo_unitario = embalagens_mod.calcular_custo_unitario(e)
        total += custo_unitario * e["quantidade"]
    return total


def calcular_custo_produto(produto_id):
    """Custo total do produto: ingredientes + taxa de utilidades/gas (overhead,
    padrao 10%) sobre os ingredientes + custo das embalagens usadas.
    Espelha a Calculadora de Precificacao da planilha original."""
    produto = buscar_produto(produto_id)
    custo_ingredientes = calcular_custo_ingredientes(produto_id)
    taxa = produto["taxa_overhead"] if produto else 10
    custo_overhead = custo_ingredientes * (taxa / 100)
    custo_embalagens = calcular_custo_embalagens(produto_id)
    return custo_ingredientes + custo_overhead + custo_embalagens


def detalhar_custo_produto(produto_id):
    produto = buscar_produto(produto_id)
    custo_ingredientes = calcular_custo_ingredientes(produto_id)
    taxa = produto["taxa_overhead"] if produto else 10
    custo_overhead = custo_ingredientes * (taxa / 100)
    custo_embalagens = calcular_custo_embalagens(produto_id)
    return {
        "ingredientes": custo_ingredientes,
        "overhead": custo_overhead,
        "embalagens": custo_embalagens,
        "total": custo_ingredientes + custo_overhead + custo_embalagens,
    }


def calcular_margem_produto(produto_id, preco_venda):
    """Retorna (margem_reais, margem_percentual) com base no custo total do produto."""
    custo = calcular_custo_produto(produto_id)
    margem_reais = preco_venda - custo
    margem_percentual = (margem_reais / preco_venda * 100) if preco_venda else 0
    return margem_reais, margem_percentual
