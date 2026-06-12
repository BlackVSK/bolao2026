#!/bin/sh
set -e

echo "Aguardando banco de dados..."
until python -c "
import psycopg2, os
try:
    import dj_database_url, urllib.parse
    url = os.environ.get('DATABASE_URL')
    if url:
        r = urllib.parse.urlparse(url)
        psycopg2.connect(dbname=r.path[1:], user=r.username, password=r.password, host=r.hostname, port=r.port or 5432)
    else:
        psycopg2.connect(
            dbname=os.environ.get('DB_NAME', 'bolao'),
            user=os.environ.get('DB_USER', 'bolao'),
            password=os.environ.get('DB_PASSWORD', 'bolao'),
            host=os.environ.get('DB_HOST', 'db'),
            port=int(os.environ.get('DB_PORT', 5432)),
        )
except Exception as e:
    raise SystemExit(1)
" 2>/dev/null; do
  echo "Banco não disponível, aguardando..."
  sleep 1
done

echo "Banco disponível."

echo "Aplicando migrations..."
python manage.py migrate --no-input

echo "Coletando arquivos estáticos..."
python manage.py collectstatic --no-input

echo "Iniciando servidor..."
exec "$@"
