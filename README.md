# ⚽ Bolão Copa do Mundo 2026

Aplicação de bolão para a Copa do Mundo FIFA 2026.

## Stack

- **Backend**: Django 4.2 + DRF + JWT
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Database**: PostgreSQL 15
- **Container**: Docker + Docker Compose

## Como rodar

### 1. Suba os containers

```bash
docker-compose up --build
```

### 2. Execute as migrações

```bash
docker-compose exec backend python manage.py migrate
```

### 3. Crie um usuário admin

```bash
docker-compose exec backend python manage.py create_admin --username admin --password senha123
```

### 4. Acesse

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api
- **Django Admin**: http://localhost:8000/django-admin/

## Endpoints da API

### Auth
- `POST /api/auth/login` — Login (retorna access + refresh tokens)
- `POST /api/auth/refresh` — Refresh do token

### Usuários (admin only)
- `GET  /api/users` — Lista usuários
- `POST /api/users` — Cria usuário
- `GET  /api/users/{id}` — Detalhe
- `PUT  /api/users/{id}` — Atualiza
- `DELETE /api/users/{id}` — Remove

### Partidas
- `GET  /api/matches` — Lista todas (autenticado)
- `POST /api/matches` — Cria (admin only)
- `GET  /api/matches/{id}` — Detalhe
- `PUT  /api/matches/{id}` — Atualiza (admin only)
- `DELETE /api/matches/{id}` — Remove (admin only)

### Palpites
- `GET  /api/predictions` — Palpites do usuário logado
- `POST /api/predictions` — Cria palpite (bloqueado após início da partida)
- `PUT  /api/predictions/{id}` — Atualiza (bloqueado após início da partida)
- `GET  /api/predictions/ranking` — Ranking geral

## Regras de Pontuação

| Resultado | Pontos |
|-----------|--------|
| Placar exato | 3 pts |
| Vencedor correto (ou empate) | 1 pt |
| Errou | 0 pts |

## Variáveis de ambiente

Copie `.env.example` para `.env` e ajuste conforme necessário:

```bash
cp backend/.env.example backend/.env
```

## Deploy (Dokku)

O arquivo `Procfile` já está configurado:

```
web: gunicorn core.wsgi --bind 0.0.0.0:$PORT
```
