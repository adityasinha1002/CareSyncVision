release: flask db upgrade && python init_db.py
web: gunicorn --bind 0.0.0.0:$PORT --workers 1 --worker-class sync --timeout 120 --access-logfile - --error-logfile - main:app
