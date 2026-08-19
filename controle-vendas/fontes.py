import ctypes
import os
import sys

FR_PRIVATE = 0x10

NOME_FONTE_TITULO = "Caprasimo"
NOME_FONTE_CORPO = "Figtree"

# Usados caso as fontes nao consigam ser carregadas (ex: fora do Windows).
FALLBACK_FONTE_TITULO = "Georgia"
FALLBACK_FONTE_CORPO = "Segoe UI"


def registrar_fontes(pasta_fontes):
    """Carrega os .ttf da pasta como fontes privadas do processo (sem instalar
    no Windows, sem precisar de permissao de administrador). Retorna True se
    pelo menos uma fonte foi carregada com sucesso."""
    if sys.platform != "win32" or not os.path.isdir(pasta_fontes):
        return False

    try:
        gdi32 = ctypes.WinDLL("gdi32")
    except OSError:
        return False

    carregou_alguma = False
    for nome_arquivo in os.listdir(pasta_fontes):
        if nome_arquivo.lower().endswith(".ttf"):
            caminho = os.path.join(pasta_fontes, nome_arquivo)
            resultado = gdi32.AddFontResourceExW(caminho, FR_PRIVATE, 0)
            if resultado > 0:
                carregou_alguma = True

    return carregou_alguma


def fonte_titulo():
    return NOME_FONTE_TITULO if _fontes_carregadas else FALLBACK_FONTE_TITULO


def fonte_corpo():
    return NOME_FONTE_CORPO if _fontes_carregadas else FALLBACK_FONTE_CORPO


_fontes_carregadas = False


def inicializar(pasta_fontes):
    global _fontes_carregadas
    _fontes_carregadas = registrar_fontes(pasta_fontes)
    return _fontes_carregadas
