import os
import sys
from sqlalchemy import create_engine, text


def get_database_url() -> str:
    # Try env DATABASE_URL first; fallback to SQLite file
    return os.getenv("DATABASE_URL")


def is_sqlite(url: str) -> bool:
    return url.startswith("sqlite")


def main():
    url = get_database_url()
    engine = create_engine(url)
    with engine.begin() as conn:
        if is_sqlite(url):
            # Check if columns exist
            def has_column(table: str, col: str) -> bool:
                rows = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
                return any(r[1] == col for r in rows)
            if not has_column("clientes", "usuarioId"):
                conn.execute(text("ALTER TABLE clientes ADD COLUMN usuarioId TEXT"))
            if not has_column("documentos", "usuarioId"):
                conn.execute(text("ALTER TABLE documentos ADD COLUMN usuarioId TEXT"))
        else:
            # PostgreSQL: add columns as UUID, nullable for existing data
            conn.execute(text("ALTER TABLE clientes ADD COLUMN IF NOT EXISTS usuarioId UUID"))
            conn.execute(text("ALTER TABLE documentos ADD COLUMN IF NOT EXISTS usuarioId UUID"))
    print("Migration complete: usuarioId added to clientes and documentos (if missing)")


if __name__ == "__main__":
    sys.exit(main())