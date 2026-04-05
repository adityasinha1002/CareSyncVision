# CareSyncVision Backend - Flask API Server

Production-grade Flask API server for patient health monitoring, medication tracking, and alert management.

## Architecture

```
backend/
├── app/
│   ├── __init__.py          # Flask application factory with database initialization
│   ├── config.py            # Configuration management
│   ├── middleware/          # Request/response middleware
│   │   └── validation.py    # Request validation
│   ├── routes/              # API endpoint blueprints
│   │   ├── health.py        # Health check endpoints
│   │   ├── patient.py       # Patient data endpoints
│   │   └── medication.py    # Medication management endpoints
│   ├── models/              # SQLAlchemy ORM models
│   │   ├── alert.py         
│   │   ├── health_record.py
│   │   ├── medication.py    
│   │   └── patient.py       
│   └── services/            # Business logic layer
│       ├── medication_service.py
│       └── patient_service.py
├── database/
│   ├── init_db.sql          # PostgreSQL schema initialization
│   └── models.py            # SQLAlchemy ORM definitions
├── uploads/                 # User-uploaded files (images from ESP32)
├── logs/                    # Application logs
├── .env                     # Environment variables (not in git)
├── .gitignore               # Git ignore rules
├── Dockerfile               # Docker container definition
├── requirements.txt         # Python dependencies
├── wsgi.py                  # WSGI entry point for Gunicorn
└── README.md                # This file
```

## Dependencies

- **Flask 3.1.3**: Web framework
- **Flask-SQLAlchemy 3.1.1**: ORM and database integration
- **Flask-CORS 4.0.0**: Cross-origin request handling
- **SQLAlchemy 2.0.25**: Object-relational mapping
- **psycopg2-binary 2.9.9**: PostgreSQL driver
- **Gunicorn 22.0.0**: WSGI production server
- **OpenCV 4.9.0.80**: Image processing for health analysis
- **Pillow 10.2.0**: Image library
- **NumPy 1.26.4**: Numerical computing
- **python-dotenv 1.0.1**: Environment variable loading

## Quick Start

### Local Development

1. **Create virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with local database URL: postgresql://user:password@localhost:5432/caresynvision
   ```

4. **Initialize database:**
   ```bash
   # Using PostgreSQL directly
   psql -U caresynvision -d caresynvision -f database/init_db.sql
   ```

5. **Run development server:**
   ```bash
   python -m flask run
   # Or with auto-reload:
   flask run --reload
   ```

   Server runs at `http://localhost:5000`

### Docker Deployment

1. **Build image:**
   ```bash
   docker build -t caresynvision-backend .
   ```

2. **Run container (with external PostgreSQL):**
   ```bash
   docker run -p 5000:5000 \
     -e DATABASE_URL=postgresql://user:password@db-host:5432/caresynvision \
     -e FLASK_SECRET_KEY=your-secret-key \
     -v $(pwd)/uploads:/app/uploads \
     caresynvision-backend
   ```

3. **Using docker-compose:**
   ```bash
   cd ..
   docker-compose -f docker-compose.new.yml up --build
   ```

## API Endpoints

### Health Check
- **GET** `/api/health` - Service health status

### Patient Management
- **POST** `/api/patient/health-data` - Submit health observation (image from ESP32-CAM)
- **POST** `/api/patient/vitals` - Log vital signs
- **GET** `/api/patient/<patient_id>` - Retrieve patient health summary
- **GET** `/api/patient/<patient_id>/history` - Get health history (last 7 days)

### Medication
- **POST** `/api/medication/log` - Log medication administration
- **GET** `/api/medication/<patient_id>` - Get medication schedule
- **GET** `/api/medication/<patient_id>/adherence` - Get adherence metrics

### Alerts
- **GET** `/api/alerts/<patient_id>` - Get patient alerts
- **POST** `/api/alerts/<patient_id>/resolve` - Resolve an alert

## Configuration

All configuration is managed through environment variables in `.env`:

```env
# Flask
FLASK_ENV=production
FLASK_SECRET_KEY=your-secret-key
DEBUG=False

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/caresynvision
SQLALCHEMY_TRACK_MODIFICATIONS=False

# File Upload
UPLOAD_FOLDER=/app/uploads
MAX_UPLOAD_SIZE=52428800

# Health Thresholds
ACTIVITY_THRESHOLD=30
SLEEP_QUALITY_THRESHOLD=6
RISK_SCORE_THRESHOLD=70
```

## Database Models

### Patient
```python
id: UUID (Primary Key)
name: String
age: Integer
medical_history: Text
created_at: DateTime
updated_at: DateTime
```

### HealthRecord
```python
id: UUID (Primary Key)
patient_id: UUID (Foreign Key → Patient)
activity_level: Integer (0-100)
sleep_quality: Integer (0-10)
behavioral_notes: Text
risk_score: Integer (0-100)
timestamp: DateTime
```

### Medication
```python
id: UUID (Primary Key)
patient_id: UUID (Foreign Key → Patient)
medication_name: String
dosage: String
frequency: String
schedule_time: Time
last_taken: DateTime
adherence_status: String (taken/pending/missed)
```

### Alert
```python
id: UUID (Primary Key)
patient_id: UUID (Foreign Key → Patient)
severity: String (high/medium/low)
alert_type: String
message: Text
created_at: DateTime
resolved_at: DateTime (nullable)
```

## Error Handling

All API responses follow a standard format:

**Success Response (200):**
```json
{
  "status": "success",
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error Response (400/500):**
```json
{
  "status": "error",
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Logging

Application logs are written to:
- **Console**: All log levels during development
- **File**: `logs/caresynvision.log` in production
- **Log Level**: Configurable via `LOG_LEVEL` env var (INFO, DEBUG, WARNING, ERROR)

## Health Checks

Docker health check monitors:
- HTTP GET `/api/health` endpoint
- Interval: 30 seconds
- Timeout: 10 seconds
- Retries: 3

## Security

- **CORS**: Enabled for frontend (configurable allowed origins)
- **HTTPS**: Configure reverse proxy (Nginx/HAProxy) in production
- **Secret Key**: Must be strong and unique - generate with: `openssl rand -hex 32`
- **Database**: Use strong credentials, enable SSL for remote databases
- **File Upload**: Size limits enforced (default 50MB)

## Troubleshooting

### Database Connection Issues
```
Error: could not translate host name "postgres" to address
→ Ensure PostgreSQL container is running and using correct hostname
```

### Module Import Errors
```
ModuleNotFoundError: No module named 'app'
→ Run from /backend directory: python -m flask run
→ Or add PYTHONPATH: export PYTHONPATH=/app
```

### Port Already in Use
```
OSError: [Errno 48] Address already in use
→ Kill process: lsof -ti:5000 | xargs kill -9
→ Or use different port: flask run --port 5001
```

## Development

### Running Tests
```bash
pytest
```

### Code Formatting
```bash
black .
flake8
```

### Database Migrations (Future)
```bash
flask db init
flask db migrate
flask db upgrade
```

## Production Deployment

1. **Use strong SECRET_KEY:**
   ```bash
   export FLASK_SECRET_KEY=$(openssl rand -hex 32)
   ```

2. **Set production database:**
   ```bash
   export DATABASE_URL=postgresql://user:strong-password@prod-db.example.com:5432/caresynvision
   ```

3. **Use reverse proxy (Nginx):**
   - Terminate HTTPS/TLS
   - Load balancing
   - Static file serving
   - Request filtering

4. **Monitor application:**
   - Application errors: Check `logs/` directory
   - Database performance: Monitor slow queries
   - Memory usage: Gunicorn workers × request concurrency

5. **Backup database:**
   ```bash
   pg_dump -U caresynvision caresynvision > backup_$(date +%Y%m%d).sql
   ```

## Contributing

- Follow PEP 8 style guide
- Add docstrings to all functions
- Write tests for new features
- Update this README for API changes

## License

Proprietary - CareSyncVision
