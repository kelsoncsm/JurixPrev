from sqlalchemy import text
from backend.app.database import engine


def main():
    with engine.connect() as conn:
        perfis = conn.execute(text("select distinct perfil from public.usuarios order by perfil"))
        statuses = conn.execute(text("select distinct status from public.usuarios order by status"))
        print("perfis:", [r[0] for r in perfis.fetchall()])
        print("status:", [r[0] for r in statuses.fetchall()])


if __name__ == '__main__':
    main()