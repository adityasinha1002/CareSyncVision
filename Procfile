release: flask db upgrade && python init_db.py
web: gunicorn --config gunicorn_config.py main:app
