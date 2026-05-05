release: flask db upgrade && python init_db.py
web: gunicorn --bind 0.0.0.0:${PORT:-5000} --workers 1 --worker-class sync --timeout 120 --access-logfile - --error-logfile - main:app
