from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from uuid import UUID

from .database import Base, engine, get_db
from . import schemas, crud

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="JurixPrev API")

# CORS for Angular dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "http://localhost:4201",
        "http://127.0.0.1:4201",
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


@app.get("/clientes", response_model=list[schemas.Cliente])
def listar_clientes(db: Session = Depends(get_db)):
    return crud.list_clientes(db)


@app.post("/clientes", response_model=schemas.Cliente)
def criar_cliente(payload: schemas.ClienteCreate, db: Session = Depends(get_db)):
    return crud.create_cliente(db, payload)


@app.get("/clientes/{cliente_id}", response_model=schemas.Cliente)
def obter_cliente(cliente_id: UUID, db: Session = Depends(get_db)):
    cliente = crud.get_cliente(db, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return cliente


@app.put("/clientes/{cliente_id}", response_model=schemas.Cliente)
def atualizar_cliente(cliente_id: UUID, payload: schemas.ClienteUpdate, db: Session = Depends(get_db)):
    cliente = crud.get_cliente(db, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return crud.update_cliente(db, cliente, payload)


@app.delete("/clientes/{cliente_id}")
def remover_cliente(cliente_id: UUID, db: Session = Depends(get_db)):
    cliente = crud.get_cliente(db, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    crud.delete_cliente(db, cliente)
    return {"ok": True}


# Usuários
@app.post("/usuarios/register", response_model=schemas.Usuario)
def registrar_usuario(payload: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    existente = crud.get_usuario_por_login(db, payload.login)
    if existente:
        raise HTTPException(status_code=400, detail="Login já cadastrado")
    criado = crud.create_usuario(db, payload)
    return schemas.Usuario(id=criado.id, nome=criado.nome, login=criado.login, perfil=criado.perfil)

@app.get("/usuarios/by-login/{login}", response_model=schemas.Usuario)
def obter_usuario_por_login(login: str, db: Session = Depends(get_db)):
    usuario = crud.get_usuario_por_login(db, login)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return schemas.Usuario(id=usuario.id, nome=usuario.nome, login=usuario.login, perfil=usuario.perfil)


@app.post("/auth/login", response_model=schemas.Usuario)
def autenticar(payload: schemas.AuthLoginRequest, db: Session = Depends(get_db)):
    usuario = crud.verificar_login(db, payload.login, payload.senha)
    if not usuario:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    return schemas.Usuario(id=usuario.id, nome=usuario.nome, login=usuario.login, perfil=usuario.perfil)


# Documentos
@app.get("/documentos", response_model=list[schemas.Documento])
def listar_documentos(db: Session = Depends(get_db)):
    # converter campos serializados
    docs = crud.list_documentos(db)
    import json
    for d in docs:
        try:
            d.dadosFormulario = json.loads(d.dadosFormulario) if d.dadosFormulario else None
        except Exception:
            d.dadosFormulario = None
        d.geradoPorIA = str(d.geradoPorIA).lower() == "true"
    return docs


@app.post("/documentos", response_model=schemas.Documento)
def criar_documento(payload: schemas.DocumentoCreate, db: Session = Depends(get_db)):
    return crud.create_documento(db, payload)


@app.get("/documentos/{documento_id}", response_model=schemas.Documento)
def obter_documento(documento_id: UUID, db: Session = Depends(get_db)):
    doc = crud.get_documento(db, documento_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    import json
    try:
        doc.dadosFormulario = json.loads(doc.dadosFormulario) if doc.dadosFormulario else None
    except Exception:
        doc.dadosFormulario = None
    doc.geradoPorIA = str(doc.geradoPorIA).lower() == "true"
    return doc


@app.put("/documentos/{documento_id}", response_model=schemas.Documento)
def atualizar_documento(documento_id: UUID, payload: schemas.DocumentoUpdate, db: Session = Depends(get_db)):
    doc = crud.get_documento(db, documento_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    return crud.update_documento(db, doc, payload)


@app.delete("/documentos/{documento_id}")
def remover_documento(documento_id: UUID, db: Session = Depends(get_db)):
    doc = crud.get_documento(db, documento_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    crud.delete_documento(db, doc)
    return {"ok": True}