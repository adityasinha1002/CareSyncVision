# Backend Database Directory

This directory contains database models, migrations, and initialization scripts.

## Files

- `models.py` - SQLAlchemy ORM models (Patient, HealthRecord, Medication, Session, Alert)
- `init_db.sql` - PostgreSQL schema initialization script
- `migrations/` - Database migration scripts

## Database Setup

### Option 1: Using SQLAlchemy (Python)

```python
from database.models import init_db

# Initialize database
engine = init_db('postgresql://user:password@localhost/caresynvision')
```

### Option 2: Using SQL Script (PostgreSQL)

```bash
psql -U postgres -h localhost < database/init_db.sql
```

### Option 3: Using Docker Compose

The `docker-compose.yml` in the root directory includes PostgreSQL setup:

```bash
docker-compose up postgres
```

## Database Connection String

```
postgresql://username:password@host:port/database_name

Example:
postgresql://caresynvision:securepassword@localhost:5432/caresynvision
```

## Tables

- `patients` - Patient information
- `health_records` - Health monitoring data
- `medications` - Medication schedules and administration
- `sessions` - Authentication sessions
- `alerts` - System alerts and notifications
- `caregivers` - Caregiver accounts
- `caregiver_patients` - Caregiver-Patient relationships

## Indexes

Optimized indexes on:
- `patient_id` (for frequent lookups)
- `timestamp` (for time-series queries)
- `severity` and `acknowledged` (for alert filtering)
- `administered` (for medication adherence)

## Backup & Recovery

```bash
# Backup database
pg_dump caresynvision > backup.sql

# Restore database
psql caresynvision < backup.sql
```
