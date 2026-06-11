#!/bin/sh
set -e

echo "Aguardando banco de dados..."
until python -c "
import psycopg2, os
psycopg2.connect(
    dbname=os.environ.get('DB_NAME', 'bolao'),
    user=os.environ.get('DB_USER', 'bolao'),
    password=os.environ.get('DB_PASSWORD', 'bolao'),
    host=os.environ.get('DB_HOST', 'db'),
    port=os.environ.get('DB_PORT', '5432'),
)
" 2>/dev/null; do
  echo "Banco não disponível, aguardando..."
  sleep 1
done

echo "Banco disponível."

echo "Gerando migrations..."
python manage.py makemigrations users matches predictions --no-input

echo "Aplicando migrations..."
python manage.py migrate --no-input

echo "Iniciando servidor..."
exec "$@"
