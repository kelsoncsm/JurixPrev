import os
from sqlalchemy import text, create_engine
from sqlalchemy.exc import OperationalError
from dotenv import load_dotenv

# Carrega .env e cria engine
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)


def main():
    with engine.connect() as conn:
        try:
            # Converte valores antigos para códigos
            # Perfil: ADMINISTRATIVO -> A, USUARIO -> U
            conn.execute(text("UPDATE usuarios SET perfil='A' WHERE UPPER(perfil)='ADMINISTRATIVO'"))
            conn.execute(text("UPDATE usuarios SET perfil='U' WHERE UPPER(perfil)='USUARIO'"))

            # Status: ATIVO -> A, INATIVO -> I
            conn.execute(text("UPDATE usuarios SET status='A' WHERE UPPER(status)='ATIVO'"))
            conn.execute(text("UPDATE usuarios SET status='I' WHERE UPPER(status)='INATIVO'"))

            # Em bancos que suportam alteração de default diretamente
            try:
                conn.execute(text("ALTER TABLE IF EXISTS usuarios ALTER COLUMN status SET DEFAULT 'A'"))
            except Exception:
                # SQLite não suporta ALTER COLUMN facilmente; ignorar
                pass

            conn.commit()
            print("[migrate] Valores de perfil/status convertidos para códigos A/U e A/I.")
        except OperationalError as e:
            print("[migrate] Erro operacional:", e)
        except Exception as e:
            print("[migrate] Erro:", e)


if __name__ == "__main__":
    main()