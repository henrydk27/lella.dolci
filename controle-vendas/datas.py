"""Conversao entre o formato usado no banco (ISO: AAAA-MM-DD) e o formato
exibido/digitado pelo usuario (DD/MM/AAAA). O banco guarda em ISO porque
esse formato ordena e filtra corretamente como texto."""


def iso_para_br(valor):
    if not valor:
        return ""
    partes = valor.strip().split(" ")
    data = partes[0]
    resto = f" {partes[1]}" if len(partes) > 1 else ""
    try:
        ano, mes, dia = data.split("-")
    except ValueError:
        return valor
    return f"{dia}/{mes}/{ano}{resto}"


def br_para_iso(valor):
    """Retorna None para vazio, ou lanca ValueError se o formato for invalido."""
    if not valor or not valor.strip():
        return None
    dia, mes, ano = valor.strip().split("/")
    if len(dia) != 2 or len(mes) != 2 or len(ano) != 4:
        raise ValueError("Data invalida")
    return f"{int(ano):04d}-{int(mes):02d}-{int(dia):02d}"
