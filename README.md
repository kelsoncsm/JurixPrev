# Template de Organização (Angular + FastAPI)

Este repositório segue um modelo de organização para projetos com frontend em Angular e backend em FastAPI.

## Documentação Principal

- Consulte `docs/template-organizacao-projeto.md` para:
  - Estrutura de pastas (front/back)
  - Convenções de código e nomenclatura
  - Scripts de desenvolvimento e testes
  - Fluxo de trabalho recomendado e checklist

## Desenvolvimento

- Backend: `uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`
- Frontend: `npm start` dentro de `frontend/`
- Capturas do fluxo (e2e): `npm run capture:flow` dentro de `frontend/` (gera imagens em `frontend/e2e/screenshots/`)

## Próximos Passos

- Ajuste o `environment.ts` no frontend para apontar para seu backend (`environment.apiUrl`).
- Configure variáveis `.env` no backend (`DATABASE_URL`, `JWT_SECRET`, etc.).
- Remova conteúdos de demonstração em `frontend/src/app/demo/` quando avançar para produção.