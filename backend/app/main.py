from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from uuid import UUID
import os

from .database import Base, engine, get_db, SessionLocal
from . import schemas, crud
from .auth import create_token, decode_token

# Create tables if they don't exist and ensure default admin user
Base.metadata.create_all(bind=engine)

def _ensure_default_admin():
    try:
        from .models import Usuario
        import hashlib
        db = SessionLocal()
        try:
            admin = db.query(Usuario).filter(Usuario.login == "admin").first()
            if not admin:
                pwd_hash = hashlib.sha256("admin123".encode("utf-8")).hexdigest()
                novo = Usuario(
                    nome="Administrador",
                    login="admin",
                    senhaHash=pwd_hash,
                    perfil="A",
                    status="A",
                )
                db.add(novo)
                db.commit()
        finally:
            db.close()
    except Exception:
        # Evita quebrar startup por erro de seed; logs podem ser adicionados conforme necessário
        pass

_ensure_default_admin()

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


# IA Jurídica: geração de conteúdos
@app.post("/documentos/gerar-ia", response_model=schemas.DocumentoIAResponse)
def gerar_documento_ia(payload: schemas.DocumentoIARequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Gera Fundamentos Jurídicos, Pedidos, Observações e Conteúdo completo via IA.
    Se a variável OPENAI_API_KEY não estiver configurada, usa um gerador local simples.
    """
    dados = payload.dadosFormulario or {}

    # Se o cliente informou campos já preenchidos, respeitamos e apenas completamos o restante
    fundamentos_in = dados.get("fundamentosJuridicos") or dados.get("fundamentacaoJuridica")
    pedidos_in = dados.get("pedidos")
    observacoes_in = dados.get("observacoes")

    openai_api_key = os.getenv("OPENAI_API_KEY")

    def _fallback_generate():
        # Geração simples baseada nos dados de entrada
        nome = dados.get("nomeCliente") or "[NOME DO CLIENTE]"
        reu = dados.get("nomeReu") or "[PARTE CONTRÁRIA]"
        vara = dados.get("vara") or "[VARA]"
        comarca = dados.get("comarca") or "[COMARCA]"
        processo = dados.get("numeroProcesso") or dados.get("numeroProcedimento") or "[NÚMERO DO PROCESSO]"
        valor_causa = dados.get("valorCausa")

        fundamentos = fundamentos_in or (
            f"O direito do(a) autor(a) {nome} encontra amparo nos arts. 186 e 927 do Código Civil, que estabelecem a obrigação de indenizar em razão de ato ilícito, além das disposições específicas aplicáveis ao caso concreto. Considerando os fatos narrados e a relação jurídica entre as partes, a responsabilidade de {reu} é objetiva/subjectiva, conforme o entendimento consolidado na jurisprudência dos tribunais."
        )
        pedidos = pedidos_in or (
            "a) Citação da parte ré para, querendo, contestar a presente ação;\n"
            "b) Condenação da parte ré ao cumprimento da obrigação nos termos expostos;\n"
            "c) Condenação ao pagamento de custas e honorários;\n"
            + (f"d) Fixação do valor da causa em R$ {valor_causa}." if valor_causa else "d) Demais medidas cabíveis.")
        )
        observacoes = observacoes_in or (
            f"Processo nº {processo} em trâmite na {vara} da Comarca de {comarca}. As partes podem celebrar acordo, caso desejem, observando-se os princípios da boa-fé e da cooperação processual."
        )

        titulo = f"{payload.tipoDocumento} - {nome}"
        conteudo = (
            f"EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA {vara} DA COMARCA DE {comarca}\n\n"
            f"{nome}, por seu advogado, vem propor a presente {payload.tipoDocumento} em face de {reu}, pelos fatos e fundamentos a seguir.\n\n"
            "I - DOS FATOS\n"
            + (dados.get("relatoFatos") or "[RELATO DOS FATOS]") + "\n\n"
            "II - DOS FUNDAMENTOS JURÍDICOS\n"
            + fundamentos + "\n\n"
            "III - DOS PEDIDOS\n"
            + pedidos + "\n\n"
            "IV - DAS OBSERVAÇÕES\n"
            + observacoes + "\n\n"
            "Termos em que, pede deferimento."
        )

        # Ajuste simples de tom
        tom = (payload.tomTexto or "Técnico").lower()
        if "simpl" in tom:
            conteudo = conteudo.replace("EXCELENTÍSSIMO(A)", "ILUSTRÍSSIMO(A)")
        elif "persuas" in tom:
            conteudo += "\n\nDiante da robustez dos fundamentos, é de rigor o acolhimento dos pedidos."

        return schemas.DocumentoIAResponse(
            conteudo=conteudo,
            fundamentosJuridicos=fundamentos,
            pedidos=pedidos,
            observacoes=observacoes,
        )

    # Tenta usar OpenAI se possível
    if openai_api_key:
        try:
            import json
            import requests
            # Monta prompt em português e solicita retorno em JSON
            system_prompt = (
                "Você é um assistente jurídico que redige peças em português, com base nos dados fornecidos. "
                "Retorne um JSON com as chaves: fundamentosJuridicos, pedidos, observacoes, conteudo."
            )
            user_prompt = {
                "tipoDocumento": payload.tipoDocumento,
                "tomTexto": payload.tomTexto,
                "dados": dados,
            }
            body = {
                "model": "gpt-4o-mini",  # modelo genérico; pode ser ajustado por config
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": json.dumps(user_prompt, ensure_ascii=False)},
                ],
                "response_format": {"type": "json_object"}
            }
            resp = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {openai_api_key}",
                    "Content-Type": "application/json",
                },
                data=json.dumps(body),
                timeout=25,
            )
            if resp.status_code == 200:
                data_out = resp.json()
                content = data_out["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                return schemas.DocumentoIAResponse(
                    conteudo=parsed.get("conteudo") or "",
                    fundamentosJuridicos=parsed.get("fundamentosJuridicos"),
                    pedidos=parsed.get("pedidos"),
                    observacoes=parsed.get("observacoes"),
                )
        except Exception:
            # Fallback em caso de erro na chamada externa
            pass

    # Fallback padrão
    return _fallback_generate()