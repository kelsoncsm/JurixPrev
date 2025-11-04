from sqlalchemy import text
from backend.app.database import engine


def main():
    with engine.connect() as conn:
        # Garante schema public e define search_path
        try:
            conn.execution_options(isolation_level="AUTOCOMMIT").execute(text("CREATE SCHEMA IF NOT EXISTS public"))
        except Exception:
            pass
        conn.execute(text("SET search_path TO public"))
        print("[migrate] schema 'public' garantido e search_path definido.")


if __name__ == "__main__":
    main()