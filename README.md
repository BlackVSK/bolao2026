# Bolão Copa do Mundo 2026

Aplicação de bolão para a Copa do Mundo 2026. Participantes fazem palpites nos resultados dos jogos e acumulam pontos conforme a precisão dos chutes.

---

## Regras de pontuação

| Resultado | Pontos |
|-----------|--------|
| Acerto exato do placar | 3 pontos |
| Acerto do vencedor (ou empate) | 1 ponto |
| Erro total | 0 pontos |

- O palpite deve ser feito **antes do horário do jogo** (configurado por jogo)
- É permitido **alterar o palpite** a qualquer momento até o horário limite
- Após o horário do jogo, o palpite é bloqueado automaticamente

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Backend | Django 4.2 + Django REST Framework |
| Autenticação | JWT via `djangorestframework-simplejwt` |
| Banco de dados | PostgreSQL 15 |
| Frontend | React 18 + Vite + Tailwind CSS |
| Container (dev) | Docker + docker-compose |
| Deploy | Dokku (dois apps separados) |

---

## Estrutura do projeto

```
bolão/
├── docker-compose.yml          # Ambiente de desenvolvimento local
├── .gitignore
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── Procfile                # Comando de produção para Dokku
│   ├── entrypoint.sh           # Aguarda banco, roda migrations, inicia servidor
│   ├── requirements.txt
│   ├── manage.py
│   ├── .env                    # NÃO commitado — variáveis locais
│   ├── .env.example            # Template de variáveis necessárias
│   ├── app.json                # Metadados do app para plataformas de deploy
│   │
│   ├── core/
│   │   ├── settings.py         # Configurações Django
│   │   ├── urls.py             # Rotas raiz da API
│   │   └── wsgi.py
│   │
│   └── apps/
│       ├── users/              # Autenticação e gerenciamento de usuários
│       ├── matches/            # Partidas da copa
│       └── predictions/        # Palpites e cálculo de pontos
│
└── frontend/
    ├── Dockerfile
    ├── Procfile                # Comando de produção para Dokku
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── .env.example
    │
    └── src/
        ├── api/                # Funções de chamada à API (axios)
        ├── components/         # Layout, MatchCard, Modais
        ├── constants/          # Lista de 48 países com emoji de bandeira
        ├── context/            # AuthContext (JWT + estado do usuário)
        └── pages/
            ├── LoginPage.jsx
            ├── DashboardPage.jsx
            ├── RankingPage.jsx
            ├── AdminMatchesPage.jsx
            └── AdminUsersPage.jsx
```

---

## Modelos de dados

### User
```
id, username (único), password (hash), is_admin (bool)
```
Usuário admin tem `is_staff=True` e `is_superuser=True` automaticamente.

### Match
```
id, home_team, home_flag (emoji), away_team, away_flag (emoji),
match_datetime, home_score (null até fim), away_score (null até fim),
is_finished (bool)
```
Quando `is_finished` é salvo como `True`, um signal Django dispara e recalcula os pontos de todos os palpites daquele jogo.

### Prediction
```
id, user (FK), match (FK), home_score, away_score, points
unique_together: (user, match)
```

---

## API — Endpoints

### Autenticação
```
POST /api/auth/login    → { access, refresh, username, is_admin, user_id }
POST /api/auth/refresh  → { access }
```

### Usuários (apenas admin)
```
GET    /api/users        → lista todos os usuários
POST   /api/users        → cria usuário { username, password, is_admin }
GET    /api/users/{id}   → detalhe do usuário
PUT    /api/users/{id}   → edita usuário
DELETE /api/users/{id}   → remove usuário
```

### Partidas
```
GET    /api/matches       → lista todos os jogos (autenticado)
POST   /api/matches       → cria jogo (apenas admin)
GET    /api/matches/{id}  → detalhe (autenticado)
PUT    /api/matches/{id}  → edita jogo, insere resultado (apenas admin)
DELETE /api/matches/{id}  → remove jogo (apenas admin)
```

### Palpites
```
GET    /api/predictions              → palpites do usuário logado
POST   /api/predictions              → criar palpite (bloqueado após horário do jogo)
GET    /api/predictions/ranking      → ranking geral de todos os usuários
GET    /api/predictions/{id}         → detalhe do palpite
PUT    /api/predictions/{id}         → editar palpite (bloqueado após horário do jogo)
PATCH  /api/predictions/{id}         → edição parcial do palpite (bloqueado após horário do jogo)
DELETE /api/predictions/{id}         → remover palpite
```

### Painel admin Django
```
/painel-interno/   → acesso restrito ao superuser
```

---

## Desenvolvimento local

### Pré-requisitos
- Docker e docker-compose instalados

### 1. Subir os containers

```bash
docker-compose up --build
```

O `entrypoint.sh` do backend já:
1. Aguarda o banco estar disponível
2. Roda `makemigrations`
3. Roda `migrate`
4. Inicia o servidor

### 2. Criar o administrador

```bash
docker-compose exec backend python manage.py create_admin --username admin --password SuaSenha123
```

### 3. Acessar

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Admin Django | http://localhost:8000/painel-interno/ |

### Variáveis de ambiente (backend/.env)

Copie `backend/.env.example` para `backend/.env` e preencha:

```env
DEBUG=True
SECRET_KEY=gere-com-secrets.token_urlsafe(50)
ALLOWED_HOSTS=localhost,127.0.0.1,backend
DB_NAME=bolao
DB_USER=bolao
DB_PASSWORD=bolao
DB_HOST=db
DB_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

---

## Deploy no Dokku

O projeto é deployado como **dois apps independentes** no Dokku.

### Pré-requisitos no servidor

```bash
# Instalar plugin de Postgres
sudo dokku plugin:install https://github.com/dokku/dokku-postgres.git

# Instalar plugin de Let's Encrypt (SSL)
sudo dokku plugin:install https://github.com/dokku/dokku-letsencrypt.git
```

---

### Deploy do Backend

#### 1. Criar o app e o banco

```bash
# No servidor Dokku
dokku apps:create bolao-backend
dokku postgres:create bolao-db
dokku postgres:link bolao-db bolao-backend
```

#### 2. Configurar variáveis de ambiente

```bash
# Gere uma SECRET_KEY forte antes
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(50))")

dokku config:set bolao-backend \
  SECRET_KEY="$SECRET_KEY" \
  DEBUG=False \
  ALLOWED_HOSTS=bolao-backend.SEU-IP.nip.io \
  CORS_ALLOWED_ORIGINS=https://bolao-frontend.SEU-IP.nip.io \
  DJANGO_SETTINGS_MODULE=core.settings
```

> Quando você faz `postgres:link`, o Dokku injeta automaticamente a variável `DATABASE_URL`.
> O `settings.py` detecta essa variável e a usa diretamente — **não é necessário configurar as variáveis `DB_*` manualmente em produção**.
> As variáveis `DB_*` existem apenas como fallback para desenvolvimento local (via `backend/.env`).

#### 3. Deploy via git

Na sua máquina local, dentro da pasta `backend/`:

```bash
# Adicionar o remote do Dokku
git remote add dokku-backend dokku@SEU-IP:bolao-backend

# Deploy — enviar apenas a pasta backend
git subtree push --prefix backend dokku-backend main
```

#### 4. Rodar migrations e criar admin

```bash
dokku run bolao-backend python manage.py migrate
dokku run bolao-backend python manage.py create_admin --username admin --password SuaSenha123
```

#### 5. Configurar SSL (opcional mas recomendado)

```bash
dokku letsencrypt:set bolao-backend email seu@email.com
dokku letsencrypt:enable bolao-backend
```

---

### Deploy do Frontend

#### 1. Criar o app

```bash
# No servidor Dokku
dokku apps:create bolao-frontend
```

#### 2. Configurar a URL da API

No seu ambiente local, crie `frontend/.env` com:

```env
VITE_API_URL=https://bolao-backend.SEU-IP.nip.io
```

#### 3. Build e deploy

O frontend precisa ser buildado antes do deploy. O Procfile já configura o servidor estático com `serve`.

```bash
# Na sua máquina local, dentro de frontend/
npm install
npm run build
```

Na raiz do projeto:

```bash
git remote add dokku-frontend dokku@SEU-IP:bolao-frontend

git subtree push --prefix frontend dokku-frontend main
```

O Dokku vai detectar o `package.json`, rodar `npm install` e `npm run build` automaticamente, e usar o Procfile para servir os arquivos.

#### 4. SSL do frontend

```bash
dokku letsencrypt:set bolao-frontend email seu@email.com
dokku letsencrypt:enable bolao-frontend
```

---

### URLs finais após deploy

| Serviço | URL |
|---------|-----|
| Frontend | `https://bolao-frontend.SEU-IP.nip.io` |
| Backend API | `https://bolao-backend.SEU-IP.nip.io` |
| Admin Django | `https://bolao-backend.SEU-IP.nip.io/painel-interno/` |

Substitua `SEU-IP` pelo IP do seu servidor Dokku (ex: `45.67.89.10`).

---

## Como usar como administrador

### 1. Criar usuários para os participantes

Acesse `/admin/users` no frontend (logado como admin) e crie um usuário para cada participante com nome e senha.

### 2. Cadastrar os jogos

Acesse `/admin/matches` e cadastre cada jogo:
- Selecione os times nos dropdowns (com bandeiras emoji)
- Defina a data e horário exato do jogo
- Salve — o palpite ficará disponível para os participantes até esse horário

### 3. Inserir resultados

Após o término de cada jogo, volte em `/admin/matches`, edite o jogo:
- Preencha o placar final
- Marque "Finalizada" como verdadeiro

Os pontos de todos os participantes são calculados automaticamente.

### 4. Acompanhar o ranking

Qualquer participante pode ver o ranking em `/ranking` a qualquer momento.

---

## Segurança

- `SECRET_KEY` gerada com `secrets.token_urlsafe(50)` — nunca o valor padrão do Django
- `DEBUG=False` em produção — sem stack traces expostos
- Banco PostgreSQL **não exposto** externamente (apenas rede interna Docker/Dokku)
- Rate limiting: 20 req/min para anônimos, 200 req/min para autenticados
- Headers de segurança ativos em produção: HSTS, SSL redirect, X-Frame-Options DENY
- URL do admin Django ofuscada (`/painel-interno/`)
- `.env` no `.gitignore` — credenciais nunca commitadas

---

## Comandos úteis

```bash
# Ver logs do backend em produção
dokku logs bolao-backend -t

# Ver logs do frontend
dokku logs bolao-frontend -t

# Acessar shell do container em produção
dokku run bolao-backend bash

# Restartar um app
dokku ps:restart bolao-backend

# Ver variáveis de ambiente configuradas
dokku config bolao-backend
```
