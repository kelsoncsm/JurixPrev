from pydantic import BaseModel, EmailStr
from datetime import date
from uuid import UUID


class ClienteBase(BaseModel):
    nomeCompleto: str
    email: EmailStr
    estadoCivil: str
    profissao: str
    cpf: str
    rg: str
    orgaoExpedidor: str
    nit: str
    numeroBeneficio: str
    dataNascimento: date
    nomeMae: str
    nomePai: str
    endereco: str
    bairro: str
    cidade: str
    uf: str


class ClienteCreate(ClienteBase):
    pass


class ClienteUpdate(ClienteBase):
    pass


class Cliente(ClienteBase):
    id: UUID

    class Config:
        from_attributes = True


class UsuarioBase(BaseModel):
    nome: str
    login: str
    perfil: str = "USUARIO"


class UsuarioCreate(UsuarioBase):
    senha: str


class Usuario(UsuarioBase):
    id: UUID

    class Config:
        from_attributes = True


class AuthLoginRequest(BaseModel):
    login: str
    senha: str


class DocumentoBase(BaseModel):
    tipoDocumento: str
    titulo: str
    tomTexto: str
    conteudo: str
    status: str
    dataCreacao: date
    dataUltimaEdicao: date
    geradoPorIA: bool = False
    dadosFormulario: dict | None = None
    imagemUrl: str | None = None


class DocumentoCreate(DocumentoBase):
    pass


class DocumentoUpdate(DocumentoBase):
    pass


class Documento(DocumentoBase):
    id: UUID

    class Config:
        from_attributes = True