import os
import hashlib
from sqlalchemy import text, create_engine
from sqlalchemy.engine.url import make_url
from sqlalchemy.exc import OperationalError
from dotenv import load_dotenv

# Carrega .env e cria engine diretamente da DATABASE_URL, sem fallback
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
 
def _ensure_database_exists(url_str: str):
    # Tenta criar o banco automaticamente conectando ao DB admin 'postgres'
    try:
        tmp_engine = create_engine(url_str)
        with tmp_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        tmp_engine.dispose()
        return
    except OperationalError:
        pass

    try:
        url = make_url(url_str)
        admin_url = url.set(database="postgres")
        admin_engine = create_engine(admin_url)
        with admin_engine.connect() as conn:
            conn.execution_options(isolation_level="AUTOCOMMIT").execute(text(f'CREATE DATABASE "{url.database}"'))
        admin_engine.dispose()
    except Exception:
        # Silencia: se não conseguir criar, a próxima conexão falhará e será reportada
        pass

_ensure_database_exists(DATABASE_URL)
engine = create_engine(DATABASE_URL)


def _is_sqlite() -> bool:
    try:
        return engine.url.drivername.startswith("sqlite")
    except Exception:
        return False


def ensure_usuarios_table_sqlite(conn):
    # Create table if not exists
    conn.execute(text(
        """
        CREATE TABLE IF NOT EXISTS usuarios (
            id TEXT PRIMARY KEY,
            nome TEXT NOT NULL,
            login TEXT NOT NULL UNIQUE,
            senhaHash TEXT NOT NULL,
            perfil TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'A'
        )
        """
    ))


def ensure_usuarios_table_postgres(conn):
    # Try to create extension and table for Postgres
    try:
        conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'))
    except Exception:
        pass
    conn.execute(text(
        """
        CREATE TABLE IF NOT EXISTS usuarios (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            nome VARCHAR(255) NOT NULL,
            login VARCHAR(255) NOT NULL UNIQUE,
            senhaHash VARCHAR(255) NOT NULL,
            perfil VARCHAR(30) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'A'
        )
        """
    ))
    # Normaliza coluna de senha para nome camelCase com aspas
    has_uc = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='usuarios' AND column_name='senhaHash'")).fetchone()
    has_lc = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='usuarios' AND column_name='senhahash'")).fetchone()
    if (not has_uc) and has_lc:
        conn.execute(text("ALTER TABLE usuarios RENAME COLUMN senhahash TO \"senhaHash\""))
    elif not has_uc:
        # adiciona coluna se não existir (permitindo NULL para não quebrar dados antigos)
        conn.execute(text("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS \"senhaHash\" VARCHAR(255)"))

    # Garante coluna status
    try:
        conn.execute(text("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'A'"))
    except Exception:
        pass


def ensure_column_sqlite(conn, table: str, column: str, column_def: str):
    # Check if column exists
    res = conn.execute(text(f"PRAGMA table_info('{table}')"))
    cols = [row[1] for row in res.fetchall()]
    if column not in cols:
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {column_def}"))


def ensure_fk_indexes_sqlite(conn):
    # For completeness, but SQLite won't enforce FK without PRAGMA foreign_keys=ON
    pass


def seed_admin(conn):
    login = "kelsoncsm"
    senha_hash = hashlib.sha256("123".encode("utf-8")).hexdigest()
    perfil = "A"

    # Upsert-like behavior
    res = conn.execute(text("SELECT id FROM usuarios WHERE login = :login"), {"login": login}).fetchone()
    if res is None:
        if _is_sqlite():
            import uuid as _uuid
            uid = str(_uuid.uuid4())
            conn.execute(
                text(
                    "INSERT INTO usuarios (id, nome, login, senhaHash, perfil) VALUES (:id, :nome, :login, :senhaHash, :perfil)"
                ),
                {"id": uid, "nome": "Administrador", "login": login, "senhaHash": senha_hash, "perfil": perfil},
            )
        else:
            # Quote mixed-case column "senhaHash" for Postgres and provide explicit UUID id
            import uuid as _uuid
            uid = str(_uuid.uuid4())
            conn.execute(
                text(
                    "INSERT INTO usuarios (id, nome, login, \"senhaHash\", perfil) VALUES (:id, :nome, :login, :senhaHash, :perfil) "
                    "ON CONFLICT (login) DO UPDATE SET nome=EXCLUDED.nome, perfil=EXCLUDED.perfil, \"senhaHash\"=EXCLUDED.\"senhaHash\""
                ),
                {"id": uid, "nome": "Administrador", "login": login, "senhaHash": senha_hash, "perfil": perfil},
            )


def main():
    with engine.connect() as conn:
        try:
            if _is_sqlite():
                ensure_usuarios_table_sqlite(conn)
                # Ensure usuarioId columns exist on clientes and documentos
                ensure_column_sqlite(conn, "clientes", "usuarioId", "TEXT")
                ensure_column_sqlite(conn, "documentos", "usuarioId", "TEXT")
            else:
                ensure_usuarios_table_postgres(conn)
                # Add usuarioId to tables if missing (Postgres)
                conn.execute(text(
                    "ALTER TABLE IF EXISTS clientes ADD COLUMN IF NOT EXISTS \"usuarioId\" UUID"
                ))
                conn.execute(text(
                    "ALTER TABLE IF EXISTS documentos ADD COLUMN IF NOT EXISTS \"usuarioId\" UUID"
                ))
                # Garante coluna status na tabela usuarios
                conn.execute(text("ALTER TABLE IF EXISTS usuarios ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'A'"))
                # If columns exist as lower-case, rename to match ORM quoted names
                has_uc_cli = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='clientes' AND column_name='usuarioId'")).fetchone()
                has_lc_cli = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='clientes' AND column_name='usuarioid'")).fetchone()
                if (not has_uc_cli) and has_lc_cli:
                    conn.execute(text("ALTER TABLE clientes RENAME COLUMN usuarioid TO \"usuarioId\""))
                elif has_uc_cli and has_lc_cli:
                    conn.execute(text("ALTER TABLE clientes DROP COLUMN usuarioid"))

                has_uc_doc = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='documentos' AND column_name='usuarioId'")).fetchone()
                has_lc_doc = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='documentos' AND column_name='usuarioid'")).fetchone()
                if (not has_uc_doc) and has_lc_doc:
                    conn.execute(text("ALTER TABLE documentos RENAME COLUMN usuarioid TO \"usuarioId\""))
                elif has_uc_doc and has_lc_doc:
                    conn.execute(text("ALTER TABLE documentos DROP COLUMN usuarioid"))

            seed_admin(conn)
            conn.commit()
            print("[seed] Usuário administrador garantido e colunas usuarioId verificadas.")
        except OperationalError as e:
            print("[seed] Erro operacional:", e)
        except Exception as e:
            print("[seed] Erro:", e)


if __name__ == "__main__":
    main()