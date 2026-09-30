import db
import produtos
import ingredientes
import embalagens
import gastos
import pedidos
import clientes
import datas


def pausar():
    input("\nPressione ENTER para continuar...")


def ler_float(mensagem, padrao=None):
    while True:
        valor = input(mensagem).strip().replace(",", ".")
        if valor == "" and padrao is not None:
            return padrao
        try:
            return float(valor)
        except ValueError:
            print("Valor invalido, tente novamente.")


def ler_int(mensagem, padrao=None):
    while True:
        valor = input(mensagem).strip()
        if valor == "" and padrao is not None:
            return padrao
        try:
            return int(valor)
        except ValueError:
            print("Valor invalido, tente novamente.")


def ler_data_iso(mensagem, permitir_vazio=True):
    """Le uma data digitada em DD/MM/AAAA e retorna em ISO (AAAA-MM-DD) para o banco."""
    while True:
        valor = input(mensagem).strip()
        if valor == "":
            if permitir_vazio:
                return None
            print("Data obrigatoria.")
            continue
        try:
            return datas.br_para_iso(valor)
        except ValueError:
            print("Data invalida, use o formato DD/MM/AAAA.")


# ---------------- INGREDIENTES ----------------

def menu_ingredientes():
    while True:
        print("\n=== INGREDIENTES ===")
        print("1. Listar ingredientes")
        print("2. Adicionar ingrediente")
        print("3. Editar ingrediente")
        print("4. Remover ingrediente")
        print("5. Ajustar estoque")
        print("0. Voltar")
        opcao = input("Escolha: ").strip()

        if opcao == "1":
            listar_ingredientes_tela()
        elif opcao == "2":
            adicionar_ingrediente_tela()
        elif opcao == "3":
            editar_ingrediente_tela()
        elif opcao == "4":
            remover_ingrediente_tela()
        elif opcao == "5":
            ajustar_estoque_tela()
        elif opcao == "0":
            break
        else:
            print("Opcao invalida.")


def listar_ingredientes_tela():
    itens = ingredientes.listar_ingredientes()
    print("\nID  Nome                 Unidade  Estoque   Preco Unit.")
    for i in itens:
        print(f"{i['id']:<3} {i['nome']:<20} {i['unidade']:<8} {i['quantidade_estoque']:<9} R$ {i['preco_unitario']:.2f}")
    if not itens:
        print("Nenhum ingrediente cadastrado.")


def adicionar_ingrediente_tela():
    nome = input("Nome do ingrediente: ").strip()
    unidade = input("Unidade (g, kg, ml, l, un): ").strip()
    quantidade = ler_float("Quantidade em estoque: ", 0)
    preco = ler_float("Preco unitario (por unidade de medida): ", 0)
    ingredientes.adicionar_ingrediente(nome, unidade, quantidade, preco)
    print("Ingrediente adicionado com sucesso.")


def editar_ingrediente_tela():
    listar_ingredientes_tela()
    id_ing = ler_int("\nID do ingrediente a editar: ")
    ing = ingredientes.buscar_ingrediente(id_ing)
    if not ing:
        print("Ingrediente nao encontrado.")
        return
    nome = input(f"Nome [{ing['nome']}]: ").strip() or ing["nome"]
    unidade = input(f"Unidade [{ing['unidade']}]: ").strip() or ing["unidade"]
    quantidade = ler_float(f"Estoque [{ing['quantidade_estoque']}]: ", ing["quantidade_estoque"])
    preco = ler_float(f"Preco unitario [{ing['preco_unitario']}]: ", ing["preco_unitario"])
    ingredientes.atualizar_ingrediente(id_ing, nome, unidade, quantidade, preco)
    print("Ingrediente atualizado.")


def remover_ingrediente_tela():
    listar_ingredientes_tela()
    id_ing = ler_int("\nID do ingrediente a remover: ")
    ingredientes.remover_ingrediente(id_ing)
    print("Ingrediente removido.")


def ajustar_estoque_tela():
    listar_ingredientes_tela()
    id_ing = ler_int("\nID do ingrediente: ")
    delta = ler_float("Quantidade a adicionar (use negativo para remover): ")
    ingredientes.ajustar_estoque(id_ing, delta)
    print("Estoque ajustado.")


# ---------------- CLIENTES ----------------

def menu_clientes():
    while True:
        print("\n=== CLIENTES ===")
        print("1. Listar clientes")
        print("2. Ver ficha de um cliente (historico, gasto total, status)")
        print("3. Adicionar cliente")
        print("4. Editar cliente")
        print("5. Remover cliente")
        print("6. Aniversariantes do mes")
        print("7. Clientes inativos")
        print("0. Voltar")
        opcao = input("Escolha: ").strip()

        if opcao == "1":
            listar_clientes_tela()
        elif opcao == "2":
            ver_cliente_tela()
        elif opcao == "3":
            adicionar_cliente_tela()
        elif opcao == "4":
            editar_cliente_tela()
        elif opcao == "5":
            remover_cliente_tela()
        elif opcao == "6":
            aniversariantes_tela()
        elif opcao == "7":
            inativos_tela()
        elif opcao == "0":
            break
        else:
            print("Opcao invalida.")


def listar_clientes_tela():
    itens = clientes.listar_clientes_com_status()
    print("\nID  Nome                      Status       Total Gasto   Ultima Compra")
    for info in itens:
        c = info["cliente"]
        ultima = datas.iso_para_br(info["ultima_compra"][:10]) if info["ultima_compra"] else "-"
        print(f"{c['id']:<3} {c['nome']:<25} {info['status']:<12} R$ {info['total_gasto']:<10.2f} {ultima}")
    if not itens:
        print("Nenhum cliente cadastrado.")


def ver_cliente_tela():
    listar_clientes_tela()
    id_cliente = ler_int("\nID do cliente: ")
    perfil = clientes.perfil_cliente(id_cliente)
    if not perfil:
        print("Cliente nao encontrado.")
        return
    c = perfil["cliente"]
    ultima = datas.iso_para_br(perfil["ultima_compra"][:10]) if perfil["ultima_compra"] else "-"
    print(f"\n{c['nome']} | Status: {perfil['status'].upper()}")
    print(f"Telefone: {c['telefone'] or '-'} | E-mail: {c['email'] or '-'} | Aniversario: {c['aniversario'] or '-'}")
    print(f"Endereco: {c['endereco'] or '-'}")
    print(f"Como conheceu: {c['como_conheceu'] or '-'}")
    if c["notas"]:
        print(f"Notas: {c['notas']}")
    print(f"\nTotal gasto: R$ {perfil['total_gasto']:.2f} | Pedidos pagos: {perfil['quantidade_pedidos']} | Ticket medio: R$ {perfil['ticket_medio']:.2f}")
    print(f"Ultima compra: {ultima} | Produto favorito: {perfil['produto_favorito'] or '-'}")

    print("\nHistorico de pedidos:")
    for p in clientes.historico_pedidos_cliente(id_cliente):
        total = pedidos.total_pedido(p["id"])
        print(f"  [{p['id']}] {datas.iso_para_br(p['data_pedido'])} - {p['status']} - R$ {total:.2f}")


def adicionar_cliente_tela():
    nome = input("Nome do cliente: ").strip()
    telefone = input("Telefone (opcional): ").strip() or None
    email = input("E-mail (opcional): ").strip() or None
    endereco = input("Endereco (opcional): ").strip() or None
    aniversario = input("Aniversario DD/MM (opcional): ").strip() or None
    como_conheceu = input("Como conheceu a loja (opcional): ").strip() or None
    notas = input("Notas (opcional): ").strip() or None
    clientes.adicionar_cliente(nome, telefone, email, endereco, aniversario, como_conheceu, notas)
    print("Cliente adicionado com sucesso.")


def editar_cliente_tela():
    listar_clientes_tela()
    id_cliente = ler_int("\nID do cliente a editar: ")
    c = clientes.buscar_cliente(id_cliente)
    if not c:
        print("Cliente nao encontrado.")
        return
    nome = input(f"Nome [{c['nome']}]: ").strip() or c["nome"]
    telefone = input(f"Telefone [{c['telefone'] or ''}]: ").strip() or c["telefone"]
    email = input(f"E-mail [{c['email'] or ''}]: ").strip() or c["email"]
    endereco = input(f"Endereco [{c['endereco'] or ''}]: ").strip() or c["endereco"]
    aniversario = input(f"Aniversario [{c['aniversario'] or ''}]: ").strip() or c["aniversario"]
    como_conheceu = input(f"Como conheceu [{c['como_conheceu'] or ''}]: ").strip() or c["como_conheceu"]
    notas = input(f"Notas [{c['notas'] or ''}]: ").strip() or c["notas"]
    clientes.atualizar_cliente(id_cliente, nome, telefone, email, endereco, aniversario, como_conheceu, notas)
    print("Cliente atualizado.")


def remover_cliente_tela():
    listar_clientes_tela()
    id_cliente = ler_int("\nID do cliente a remover: ")
    if messagebox_simples("Os pedidos ja feitos por este cliente nao serao apagados. Confirma remocao? (s/n): "):
        clientes.remover_cliente(id_cliente)
        print("Cliente removido.")


def messagebox_simples(mensagem):
    return input(mensagem).strip().lower() in ("s", "sim")


def aniversariantes_tela():
    itens = clientes.aniversariantes_do_mes()
    print("\nAniversariantes do mes:")
    for c in itens:
        print(f"  {c['nome']} - {c['aniversario']} - {c['telefone'] or 'sem telefone'}")
    if not itens:
        print("Nenhum aniversariante este mes.")


def inativos_tela():
    itens = clientes.clientes_inativos()
    print(f"\nClientes sem comprar ha mais de {clientes.DIAS_INATIVIDADE} dias:")
    for info in itens:
        c = info["cliente"]
        print(f"  {c['nome']} - {info['dias_sem_compra']} dias sem comprar - {c['telefone'] or 'sem telefone'}")
    if not itens:
        print("Nenhum cliente inativo.")


def escolher_cliente_para_pedido():
    """Fluxo rapido: digita o nome, reaproveita cliente existente ou cria um novo."""
    clientes.listar_clientes()
    itens = clientes.listar_clientes()
    if itens:
        print("\nClientes cadastrados:", ", ".join(c["nome"] for c in itens))
    nome = input("Nome do cliente (novo ou existente): ").strip()
    return clientes.buscar_ou_criar_cliente_por_nome(nome)


# ---------------- EMBALAGENS ----------------

def menu_embalagens():
    while True:
        print("\n=== EMBALAGENS ===")
        print("1. Listar embalagens")
        print("2. Adicionar embalagem")
        print("3. Editar embalagem")
        print("4. Remover embalagem")
        print("0. Voltar")
        opcao = input("Escolha: ").strip()

        if opcao == "1":
            listar_embalagens_tela()
        elif opcao == "2":
            adicionar_embalagem_tela()
        elif opcao == "3":
            editar_embalagem_tela()
        elif opcao == "4":
            remover_embalagem_tela()
        elif opcao == "0":
            break
        else:
            print("Opcao invalida.")


def listar_embalagens_tela():
    itens = embalagens.listar_embalagens()
    print("\nID  Nome                 Custo Total  Rendimento  Custo Unit.")
    for e in itens:
        custo_unit = embalagens.calcular_custo_unitario(e)
        print(f"{e['id']:<3} {e['nome']:<20} R$ {e['custo_total']:<9.2f} {e['rendimento']:<11} R$ {custo_unit:.2f}")
    if not itens:
        print("Nenhuma embalagem cadastrada.")


def adicionar_embalagem_tela():
    nome = input("Nome da embalagem: ").strip()
    custo_total = ler_float("Custo total (do rolo/pacote/lote): ", 0)
    rendimento = ler_int("Rendimento (quantas unidades saem): ", 1)
    embalagens.adicionar_embalagem(nome, custo_total, rendimento)
    print("Embalagem adicionada com sucesso.")


def editar_embalagem_tela():
    listar_embalagens_tela()
    id_emb = ler_int("\nID da embalagem a editar: ")
    emb = embalagens.buscar_embalagem(id_emb)
    if not emb:
        print("Embalagem nao encontrada.")
        return
    nome = input(f"Nome [{emb['nome']}]: ").strip() or emb["nome"]
    custo_total = ler_float(f"Custo total [{emb['custo_total']}]: ", emb["custo_total"])
    rendimento = ler_int(f"Rendimento [{emb['rendimento']}]: ", emb["rendimento"])
    embalagens.atualizar_embalagem(id_emb, nome, custo_total, rendimento)
    print("Embalagem atualizada.")


def remover_embalagem_tela():
    listar_embalagens_tela()
    id_emb = ler_int("\nID da embalagem a remover: ")
    embalagens.remover_embalagem(id_emb)
    print("Embalagem removida.")


# ---------------- PRODUTOS ----------------

def menu_produtos():
    while True:
        print("\n=== PRODUTOS ===")
        print("1. Listar produtos")
        print("2. Adicionar produto")
        print("3. Editar produto")
        print("4. Remover produto")
        print("5. Gerenciar ingredientes do produto (receita)")
        print("6. Gerenciar embalagens do produto")
        print("0. Voltar")
        opcao = input("Escolha: ").strip()

        if opcao == "1":
            listar_produtos_tela()
        elif opcao == "2":
            adicionar_produto_tela()
        elif opcao == "3":
            editar_produto_tela()
        elif opcao == "4":
            remover_produto_tela()
        elif opcao == "5":
            gerenciar_ingredientes_produto_tela()
        elif opcao == "6":
            gerenciar_embalagens_produto_tela()
        elif opcao == "0":
            break
        else:
            print("Opcao invalida.")


def listar_produtos_tela():
    itens = produtos.listar_produtos()
    print("\nID  Nome                      Categoria        Preco      Descricao")
    for p in itens:
        print(f"{p['id']:<3} {p['nome']:<25} {p['categoria'] or '-':<16} R$ {p['preco']:<8.2f} {p['descricao'] or ''}")
    if not itens:
        print("Nenhum produto cadastrado.")


def adicionar_produto_tela():
    nome = input("Nome do produto: ").strip()
    print("Categorias sugeridas:", ", ".join(produtos.listar_categorias()[:10]), "...")
    categoria = input("Categoria (opcional): ").strip() or None
    preco = ler_float("Preco de venda: ")
    taxa_overhead = ler_float("Taxa de utilidades/gas em % (padrao 10): ", 10)
    descricao = input("Descricao (opcional): ").strip()
    produtos.adicionar_produto(nome, preco, descricao, categoria, taxa_overhead)
    print("Produto adicionado com sucesso.")


def editar_produto_tela():
    listar_produtos_tela()
    id_prod = ler_int("\nID do produto a editar: ")
    prod = produtos.buscar_produto(id_prod)
    if not prod:
        print("Produto nao encontrado.")
        return
    nome = input(f"Nome [{prod['nome']}]: ").strip() or prod["nome"]
    categoria = input(f"Categoria [{prod['categoria'] or ''}]: ").strip() or prod["categoria"]
    preco = ler_float(f"Preco [{prod['preco']}]: ", prod["preco"])
    taxa_overhead = ler_float(f"Taxa de utilidades % [{prod['taxa_overhead']}]: ", prod["taxa_overhead"])
    descricao = input(f"Descricao [{prod['descricao'] or ''}]: ").strip() or prod["descricao"]
    produtos.atualizar_produto(id_prod, nome, preco, descricao, categoria, taxa_overhead)
    print("Produto atualizado.")


def remover_produto_tela():
    listar_produtos_tela()
    id_prod = ler_int("\nID do produto a remover: ")
    produtos.remover_produto(id_prod)
    print("Produto removido.")


def gerenciar_ingredientes_produto_tela():
    listar_produtos_tela()
    id_prod = ler_int("\nID do produto: ")
    prod = produtos.buscar_produto(id_prod)
    if not prod:
        print("Produto nao encontrado.")
        return

    while True:
        print(f"\n=== Receita: {prod['nome']} ===")
        itens = produtos.listar_ingredientes_do_produto(id_prod)
        for i in itens:
            print(f"  [{i['id']}] {i['nome']} - {i['quantidade']} {i['unidade']}")
        detalhe = produtos.detalhar_custo_produto(id_prod)
        print(f"Ingredientes: R$ {detalhe['ingredientes']:.2f} | Utilidades: R$ {detalhe['overhead']:.2f} | "
              f"Embalagens: R$ {detalhe['embalagens']:.2f} | Custo total: R$ {detalhe['total']:.2f} | Preco de venda: R$ {prod['preco']:.2f}")

        print("\n1. Adicionar ingrediente")
        print("2. Remover ingrediente")
        print("0. Voltar")
        opcao = input("Escolha: ").strip()

        if opcao == "1":
            listar_ingredientes_tela()
            id_ing = ler_int("ID do ingrediente: ")
            quantidade = ler_float("Quantidade utilizada na receita: ")
            produtos.adicionar_ingrediente_ao_produto(id_prod, id_ing, quantidade)
        elif opcao == "2":
            id_rel = ler_int("ID do item da receita a remover: ")
            produtos.remover_ingrediente_do_produto(id_rel)
        elif opcao == "0":
            break
        else:
            print("Opcao invalida.")


def gerenciar_embalagens_produto_tela():
    listar_produtos_tela()
    id_prod = ler_int("\nID do produto: ")
    prod = produtos.buscar_produto(id_prod)
    if not prod:
        print("Produto nao encontrado.")
        return

    while True:
        print(f"\n=== Embalagens usadas: {prod['nome']} ===")
        itens = produtos.listar_embalagens_do_produto(id_prod)
        for e in itens:
            print(f"  [{e['id']}] {e['nome']} - {e['quantidade']}x")
        custo_embalagens = produtos.calcular_custo_embalagens(id_prod)
        print(f"Custo de embalagem: R$ {custo_embalagens:.2f}")

        print("\n1. Adicionar embalagem")
        print("2. Remover embalagem")
        print("0. Voltar")
        opcao = input("Escolha: ").strip()

        if opcao == "1":
            listar_embalagens_tela()
            id_emb = ler_int("ID da embalagem: ")
            quantidade = ler_float("Quantas unidades este produto usa: ", 1)
            produtos.adicionar_embalagem_ao_produto(id_prod, id_emb, quantidade)
        elif opcao == "2":
            id_rel = ler_int("ID do item a remover: ")
            produtos.remover_embalagem_do_produto(id_rel)
        elif opcao == "0":
            break
        else:
            print("Opcao invalida.")


# ---------------- PEDIDOS ----------------

def menu_pedidos():
    while True:
        print("\n=== PEDIDOS ===")
        print("1. Novo pedido")
        print("2. Listar pedidos")
        print("3. Ver detalhes de um pedido")
        print("4. Editar/remover item de um pedido")
        print("5. Atualizar entrega/pagamento do pedido")
        print("6. Atualizar status do pedido")
        print("7. Remover pedido")
        print("0. Voltar")
        opcao = input("Escolha: ").strip()

        if opcao == "1":
            novo_pedido_tela()
        elif opcao == "2":
            listar_pedidos_tela()
        elif opcao == "3":
            ver_pedido_tela()
        elif opcao == "4":
            editar_item_pedido_tela()
        elif opcao == "5":
            atualizar_dados_pedido_tela()
        elif opcao == "6":
            atualizar_status_tela()
        elif opcao == "7":
            remover_pedido_tela()
        elif opcao == "0":
            break
        else:
            print("Opcao invalida.")


def novo_pedido_tela():
    cliente_id = escolher_cliente_para_pedido()
    data_entrega = ler_data_iso("Data de entrega (DD/MM/AAAA, opcional): ")
    forma_pagamento = input("Forma de pagamento (pix/dinheiro/cartao_debito/cartao_credito/outro, opcional): ").strip() or None
    observacoes = input("Observacoes (opcional): ").strip()
    itens = []

    while True:
        listar_produtos_tela()
        id_prod = ler_int("\nID do produto (0 para finalizar): ")
        if id_prod == 0:
            break
        prod = produtos.buscar_produto(id_prod)
        if not prod:
            print("Produto nao encontrado.")
            continue
        quantidade = ler_int("Quantidade: ", 1)
        itens.append({
            "produto_id": id_prod,
            "quantidade": quantidade,
            "preco_unitario": prod["preco"],
        })
        print(f"Adicionado: {quantidade}x {prod['nome']}")

    if not itens:
        print("Pedido cancelado (nenhum item adicionado).")
        return

    pedido_id = pedidos.criar_pedido(cliente_id, itens, observacoes, data_entrega, forma_pagamento)
    total = pedidos.total_pedido(pedido_id)
    print(f"\nPedido #{pedido_id} criado com sucesso! Total: R$ {total:.2f}")


def listar_pedidos_tela():
    itens = pedidos.listar_pedidos()
    print("\nID  Cliente               Data                 Entrega      Pagamento        Status")
    for p in itens:
        print(f"{p['id']:<3} {p['cliente_nome']:<20} {datas.iso_para_br(p['data_pedido']):<20} {datas.iso_para_br(p['data_entrega']) or '-':<12} {p['forma_pagamento'] or '-':<16} {p['status']}")
    if not itens:
        print("Nenhum pedido cadastrado.")


def ver_pedido_tela():
    listar_pedidos_tela()
    id_pedido = ler_int("\nID do pedido: ")
    pedido, itens = pedidos.buscar_pedido(id_pedido)
    if not pedido:
        print("Pedido nao encontrado.")
        return

    print(f"\nPedido #{pedido['id']} - {pedido['cliente_nome']}")
    print(f"Data: {datas.iso_para_br(pedido['data_pedido'])} | Entrega: {datas.iso_para_br(pedido['data_entrega']) or '-'} | Pagamento: {pedido['forma_pagamento'] or '-'} | Status: {pedido['status']}")
    if pedido["observacoes"]:
        print(f"Obs: {pedido['observacoes']}")
    print("\nItens:")
    total = 0
    for i in itens:
        subtotal = i["quantidade"] * i["preco_unitario"]
        total += subtotal
        print(f"  [{i['id']}] {i['quantidade']}x {i['produto_nome']} - R$ {i['preco_unitario']:.2f} = R$ {subtotal:.2f}")
    print(f"\nTotal: R$ {total:.2f}")


def editar_item_pedido_tela():
    id_pedido = ler_int("ID do pedido: ")
    pedido, itens = pedidos.buscar_pedido(id_pedido)
    if not pedido:
        print("Pedido nao encontrado.")
        return
    for i in itens:
        subtotal = i["quantidade"] * i["preco_unitario"]
        print(f"  [{i['id']}] {i['quantidade']}x {i['produto_nome']} - R$ {i['preco_unitario']:.2f} = R$ {subtotal:.2f}")
    if not itens:
        print("Este pedido nao tem itens.")
        return
    id_item = ler_int("ID do item a editar: ")
    print("1. Alterar quantidade")
    print("2. Remover item")
    opcao = input("Escolha: ").strip()
    if opcao == "1":
        quantidade = ler_int("Nova quantidade: ", 1)
        pedidos.atualizar_quantidade_item(id_item, quantidade)
        print("Quantidade atualizada.")
    elif opcao == "2":
        pedidos.remover_item_pedido(id_item)
        print("Item removido.")
    else:
        print("Opcao invalida.")


def atualizar_status_tela():
    listar_pedidos_tela()
    id_pedido = ler_int("\nID do pedido: ")
    print(f"Status disponiveis: {', '.join(pedidos.STATUS_PEDIDO)}")
    status = input("Novo status: ").strip()
    if status not in pedidos.STATUS_PEDIDO:
        print("Status invalido.")
        return
    pedidos.atualizar_status_pedido(id_pedido, status)
    print("Status atualizado.")


def atualizar_dados_pedido_tela():
    listar_pedidos_tela()
    id_pedido = ler_int("\nID do pedido: ")
    pedido, _ = pedidos.buscar_pedido(id_pedido)
    if not pedido:
        print("Pedido nao encontrado.")
        return
    entrada_data = input(f"Data de entrega [{datas.iso_para_br(pedido['data_entrega'])}] (DD/MM/AAAA): ").strip()
    if entrada_data:
        try:
            data_entrega = datas.br_para_iso(entrada_data)
        except ValueError:
            print("Data invalida, mantendo a data anterior.")
            data_entrega = pedido["data_entrega"]
    else:
        data_entrega = pedido["data_entrega"]
    forma_pagamento = input(f"Forma de pagamento [{pedido['forma_pagamento'] or ''}]: ").strip() or pedido["forma_pagamento"]
    pedidos.atualizar_dados_pedido(id_pedido, data_entrega, forma_pagamento, pedido["observacoes"])

    novo_cliente = input(f"Cliente [{pedido['cliente_nome']}] (deixe vazio para manter): ").strip()
    if novo_cliente:
        cliente_id = clientes.buscar_ou_criar_cliente_por_nome(novo_cliente)
        pedidos.atualizar_cliente_pedido(id_pedido, cliente_id)
    print("Dados do pedido atualizados.")


def remover_pedido_tela():
    listar_pedidos_tela()
    id_pedido = ler_int("\nID do pedido a remover: ")
    pedidos.remover_pedido(id_pedido)
    print("Pedido removido.")


# ---------------- HISTORICO ----------------

def menu_historico():
    while True:
        print("\n=== HISTORICO DE VENDAS ===")
        print("1. Ver todo o historico")
        print("2. Filtrar por periodo")
        print("3. Filtrar por status")
        print("4. Resumo de vendas (pagas) por periodo")
        print("5. Vendas por categoria (ano atual)")
        print("0. Voltar")
        opcao = input("Escolha: ").strip()

        if opcao == "1":
            exibir_historico(pedidos.historico_vendas())
        elif opcao == "2":
            data_inicio = ler_data_iso("Data inicio (DD/MM/AAAA): ", permitir_vazio=False)
            data_fim = ler_data_iso("Data fim (DD/MM/AAAA): ", permitir_vazio=False)
            exibir_historico(pedidos.historico_vendas(data_inicio, data_fim))
        elif opcao == "3":
            print(f"Status disponiveis: {', '.join(pedidos.STATUS_PEDIDO)}")
            status = input("Status: ").strip()
            exibir_historico(pedidos.historico_vendas(status=status))
        elif opcao == "4":
            data_inicio = ler_data_iso("Data inicio (DD/MM/AAAA, opcional): ")
            data_fim = ler_data_iso("Data fim (DD/MM/AAAA, opcional): ")
            resumo = pedidos.resumo_vendas(data_inicio, data_fim)
            print(f"\nPedidos pagos: {resumo['quantidade_pedidos']}")
            print(f"Total vendido: R$ {resumo['total_vendas']:.2f}")
        elif opcao == "5":
            ano = input("Ano (AAAA, opcional): ").strip() or None
            print("\nCategoria                 Quantidade vendida")
            for linha in pedidos.vendas_por_categoria(ano):
                print(f"{linha['categoria']:<26} {linha['total']}")
        elif opcao == "0":
            break
        else:
            print("Opcao invalida.")


def exibir_historico(itens):
    print("\nID  Cliente               Data                 Status")
    for p in itens:
        total = pedidos.total_pedido(p["id"])
        print(f"{p['id']:<3} {p['cliente_nome']:<20} {datas.iso_para_br(p['data_pedido']):<20} {p['status']:<12} R$ {total:.2f}")
    if not itens:
        print("Nenhum registro encontrado.")


# ---------------- GASTOS ----------------

def menu_gastos():
    while True:
        print("\n=== GASTOS ===")
        print("1. Listar gastos")
        print("2. Adicionar gasto")
        print("3. Editar gasto")
        print("4. Remover gasto")
        print("5. Resumo por categoria e forma de pagamento")
        print("0. Voltar")
        opcao = input("Escolha: ").strip()

        if opcao == "1":
            listar_gastos_tela()
        elif opcao == "2":
            adicionar_gasto_tela()
        elif opcao == "3":
            editar_gasto_tela()
        elif opcao == "4":
            remover_gasto_tela()
        elif opcao == "5":
            resumo_gastos_tela()
        elif opcao == "0":
            break
        else:
            print("Opcao invalida.")


def listar_gastos_tela():
    itens = gastos.listar_gastos()
    print("\nID  Nome                      Data        Pagamento        Categoria        Valor")
    for g in itens:
        print(f"{g['id']:<3} {g['nome']:<25} {datas.iso_para_br(g['data']):<11} {g['tipo_pagamento'] or '-':<16} {g['categoria'] or '-':<16} R$ {g['valor']:.2f}")
    if not itens:
        print("Nenhum gasto cadastrado.")


def adicionar_gasto_tela():
    nome = input("Nome do gasto: ").strip()
    data_iso = ler_data_iso("Data (DD/MM/AAAA): ", permitir_vazio=False)
    print(f"Formas de pagamento sugeridas: {', '.join(t for t in gastos.TIPOS_PAGAMENTO if t)}")
    tipo_pagamento = input("Forma de pagamento (opcional): ").strip() or None
    print(f"Categorias sugeridas: {', '.join(c for c in gastos.CATEGORIAS if c)}")
    categoria = input("Categoria (opcional): ").strip() or None
    valor = ler_float("Valor: ", 0)
    gastos.adicionar_gasto(nome, data_iso, tipo_pagamento, categoria, valor)
    print("Gasto adicionado com sucesso.")


def editar_gasto_tela():
    listar_gastos_tela()
    id_gasto = ler_int("\nID do gasto a editar: ")
    gasto = gastos.buscar_gasto(id_gasto)
    if not gasto:
        print("Gasto nao encontrado.")
        return
    nome = input(f"Nome [{gasto['nome']}]: ").strip() or gasto["nome"]
    entrada_data = input(f"Data [{datas.iso_para_br(gasto['data'])}] (DD/MM/AAAA): ").strip()
    data_iso = datas.br_para_iso(entrada_data) if entrada_data else gasto["data"]
    tipo_pagamento = input(f"Forma de pagamento [{gasto['tipo_pagamento'] or ''}]: ").strip() or gasto["tipo_pagamento"]
    categoria = input(f"Categoria [{gasto['categoria'] or ''}]: ").strip() or gasto["categoria"]
    valor = ler_float(f"Valor [{gasto['valor']}]: ", gasto["valor"])
    gastos.atualizar_gasto(id_gasto, nome, data_iso, tipo_pagamento, categoria, valor)
    print("Gasto atualizado.")


def remover_gasto_tela():
    listar_gastos_tela()
    id_gasto = ler_int("\nID do gasto a remover: ")
    gastos.remover_gasto(id_gasto)
    print("Gasto removido.")


def resumo_gastos_tela():
    print(f"\nTotal geral: R$ {gastos.total_gastos():.2f}")
    print("\nPor categoria:")
    for categoria, valor in gastos.resumo_por_categoria():
        print(f"  {categoria}: R$ {valor:.2f}")
    print("\nPor forma de pagamento:")
    for tipo, valor in gastos.resumo_por_tipo_pagamento():
        print(f"  {tipo}: R$ {valor:.2f}")


# ---------------- MENU PRINCIPAL ----------------

def exibir_resumo_inicial():
    resumo_mes = pedidos.resumo_mes_atual()
    em_aberto = pedidos.quantidade_pedidos_em_aberto()
    top = pedidos.produto_mais_vendido()

    print(f"Vendido este mes: R$ {resumo_mes['total_vendas']:.2f} ({resumo_mes['quantidade_pedidos']} pedido(s) pago(s))")
    print(f"Pedidos em aberto (nao pagos): {em_aberto}")
    if top:
        print(f"Produto mais vendido: {top['nome']} ({top['total_vendido']} unidade(s))")
    else:
        print("Produto mais vendido: sem vendas ainda")

    aniversariantes = clientes.aniversariantes_do_mes()
    if aniversariantes:
        print(f"Aniversariantes do mes: {', '.join(c['nome'] for c in aniversariantes)}")
    inativos = clientes.clientes_inativos()
    if inativos:
        print(f"Clientes inativos (sem comprar ha mais de {clientes.DIAS_INATIVIDADE} dias): {len(inativos)}")


def menu_principal():
    db.init_db()
    while True:
        print("\n========================================")
        print(" LELLA DOLCI - CONTROLE DE VENDAS")
        print("========================================")
        exibir_resumo_inicial()
        print("----------------------------------------")
        print("1. Clientes")
        print("2. Produtos")
        print("3. Ingredientes")
        print("4. Embalagens")
        print("5. Pedidos")
        print("6. Historico de vendas")
        print("7. Gastos")
        print("0. Sair")
        opcao = input("Escolha: ").strip()

        if opcao == "1":
            menu_clientes()
        elif opcao == "2":
            menu_produtos()
        elif opcao == "3":
            menu_ingredientes()
        elif opcao == "4":
            menu_embalagens()
        elif opcao == "5":
            menu_pedidos()
        elif opcao == "6":
            menu_historico()
        elif opcao == "7":
            menu_gastos()
        elif opcao == "0":
            print("Ate logo!")
            break
        else:
            print("Opcao invalida.")


if __name__ == "__main__":
    menu_principal()
