from sqlalchemy import text
from backend.app.database import engine


def main():
    with engine.connect() as conn:
        usuarios = conn.execute(text('select count(*) from public.usuarios')).scalar()
        clientes = conn.execute(text('select count(*) from public.clientes')).scalar()
        documentos = conn.execute(text('select count(*) from public.documentos')).scalar()
        print({'usuarios': usuarios, 'clientes': clientes, 'documentos': documentos})


if __name__ == '__main__':
    main()