import db
import produtos
import ingredientes
import pedidos
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


# ---------------- PRODUTOS ----------------

def menu_produtos():
    while True:
        print("\n=== PRODUTOS ===")
        print("1. Listar produtos")
        print("2. Adicionar produto")
        print("3. Editar produto")
        print("4. Remover produto")
        print("5. Gerenciar ingredientes do produto (ficha tecnica)")
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
        elif opcao == "0":
            break
        else:
            print("Opcao invalida.")


def listar_produtos_tela():
    itens = produtos.listar_produtos()
    print("\nID  Nome                      Preco      Descricao")
    for p in itens:
        print(f"{p['id']:<3} {p['nome']:<25} R$ {p['preco']:<8.2f} {p['descricao'] or ''}")
    if not itens:
        print("Nenhum produto cadastrado.")


def adicionar_produto_tela():
    nome = input("Nome do produto: ").strip()
    preco = ler_float("Preco de venda: ")
    descricao = input("Descricao (opcional): ").strip()
    produtos.adicionar_produto(nome, preco, descricao)
    print("Produto adicionado com sucesso.")


def editar_produto_tela():
    listar_produtos_tela()
    id_prod = ler_int("\nID do produto a editar: ")
    prod = produtos.buscar_produto(id_prod)
    if not prod:
        print("Produto nao encontrado.")
        return
    nome = input(f"Nome [{prod['nome']}]: ").strip() or prod["nome"]
    preco = ler_float(f"Preco [{prod['preco']}]: ", prod["preco"])
    descricao = input(f"Descricao [{prod['descricao'] or ''}]: ").strip() or prod["descricao"]
    produtos.atualizar_produto(id_prod, nome, preco, descricao)
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
        print(f"\n=== Ficha tecnica: {prod['nome']} ===")
        itens = produtos.listar_ingredientes_do_produto(id_prod)
        for i in itens:
            print(f"  [{i['id']}] {i['nome']} - {i['quantidade']} {i['unidade']}")
        custo = produtos.calcular_custo_produto(id_prod)
        print(f"Custo estimado: R$ {custo:.2f} | Preco de venda: R$ {prod['preco']:.2f}")

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
            id_rel = ler_int("ID do item da ficha a remover: ")
            produtos.remover_ingrediente_do_produto(id_rel)
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
    cliente = input("Nome do cliente: ").strip()
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

    pedido_id = pedidos.criar_pedido(cliente, itens, observacoes, data_entrega, forma_pagamento)
    total = pedidos.total_pedido(pedido_id)
    print(f"\nPedido #{pedido_id} criado com sucesso! Total: R$ {total:.2f}")


def listar_pedidos_tela():
    itens = pedidos.listar_pedidos()
    print("\nID  Cliente               Data                 Entrega      Pagamento        Status")
    for p in itens:
        print(f"{p['id']:<3} {p['cliente']:<20} {datas.iso_para_br(p['data_pedido']):<20} {datas.iso_para_br(p['data_entrega']) or '-':<12} {p['forma_pagamento'] or '-':<16} {p['status']}")
    if not itens:
        print("Nenhum pedido cadastrado.")


def ver_pedido_tela():
    listar_pedidos_tela()
    id_pedido = ler_int("\nID do pedido: ")
    pedido, itens = pedidos.buscar_pedido(id_pedido)
    if not pedido:
        print("Pedido nao encontrado.")
        return

    print(f"\nPedido #{pedido['id']} - {pedido['cliente']}")
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
    print("Status disponiveis: nao_pago, pago")
    status = input("Novo status: ").strip()
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
        print("0. Voltar")
        opcao = input("Escolha: ").strip()

        if opcao == "1":
            exibir_historico(pedidos.historico_vendas())
        elif opcao == "2":
            data_inicio = ler_data_iso("Data inicio (DD/MM/AAAA): ", permitir_vazio=False)
            data_fim = ler_data_iso("Data fim (DD/MM/AAAA): ", permitir_vazio=False)
            exibir_historico(pedidos.historico_vendas(data_inicio, data_fim))
        elif opcao == "3":
            status = input("Status (nao_pago/pago): ").strip()
            exibir_historico(pedidos.historico_vendas(status=status))
        elif opcao == "4":
            data_inicio = ler_data_iso("Data inicio (DD/MM/AAAA, opcional): ")
            data_fim = ler_data_iso("Data fim (DD/MM/AAAA, opcional): ")
            resumo = pedidos.resumo_vendas(data_inicio, data_fim)
            print(f"\nPedidos pagos: {resumo['quantidade_pedidos']}")
            print(f"Total vendido: R$ {resumo['total_vendas']:.2f}")
        elif opcao == "0":
            break
        else:
            print("Opcao invalida.")


def exibir_historico(itens):
    print("\nID  Cliente               Data                 Status")
    for p in itens:
        total = pedidos.total_pedido(p["id"])
        print(f"{p['id']:<3} {p['cliente']:<20} {datas.iso_para_br(p['data_pedido']):<20} {p['status']:<12} R$ {total:.2f}")
    if not itens:
        print("Nenhum registro encontrado.")


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


def menu_principal():
    db.init_db()
    while True:
        print("\n========================================")
        print(" LELLA DOLCI - CONTROLE DE VENDAS")
        print("========================================")
        exibir_resumo_inicial()
        print("----------------------------------------")
        print("1. Produtos")
        print("2. Ingredientes")
        print("3. Pedidos")
        print("4. Historico de vendas")
        print("0. Sair")
        opcao = input("Escolha: ").strip()

        if opcao == "1":
            menu_produtos()
        elif opcao == "2":
            menu_ingredientes()
        elif opcao == "3":
            menu_pedidos()
        elif opcao == "4":
            menu_historico()
        elif opcao == "0":
            print("Ate logo!")
            break
        else:
            print("Opcao invalida.")


if __name__ == "__main__":
    menu_principal()
