# CORTE CERTO

Web app para barbearias com painel administrativo e backend (frontend + backend em Node.js).

## Estrutura

1. API / Backend (`backend`) - Node.js + Express + PostgreSQL
2. Painel Admin (`frontend`) - React + Vite + TailwindCSS

## Deploy no Railway

O repositorio foi preparado para deploy pelo root no Railway.

- Build command: `npm run build`
- Start command: `npm start`
- Node: `20.x` via `.nvmrc`
- Healthcheck: `/health`

Arquivo de exemplo para deploy:

- `.env.railway.app.example`: servico principal no Railway

### Checklist de deploy

1. Crie um servico no Railway apontando para a raiz do repositorio.
2. Configure as variaveis com base em `.env.railway.app.example`.
3. Em `DATABASE_URL`, use a URI real de `Connection Pooling` do Supabase.
4. Nao use `db.<projeto>.supabase.co` no Railway.
5. Defina `API_URL` com `https://`.
6. Faca o deploy.
7. Verifique `https://seu-app.up.railway.app/health`.

### Variaveis recomendadas no Railway

- `PORT`: definido automaticamente pelo Railway
- `DATABASE_URL`: URI do pooler do Supabase
- `DATABASE_SSL`: `true`
- `DATABASE_POOL_MAX`: `10`
- `DATABASE_CONNECTION_TIMEOUT_MS`: `15000`
- `DATABASE_IDLE_TIMEOUT_MS`: `30000`
- `AUTH_TOKEN_SECRET`: segredo forte usado para assinar as sessoes de login
- `AUTH_TOKEN_TTL_DAYS`: duracao da sessao do painel, ex. `30`
- `SERVICE_AUTH_TOKEN`: token tecnico para integracoes
- `BARBEARIA_ID`: identificador da barbearia, ex. `default`
- `BARBEARIA_NOME`: nome exibido no sistema
- `API_URL`: URL publica da aplicacao, ex. `https://seu-app.railway.app`
- `ADMIN_PASS`: senha do login admin local (senha master)

### Observacoes de deploy

- O frontend e compilado no build e servido pelo backend em producao.
- O frontend usa a mesma origem da aplicacao por padrao, entao `VITE_API_URL` pode ficar vazio.
- O backend aplica o schema automaticamente ao iniciar.
- O backend valida as variaveis criticas e falha cedo com mensagens mais claras de configuracao.

## Deploy na Hostinger (Node.js web app)

Este projeto e um app Node.js (Express) que serve frontend + backend. Para publicar na Hostinger:

1. Em **Websites → Add Website**, escolha **Node.js web app** (nao o deploy estatico de Git).
2. Selecione **Import Git repository** e conecte o repositorio do GitHub.
3. Deixe o hPanel detectar o framework (Express) e confira:
   - **Entry file**: `backend/src/server.js`
   - **Node version**: 20.x
   - **Build command**: `npm run build`
   - **Output directory**: vazio (app server-side; o backend serve o frontend de `frontend/dist`)
4. Adicione as **variaveis de ambiente** no painel (ex.: `ADMIN_PASS`, `BARBEARIA_ID`, `API_URL`, e `DATABASE_URL` se usar banco).
5. **Deploy** e acesse o dominio.

> A API e o painel sao servidos pelo mesmo processo Node na mesma porta.

## Backend

- Tecnologias: Node.js + Express + PostgreSQL
- Compativel com Supabase Postgres via `DATABASE_URL`
- Autenticacao SaaS com cadastro por e-mail/senha salvo no banco
- Multi-tenant por `barbearia_id` nas rotas administrativas
- Login de admin local via `ADMIN_PASS` (senha master) independente do banco
- Endpoints principais:
  - `GET /health`
  - `POST /auth/register`
  - `POST /auth/login`
  - `GET /auth/me`
  - `GET /horarios-disponiveis?data=YYYY-MM-DD`
  - `POST /agendar`
  - `GET /agendamentos`
  - `DELETE /agendamento/:id`
  - `PUT /agendamento/:id`
  - `POST /horarios`
  - `GET /relatorios/resumo`

### Login de admin local (senha master)

Quando `ADMIN_PASS` estiver definido (ex.: `backend/.env`), o painel aceita um login local
sem precisar de usuario cadastrado no banco. Isso e util no modo `MOCK_DB` ou para acesso
rapido do proprietario.

- E-mail: `ADMIN_EMAIL` (padrao `admin@cortecerto.local`)
- Senha: `ADMIN_PASS`
- O login local emite uma sessao com cargo `owner` isolada na `barbearia_id` da aplicacao.
- Se o e-mail/senha tambem baterem com um usuario cadastrado no banco, o login do banco tem prioridade.

Para usar com Supabase localmente:

1. Preencha `backend/.env`.
2. Se estiver rodando localmente, a URI direta `db.<projeto>.supabase.co` pode ser usada.
3. No Railway, use a URI de `Connection Pooling`.
4. Rode `npm run db:apply-schema --workspace backend` se quiser aplicar manualmente.

Schema do banco:

- `backend/src/sql/schema.sql`
- Tabelas de SaaS:
  - `barbearias` com slug, plano e status da assinatura
  - `usuarios_painel` com e-mail unico e hash de senha

## Frontend

- React + TailwindCSS
- Telas: login, dashboard, agenda, horarios, servicos, caixa, clientes e configuracoes
- `VITE_API_URL` pode ficar vazio quando frontend e backend estao no mesmo servico
