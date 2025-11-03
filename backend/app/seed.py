from datetime import date
import json

from .database import engine, SessionLocal
from .models import Base, Cliente, Documento


def seed():
    # Garante que as tabelas existam
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Inserir clientes somente se vazio
        if db.query(Cliente).count() == 0:
            c1 = Cliente(
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
                logoUrl=None,
            )
            c2 = Cliente(
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
                logoUrl=None,
            )
            db.add_all([c1, c2])

        # Inserir documentos somente se vazio
        if db.query(Documento).count() == 0:
            d1 = Documento(
                tipoDocumento="Petição Inicial",
                titulo="Petição Inicial - Ação de Cobrança",
                tomTexto="Técnico",
                conteudo="Conteúdo da petição inicial...",
                status="Finalizado",
                dataCreacao=date(2024, 1, 15),
                dataUltimaEdicao=date(2024, 1, 16),
                geradoPorIA="true",
                dadosFormulario=json.dumps({
                    "nomeCliente": "João Silva",
                    "cpfCnpj": "123.456.789-01",
                    "valorCausa": 15000,
                }, ensure_ascii=False),
            )
            d2 = Documento(
                tipoDocumento="Procuração",
                titulo="Procuração Ad Judicia",
                tomTexto="Formal",
                conteudo="Conteúdo da procuração...",
                status="Rascunho",
                dataCreacao=date(2024, 1, 20),
                dataUltimaEdicao=date(2024, 1, 20),
                geradoPorIA="true",
                dadosFormulario=json.dumps({
                    "nomeCliente": "Ana Souza",
                    "oabAdvogado": "12345",
                }, ensure_ascii=False),
            )
            db.add_all([d1, d2])

        db.commit()
        return {
            "clientes": db.query(Cliente).count(),
            "documentos": db.query(Documento).count(),
        }
    finally:
        db.close()


if __name__ == "__main__":
    result = seed()
    print("Seed concluído:", result)