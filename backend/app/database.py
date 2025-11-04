import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.engine.url import make_url
from sqlalchemy.exc import OperationalError
from dotenv import load_dotenv

# Carrega .env do diretório backend, independentemente do CWD
_APP_DIR = os.path.dirname(__file__)
_BACKEND_DIR = os.path.dirname(_APP_DIR)
_ENV_PATH = os.path.join(_BACKEND_DIR, ".env")
load_dotenv(dotenv_path=_ENV_PATH)

# Obrigatório: usar DATABASE_URL. Se não existir, falha explicitamente.
DATABASE_URL = os.getenv("DATABASE_URL")


# For SQLite, need check_same_thread; for Postgres, defaults are fine
def _ensure_database_exists(url_str: str):
    # Only attempt auto-create for Postgres
    if not url_str.startswith("postgresql"):
        return
    url = make_url(url_str)
    try:
        # Try connecting to target DB
        tmp_engine = create_engine(url_str)
        with tmp_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        tmp_engine.dispose()
        return
    except OperationalError:
        # Attempt to create database by connecting to the 'postgres' admin database
        try:
            admin_url = url.set(database="postgres")
            admin_engine = create_engine(admin_url)
            with admin_engine.connect() as conn:
                conn.execution_options(isolation_level="AUTOCOMMIT").execute(text(f"CREATE DATABASE \"{url.database}\""))
            admin_engine.dispose()
        except Exception:
            # Silencia e deixa o fallback tratar a conexão
            print("[database] Não foi possível criar o banco automaticamente. Verifique seu Postgres e credenciais.")


_ensure_database_exists(DATABASE_URL)


def _create_engine_strict(url_str: str):
    # Cria engine e valida conexão; sem fallback para SQLite.
    if url_str.startswith("sqlite"):
        eng = create_engine(url_str, connect_args={"check_same_thread": False})
    else:
        eng = create_engine(url_str)
    # valida conexão
    try:
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
    except OperationalError as e:
        raise RuntimeError(f"Não foi possível conectar ao banco configurado ({url_str}). Erro: {e}")
    return eng

engine = _create_engine_strict(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()