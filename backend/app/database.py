import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.engine.url import make_url
from sqlalchemy.exc import OperationalError
from dotenv import load_dotenv

load_dotenv()

# Default to local Postgres if DATABASE_URL not set
DATABASE_URL = os.getenv("DATABASE_URL") or "postgresql+psycopg2://postgres@localhost:5432/jurixprev"

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


def _create_engine_with_fallback(url_str: str):
    # Prefer configured DB; if unreachable, fallback to local SQLite to keep API online
    if url_str.startswith("sqlite"):
        return create_engine(url_str, connect_args={"check_same_thread": False})
    try:
        eng = create_engine(url_str)
        # attempt a quick connection
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        return eng
    except OperationalError:
        fallback = "sqlite:///./jurixprev.db"
        print("[database] Aviso: não foi possível conectar ao Postgres. Fazendo fallback para SQLite em jurixprev.db.")
        return create_engine(fallback, connect_args={"check_same_thread": False})


engine = _create_engine_with_fallback(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()