# Template de Organização do Projeto (Frontend + Backend)

Este template define uma estrutura, convenções e fluxo de trabalho para projetos web com Angular (frontend) e FastAPI (backend). Use-o como base para iniciar e manter o projeto organizado, previsível e fácil de evoluir.

## Visão Geral

- Monorepo com duas aplicações: `frontend/` (Angular) e `backend/` (FastAPI).
- Separação clara entre camadas: UI, serviços, modelos, rotas (frontend) e API, domínio, persistência, autenticação (backend).
- Padrões de código, nomenclatura e scripts de desenvolvimento consistentes.

## Estrutura de Pastas

```
projeto/
├── backend/
│   ├── app/
│   │   ├── main.py            # Bootstrap da aplicação FastAPI
│   │   ├── auth.py            # Rotas e utilitários de autenticação (JWT, permissões)
│   │   ├── models.py          # Modelos ORM (SQLAlchemy)
│   │   ├── schemas.py         # Schemas Pydantic (entrada/saída)
│   │   ├── crud.py            # Operações de banco (Repository/CRUD)
│   │   ├── database.py        # Conexão, sessão, configuração do DB
│   │   ├── migrations/        # Migrações (Alembic)
│   │   └── seed.py            # Semeadura de dados
│   ├── sql/                   # SQL auxiliar (schema inicial, consultas)
│   ├── requirements.txt       # Dependências do backend
│   └── .env                   # Variáveis de ambiente (não versionar em produção)
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/    # Componentes de features (CRUDs, páginas)
│   │   │   ├── services/      # Serviços de API (HttpClient), utilitários
│   │   │   ├── guards/        # Guards de rota (auth/roles)
│   │   │   ├── theme/         # Layout, navegação, componentes compartilhados
│   │   │   ├── demo/          # Páginas de exemplo (remover em produção)
│   │   │   ├── app-routing.module.ts # Rotas da aplicação
│   │   ├── assets/            # Imagens, ícones
│   │   ├── environments/      # `environment.ts` e `environment.prod.ts`
│   │   └── styles.scss        # Estilos globais
│   ├── e2e/                   # Testes/capturas end-to-end (Playwright)
│   ├── package.json           # Scripts e dependências do frontend
│   └── angular.json           # Configuração do Angular CLI
├── docs/                      # Documentação do projeto
└── run-dev.bat                # Script para iniciar ambos serviços em desenvolvimento
```

## Backend (FastAPI)

- Endpoints: agrupar por recurso em módulos (ex.: `/usuarios`, `/clientes`, `/documentos`).
- Autenticação: JWT; middleware para extrair usuário, guards de permissionamento por perfil (Admin/Usuário).
- Schemas: `schemas.py` diferencia `Create`, `Update`, `Read` e `Auth`.
- Persistência: `models.py` (SQLAlchemy) + `crud.py` (Repository Pattern). Evitar lógica de domínio nas rotas.
- Migrações: usar Alembic; documentar comandos em `docs/`.
- Testes: `pytest`; mocks de DB (SQLite) ou transações isoladas.
- Variáveis de ambiente: `APP_ENV`, `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`.

### Exemplo de endpoints

```
GET    /api/usuarios           # lista
POST   /api/usuarios           # cria
POST   /api/usuarios/login     # autentica (JWT)
GET    /api/clientes           # lista com filtros
POST   /api/clientes           # cria
GET    /api/documentos         # lista com filtros
POST   /api/documentos         # cria (com ou sem IA)
```

## Frontend (Angular)

- Módulos: organizar features por pasta (ex.: `usuarios`, `clientes`, `documentos`).
- Componentes: separar listas, formulários e visualizações (ex.: `lista-usuarios`, `cadastro-usuario`).
- Serviços: um serviço por recurso (`UsuarioService`, `ClienteService`, `DocumentoJuridicoService`), baseados em `environment.apiUrl`.
- Rotas: proteger com `roleGuard` quando necessário; rotas aninhadas sob layout `AdminComponent`.
- UI/Theme: `theme/` contém navegação, card, navbar; manter componentes compartilhados em `shared`.
- E2E: Playwright para fluxo principal (login, CRUDs e documentos), com screenshots para documentação e QA.

### Convenções

- Nomenclatura de componentes: `NomeFeatureComponent` em `kebab-case` nos arquivos.
- Observables e serviços: sufixar streams com `$` quando for `Observable` (`logoUrl$`).
- Mapeamento de formulários: Reactive Forms com validações e mensagens consistentes.
- HTTP: centralizar base URL em `environment.apiUrl`; tratar erros via interceptors quando aplicável.

## Padrões e Convenções

- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`).
- Estilo: ESLint + Prettier já configurados no frontend; Python lint (flake8/black) opcional no backend.
- Erros: mensagens amigáveis; logs detalhados no backend (sem dados sensíveis), alertas/Toasts no frontend.
- Branches: `main`, `develop` e `feature/*` (ajuste conforme necessidade).

## Scripts de Desenvolvimento

- Backend
  - `uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`
- Frontend
  - `npm start` (Angular dev server)
  - `npm run build` (produção)
  - `npm run lint` / `npm run lint:fix`
  - `npm run capture:flow` (Playwright: screenshots do fluxo principal)

## Fluxo de Desenvolvimento

1. Planejar feature e criar branch `feature/<nome>`.
2. Backend: definir schemas, endpoints e regras de permissão.
3. Frontend: criar componentes, serviços e rotas.
4. Testar localmente (`frontend` + `backend` rodando).
5. E2E e screenshots para documentação (`npm run capture:flow`).
6. Abrir PR com checklist:
   - [ ] Endpoints documentados (OpenAPI/Swagger)
   - [ ] Validações e mensagens de erro
   - [ ] Testes unitários/integração
   - [ ] Fluxo E2E atualizado

## Testes e Qualidade

- Backend: `pytest`, cobertura mínima 70% para módulos críticos.
- Frontend: `ng test` para unitários; Playwright para e2e.
- Integração: mock de serviços externos; semeadura de dados para cenários previsíveis.

## Deploy (Guia Básico)

- Backend: conteinerizar (Docker), usar `DATABASE_URL` via env; rodar migrações no início.
- Frontend: build e servir via CDN ou servidor de arquivos estáticos; configurar `environment.prod.ts`.
- CI/CD: pipeline com jobs de lint, test, build e deploy.

## Dicas

- Remover `demo/` no frontend em produção.
- Manter `docs/` atualizados com decisões de arquitetura (ADRs) e fluxos.
- Usar `.env` apenas em desenvolvimento; secrets via gerenciador seguro em produção.