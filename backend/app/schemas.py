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
    usuarioId: UUID | None = None

    class Config:
        from_attributes = True


class UsuarioBase(BaseModel):
    nome: str
    login: str
    perfil: str = "U"
    status: str = "A"


class UsuarioCreate(UsuarioBase):
    senha: str

class UsuarioUpdate(BaseModel):
    nome: str
    perfil: str = "U"
    status: str | None = None
    senha: str | None = None


class Usuario(UsuarioBase):
    id: UUID

    class Config:
        from_attributes = True


class AuthLoginRequest(BaseModel):
    login: str
    senha: str


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: "Usuario"


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
    usuarioId: UUID | None = None

    class Config:
        from_attributes = True


# IA: Requisição e Resposta
class DocumentoIARequest(BaseModel):
    tipoDocumento: str
    tomTexto: str
    dadosFormulario: dict


class DocumentoIAResponse(BaseModel):
    conteudo: str
    fundamentosJuridicos: str | None = None
    pedidos: str | None = None
    observacoes: str | None = None