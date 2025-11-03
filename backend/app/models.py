from sqlalchemy import Column, String, Date, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import mapped_column
from sqlalchemy.types import Integer
import uuid
from .database import Base


class Cliente(Base):
    __tablename__ = "clientes"

    id = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nomeCompleto = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    estadoCivil = Column(String(50), nullable=False)
    profissao = Column(String(100), nullable=False)
    cpf = Column(String(20), nullable=False)
    rg = Column(String(50), nullable=False)
    orgaoExpedidor = Column(String(50), nullable=False)
    nit = Column(String(50), nullable=False)
    numeroBeneficio = Column(String(50), nullable=False)
    dataNascimento = Column(Date, nullable=False)
    nomeMae = Column(String(255), nullable=False)
    nomePai = Column(String(255), nullable=False)
    endereco = Column(Text, nullable=False)
    bairro = Column(String(100), nullable=False)
    cidade = Column(String(100), nullable=False)
    uf = Column(String(2), nullable=False)
    logoUrl = Column(Text, nullable=True)


class Documento(Base):
    __tablename__ = "documentos"

    id = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tipoDocumento = Column(String(100), nullable=False)
    titulo = Column(String(255), nullable=False)
    tomTexto = Column(String(50), nullable=False)
    conteudo = Column(Text, nullable=False)
    status = Column(String(50), nullable=False)
    dataCreacao = Column(Date, nullable=False)
    dataUltimaEdicao = Column(Date, nullable=False)
    geradoPorIA = Column(String(5), nullable=False, default="false")  # armazenar 'true'/'false'
    dadosFormulario = Column(Text, nullable=True)  # JSON serializado como texto