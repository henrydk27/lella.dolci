from db import get_connection


def listar_embalagens():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM embalagens ORDER BY nome").fetchall()
    conn.close()
    return rows


def buscar_embalagem(embalagem_id):
    conn = get_connection()
    row = conn.execute("SELECT * FROM embalagens WHERE id = ?", (embalagem_id,)).fetchone()
    conn.close()
    return row


def adicionar_embalagem(nome, custo_total, rendimento):
    conn = get_connection()
    conn.execute(
        "INSERT INTO embalagens (nome, custo_total, rendimento) VALUES (?, ?, ?)",
        (nome, custo_total, rendimento),
    )
    conn.commit()
    conn.close()


def atualizar_embalagem(embalagem_id, nome, custo_total, rendimento):
    conn = get_connection()
    conn.execute(
        "UPDATE embalagens SET nome = ?, custo_total = ?, rendimento = ? WHERE id = ?",
        (nome, custo_total, rendimento, embalagem_id),
    )
    conn.commit()
    conn.close()


def remover_embalagem(embalagem_id):
    conn = get_connection()
    conn.execute("DELETE FROM embalagens WHERE id = ?", (embalagem_id,))
    conn.commit()
    conn.close()


def calcular_custo_unitario(embalagem):
    """embalagem: linha do banco (custo_total, rendimento). Custo por unidade
    embalada, igual a coluna 'Custo por Unidade' da planilha original."""
    if not embalagem["rendimento"]:
        return 0
    return embalagem["custo_total"] / embalagem["rendimento"]
