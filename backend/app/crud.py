from sqlalchemy.orm import Session
from . import models, schemas
import hashlib


def list_clientes(db: Session):
    return db.query(models.Cliente).all()


def list_clientes_by_usuario(db: Session, usuario_id):
    return db.query(models.Cliente).filter(models.Cliente.usuarioId == usuario_id).all()


def get_cliente(db: Session, cliente_id):
    return db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()


def create_cliente(db: Session, payload: schemas.ClienteCreate, usuario_id):
    data = payload.model_dump()
    data["usuarioId"] = usuario_id
    cliente = models.Cliente(**data)
    db.add(cliente)
    db.commit()
    db.refresh(cliente)
    return cliente


def update_cliente(db: Session, cliente, payload: schemas.ClienteUpdate):
    for k, v in payload.model_dump().items():
        setattr(cliente, k, v)
    db.commit()
    db.refresh(cliente)
    return cliente


def delete_cliente(db: Session, cliente):
    db.delete(cliente)
    db.commit()


# Usuarios
def get_usuario_por_email(db: Session, email: str):
    # Mantido apenas por compatibilidade, usa coluna 'login' se necessário
    return db.query(models.Usuario).filter(models.Usuario.login == email).first()

def get_usuario_por_login(db: Session, login: str):
    return db.query(models.Usuario).filter(models.Usuario.login == login).first()

def list_usuarios(db: Session):
    return db.query(models.Usuario).all()


def create_usuario(db: Session, payload: schemas.UsuarioCreate):
    # hashing simples para demo; em produção, usar bcrypt/argon2
    senha_hash = hashlib.sha256(payload.senha.encode('utf-8')).hexdigest()
    perfil = getattr(payload, 'perfil', 'USUARIO') or 'USUARIO'
    usuario = models.Usuario(nome=payload.nome, login=payload.login, senhaHash=senha_hash, perfil=perfil)
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario

def get_usuario_por_id(db: Session, usuario_id):
    return db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()

def update_usuario(db: Session, usuario_id, payload: schemas.UsuarioUpdate):
    usuario = get_usuario_por_id(db, usuario_id)
    if not usuario:
        return None
    usuario.nome = payload.nome
    usuario.perfil = getattr(payload, 'perfil', usuario.perfil) or usuario.perfil
    if getattr(payload, 'senha', None):
        usuario.senhaHash = hashlib.sha256(payload.senha.encode('utf-8')).hexdigest()
    db.commit()
    db.refresh(usuario)
    return usuario

def delete_usuario(db: Session, usuario_id):
    usuario = get_usuario_por_id(db, usuario_id)
    if not usuario:
        return False
    db.delete(usuario)
    db.commit()
    return True


def verificar_login(db: Session, login: str, senha: str):
    usuario = get_usuario_por_login(db, login)
    if not usuario:
        return None
    senha_hash = hashlib.sha256(senha.encode('utf-8')).hexdigest()
    return usuario if usuario.senhaHash == senha_hash else None


# Documentos
def list_documentos(db: Session):
    return db.query(models.Documento).all()


def list_documentos_by_usuario(db: Session, usuario_id):
    return db.query(models.Documento).filter(models.Documento.usuarioId == usuario_id).all()


def get_documento(db: Session, documento_id):
    return db.query(models.Documento).filter(models.Documento.id == documento_id).first()


def create_documento(db: Session, payload: schemas.DocumentoCreate, usuario_id=None):
    # serializa dadosFormulario para texto
    data = payload.model_dump()
    if data.get("dadosFormulario") is not None:
        import json
        data["dadosFormulario"] = json.dumps(data["dadosFormulario"], ensure_ascii=False)
    # converter geradoPorIA bool -> 'true'/'false'
    data["geradoPorIA"] = "true" if data.get("geradoPorIA") else "false"
    if usuario_id:
        data["usuarioId"] = usuario_id
    documento = models.Documento(**data)
    db.add(documento)
    db.commit()
    db.refresh(documento)
    return documento


def update_documento(db: Session, documento, payload: schemas.DocumentoUpdate):
    data = payload.model_dump()
    if data.get("dadosFormulario") is not None:
        import json
        data["dadosFormulario"] = json.dumps(data["dadosFormulario"], ensure_ascii=False)
    data["geradoPorIA"] = "true" if data.get("geradoPorIA") else "false"
    for k, v in data.items():
        setattr(documento, k, v)
    db.commit()
    db.refresh(documento)
    return documento


def delete_documento(db: Session, documento):
    db.delete(documento)
    db.commit()