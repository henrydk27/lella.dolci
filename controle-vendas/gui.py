import tkinter as tk
from tkinter import ttk, messagebox, simpledialog

import db
import produtos
import ingredientes
import pedidos


# ---------------- TEMA DARK / LILAS NEON ----------------

COR_FUNDO = "#121014"
COR_PAINEL = "#1b1820"
COR_PAINEL_CLARO = "#242030"
COR_BORDA = "#3a3345"
COR_TEXTO = "#f0eef5"
COR_TEXTO_SUAVE = "#a99fc2"
COR_LILAS = "#c77dff"
COR_LILAS_NEON = "#e0aaff"
COR_LILAS_ESCURO = "#7b2cbf"
COR_SELECAO = "#3c2a5e"
COR_OK = "#7ef9c4"
COR_ALERTA = "#ff6b9d"

FONTE_BASE = ("Segoe UI", 10)
FONTE_TITULO = ("Segoe UI", 16, "bold")
FONTE_SUBTITULO = ("Segoe UI", 11, "bold")


def configurar_estilo(root):
    style = ttk.Style(root)
    style.theme_use("clam")

    root.configure(bg=COR_FUNDO)

    style.configure(".", background=COR_FUNDO, foreground=COR_TEXTO, font=FONTE_BASE)

    style.configure("TFrame", background=COR_FUNDO)
    style.configure("Painel.TFrame", background=COR_PAINEL)

    style.configure("TLabel", background=COR_FUNDO, foreground=COR_TEXTO, font=FONTE_BASE)
    style.configure("Painel.TLabel", background=COR_PAINEL, foreground=COR_TEXTO, font=FONTE_BASE)
    style.configure("Titulo.TLabel", background=COR_FUNDO, foreground=COR_LILAS_NEON, font=FONTE_TITULO)
    style.configure("Subtitulo.TLabel", background=COR_PAINEL, foreground=COR_LILAS_NEON, font=FONTE_SUBTITULO)
    style.configure("Resumo.TLabel", background=COR_FUNDO, foreground=COR_LILAS_NEON, font=("Segoe UI", 11, "bold"))

    style.configure(
        "TLabelframe",
        background=COR_PAINEL,
        foreground=COR_LILAS_NEON,
        bordercolor=COR_LILAS_ESCURO,
        relief="solid",
        borderwidth=1,
    )
    style.configure("TLabelframe.Label", background=COR_PAINEL, foreground=COR_LILAS_NEON, font=FONTE_SUBTITULO)

    style.configure(
        "TNotebook",
        background=COR_FUNDO,
        bordercolor=COR_FUNDO,
        tabmargins=(5, 5, 5, 0),
    )
    style.configure(
        "TNotebook.Tab",
        background=COR_PAINEL,
        foreground=COR_TEXTO_SUAVE,
        padding=(16, 8),
        font=("Segoe UI", 10, "bold"),
        borderwidth=0,
    )
    style.map(
        "TNotebook.Tab",
        background=[("selected", COR_SELECAO)],
        foreground=[("selected", COR_LILAS_NEON)],
    )

    style.configure(
        "TEntry",
        fieldbackground=COR_PAINEL_CLARO,
        foreground=COR_TEXTO,
        bordercolor=COR_LILAS_ESCURO,
        insertcolor=COR_LILAS_NEON,
        borderwidth=1,
        padding=6,
    )
    style.map("TEntry", bordercolor=[("focus", COR_LILAS_NEON)])

    style.configure(
        "TCombobox",
        fieldbackground=COR_PAINEL_CLARO,
        background=COR_PAINEL_CLARO,
        foreground=COR_TEXTO,
        arrowcolor=COR_LILAS_NEON,
        bordercolor=COR_LILAS_ESCURO,
        padding=6,
    )
    style.map(
        "TCombobox",
        fieldbackground=[("readonly", COR_PAINEL_CLARO)],
        foreground=[("readonly", COR_TEXTO)],
    )
    root.option_add("*TCombobox*Listbox.background", COR_PAINEL_CLARO)
    root.option_add("*TCombobox*Listbox.foreground", COR_TEXTO)
    root.option_add("*TCombobox*Listbox.selectBackground", COR_SELECAO)
    root.option_add("*TCombobox*Listbox.selectForeground", COR_LILAS_NEON)

    style.configure(
        "TButton",
        background=COR_LILAS_ESCURO,
        foreground=COR_TEXTO,
        font=("Segoe UI", 10, "bold"),
        borderwidth=0,
        padding=(12, 8),
        focuscolor=COR_LILAS_ESCURO,
    )
    style.map(
        "TButton",
        background=[("active", COR_LILAS), ("pressed", COR_LILAS_NEON)],
        foreground=[("active", "#1a1224"), ("pressed", "#1a1224")],
    )

    style.configure(
        "Perigo.TButton",
        background="#3d1f2e",
        foreground=COR_ALERTA,
        font=("Segoe UI", 10, "bold"),
        borderwidth=0,
        padding=(12, 8),
    )
    style.map(
        "Perigo.TButton",
        background=[("active", COR_ALERTA)],
        foreground=[("active", "#1a1224")],
    )

    style.configure(
        "Treeview",
        background=COR_PAINEL_CLARO,
        fieldbackground=COR_PAINEL_CLARO,
        foreground=COR_TEXTO,
        bordercolor=COR_BORDA,
        borderwidth=0,
        rowheight=28,
    )
    style.map(
        "Treeview",
        background=[("selected", COR_SELECAO)],
        foreground=[("selected", COR_LILAS_NEON)],
    )
    style.configure(
        "Treeview.Heading",
        background=COR_PAINEL,
        foreground=COR_LILAS_NEON,
        font=("Segoe UI", 10, "bold"),
        borderwidth=0,
        relief="flat",
    )
    style.map("Treeview.Heading", background=[("active", COR_SELECAO)])

    style.configure("TSeparator", background=COR_LILAS_ESCURO)

    style.configure(
        "TScrollbar",
        background=COR_PAINEL_CLARO,
        troughcolor=COR_FUNDO,
        bordercolor=COR_FUNDO,
        arrowcolor=COR_LILAS_NEON,
    )

    return style


def texto_widget(master, **kwargs):
    """Cria um tk.Text ja estilizado para combinar com o tema dark."""
    padrao = dict(
        bg=COR_PAINEL_CLARO,
        fg=COR_TEXTO,
        insertbackground=COR_LILAS_NEON,
        selectbackground=COR_SELECAO,
        selectforeground=COR_LILAS_NEON,
        relief="flat",
        borderwidth=8,
        highlightthickness=1,
        highlightbackground=COR_LILAS_ESCURO,
        highlightcolor=COR_LILAS_NEON,
        font=FONTE_BASE,
    )
    padrao.update(kwargs)
    return tk.Text(master, **padrao)


def listbox_widget(master, **kwargs):
    padrao = dict(
        bg=COR_PAINEL_CLARO,
        fg=COR_TEXTO,
        selectbackground=COR_SELECAO,
        selectforeground=COR_LILAS_NEON,
        relief="flat",
        borderwidth=6,
        highlightthickness=1,
        highlightbackground=COR_LILAS_ESCURO,
        highlightcolor=COR_LILAS_NEON,
        font=FONTE_BASE,
        activestyle="none",
    )
    padrao.update(kwargs)
    return tk.Listbox(master, **padrao)


class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Lella Dolci - Controle de Vendas")
        self.geometry("1050x650")
        self.minsize(900, 560)

        configurar_estilo(self)
        self.configure(bg=COR_FUNDO)

        cabecalho = ttk.Frame(self)
        cabecalho.pack(fill="x", padx=16, pady=(14, 0))
        ttk.Label(cabecalho, text="Lella Dolci", style="Titulo.TLabel").pack(side="left")
        ttk.Label(cabecalho, text="   controle de vendas", foreground=COR_TEXTO_SUAVE, background=COR_FUNDO).pack(side="left", pady=(6, 0))

        notebook = ttk.Notebook(self)
        notebook.pack(fill="both", expand=True, padx=16, pady=14)

        self.aba_produtos = AbaProdutos(notebook)
        self.aba_ingredientes = AbaIngredientes(notebook)
        self.aba_pedidos = AbaPedidos(notebook, atualizar_callback=self.atualizar_tudo)
        self.aba_historico = AbaHistorico(notebook)

        notebook.add(self.aba_produtos, text="  Produtos  ")
        notebook.add(self.aba_ingredientes, text="  Ingredientes  ")
        notebook.add(self.aba_pedidos, text="  Pedidos  ")
        notebook.add(self.aba_historico, text="  Historico  ")

    def atualizar_tudo(self):
        self.aba_produtos.atualizar()
        self.aba_ingredientes.atualizar()
        self.aba_historico.atualizar()


# ---------------- ABA PRODUTOS ----------------

class AbaProdutos(ttk.Frame):
    def __init__(self, parent):
        super().__init__(parent)
        self.produto_selecionado = None
        self._montar_layout()
        self.atualizar()

    def _montar_layout(self):
        frame_lista = ttk.Frame(self)
        frame_lista.pack(side="left", fill="both", expand=True, padx=(0, 10), pady=5)

        colunas = ("id", "nome", "preco", "descricao")
        self.tree = ttk.Treeview(frame_lista, columns=colunas, show="headings")
        for col, titulo, largura in [("id", "ID", 40), ("nome", "Nome", 180), ("preco", "Preco", 80), ("descricao", "Descricao", 220)]:
            self.tree.heading(col, text=titulo)
            self.tree.column(col, width=largura)
        self.tree.pack(fill="both", expand=True)
        self.tree.bind("<<TreeviewSelect>>", self._selecionar)

        frame_form = ttk.LabelFrame(self, text="Produto")
        frame_form.pack(side="right", fill="y", padx=(0, 5), pady=5)

        ttk.Label(frame_form, text="Nome:", style="Painel.TLabel").grid(row=0, column=0, sticky="w", padx=10, pady=(10, 5))
        self.entry_nome = ttk.Entry(frame_form, width=32)
        self.entry_nome.grid(row=0, column=1, padx=10, pady=(10, 5))

        ttk.Label(frame_form, text="Preco:", style="Painel.TLabel").grid(row=1, column=0, sticky="w", padx=10, pady=5)
        self.entry_preco = ttk.Entry(frame_form, width=32)
        self.entry_preco.grid(row=1, column=1, padx=10, pady=5)

        ttk.Label(frame_form, text="Descricao:", style="Painel.TLabel").grid(row=2, column=0, sticky="w", padx=10, pady=5)
        self.entry_descricao = ttk.Entry(frame_form, width=32)
        self.entry_descricao.grid(row=2, column=1, padx=10, pady=5)

        frame_botoes = ttk.Frame(frame_form, style="Painel.TFrame")
        frame_botoes.grid(row=3, column=0, columnspan=2, pady=10)
        ttk.Button(frame_botoes, text="Novo", command=self._limpar).pack(side="left", padx=4)
        ttk.Button(frame_botoes, text="Salvar", command=self._salvar).pack(side="left", padx=4)
        ttk.Button(frame_botoes, text="Remover", style="Perigo.TButton", command=self._remover).pack(side="left", padx=4)

        ttk.Separator(frame_form, orient="horizontal").grid(row=4, column=0, columnspan=2, sticky="ew", padx=10, pady=10)
        ttk.Label(frame_form, text="Ficha tecnica (ingredientes)", style="Subtitulo.TLabel").grid(row=5, column=0, columnspan=2, padx=10)

        self.lista_ficha = listbox_widget(frame_form, width=42, height=8)
        self.lista_ficha.grid(row=6, column=0, columnspan=2, padx=10, pady=8)

        frame_ficha_botoes = ttk.Frame(frame_form, style="Painel.TFrame")
        frame_ficha_botoes.grid(row=7, column=0, columnspan=2)
        ttk.Button(frame_ficha_botoes, text="Adicionar ingrediente", command=self._adicionar_ingrediente_ficha).pack(side="left", padx=4)
        ttk.Button(frame_ficha_botoes, text="Remover selecionado", style="Perigo.TButton", command=self._remover_ingrediente_ficha).pack(side="left", padx=4)

        self.label_custo = ttk.Label(frame_form, text="Custo estimado: R$ 0.00", style="Subtitulo.TLabel")
        self.label_custo.grid(row=8, column=0, columnspan=2, pady=14)

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
        self.label_custo.config(text=f"Custo estimado: R$ {custo:.2f}")

    def _limpar(self):
        self.produto_selecionado = None
        self.entry_nome.delete(0, tk.END)
        self.entry_preco.delete(0, tk.END)
        self.entry_descricao.delete(0, tk.END)
        self.lista_ficha.delete(0, tk.END)
        self.label_custo.config(text="Custo estimado: R$ 0.00")
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
        messagebox.showinfo("Sucesso", "Produto salvo com sucesso.")

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
        self.listbox = listbox_widget(master, width=40, height=10)
        for o in self.opcoes:
            self.listbox.insert(tk.END, o)
        self.listbox.pack()
        return self.listbox

    def apply(self):
        selecao = self.listbox.curselection()
        if selecao:
            self.resultado = selecao[0]


# ---------------- ABA INGREDIENTES ----------------

class AbaIngredientes(ttk.Frame):
    def __init__(self, parent):
        super().__init__(parent)
        self.ingrediente_selecionado = None
        self._montar_layout()
        self.atualizar()

    def _montar_layout(self):
        frame_lista = ttk.Frame(self)
        frame_lista.pack(side="left", fill="both", expand=True, padx=(0, 10), pady=5)

        colunas = ("id", "nome", "unidade", "estoque", "preco")
        self.tree = ttk.Treeview(frame_lista, columns=colunas, show="headings")
        for col, titulo, largura in [("id", "ID", 40), ("nome", "Nome", 160), ("unidade", "Unidade", 70), ("estoque", "Estoque", 80), ("preco", "Preco Unit.", 90)]:
            self.tree.heading(col, text=titulo)
            self.tree.column(col, width=largura)
        self.tree.pack(fill="both", expand=True)
        self.tree.bind("<<TreeviewSelect>>", self._selecionar)

        frame_form = ttk.LabelFrame(self, text="Ingrediente")
        frame_form.pack(side="right", fill="y", padx=(0, 5), pady=5)

        ttk.Label(frame_form, text="Nome:", style="Painel.TLabel").grid(row=0, column=0, sticky="w", padx=10, pady=(10, 5))
        self.entry_nome = ttk.Entry(frame_form, width=32)
        self.entry_nome.grid(row=0, column=1, padx=10, pady=(10, 5))

        ttk.Label(frame_form, text="Unidade (g, kg, ml, l, un):", style="Painel.TLabel").grid(row=1, column=0, sticky="w", padx=10, pady=5)
        self.entry_unidade = ttk.Entry(frame_form, width=32)
        self.entry_unidade.grid(row=1, column=1, padx=10, pady=5)

        ttk.Label(frame_form, text="Estoque:", style="Painel.TLabel").grid(row=2, column=0, sticky="w", padx=10, pady=5)
        self.entry_estoque = ttk.Entry(frame_form, width=32)
        self.entry_estoque.grid(row=2, column=1, padx=10, pady=5)

        ttk.Label(frame_form, text="Preco unitario:", style="Painel.TLabel").grid(row=3, column=0, sticky="w", padx=10, pady=5)
        self.entry_preco = ttk.Entry(frame_form, width=32)
        self.entry_preco.grid(row=3, column=1, padx=10, pady=5)

        frame_botoes = ttk.Frame(frame_form, style="Painel.TFrame")
        frame_botoes.grid(row=4, column=0, columnspan=2, pady=10)
        ttk.Button(frame_botoes, text="Novo", command=self._limpar).pack(side="left", padx=4)
        ttk.Button(frame_botoes, text="Salvar", command=self._salvar).pack(side="left", padx=4)
        ttk.Button(frame_botoes, text="Remover", style="Perigo.TButton", command=self._remover).pack(side="left", padx=4)

        ttk.Separator(frame_form, orient="horizontal").grid(row=5, column=0, columnspan=2, sticky="ew", padx=10, pady=10)
        ttk.Label(frame_form, text="Ajustar estoque (+/-):", style="Painel.TLabel").grid(row=6, column=0, sticky="w", padx=10)
        self.entry_ajuste = ttk.Entry(frame_form, width=15)
        self.entry_ajuste.grid(row=6, column=1, sticky="w", padx=10)
        ttk.Button(frame_form, text="Aplicar ajuste", command=self._ajustar_estoque).grid(row=7, column=0, columnspan=2, pady=10)

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
        messagebox.showinfo("Sucesso", "Ingrediente salvo com sucesso.")

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

class AbaPedidos(ttk.Frame):
    def __init__(self, parent, atualizar_callback=None):
        super().__init__(parent)
        self.atualizar_callback = atualizar_callback
        self.itens_pedido = []
        self.pedido_selecionado = None
        self._montar_layout()
        self.atualizar()

    def _montar_layout(self):
        frame_lista = ttk.Frame(self)
        frame_lista.pack(side="left", fill="both", expand=True, padx=(0, 10), pady=5)

        colunas = ("id", "cliente", "data", "status")
        self.tree = ttk.Treeview(frame_lista, columns=colunas, show="headings")
        for col, titulo, largura in [("id", "ID", 40), ("cliente", "Cliente", 140), ("data", "Data", 150), ("status", "Status", 100)]:
            self.tree.heading(col, text=titulo)
            self.tree.column(col, width=largura)
        self.tree.pack(fill="both", expand=True)
        self.tree.bind("<<TreeviewSelect>>", self._selecionar_pedido)

        frame_detalhe = ttk.Frame(frame_lista)
        frame_detalhe.pack(fill="x", pady=8)
        self.text_detalhe = texto_widget(frame_detalhe, height=8)
        self.text_detalhe.pack(fill="x")

        frame_status = ttk.Frame(frame_lista)
        frame_status.pack(fill="x")
        ttk.Label(frame_status, text="Status:").pack(side="left", padx=5)
        self.combo_status = ttk.Combobox(frame_status, values=["pendente", "em_preparo", "concluido", "cancelado"], state="readonly", width=15)
        self.combo_status.pack(side="left", padx=5)
        ttk.Button(frame_status, text="Atualizar status", command=self._atualizar_status).pack(side="left", padx=5)
        ttk.Button(frame_status, text="Remover pedido", style="Perigo.TButton", command=self._remover_pedido).pack(side="left", padx=5)

        frame_novo = ttk.LabelFrame(self, text="Novo pedido")
        frame_novo.pack(side="right", fill="y", padx=(0, 5), pady=5)

        ttk.Label(frame_novo, text="Cliente:", style="Painel.TLabel").grid(row=0, column=0, sticky="w", padx=10, pady=(10, 5))
        self.entry_cliente = ttk.Entry(frame_novo, width=32)
        self.entry_cliente.grid(row=0, column=1, padx=10, pady=(10, 5))

        ttk.Label(frame_novo, text="Observacoes:", style="Painel.TLabel").grid(row=1, column=0, sticky="w", padx=10, pady=5)
        self.entry_obs = ttk.Entry(frame_novo, width=32)
        self.entry_obs.grid(row=1, column=1, padx=10, pady=5)

        ttk.Label(frame_novo, text="Produto:", style="Painel.TLabel").grid(row=2, column=0, sticky="w", padx=10, pady=5)
        self.combo_produto = ttk.Combobox(frame_novo, width=29, state="readonly")
        self.combo_produto.grid(row=2, column=1, padx=10, pady=5)

        ttk.Label(frame_novo, text="Quantidade:", style="Painel.TLabel").grid(row=3, column=0, sticky="w", padx=10, pady=5)
        self.entry_quantidade = ttk.Entry(frame_novo, width=32)
        self.entry_quantidade.grid(row=3, column=1, padx=10, pady=5)

        ttk.Button(frame_novo, text="Adicionar item", command=self._adicionar_item).grid(row=4, column=0, columnspan=2, pady=8)

        self.lista_itens = listbox_widget(frame_novo, width=42, height=8)
        self.lista_itens.grid(row=5, column=0, columnspan=2, padx=10, pady=8)
        ttk.Button(frame_novo, text="Remover item selecionado", style="Perigo.TButton", command=self._remover_item).grid(row=6, column=0, columnspan=2)

        self.label_total = ttk.Label(frame_novo, text="Total: R$ 0.00", style="Subtitulo.TLabel")
        self.label_total.grid(row=7, column=0, columnspan=2, pady=14)

        ttk.Button(frame_novo, text="Finalizar pedido", command=self._finalizar_pedido).grid(row=8, column=0, columnspan=2, pady=(0, 10))

        self._carregar_produtos_combo()

    def _carregar_produtos_combo(self):
        self.produtos_disponiveis = produtos.listar_produtos()
        self.combo_produto["values"] = [f"{p['id']} - {p['nome']} (R$ {p['preco']:.2f})" for p in self.produtos_disponiveis]

    def _adicionar_item(self):
        indice = self.combo_produto.current()
        if indice < 0:
            messagebox.showerror("Erro", "Selecione um produto.")
            return
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
        self.label_total.config(text=f"Total: R$ {total:.2f}")

    def _finalizar_pedido(self):
        cliente = self.entry_cliente.get().strip()
        if not cliente:
            messagebox.showerror("Erro", "Informe o nome do cliente.")
            return
        if not self.itens_pedido:
            messagebox.showerror("Erro", "Adicione ao menos um item ao pedido.")
            return

        observacoes = self.entry_obs.get().strip()
        pedido_id = pedidos.criar_pedido(cliente, self.itens_pedido, observacoes)
        total = pedidos.total_pedido(pedido_id)
        messagebox.showinfo("Sucesso", f"Pedido #{pedido_id} criado! Total: R$ {total:.2f}")

        self.entry_cliente.delete(0, tk.END)
        self.entry_obs.delete(0, tk.END)
        self.itens_pedido = []
        self._atualizar_lista_itens()
        self.atualizar()
        if self.atualizar_callback:
            self.atualizar_callback()

    def atualizar(self):
        for item in self.tree.get_children():
            self.tree.delete(item)
        for p in pedidos.listar_pedidos():
            self.tree.insert("", "end", iid=p["id"], values=(p["id"], p["cliente"], p["data_pedido"], p["status"]))
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

        self.text_detalhe.delete("1.0", tk.END)
        self.text_detalhe.insert(tk.END, f"Pedido #{pedido['id']} - {pedido['cliente']}\n")
        self.text_detalhe.insert(tk.END, f"Data: {pedido['data_pedido']}\n")
        if pedido["observacoes"]:
            self.text_detalhe.insert(tk.END, f"Obs: {pedido['observacoes']}\n")
        self.text_detalhe.insert(tk.END, "\nItens:\n")
        total = 0
        for i in itens:
            subtotal = i["quantidade"] * i["preco_unitario"]
            total += subtotal
            self.text_detalhe.insert(tk.END, f"  {i['quantidade']}x {i['produto_nome']} - R$ {i['preco_unitario']:.2f} = R$ {subtotal:.2f}\n")
        self.text_detalhe.insert(tk.END, f"\nTotal: R$ {total:.2f}")

    def _atualizar_status(self):
        if not self.pedido_selecionado:
            messagebox.showerror("Erro", "Selecione um pedido.")
            return
        novo_status = self.combo_status.get()
        if not novo_status:
            return
        pedidos.atualizar_status_pedido(self.pedido_selecionado, novo_status)
        self.atualizar()
        if self.atualizar_callback:
            self.atualizar_callback()

    def _remover_pedido(self):
        if not self.pedido_selecionado:
            messagebox.showerror("Erro", "Selecione um pedido.")
            return
        if messagebox.askyesno("Confirmar", "Deseja remover este pedido?"):
            pedidos.remover_pedido(self.pedido_selecionado)
            self.pedido_selecionado = None
            self.text_detalhe.delete("1.0", tk.END)
            self.atualizar()
            if self.atualizar_callback:
                self.atualizar_callback()


# ---------------- ABA HISTORICO ----------------

class AbaHistorico(ttk.Frame):
    def __init__(self, parent):
        super().__init__(parent)
        self._montar_layout()
        self.atualizar()

    def _montar_layout(self):
        frame_filtro = ttk.Frame(self)
        frame_filtro.pack(fill="x", padx=5, pady=8)

        ttk.Label(frame_filtro, text="Data inicio (AAAA-MM-DD):").pack(side="left", padx=5)
        self.entry_inicio = ttk.Entry(frame_filtro, width=12)
        self.entry_inicio.pack(side="left", padx=5)

        ttk.Label(frame_filtro, text="Data fim (AAAA-MM-DD):").pack(side="left", padx=5)
        self.entry_fim = ttk.Entry(frame_filtro, width=12)
        self.entry_fim.pack(side="left", padx=5)

        ttk.Label(frame_filtro, text="Status:").pack(side="left", padx=5)
        self.combo_status = ttk.Combobox(frame_filtro, values=["", "pendente", "em_preparo", "concluido", "cancelado"], state="readonly", width=12)
        self.combo_status.pack(side="left", padx=5)

        ttk.Button(frame_filtro, text="Filtrar", command=self.atualizar).pack(side="left", padx=5)
        ttk.Button(frame_filtro, text="Limpar filtros", command=self._limpar_filtros).pack(side="left", padx=5)

        colunas = ("id", "cliente", "data", "status", "total")
        self.tree = ttk.Treeview(self, columns=colunas, show="headings")
        for col, titulo, largura in [("id", "ID", 40), ("cliente", "Cliente", 150), ("data", "Data", 150), ("status", "Status", 100), ("total", "Total", 90)]:
            self.tree.heading(col, text=titulo)
            self.tree.column(col, width=largura)
        self.tree.pack(fill="both", expand=True, padx=5, pady=5)

        self.label_resumo = ttk.Label(self, text="", style="Resumo.TLabel")
        self.label_resumo.pack(pady=10)

    def _limpar_filtros(self):
        self.entry_inicio.delete(0, tk.END)
        self.entry_fim.delete(0, tk.END)
        self.combo_status.set("")
        self.atualizar()

    def atualizar(self):
        data_inicio = self.entry_inicio.get().strip() or None
        data_fim = self.entry_fim.get().strip() or None
        status = self.combo_status.get().strip() or None

        for item in self.tree.get_children():
            self.tree.delete(item)

        registros = pedidos.historico_vendas(data_inicio, data_fim, status)
        for p in registros:
            total = pedidos.total_pedido(p["id"])
            self.tree.insert("", "end", values=(p["id"], p["cliente"], p["data_pedido"], p["status"], f"{total:.2f}"))

        resumo = pedidos.resumo_vendas(data_inicio, data_fim)
        self.label_resumo.config(text=f"Pedidos concluidos: {resumo['quantidade_pedidos']}   |   Total vendido: R$ {resumo['total_vendas']:.2f}")


if __name__ == "__main__":
    db.init_db()
    app = App()
    app.mainloop()
