import os
import sys
import tkinter as tk
from tkinter import messagebox, simpledialog, ttk

import customtkinter as ctk

import db
import produtos
import ingredientes
import pedidos
import datas


def caminho_recurso(nome_arquivo):
    """Resolve o caminho de um arquivo empacotado junto do programa.
    Quando rodando via PyInstaller (--onefile), os arquivos ficam em
    sys._MEIPASS; ao rodar via `python gui.py`, ficam ao lado deste arquivo."""
    base = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base, nome_arquivo)


# ---------------- TEMA DARK / LILAS NEON ----------------

COR_FUNDO = "#121014"
COR_PAINEL = "#1b1820"
COR_PAINEL_CLARO = "#242030"
COR_BORDA = "#3a3345"
COR_TEXTO = "#f0eef5"
COR_TEXTO_SUAVE = "#a99fc2"
COR_LILAS = "#c77dff"
COR_LILAS_NEON = "#e0aaff"
COR_LILAS_HOVER = "#9d4edd"
COR_LILAS_ESCURO = "#7b2cbf"
COR_SELECAO = "#3c2a5e"
COR_ALERTA = "#ff6b9d"
COR_ALERTA_HOVER = "#e0527f"

RAIO = 14

ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("dark-blue")


def botao(master, texto, comando, perigo=False, **kwargs):
    cor = COR_ALERTA if perigo else COR_LILAS_ESCURO
    cor_hover = COR_ALERTA_HOVER if perigo else COR_LILAS_HOVER
    padrao = dict(
        text=texto,
        command=comando,
        corner_radius=RAIO,
        fg_color=cor,
        hover_color=cor_hover,
        text_color="#120c1a" if perigo else COR_TEXTO,
        font=ctk.CTkFont(family="Segoe UI", size=13, weight="bold"),
        height=36,
    )
    padrao.update(kwargs)
    return ctk.CTkButton(master, **padrao)


def campo(master, placeholder="", **kwargs):
    padrao = dict(
        corner_radius=RAIO,
        fg_color=COR_PAINEL_CLARO,
        border_color=COR_LILAS_ESCURO,
        border_width=1,
        text_color=COR_TEXTO,
        placeholder_text=placeholder,
        placeholder_text_color=COR_TEXTO_SUAVE,
        height=36,
    )
    padrao.update(kwargs)
    return ctk.CTkEntry(master, **padrao)


def combo(master, valores, **kwargs):
    padrao = dict(
        corner_radius=RAIO,
        fg_color=COR_PAINEL_CLARO,
        button_color=COR_LILAS_ESCURO,
        button_hover_color=COR_LILAS_HOVER,
        border_color=COR_LILAS_ESCURO,
        text_color=COR_TEXTO,
        dropdown_fg_color=COR_PAINEL_CLARO,
        dropdown_text_color=COR_TEXTO,
        dropdown_hover_color=COR_SELECAO,
        values=valores,
        height=36,
        state="readonly",
    )
    padrao.update(kwargs)
    return ctk.CTkComboBox(master, **padrao)


def cartao(master, titulo=None, **kwargs):
    padrao = dict(corner_radius=18, fg_color=COR_PAINEL, border_color=COR_LILAS_ESCURO, border_width=1)
    padrao.update(kwargs)
    frame = ctk.CTkFrame(master, **padrao)
    if titulo:
        ctk.CTkLabel(
            frame, text=titulo, font=ctk.CTkFont(family="Segoe UI", size=14, weight="bold"), text_color=COR_LILAS_NEON
        ).pack(anchor="w", padx=18, pady=(16, 6))
    return frame


def rotulo(master, texto, **kwargs):
    padrao = dict(text=texto, text_color=COR_TEXTO, font=ctk.CTkFont(family="Segoe UI", size=12))
    padrao.update(kwargs)
    return ctk.CTkLabel(master, **padrao)


def configurar_estilo_treeview(root):
    """Trata o Treeview (nativo, usado para listas em tabela) para combinar com o tema."""
    style = ttk.Style(root)
    style.theme_use("clam")

    style.configure(
        "Custom.Treeview",
        background=COR_PAINEL_CLARO,
        fieldbackground=COR_PAINEL_CLARO,
        foreground=COR_TEXTO,
        bordercolor=COR_PAINEL,
        borderwidth=0,
        rowheight=30,
        font=("Segoe UI", 10),
    )
    style.map(
        "Custom.Treeview",
        background=[("selected", COR_SELECAO)],
        foreground=[("selected", COR_LILAS_NEON)],
    )
    style.configure(
        "Custom.Treeview.Heading",
        background=COR_PAINEL,
        foreground=COR_LILAS_NEON,
        font=("Segoe UI", 10, "bold"),
        borderwidth=0,
        relief="flat",
    )
    style.map("Custom.Treeview.Heading", background=[("active", COR_SELECAO)])
    style.layout("Custom.Treeview", [("Custom.Treeview.treearea", {"sticky": "nswe"})])
    return style


def tabela(master, colunas):
    """Cria um Treeview dentro de um container arredondado (CTkFrame) para simular cantos suaves."""
    container = ctk.CTkFrame(master, corner_radius=18, fg_color=COR_PAINEL_CLARO, border_color=COR_LILAS_ESCURO, border_width=1)
    tree = ttk.Treeview(container, columns=[c[0] for c in colunas], show="headings", style="Custom.Treeview")
    for chave, titulo, largura in colunas:
        tree.heading(chave, text=titulo)
        tree.column(chave, width=largura)
    tree.pack(fill="both", expand=True, padx=10, pady=10)
    return container, tree


FORMAS_PAGAMENTO = ["", "pix", "dinheiro", "cartao_debito", "cartao_credito", "outro"]


def mostrar_toast(widget, mensagem, sucesso=True):
    """Banner discreto que aparece por alguns segundos e some sozinho,
    no lugar de um popup do Windows que interrompe o fluxo."""
    root = widget.winfo_toplevel()
    cor_borda = COR_LILAS_NEON if sucesso else COR_ALERTA
    toast = ctk.CTkLabel(
        root,
        text=mensagem,
        fg_color=COR_PAINEL_CLARO,
        text_color=COR_TEXTO,
        corner_radius=RAIO,
        border_color=cor_borda,
        border_width=2,
        font=ctk.CTkFont(family="Segoe UI", size=12, weight="bold"),
        padx=18,
        pady=10,
    )
    toast.place(relx=0.5, rely=0.94, anchor="s")
    toast.lift()
    root.after(2400, toast.destroy)


class App(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("Lella Dolci - Controle de Vendas")
        self.geometry("1080x680")
        self.minsize(920, 580)
        self.configure(fg_color=COR_FUNDO)

        try:
            self.iconbitmap(caminho_recurso("icone.ico"))
        except Exception:
            pass

        configurar_estilo_treeview(self)

        cabecalho = ctk.CTkFrame(self, fg_color="transparent")
        cabecalho.pack(fill="x", padx=22, pady=(18, 6))
        ctk.CTkLabel(
            cabecalho, text="Lella Dolci", font=ctk.CTkFont(family="Segoe UI", size=24, weight="bold"), text_color=COR_LILAS_NEON
        ).pack(side="left")
        ctk.CTkLabel(
            cabecalho, text="   controle de vendas", font=ctk.CTkFont(family="Segoe UI", size=13), text_color=COR_TEXTO_SUAVE
        ).pack(side="left", pady=(6, 0))

        self.abas = ctk.CTkTabview(
            self,
            corner_radius=18,
            fg_color=COR_PAINEL,
            segmented_button_fg_color=COR_PAINEL,
            segmented_button_selected_color=COR_LILAS_ESCURO,
            segmented_button_selected_hover_color=COR_LILAS_HOVER,
            segmented_button_unselected_color=COR_PAINEL,
            segmented_button_unselected_hover_color=COR_SELECAO,
            text_color=COR_TEXTO,
            command=self._ao_trocar_aba,
        )
        self.abas.pack(fill="both", expand=True, padx=22, pady=18)

        self.abas.add("Inicio")
        self.abas.add("Produtos")
        self.abas.add("Ingredientes")
        self.abas.add("Pedidos")
        self.abas.add("Historico")

        self.aba_inicio = AbaInicio(self.abas.tab("Inicio"))
        self.aba_inicio.pack(fill="both", expand=True)

        self.aba_produtos = AbaProdutos(self.abas.tab("Produtos"))
        self.aba_produtos.pack(fill="both", expand=True)

        self.aba_ingredientes = AbaIngredientes(self.abas.tab("Ingredientes"))
        self.aba_ingredientes.pack(fill="both", expand=True)

        self.aba_pedidos = AbaPedidos(self.abas.tab("Pedidos"), atualizar_callback=self.atualizar_tudo)
        self.aba_pedidos.pack(fill="both", expand=True)

        self.aba_historico = AbaHistorico(self.abas.tab("Historico"))
        self.aba_historico.pack(fill="both", expand=True)

        self.abas.set("Inicio")

    def atualizar_tudo(self):
        self.aba_inicio.atualizar()
        self.aba_produtos.atualizar()
        self.aba_ingredientes.atualizar()
        self.aba_historico.atualizar()

    def _ao_trocar_aba(self):
        aba_atual = self.abas.get()
        if aba_atual == "Pedidos":
            self.aba_pedidos.atualizar()
        elif aba_atual == "Inicio":
            self.aba_inicio.atualizar()


# ---------------- ABA INICIO (DASHBOARD) ----------------

class AbaInicio(ctk.CTkFrame):
    def __init__(self, parent):
        super().__init__(parent, fg_color="transparent")
        self._montar_layout()
        self.atualizar()

    def _montar_layout(self):
        ctk.CTkLabel(
            self, text="Resumo geral", font=ctk.CTkFont(family="Segoe UI", size=18, weight="bold"), text_color=COR_LILAS_NEON
        ).pack(anchor="w", pady=(4, 16))

        linha_cards = ctk.CTkFrame(self, fg_color="transparent")
        linha_cards.pack(fill="x")

        self.card_vendido = self._criar_card(linha_cards, "Vendido este mes")
        self.card_vendido.pack(side="left", fill="both", expand=True, padx=(0, 10))

        self.card_abertos = self._criar_card(linha_cards, "Pedidos em aberto")
        self.card_abertos.pack(side="left", fill="both", expand=True, padx=10)

        self.card_mais_vendido = self._criar_card(linha_cards, "Produto mais vendido")
        self.card_mais_vendido.pack(side="left", fill="both", expand=True, padx=(10, 0))

    def _criar_card(self, master, titulo):
        card = cartao(master, titulo=titulo, height=140)
        card.pack_propagate(False)
        valor = rotulo(card, "-", font=ctk.CTkFont(family="Segoe UI", size=26, weight="bold"), text_color=COR_TEXTO)
        valor.pack(anchor="w", padx=18, pady=(6, 4))
        detalhe = rotulo(card, "", font=ctk.CTkFont(family="Segoe UI", size=12), text_color=COR_TEXTO_SUAVE)
        detalhe.pack(anchor="w", padx=18)
        card.valor_label = valor
        card.detalhe_label = detalhe
        return card

    def atualizar(self):
        resumo_mes = pedidos.resumo_mes_atual()
        self.card_vendido.valor_label.configure(text=f"R$ {resumo_mes['total_vendas']:.2f}")
        self.card_vendido.detalhe_label.configure(text=f"{resumo_mes['quantidade_pedidos']} pedido(s) pago(s)")

        em_aberto = pedidos.quantidade_pedidos_em_aberto()
        self.card_abertos.valor_label.configure(text=str(em_aberto))
        self.card_abertos.detalhe_label.configure(text="aguardando pagamento")

        top = pedidos.produto_mais_vendido()
        if top:
            self.card_mais_vendido.valor_label.configure(text=top["nome"])
            self.card_mais_vendido.detalhe_label.configure(text=f"{top['total_vendido']} unidade(s) vendida(s)")
        else:
            self.card_mais_vendido.valor_label.configure(text="-")
            self.card_mais_vendido.detalhe_label.configure(text="sem vendas ainda")


# ---------------- ABA PRODUTOS ----------------

class AbaProdutos(ctk.CTkFrame):
    def __init__(self, parent):
        super().__init__(parent, fg_color="transparent")
        self.produto_selecionado = None
        self._montar_layout()
        self.atualizar()

    def _montar_layout(self):
        container_lista, self.tree = tabela(self, [
            ("id", "ID", 50), ("nome", "Nome", 200), ("preco", "Preco", 90), ("descricao", "Descricao", 240),
        ])
        container_lista.pack(side="left", fill="both", expand=True, padx=(0, 12), pady=4)
        self.tree.bind("<<TreeviewSelect>>", self._selecionar)

        painel = cartao(self, titulo="Produto", width=340)
        painel.pack(side="right", fill="y", pady=4)
        painel.pack_propagate(False)

        rotulo(painel, "Nome").pack(anchor="w", padx=18)
        self.entry_nome = campo(painel, "Ex: Bolo de chocolate")
        self.entry_nome.pack(fill="x", padx=18, pady=(2, 10))

        rotulo(painel, "Preco de venda").pack(anchor="w", padx=18)
        self.entry_preco = campo(painel, "Ex: 45.00")
        self.entry_preco.pack(fill="x", padx=18, pady=(2, 10))

        rotulo(painel, "Descricao").pack(anchor="w", padx=18)
        self.entry_descricao = campo(painel, "Opcional")
        self.entry_descricao.pack(fill="x", padx=18, pady=(2, 10))

        frame_botoes = ctk.CTkFrame(painel, fg_color="transparent")
        frame_botoes.pack(fill="x", padx=18, pady=(4, 10))
        botao(frame_botoes, "Novo", self._limpar, width=90).pack(side="left", padx=(0, 6))
        botao(frame_botoes, "Salvar", self._salvar, width=90).pack(side="left", padx=6)
        botao(frame_botoes, "Remover", self._remover, perigo=True, width=90).pack(side="left", padx=6)

        ctk.CTkFrame(painel, height=1, fg_color=COR_LILAS_ESCURO).pack(fill="x", padx=18, pady=10)
        rotulo(painel, "Ficha tecnica (ingredientes)", font=ctk.CTkFont(family="Segoe UI", size=13, weight="bold"), text_color=COR_LILAS_NEON).pack(anchor="w", padx=18)

        self.lista_ficha = tk.Listbox(
            painel, bg=COR_PAINEL_CLARO, fg=COR_TEXTO, selectbackground=COR_SELECAO,
            selectforeground=COR_LILAS_NEON, relief="flat", borderwidth=0,
            highlightthickness=1, highlightbackground=COR_LILAS_ESCURO, highlightcolor=COR_LILAS_NEON,
            font=("Segoe UI", 10), height=7, activestyle="none",
        )
        self.lista_ficha.pack(fill="x", padx=18, pady=8)

        frame_ficha_botoes = ctk.CTkFrame(painel, fg_color="transparent")
        frame_ficha_botoes.pack(fill="x", padx=18, pady=(0, 6))
        botao(frame_ficha_botoes, "+ ingrediente", self._adicionar_ingrediente_ficha, width=140).pack(side="left", padx=(0, 6))
        botao(frame_ficha_botoes, "Remover", self._remover_ingrediente_ficha, perigo=True, width=100).pack(side="left")

        self.label_custo = rotulo(painel, "Custo estimado: R$ 0.00", font=ctk.CTkFont(family="Segoe UI", size=13, weight="bold"), text_color=COR_LILAS_NEON)
        self.label_custo.pack(anchor="w", padx=18, pady=(8, 2))

        self.label_margem = rotulo(painel, "Margem: R$ 0.00 (0.0%)", font=ctk.CTkFont(family="Segoe UI", size=13, weight="bold"), text_color=COR_TEXTO)
        self.label_margem.pack(anchor="w", padx=18, pady=(0, 16))

    def atualizar(self):
        for item in self.tree.get_children():
            self.tree.delete(item)
        for p in produtos.listar_produtos():
            self.tree.insert("", "end", iid=p["id"], values=(p["id"], p["nome"], f"{p['preco']:.2f}", p["descricao"] or ""))

    def _selecionar(self, event):
        selecao = self.tree.selection()
        if not selecao:
            return
        produto_id = int(selecao[0])
        prod = produtos.buscar_produto(produto_id)
        if not prod:
            return
        self.produto_selecionado = produto_id
        self.entry_nome.delete(0, tk.END)
        self.entry_nome.insert(0, prod["nome"])
        self.entry_preco.delete(0, tk.END)
        self.entry_preco.insert(0, str(prod["preco"]))
        self.entry_descricao.delete(0, tk.END)
        self.entry_descricao.insert(0, prod["descricao"] or "")
        self._carregar_ficha()

    def _carregar_ficha(self):
        self.lista_ficha.delete(0, tk.END)
        if not self.produto_selecionado:
            return
        for i in produtos.listar_ingredientes_do_produto(self.produto_selecionado):
            self.lista_ficha.insert(tk.END, f"[{i['id']}] {i['nome']} - {i['quantidade']} {i['unidade']}")
        custo = produtos.calcular_custo_produto(self.produto_selecionado)
        self.label_custo.configure(text=f"Custo estimado: R$ {custo:.2f}")

        prod = produtos.buscar_produto(self.produto_selecionado)
        preco_venda = prod["preco"] if prod else 0
        margem_reais, margem_percentual = produtos.calcular_margem_produto(self.produto_selecionado, preco_venda)
        cor_margem = COR_LILAS_NEON if margem_reais >= 0 else COR_ALERTA
        self.label_margem.configure(text=f"Margem: R$ {margem_reais:.2f} ({margem_percentual:.1f}%)", text_color=cor_margem)

    def _limpar(self):
        self.produto_selecionado = None
        self.entry_nome.delete(0, tk.END)
        self.entry_preco.delete(0, tk.END)
        self.entry_descricao.delete(0, tk.END)
        self.lista_ficha.delete(0, tk.END)
        self.label_custo.configure(text="Custo estimado: R$ 0.00")
        self.label_margem.configure(text="Margem: R$ 0.00 (0.0%)", text_color=COR_TEXTO)
        self.tree.selection_remove(self.tree.selection())

    def _salvar(self):
        nome = self.entry_nome.get().strip()
        if not nome:
            messagebox.showerror("Erro", "Informe o nome do produto.")
            return
        try:
            preco = float(self.entry_preco.get().replace(",", "."))
        except ValueError:
            messagebox.showerror("Erro", "Preco invalido.")
            return
        descricao = self.entry_descricao.get().strip()

        if self.produto_selecionado:
            produtos.atualizar_produto(self.produto_selecionado, nome, preco, descricao)
        else:
            self.produto_selecionado = produtos.adicionar_produto(nome, preco, descricao)

        self.atualizar()
        self._carregar_ficha()
        mostrar_toast(self, "Produto salvo com sucesso.")

    def _remover(self):
        if not self.produto_selecionado:
            messagebox.showerror("Erro", "Selecione um produto.")
            return
        if messagebox.askyesno("Confirmar", "Deseja remover este produto?"):
            produtos.remover_produto(self.produto_selecionado)
            self._limpar()
            self.atualizar()

    def _adicionar_ingrediente_ficha(self):
        if not self.produto_selecionado:
            messagebox.showerror("Erro", "Salve o produto antes de adicionar ingredientes.")
            return
        itens = ingredientes.listar_ingredientes()
        if not itens:
            messagebox.showinfo("Aviso", "Cadastre ingredientes primeiro.")
            return
        nomes = [f"{i['id']} - {i['nome']}" for i in itens]
        escolha = SelecionarDialog(self, "Escolha o ingrediente", nomes).resultado
        if escolha is None:
            return
        ingrediente_id = itens[escolha]["id"]
        quantidade = simpledialog.askfloat("Quantidade", f"Quantidade de {itens[escolha]['nome']} ({itens[escolha]['unidade']}):")
        if quantidade is None:
            return
        produtos.adicionar_ingrediente_ao_produto(self.produto_selecionado, ingrediente_id, quantidade)
        self._carregar_ficha()

    def _remover_ingrediente_ficha(self):
        selecao = self.lista_ficha.curselection()
        if not selecao:
            return
        texto = self.lista_ficha.get(selecao[0])
        relacao_id = int(texto.split("]")[0].replace("[", ""))
        produtos.remover_ingrediente_do_produto(relacao_id)
        self._carregar_ficha()


class SelecionarDialog(simpledialog.Dialog):
    def __init__(self, parent, titulo, opcoes):
        self.opcoes = opcoes
        self.resultado = None
        super().__init__(parent, titulo)

    def body(self, master):
        master.configure(bg=COR_PAINEL)
        self.configure(bg=COR_PAINEL)
        self.listbox = tk.Listbox(
            master, width=40, height=10, bg=COR_PAINEL_CLARO, fg=COR_TEXTO,
            selectbackground=COR_SELECAO, selectforeground=COR_LILAS_NEON,
            relief="flat", highlightthickness=1, highlightbackground=COR_LILAS_ESCURO,
        )
        for o in self.opcoes:
            self.listbox.insert(tk.END, o)
        self.listbox.pack()
        return self.listbox

    def apply(self):
        selecao = self.listbox.curselection()
        if selecao:
            self.resultado = selecao[0]


# ---------------- ABA INGREDIENTES ----------------

class AbaIngredientes(ctk.CTkFrame):
    def __init__(self, parent):
        super().__init__(parent, fg_color="transparent")
        self.ingrediente_selecionado = None
        self._montar_layout()
        self.atualizar()

    def _montar_layout(self):
        container_lista, self.tree = tabela(self, [
            ("id", "ID", 50), ("nome", "Nome", 170), ("unidade", "Unidade", 80), ("estoque", "Estoque", 90), ("preco", "Preco Unit.", 100),
        ])
        container_lista.pack(side="left", fill="both", expand=True, padx=(0, 12), pady=4)
        self.tree.bind("<<TreeviewSelect>>", self._selecionar)

        painel = cartao(self, titulo="Ingrediente", width=340)
        painel.pack(side="right", fill="y", pady=4)
        painel.pack_propagate(False)

        rotulo(painel, "Nome").pack(anchor="w", padx=18)
        self.entry_nome = campo(painel, "Ex: Farinha de trigo")
        self.entry_nome.pack(fill="x", padx=18, pady=(2, 10))

        rotulo(painel, "Unidade (g, kg, ml, l, un)").pack(anchor="w", padx=18)
        self.entry_unidade = campo(painel, "Ex: kg")
        self.entry_unidade.pack(fill="x", padx=18, pady=(2, 10))

        rotulo(painel, "Estoque").pack(anchor="w", padx=18)
        self.entry_estoque = campo(painel, "Ex: 10")
        self.entry_estoque.pack(fill="x", padx=18, pady=(2, 10))

        rotulo(painel, "Preco unitario").pack(anchor="w", padx=18)
        self.entry_preco = campo(painel, "Ex: 5.00")
        self.entry_preco.pack(fill="x", padx=18, pady=(2, 10))

        frame_botoes = ctk.CTkFrame(painel, fg_color="transparent")
        frame_botoes.pack(fill="x", padx=18, pady=(4, 10))
        botao(frame_botoes, "Novo", self._limpar, width=90).pack(side="left", padx=(0, 6))
        botao(frame_botoes, "Salvar", self._salvar, width=90).pack(side="left", padx=6)
        botao(frame_botoes, "Remover", self._remover, perigo=True, width=90).pack(side="left", padx=6)

        ctk.CTkFrame(painel, height=1, fg_color=COR_LILAS_ESCURO).pack(fill="x", padx=18, pady=10)
        rotulo(painel, "Ajustar estoque (+/-)").pack(anchor="w", padx=18)
        frame_ajuste = ctk.CTkFrame(painel, fg_color="transparent")
        frame_ajuste.pack(fill="x", padx=18, pady=(2, 16))
        self.entry_ajuste = campo(frame_ajuste, "Ex: -2", width=140)
        self.entry_ajuste.pack(side="left", padx=(0, 8))
        botao(frame_ajuste, "Aplicar", self._ajustar_estoque, width=100).pack(side="left")

    def atualizar(self):
        for item in self.tree.get_children():
            self.tree.delete(item)
        for i in ingredientes.listar_ingredientes():
            self.tree.insert("", "end", iid=i["id"], values=(i["id"], i["nome"], i["unidade"], i["quantidade_estoque"], f"{i['preco_unitario']:.2f}"))

    def _selecionar(self, event):
        selecao = self.tree.selection()
        if not selecao:
            return
        ingrediente_id = int(selecao[0])
        ing = ingredientes.buscar_ingrediente(ingrediente_id)
        if not ing:
            return
        self.ingrediente_selecionado = ingrediente_id
        self.entry_nome.delete(0, tk.END)
        self.entry_nome.insert(0, ing["nome"])
        self.entry_unidade.delete(0, tk.END)
        self.entry_unidade.insert(0, ing["unidade"])
        self.entry_estoque.delete(0, tk.END)
        self.entry_estoque.insert(0, str(ing["quantidade_estoque"]))
        self.entry_preco.delete(0, tk.END)
        self.entry_preco.insert(0, str(ing["preco_unitario"]))

    def _limpar(self):
        self.ingrediente_selecionado = None
        self.entry_nome.delete(0, tk.END)
        self.entry_unidade.delete(0, tk.END)
        self.entry_estoque.delete(0, tk.END)
        self.entry_preco.delete(0, tk.END)
        self.tree.selection_remove(self.tree.selection())

    def _salvar(self):
        nome = self.entry_nome.get().strip()
        unidade = self.entry_unidade.get().strip()
        if not nome or not unidade:
            messagebox.showerror("Erro", "Informe nome e unidade.")
            return
        try:
            estoque = float(self.entry_estoque.get().replace(",", ".") or 0)
            preco = float(self.entry_preco.get().replace(",", ".") or 0)
        except ValueError:
            messagebox.showerror("Erro", "Valores numericos invalidos.")
            return

        if self.ingrediente_selecionado:
            ingredientes.atualizar_ingrediente(self.ingrediente_selecionado, nome, unidade, estoque, preco)
        else:
            ingredientes.adicionar_ingrediente(nome, unidade, estoque, preco)

        self.atualizar()
        mostrar_toast(self, "Ingrediente salvo com sucesso.")

    def _remover(self):
        if not self.ingrediente_selecionado:
            messagebox.showerror("Erro", "Selecione um ingrediente.")
            return
        if messagebox.askyesno("Confirmar", "Deseja remover este ingrediente?"):
            ingredientes.remover_ingrediente(self.ingrediente_selecionado)
            self._limpar()
            self.atualizar()

    def _ajustar_estoque(self):
        if not self.ingrediente_selecionado:
            messagebox.showerror("Erro", "Selecione um ingrediente.")
            return
        try:
            delta = float(self.entry_ajuste.get().replace(",", "."))
        except ValueError:
            messagebox.showerror("Erro", "Valor de ajuste invalido.")
            return
        ingredientes.ajustar_estoque(self.ingrediente_selecionado, delta)
        self.entry_ajuste.delete(0, tk.END)
        self.atualizar()
        self._selecionar(None)


# ---------------- ABA PEDIDOS ----------------

class AbaPedidos(ctk.CTkFrame):
    def __init__(self, parent, atualizar_callback=None):
        super().__init__(parent, fg_color="transparent")
        self.atualizar_callback = atualizar_callback
        self.itens_pedido = []
        self.pedido_selecionado = None
        self.itens_do_pedido_selecionado = []
        self._montar_layout()
        self.atualizar()

    def _montar_layout(self):
        area_esquerda = ctk.CTkFrame(self, fg_color="transparent")
        area_esquerda.pack(side="left", fill="both", expand=True, padx=(0, 12), pady=4)

        container_lista, self.tree = tabela(area_esquerda, [
            ("id", "ID", 45), ("cliente", "Cliente", 140), ("data", "Data", 135), ("entrega", "Entrega", 95), ("pagamento", "Pagamento", 110), ("status", "Status", 90),
        ])
        container_lista.pack(fill="both", expand=True)
        self.tree.bind("<<TreeviewSelect>>", self._selecionar_pedido)

        detalhe = cartao(area_esquerda, titulo="Detalhes do pedido", height=280)
        detalhe.pack(fill="x", pady=10)
        detalhe.pack_propagate(False)

        self.label_info_pedido = rotulo(detalhe, "Selecione um pedido na lista acima", font=ctk.CTkFont(family="Segoe UI", size=12, weight="bold"))
        self.label_info_pedido.pack(anchor="w", padx=18)

        linha_edicao = ctk.CTkFrame(detalhe, fg_color="transparent")
        linha_edicao.pack(fill="x", padx=18, pady=(8, 6))

        rotulo(linha_edicao, "Entrega:").pack(side="left")
        self.entry_data_entrega = campo(linha_edicao, "DD/MM/AAAA", width=120)
        self.entry_data_entrega.pack(side="left", padx=(6, 14))

        rotulo(linha_edicao, "Pagamento:").pack(side="left")
        self.combo_forma_pagamento = combo(linha_edicao, FORMAS_PAGAMENTO, width=150)
        self.combo_forma_pagamento.pack(side="left", padx=(6, 14))

        rotulo(linha_edicao, "Status:").pack(side="left")
        self.combo_status = combo(linha_edicao, ["nao_pago", "pago"], width=120)
        self.combo_status.pack(side="left", padx=(6, 0))

        linha_botoes_detalhe = ctk.CTkFrame(detalhe, fg_color="transparent")
        linha_botoes_detalhe.pack(fill="x", padx=18, pady=(0, 8))
        botao(linha_botoes_detalhe, "Salvar dados do pedido", self._salvar_dados_pedido, width=180).pack(side="left", padx=(0, 8))
        botao(linha_botoes_detalhe, "Remover pedido", self._remover_pedido, perigo=True, width=130).pack(side="left")

        container_itens, self.tree_itens = tabela(detalhe, [
            ("produto", "Produto", 160), ("quantidade", "Qtd", 60), ("preco", "Preco unit.", 90), ("subtotal", "Subtotal", 90),
        ])
        container_itens.configure(height=90)
        container_itens.pack(fill="x", padx=18, pady=(0, 8))
        container_itens.pack_propagate(False)

        linha_itens_botoes = ctk.CTkFrame(detalhe, fg_color="transparent")
        linha_itens_botoes.pack(fill="x", padx=18, pady=(0, 10))
        botao(linha_itens_botoes, "Editar quantidade", self._editar_quantidade_item, width=140).pack(side="left", padx=(0, 8))
        botao(linha_itens_botoes, "Remover item", self._remover_item_existente, perigo=True, width=120).pack(side="left")

        self.label_total_detalhe = rotulo(detalhe, "Total: R$ 0.00", font=ctk.CTkFont(family="Segoe UI", size=13, weight="bold"), text_color=COR_LILAS_NEON)
        self.label_total_detalhe.pack(anchor="e", padx=18, pady=(0, 12))

        painel = cartao(self, titulo="Novo pedido", width=360)
        painel.pack(side="right", fill="y", pady=4)
        painel.pack_propagate(False)

        rotulo(painel, "Cliente").pack(anchor="w", padx=18)
        self.entry_cliente = campo(painel, "Nome do cliente")
        self.entry_cliente.pack(fill="x", padx=18, pady=(2, 10))

        linha_datas = ctk.CTkFrame(painel, fg_color="transparent")
        linha_datas.pack(fill="x", padx=18, pady=(0, 10))
        col_entrega = ctk.CTkFrame(linha_datas, fg_color="transparent")
        col_entrega.pack(side="left", fill="x", expand=True, padx=(0, 6))
        rotulo(col_entrega, "Entrega").pack(anchor="w")
        self.entry_nova_data_entrega = campo(col_entrega, "DD/MM/AAAA")
        self.entry_nova_data_entrega.pack(fill="x")

        col_pagamento = ctk.CTkFrame(linha_datas, fg_color="transparent")
        col_pagamento.pack(side="left", fill="x", expand=True, padx=(6, 0))
        rotulo(col_pagamento, "Pagamento").pack(anchor="w")
        self.combo_nova_forma_pagamento = combo(col_pagamento, FORMAS_PAGAMENTO)
        self.combo_nova_forma_pagamento.pack(fill="x")

        rotulo(painel, "Observacoes").pack(anchor="w", padx=18)
        self.entry_obs = campo(painel, "Opcional")
        self.entry_obs.pack(fill="x", padx=18, pady=(2, 10))

        rotulo(painel, "Produto").pack(anchor="w", padx=18)
        self.combo_produto = combo(painel, [])
        self.combo_produto.pack(fill="x", padx=18, pady=(2, 10))

        rotulo(painel, "Quantidade").pack(anchor="w", padx=18)
        self.entry_quantidade = campo(painel, "Ex: 2")
        self.entry_quantidade.pack(fill="x", padx=18, pady=(2, 10))

        botao(painel, "+ Adicionar item", self._adicionar_item).pack(fill="x", padx=18, pady=(2, 10))

        self.lista_itens = tk.Listbox(
            painel, bg=COR_PAINEL_CLARO, fg=COR_TEXTO, selectbackground=COR_SELECAO,
            selectforeground=COR_LILAS_NEON, relief="flat", borderwidth=0,
            highlightthickness=1, highlightbackground=COR_LILAS_ESCURO, highlightcolor=COR_LILAS_NEON,
            font=("Segoe UI", 10), height=6, activestyle="none",
        )
        self.lista_itens.pack(fill="x", padx=18, pady=6)
        botao(painel, "Remover item selecionado", self._remover_item, perigo=True).pack(fill="x", padx=18, pady=(0, 10))

        self.label_total = rotulo(painel, "Total: R$ 0.00", font=ctk.CTkFont(family="Segoe UI", size=15, weight="bold"), text_color=COR_LILAS_NEON)
        self.label_total.pack(padx=18, pady=(4, 10))

        botao(painel, "Finalizar pedido", self._finalizar_pedido, height=42).pack(fill="x", padx=18, pady=(0, 18))

        self._carregar_produtos_combo()

    def _carregar_produtos_combo(self):
        self.produtos_disponiveis = produtos.listar_produtos()
        valores = [f"{p['id']} - {p['nome']} (R$ {p['preco']:.2f})" for p in self.produtos_disponiveis]
        self.combo_produto.configure(values=valores)
        if valores:
            self.combo_produto.set(valores[0])
        else:
            self.combo_produto.set("")

    def _adicionar_item(self):
        valor_atual = self.combo_produto.get()
        if not valor_atual or not self.produtos_disponiveis:
            messagebox.showerror("Erro", "Selecione um produto.")
            return
        indice = [f"{p['id']} - {p['nome']} (R$ {p['preco']:.2f})" for p in self.produtos_disponiveis].index(valor_atual)
        try:
            quantidade = int(self.entry_quantidade.get())
            if quantidade <= 0:
                raise ValueError
        except ValueError:
            messagebox.showerror("Erro", "Quantidade invalida.")
            return

        produto = self.produtos_disponiveis[indice]
        self.itens_pedido.append({
            "produto_id": produto["id"],
            "nome": produto["nome"],
            "quantidade": quantidade,
            "preco_unitario": produto["preco"],
        })
        self._atualizar_lista_itens()
        self.entry_quantidade.delete(0, tk.END)

    def _remover_item(self):
        selecao = self.lista_itens.curselection()
        if not selecao:
            return
        del self.itens_pedido[selecao[0]]
        self._atualizar_lista_itens()

    def _atualizar_lista_itens(self):
        self.lista_itens.delete(0, tk.END)
        total = 0
        for item in self.itens_pedido:
            subtotal = item["quantidade"] * item["preco_unitario"]
            total += subtotal
            self.lista_itens.insert(tk.END, f"{item['quantidade']}x {item['nome']} - R$ {subtotal:.2f}")
        self.label_total.configure(text=f"Total: R$ {total:.2f}")

    def _finalizar_pedido(self):
        cliente = self.entry_cliente.get().strip()
        if not cliente:
            messagebox.showerror("Erro", "Informe o nome do cliente.")
            return
        if not self.itens_pedido:
            messagebox.showerror("Erro", "Adicione ao menos um item ao pedido.")
            return

        try:
            data_entrega = datas.br_para_iso(self.entry_nova_data_entrega.get())
        except ValueError:
            messagebox.showerror("Erro", "Data de entrega invalida. Use o formato DD/MM/AAAA.")
            return

        observacoes = self.entry_obs.get().strip()
        forma_pagamento = self.combo_nova_forma_pagamento.get().strip() or None
        pedido_id = pedidos.criar_pedido(cliente, self.itens_pedido, observacoes, data_entrega, forma_pagamento)
        total = pedidos.total_pedido(pedido_id)
        mostrar_toast(self, f"Pedido #{pedido_id} criado! Total: R$ {total:.2f}")

        self.entry_cliente.delete(0, tk.END)
        self.entry_obs.delete(0, tk.END)
        self.entry_nova_data_entrega.delete(0, tk.END)
        self.combo_nova_forma_pagamento.set("")
        self.itens_pedido = []
        self._atualizar_lista_itens()
        self.atualizar()
        if self.atualizar_callback:
            self.atualizar_callback()

    def atualizar(self):
        for item in self.tree.get_children():
            self.tree.delete(item)
        for p in pedidos.listar_pedidos():
            self.tree.insert("", "end", iid=p["id"], values=(
                p["id"], p["cliente"], datas.iso_para_br(p["data_pedido"]), datas.iso_para_br(p["data_entrega"]) or "-", p["forma_pagamento"] or "-", p["status"],
            ))
        self._carregar_produtos_combo()

    def _selecionar_pedido(self, event):
        selecao = self.tree.selection()
        if not selecao:
            return
        pedido_id = int(selecao[0])
        pedido, itens = pedidos.buscar_pedido(pedido_id)
        if not pedido:
            return
        self.pedido_selecionado = pedido_id
        self.combo_status.set(pedido["status"])
        self.combo_forma_pagamento.set(pedido["forma_pagamento"] or "")
        self.entry_data_entrega.delete(0, tk.END)
        if pedido["data_entrega"]:
            self.entry_data_entrega.insert(0, datas.iso_para_br(pedido["data_entrega"]))

        obs = f" | Obs: {pedido['observacoes']}" if pedido["observacoes"] else ""
        self.label_info_pedido.configure(
            text=f"Pedido #{pedido['id']} - {pedido['cliente']} | Criado em: {datas.iso_para_br(pedido['data_pedido'])}{obs}"
        )

        self._carregar_itens_pedido(itens)

    def _carregar_itens_pedido(self, itens):
        self.itens_do_pedido_selecionado = itens
        for item in self.tree_itens.get_children():
            self.tree_itens.delete(item)
        total = 0
        for i in itens:
            subtotal = i["quantidade"] * i["preco_unitario"]
            total += subtotal
            self.tree_itens.insert("", "end", iid=i["id"], values=(i["produto_nome"], i["quantidade"], f"{i['preco_unitario']:.2f}", f"{subtotal:.2f}"))
        self.label_total_detalhe.configure(text=f"Total: R$ {total:.2f}")

    def _editar_quantidade_item(self):
        if not self.pedido_selecionado:
            messagebox.showerror("Erro", "Selecione um pedido.")
            return
        selecao = self.tree_itens.selection()
        if not selecao:
            messagebox.showerror("Erro", "Selecione um item da lista para editar.")
            return
        item_id = int(selecao[0])
        item_atual = next((i for i in self.itens_do_pedido_selecionado if i["id"] == item_id), None)
        if not item_atual:
            return
        nova_quantidade = simpledialog.askinteger(
            "Editar quantidade", f"Nova quantidade para {item_atual['produto_nome']}:",
            initialvalue=item_atual["quantidade"], minvalue=1,
        )
        if nova_quantidade is None:
            return
        pedidos.atualizar_quantidade_item(item_id, nova_quantidade)
        self._recarregar_pedido_selecionado()
        mostrar_toast(self, "Item atualizado.")

    def _remover_item_existente(self):
        if not self.pedido_selecionado:
            messagebox.showerror("Erro", "Selecione um pedido.")
            return
        selecao = self.tree_itens.selection()
        if not selecao:
            messagebox.showerror("Erro", "Selecione um item da lista para remover.")
            return
        item_id = int(selecao[0])
        if messagebox.askyesno("Confirmar", "Remover este item do pedido?"):
            pedidos.remover_item_pedido(item_id)
            self._recarregar_pedido_selecionado()
            mostrar_toast(self, "Item removido do pedido.")

    def _recarregar_pedido_selecionado(self):
        if not self.pedido_selecionado:
            return
        _, itens = pedidos.buscar_pedido(self.pedido_selecionado)
        self._carregar_itens_pedido(itens)
        if self.atualizar_callback:
            self.atualizar_callback()

    def _salvar_dados_pedido(self):
        if not self.pedido_selecionado:
            messagebox.showerror("Erro", "Selecione um pedido.")
            return
        pedido, _ = pedidos.buscar_pedido(self.pedido_selecionado)
        try:
            data_entrega = datas.br_para_iso(self.entry_data_entrega.get())
        except ValueError:
            messagebox.showerror("Erro", "Data de entrega invalida. Use o formato DD/MM/AAAA.")
            return
        forma_pagamento = self.combo_forma_pagamento.get().strip() or None
        pedidos.atualizar_dados_pedido(self.pedido_selecionado, data_entrega, forma_pagamento, pedido["observacoes"])

        novo_status = self.combo_status.get()
        if novo_status:
            pedidos.atualizar_status_pedido(self.pedido_selecionado, novo_status)

        self.atualizar()
        mostrar_toast(self, "Dados do pedido salvos.")
        if self.atualizar_callback:
            self.atualizar_callback()

    def _remover_pedido(self):
        if not self.pedido_selecionado:
            messagebox.showerror("Erro", "Selecione um pedido.")
            return
        if messagebox.askyesno("Confirmar", "Deseja remover este pedido?"):
            pedidos.remover_pedido(self.pedido_selecionado)
            self.pedido_selecionado = None
            self.label_info_pedido.configure(text="Selecione um pedido na lista acima")
            self._carregar_itens_pedido([])
            self.atualizar()
            if self.atualizar_callback:
                self.atualizar_callback()


# ---------------- ABA HISTORICO ----------------

class AbaHistorico(ctk.CTkFrame):
    def __init__(self, parent):
        super().__init__(parent, fg_color="transparent")
        self._montar_layout()
        self.atualizar()

    def _montar_layout(self):
        frame_filtro = ctk.CTkFrame(self, fg_color="transparent")
        frame_filtro.pack(fill="x", pady=(4, 12))

        rotulo(frame_filtro, "De:").pack(side="left", padx=(0, 6))
        self.entry_inicio = campo(frame_filtro, "DD/MM/AAAA", width=130)
        self.entry_inicio.pack(side="left", padx=(0, 12))

        rotulo(frame_filtro, "Ate:").pack(side="left", padx=(0, 6))
        self.entry_fim = campo(frame_filtro, "DD/MM/AAAA", width=130)
        self.entry_fim.pack(side="left", padx=(0, 12))

        rotulo(frame_filtro, "Status:").pack(side="left", padx=(0, 6))
        self.combo_status = combo(frame_filtro, ["", "nao_pago", "pago"], width=150)
        self.combo_status.pack(side="left", padx=(0, 12))

        botao(frame_filtro, "Filtrar", self.atualizar, width=110).pack(side="left", padx=(0, 8))
        botao(frame_filtro, "Limpar", self._limpar_filtros, width=100).pack(side="left")

        container_lista, self.tree = tabela(self, [
            ("id", "ID", 50), ("cliente", "Cliente", 160), ("data", "Data", 150), ("status", "Status", 110), ("total", "Total", 100),
        ])
        container_lista.pack(fill="both", expand=True)

        self.label_resumo = rotulo(
            self, "", font=ctk.CTkFont(family="Segoe UI", size=15, weight="bold"), text_color=COR_LILAS_NEON
        )
        self.label_resumo.pack(pady=14)

    def _limpar_filtros(self):
        self.entry_inicio.delete(0, tk.END)
        self.entry_fim.delete(0, tk.END)
        self.combo_status.set("")
        self.atualizar()

    def atualizar(self):
        try:
            data_inicio = datas.br_para_iso(self.entry_inicio.get())
            data_fim = datas.br_para_iso(self.entry_fim.get())
        except ValueError:
            messagebox.showerror("Erro", "Data invalida. Use o formato DD/MM/AAAA.")
            return
        status = self.combo_status.get().strip() or None

        for item in self.tree.get_children():
            self.tree.delete(item)

        registros = pedidos.historico_vendas(data_inicio, data_fim, status)
        for p in registros:
            total = pedidos.total_pedido(p["id"])
            self.tree.insert("", "end", values=(p["id"], p["cliente"], datas.iso_para_br(p["data_pedido"]), p["status"], f"{total:.2f}"))

        resumo = pedidos.resumo_vendas(data_inicio, data_fim)
        self.label_resumo.configure(text=f"Pedidos pagos: {resumo['quantidade_pedidos']}   |   Total vendido: R$ {resumo['total_vendas']:.2f}")


if __name__ == "__main__":
    db.init_db()
    app = App()
    app.mainloop()
