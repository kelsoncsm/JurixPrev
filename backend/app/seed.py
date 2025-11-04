from datetime import date
import json

from .database import engine, SessionLocal
from .models import Base, Cliente, Documento, Usuario
from . import crud, schemas
import hashlib
from uuid import UUID
from datetime import date


def seed():
    # Garante que as tabelas existam
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Inserir usuário ADMINISTRATIVO padrão se não existir
        admin_login = "admin"
        existente = db.query(Usuario).filter(Usuario.login == admin_login).first()
        # senha desejada para o admin
        nova_senha_hash = hashlib.sha256("123456".encode('utf-8')).hexdigest()
        if not existente:
            # cria admin com senha 123456
            admin = Usuario(
                nome="Administrador",
                login=admin_login,
                senhaHash=nova_senha_hash,
                perfil="ADMINISTRATIVO"
            )
            db.add(admin)
        else:
            # atualiza senha e perfil, garantindo configuração correta
            existente.senhaHash = nova_senha_hash
            existente.perfil = "ADMINISTRATIVO"

        db.commit()

        # Recupera id do admin para vincular dados genéricos
        admin_usuario = db.query(Usuario).filter(Usuario.login == admin_login).first()
        admin_id = admin_usuario.id if admin_usuario else None

        # Inserir clientes somente se vazio (dados genéricos) vinculados ao admin
        if db.query(Cliente).count() == 0 and admin_id:
            c1 = schemas.ClienteCreate(
                nomeCompleto="João Silva",
                email="joao.silva@example.com",
                estadoCivil="Solteiro",
                profissao="Advogado",
                cpf="12345678901",
                rg="1234567",
                orgaoExpedidor="SSP",
                nit="1234567890",
                numeroBeneficio="987654321",
                dataNascimento=date(1990, 5, 20),
                nomeMae="Maria Silva",
                nomePai="Carlos Silva",
                endereco="Rua A, 123",
                bairro="Centro",
                cidade="São Paulo",
                uf="SP",
            )
            c2 = schemas.ClienteCreate(
                nomeCompleto="Ana Souza",
                email="ana.souza@example.com",
                estadoCivil="Casado",
                profissao="Contadora",
                cpf="98765432100",
                rg="7654321",
                orgaoExpedidor="SSP",
                nit="0987654321",
                numeroBeneficio="123456789",
                dataNascimento=date(1985, 8, 15),
                nomeMae="Paula Souza",
                nomePai="Roberto Souza",
                endereco="Avenida B, 456",
                bairro="Jardins",
                cidade="São Paulo",
                uf="SP",
            )
            crud.create_cliente(db, c1, admin_id)
            crud.create_cliente(db, c2, admin_id)

        # Inserir documentos somente se vazio (dados genéricos) vinculados ao admin
        if db.query(Documento).count() == 0 and admin_id:
            d1 = schemas.DocumentoCreate(
                tipoDocumento="Petição Inicial",
                titulo="Petição Inicial - Ação de Cobrança",
                tomTexto="Técnico",
                conteudo="Conteúdo da petição inicial...",
                status="Finalizado",
                dataCreacao=date(2024, 1, 15),
                dataUltimaEdicao=date(2024, 1, 16),
                geradoPorIA=True,
                dadosFormulario={
                    "nomeCliente": "João Silva",
                    "cpfCnpj": "123.456.789-01",
                    "valorCausa": 15000,
                },
                imagemUrl=None,
            )
            d2 = schemas.DocumentoCreate(
                tipoDocumento="Procuração",
                titulo="Procuração Ad Judicia",
                tomTexto="Formal",
                conteudo="Conteúdo da procuração...",
                status="Rascunho",
                dataCreacao=date(2024, 1, 20),
                dataUltimaEdicao=date(2024, 1, 20),
                geradoPorIA=True,
                dadosFormulario={
                    "nomeCliente": "Ana Souza",
                    "oabAdvogado": "12345",
                },
                imagemUrl=None,
            )
            crud.create_documento(db, d1, admin_id)
            crud.create_documento(db, d2, admin_id)

        return {
            "clientes": db.query(Cliente).count(),
            "documentos": db.query(Documento).count(),
            "usuarios": db.query(Usuario).count(),
        }
    finally:
        db.close()


def seed_kelson_data():
    """
    Garante o usuário 'kelsoncsm' e insere clientes e documentos vinculados a ele,
    evitando duplicações se já existirem registros para esse usuário.
    """
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Garante usuário 'kelsoncsm' com senha 123123 e perfil ADMINISTRATIVO
        login = "kelsoncsm"
        usuario = db.query(Usuario).filter(Usuario.login == login).first()
        nova_senha_hash = hashlib.sha256("123123".encode('utf-8')).hexdigest()
        if not usuario:
            usuario = Usuario(
                nome="Kelson",
                login=login,
                senhaHash=nova_senha_hash,
                perfil="ADMINISTRATIVO"
            )
            db.add(usuario)
            db.commit()
            db.refresh(usuario)
        else:
            # Atualiza senha e mantém perfil ADMINISTRATIVO
            usuario.senhaHash = nova_senha_hash
            usuario.perfil = "ADMINISTRATIVO"
            db.commit()

        usuario_id = usuario.id

        # Insere clientes vinculados ao usuarioId, se ainda não houver clientes dele
        existentes_cli = db.query(Cliente).filter(Cliente.usuarioId == usuario_id).count()
        if existentes_cli == 0:
            c1 = schemas.ClienteCreate(
                nomeCompleto="Cliente A (Kelson)",
                email="cliente.a.kelson@example.com",
                estadoCivil="Solteiro",
                profissao="Analista",
                cpf="11111111111",
                rg="1111111",
                orgaoExpedidor="SSP",
                nit="1111111111",
                numeroBeneficio="A1",
                dataNascimento=date(1992, 2, 2),
                nomeMae="Mae A",
                nomePai="Pai A",
                endereco="Rua Exemplo, 100",
                bairro="Centro",
                cidade="São Paulo",
                uf="SP",
            )
            c2 = schemas.ClienteCreate(
                nomeCompleto="Cliente B (Kelson)",
                email="cliente.b.kelson@example.com",
                estadoCivil="Casado",
                profissao="Engenheiro",
                cpf="22222222222",
                rg="2222222",
                orgaoExpedidor="SSP",
                nit="2222222222",
                numeroBeneficio="B2",
                dataNascimento=date(1988, 8, 8),
                nomeMae="Mae B",
                nomePai="Pai B",
                endereco="Av Modelo, 200",
                bairro="Jardins",
                cidade="São Paulo",
                uf="SP",
            )
            crud.create_cliente(db, c1, usuario_id)
            crud.create_cliente(db, c2, usuario_id)

        # Insere documentos vinculados ao usuarioId, se ainda não houver documentos dele
        existentes_doc = db.query(Documento).filter(Documento.usuarioId == usuario_id).count()
        if existentes_doc == 0:
            d1 = schemas.DocumentoCreate(
                tipoDocumento="Petição Inicial",
                titulo="Petição Inicial - Cobrança (Kelson)",
                tomTexto="Técnico",
                conteudo="Conteúdo exemplo da petição inicial...",
                status="Finalizado",
                dataCreacao=date(2024, 2, 10),
                dataUltimaEdicao=date(2024, 2, 12),
                geradoPorIA=True,
                dadosFormulario={
                    "nomeCliente": "Cliente A (Kelson)",
                    "cpfCnpj": "111.111.111-11",
                    "valorCausa": 5000,
                },
                imagemUrl=None,
            )
            d2 = schemas.DocumentoCreate(
                tipoDocumento="Procuração",
                titulo="Procuração Ad Judicia (Kelson)",
                tomTexto="Formal",
                conteudo="Conteúdo exemplo da procuração...",
                status="Rascunho",
                dataCreacao=date(2024, 3, 5),
                dataUltimaEdicao=date(2024, 3, 5),
                geradoPorIA=False,
                dadosFormulario={
                    "nomeCliente": "Cliente B (Kelson)",
                    "oabAdvogado": "12345/SP",
                },
                imagemUrl=None,
            )
            crud.create_documento(db, d1, usuario_id)
            crud.create_documento(db, d2, usuario_id)

        db.commit()
        return {
            "usuario": str(usuario_id),
            "clientes_do_usuario": db.query(Cliente).filter(Cliente.usuarioId == usuario_id).count(),
            "documentos_do_usuario": db.query(Documento).filter(Documento.usuarioId == usuario_id).count(),
        }
    finally:
        db.close()


if __name__ == "__main__":
    result = seed()
    print("Seed concluído:", result)
    kelson_result = seed_kelson_data()
    print("Seed kelsoncsm concluído:", kelson_result)