from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from ..database import engine


def drop_logo_column():
    with engine.begin() as conn:
        dialect = conn.dialect.name
        try:
            if dialect == "postgresql":
                conn.execute(text('ALTER TABLE "clientes" DROP COLUMN IF EXISTS "logoUrl"'))
            elif dialect == "sqlite":
                # SQLite 3.35+ supports DROP COLUMN
                try:
                    conn.execute(text('ALTER TABLE clientes DROP COLUMN logoUrl'))
                except OperationalError:
                    # If unsupported or column missing, ignore
                    pass
            else:
                # Attempt generic SQL; ignore errors
                try:
                    conn.execute(text('ALTER TABLE clientes DROP COLUMN logoUrl'))
                except Exception:
                    pass
            print("[migration] logoUrl removida (ou já inexistente)")
        except Exception as e:
            print(f"[migration] Falha ao remover logoUrl: {e}")


if __name__ == "__main__":
    drop_logo_column()