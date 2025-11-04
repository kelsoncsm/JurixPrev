from sqlalchemy import text
from backend.app.database import engine


def main():
    with engine.begin() as conn:
        # Converter perfil
        conn.execute(text("""
            UPDATE public.usuarios SET perfil = 'A' WHERE UPPER(perfil) IN ('ADMINISTRATIVO','A');
        """))
        conn.execute(text("""
            UPDATE public.usuarios SET perfil = 'U' WHERE UPPER(perfil) IN ('USUARIO','U');
        """))
        # Converter status
        conn.execute(text("""
            UPDATE public.usuarios SET status = 'A' WHERE UPPER(status) IN ('ATIVO','A');
        """))
        conn.execute(text("""
            UPDATE public.usuarios SET status = 'I' WHERE UPPER(status) IN ('INATIVO','I');
        """))
    print("[migrate] Conversão de códigos de perfil/status concluída.")


if __name__ == '__main__':
    main()