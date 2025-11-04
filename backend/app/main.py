from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from uuid import UUID

from .database import Base, engine, get_db
from . import schemas, crud
from .auth import create_token, decode_token

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="JurixPrev API")

# CORS for Angular dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "http://localhost:4204",
        "http://127.0.0.1:4204",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}

bearer_scheme = HTTPBearer()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="Token ausente")
    data = decode_token(token)
    if not data or not data.get("sub"):
        raise HTTPException(status_code=401, detail="Token inválido")
    usuario = crud.get_usuario_por_login(db, data.get("login")) if data.get("login") else None
    # fallback: buscar por id caso login não esteja no token
    if not usuario:
        try:
            from uuid import UUID as _UUID
            uid = _UUID(data.get("sub"))
            usuario = db.query(crud.models.Usuario).filter(crud.models.Usuario.id == uid).first()  # type: ignore
        except Exception:
            usuario = None
    if not usuario:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    return usuario


@app.get("/clientes", response_model=list[schemas.Cliente])
def listar_clientes(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if (current_user.perfil or "U").upper() in ("A", "ADMINISTRATIVO"):
        return crud.list_clientes(db)
    return crud.list_clientes_by_usuario(db, current_user.id)


@app.post("/clientes", response_model=schemas.Cliente)
def criar_cliente(payload: schemas.ClienteCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return crud.create_cliente(db, payload, current_user.id)


@app.get("/clientes/{cliente_id}", response_model=schemas.Cliente)
def obter_cliente(cliente_id: UUID, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    cliente = crud.get_cliente(db, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    if (current_user.perfil or "USUARIO").upper() != "ADMINISTRATIVO" and getattr(cliente, "usuarioId", None) != current_user.id:
        raise HTTPException(status_code=403, detail="Sem acesso ao recurso")
    return cliente


@app.put("/clientes/{cliente_id}", response_model=schemas.Cliente)
def atualizar_cliente(cliente_id: UUID, payload: schemas.ClienteUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    cliente = crud.get_cliente(db, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    if (current_user.perfil or "U").upper() not in ("A", "ADMINISTRATIVO") and getattr(cliente, "usuarioId", None) != current_user.id:
        raise HTTPException(status_code=403, detail="Sem acesso ao recurso")
    return crud.update_cliente(db, cliente, payload)


@app.delete("/clientes/{cliente_id}")
def remover_cliente(cliente_id: UUID, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    cliente = crud.get_cliente(db, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    if (current_user.perfil or "USUARIO").upper() != "ADMINISTRATIVO" and getattr(cliente, "usuarioId", None) != current_user.id:
        raise HTTPException(status_code=403, detail="Sem acesso ao recurso")
    crud.delete_cliente(db, cliente)
    return {"ok": True}


# Usuários
@app.post("/usuarios/register", response_model=schemas.Usuario)
def registrar_usuario(
    payload: schemas.UsuarioCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Apenas administrador pode cadastrar usuários
    if (current_user.perfil or "U").upper() not in ("A", "ADMINISTRATIVO"):
        raise HTTPException(status_code=403, detail="Sem permissão para cadastrar usuários")
    existente = crud.get_usuario_por_login(db, payload.login)
    if existente:
        raise HTTPException(status_code=400, detail="Login já cadastrado")
    criado = crud.create_usuario(db, payload)
    return schemas.Usuario(id=criado.id, nome=criado.nome, login=criado.login, perfil=criado.perfil, status=criado.status)

@app.get("/usuarios/by-login/{login}", response_model=schemas.Usuario)
def obter_usuario_por_login(login: str, db: Session = Depends(get_db)):
    usuario = crud.get_usuario_por_login(db, login)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return schemas.Usuario(id=usuario.id, nome=usuario.nome, login=usuario.login, perfil=usuario.perfil, status=usuario.status)

@app.get("/usuarios", response_model=list[schemas.Usuario])
def listar_usuarios(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if (current_user.perfil or "U").upper() not in ("A", "ADMINISTRATIVO"):
        raise HTTPException(status_code=403, detail="Sem permissão para listar usuários")
    usuarios = crud.list_usuarios(db)
    return [schemas.Usuario(id=u.id, nome=u.nome, login=u.login, perfil=u.perfil, status=u.status) for u in usuarios]


@app.put("/usuarios/{usuario_id}", response_model=schemas.Usuario)
def atualizar_usuario(usuario_id: UUID, payload: schemas.UsuarioUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if (current_user.perfil or "U").upper() not in ("A", "ADMINISTRATIVO"):
        raise HTTPException(status_code=403, detail="Sem permissão para editar usuários")
    atualizado = crud.update_usuario(db, usuario_id, payload)
    if not atualizado:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return schemas.Usuario(id=atualizado.id, nome=atualizado.nome, login=atualizado.login, perfil=atualizado.perfil, status=atualizado.status)


@app.delete("/usuarios/{usuario_id}")
def remover_usuario(usuario_id: UUID, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if (current_user.perfil or "U").upper() not in ("A", "ADMINISTRATIVO"):
        raise HTTPException(status_code=403, detail="Sem permissão para excluir usuários")
    ok = crud.delete_usuario(db, usuario_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return {"ok": True}


@app.post("/auth/login", response_model=schemas.AuthTokenResponse)
def autenticar(payload: schemas.AuthLoginRequest, db: Session = Depends(get_db)):
    usuario = crud.verificar_login(db, payload.login, payload.senha)
    if not usuario:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    token = create_token({"sub": str(usuario.id), "login": usuario.login, "perfil": usuario.perfil})
    # Retorna dict explícito para evitar qualquer inconsistência de serialização
    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": {
            "id": str(usuario.id),
            "nome": usuario.nome,
            "login": usuario.login,
            "perfil": usuario.perfil,
            "status": usuario.status,
        },
        }

@app.post("/auth/token")
def obter_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    usuario = crud.verificar_login(db, form_data.username, form_data.password)
    if not usuario:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    token = create_token({"sub": str(usuario.id), "login": usuario.login, "perfil": usuario.perfil})
    return {
        "access_token": token,
        "token_type": "bearer",
    }


# Documentos
@app.get("/documentos", response_model=list[schemas.Documento])
def listar_documentos(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # converter campos serializados
    if (current_user.perfil or "USUARIO").upper() == "ADMINISTRATIVO":
        docs = crud.list_documentos(db)
    else:
        docs = crud.list_documentos_by_usuario(db, current_user.id)
    import json
    for d in docs:
        try:
            d.dadosFormulario = json.loads(d.dadosFormulario) if d.dadosFormulario else None
        except Exception:
            d.dadosFormulario = None
        d.geradoPorIA = str(d.geradoPorIA).lower() == "true"
    return docs


@app.post("/documentos", response_model=schemas.Documento)
def criar_documento(payload: schemas.DocumentoCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return crud.create_documento(db, payload, current_user.id)


@app.get("/documentos/{documento_id}", response_model=schemas.Documento)
def obter_documento(documento_id: UUID, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    doc = crud.get_documento(db, documento_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    if (current_user.perfil or "USUARIO").upper() != "ADMINISTRATIVO" and getattr(doc, "usuarioId", None) != current_user.id:
        raise HTTPException(status_code=403, detail="Sem acesso ao recurso")
    import json
    try:
        doc.dadosFormulario = json.loads(doc.dadosFormulario) if doc.dadosFormulario else None
    except Exception:
        doc.dadosFormulario = None
    doc.geradoPorIA = str(doc.geradoPorIA).lower() == "true"
    return doc


@app.put("/documentos/{documento_id}", response_model=schemas.Documento)
def atualizar_documento(documento_id: UUID, payload: schemas.DocumentoUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    doc = crud.get_documento(db, documento_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    if (current_user.perfil or "U").upper() not in ("A", "ADMINISTRATIVO") and getattr(doc, "usuarioId", None) != current_user.id:
        raise HTTPException(status_code=403, detail="Sem acesso ao recurso")
    return crud.update_documento(db, doc, payload)


@app.delete("/documentos/{documento_id}")
def remover_documento(documento_id: UUID, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    doc = crud.get_documento(db, documento_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    if (current_user.perfil or "USUARIO").upper() != "ADMINISTRATIVO" and getattr(doc, "usuarioId", None) != current_user.id:
        raise HTTPException(status_code=403, detail="Sem acesso ao recurso")
    crud.delete_documento(db, doc)
    return {"ok": True}