# Quick Start Guide - CareSyncVision

Get the complete CareSyncVision system running in minutes.

## Option 1: Docker Compose (Recommended)

### Prerequisites
- Docker Desktop installed (Mac/Windows) or Docker Engine (Linux)
- Docker Compose (included with Docker Desktop)
- ~10 minutes
- ~2GB disk space for images

### Start the System

```bash
# 1. Navigate to project root
cd CareSyncVision

# 2. Build and start all services
docker-compose -f docker-compose.new.yml up --build

# 3. Wait for all services to be healthy (look for "healthy" status)
# This takes about 1-2 minutes on first run
```

### Access the Application

Once all services show "healthy":

- **Frontend (Dashboard)**: http://localhost:3000
- **Backend API**: http://localhost:5000/api/health
- **Database**: localhost:5432 (PostgreSQL)

### Check Service Status

```bash
# In another terminal
docker-compose -f docker-compose.new.yml ps

# View logs
docker-compose -f docker-compose.new.yml logs -f backend
docker-compose -f docker-compose.new.yml logs -f frontend
```

### Stop the System

```bash
# Stop with Ctrl+C, then:
docker-compose -f docker-compose.new.yml down
```

### Clean Up & Reset

```bash
# Remove containers and volumes (resets database)
docker-compose -f docker-compose.new.yml down -v

# Remove unused images
docker image prune -a
```

---

## Option 2: Local Development (Advanced)

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15 (installed or running in Docker)
- ~20 minutes setup

### Step 1: Set Up PostgreSQL

**Option A - Docker:**
```bash
docker run -d \
  --name caresynvision-db \
  -e POSTGRES_USER=caresynvision \
  -e POSTGRES_PASSWORD=caresynvision \
  -e POSTGRES_DB=caresynvision \
  -p 5432:5432 \
  postgres:15-alpine
```

**Option B - Homebrew (macOS):**
```bash
brew install postgresql
createdb caresynvision
# Edit postgres user password if needed
```

### Step 2: Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env - set DATABASE_URL to your PostgreSQL connection
# export DATABASE_URL=postgresql://caresynvision:caresynvision@localhost:5432/caresynvision

# Initialize database
python -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all(); print('Database initialized')"

# Start backend server
python -m flask run
```

Backend now runs at: http://localhost:5000

Keep the terminal running, open a new terminal for frontend.

### Step 3: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev
```

Frontend now runs at: http://localhost:3000

### Step 4: Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/health
- Database: localhost:5432

---

## Testing the System

### 1. Health Check

```bash
# Backend health
curl http://localhost:5000/api/health

# Expected response:
# {"status": "healthy", "timestamp": "...", "service": "CareSyncVision AI Server"}
```

### 2. Create a Test Patient

```bash
curl -X POST http://localhost:5000/api/patient \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "age": 72,
    "medical_history": "Hypertension, Diabetes Type 2"
  }'
```

### 3. Access Frontend

Open http://localhost:3000
- Login page should appear
- (Auth implementation pending - use dummy credentials for now)

### 4. Check Database

```bash
# Connect to PostgreSQL
psql -U caresynvision -d caresynvision -h localhost

# View tables
\dt

# View patients
SELECT * FROM patients;
```

---

## Troubleshooting

### Docker Issues

**Container won't start:**
```bash
# Check logs
docker-compose -f docker-compose.new.yml logs backend

# Rebuild
docker-compose -f docker-compose.new.yml down
docker-compose -f docker-compose.new.yml up --build
```

**Port already in use:**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 5432
lsof -ti:5432 | xargs kill -9
```

**Unable to connect to database:**
```bash
# Check if postgres container is running
docker ps

# Check postgres logs
docker logs caresynvision-db

# Verify connection string in .env
# Should be: postgresql://caresynvision:caresynvision@postgres:5432/caresynvision
# Note: 'postgres' is the Docker container name
```

### Local Development Issues

**ModuleNotFoundError: No module named 'flask':**
```bash
# Activate virtual environment
source venv/bin/activate

# Install dependencies again
pip install -r requirements.txt
```

**psycopg2 installation fails:**
```bash
# Install system dependencies (macOS)
brew install postgresql

# Try again
pip install -r requirements.txt
```

**npm install fails:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules
rm -rf node_modules

# Reinstall
npm install
```

**Frontend can't connect to backend:**
```bash
# Check VITE_API_URL in frontend/.env
# Should be: http://localhost:5000/api

# Check backend is running
curl http://localhost:5000/api/health

# Check CORS is enabled (should see in response headers)
```

---

## File Structure Overview

```
CareSyncVision/
├── backend/                    # Flask API server
│   ├── app/                   # Application package
│   ├── database/              # Database schema
│   ├── uploads/               # ESP32 image uploads
│   ├── Dockerfile             # Backend container
│   ├── requirements.txt        # Python dependencies
│   └── .env                   # Environment (create from .env.example)
│
├── frontend/                   # React dashboard
│   ├── src/                   # Source code
│   ├── public/                # Static files
│   ├── Dockerfile             # Frontend container
│   ├── package.json           # Node dependencies
│   └── .env                   # Environment (create from .env.example)
│
├── ESP32_CAM/                 # Embedded firmware
│   ├── src/main.cpp
│   ├── include/esp32_config.h # WiFi ConfigManager
│   └── platformio.ini
│
├── docker-compose.new.yml     # Multi-service orchestration
├── IMPLEMENTATION_SUMMARY.md  # Comprehensive architecture guide
└── README.md                  # Project overview
```

---

## Common Commands

### Docker Compose

```bash
# Build images
docker-compose -f docker-compose.new.yml build

# Start services
docker-compose -f docker-compose.new.yml up

# Start in background
docker-compose -f docker-compose.new.yml up -d

# View logs
docker-compose -f docker-compose.new.yml logs -f

# Stop services
docker-compose -f docker-compose.new.yml stop

# Stop and remove
docker-compose -f docker-compose.new.yml down

# Restart services
docker-compose -f docker-compose.new.yml restart

# Execute command in container
docker-compose -f docker-compose.new.yml exec backend bash
```

### Backend

```bash
# Activate virtual environment
source backend/venv/bin/activate

# Run Flask development server
python -m flask run --reload

# Run with custom port
python -m flask run --port 5001

# Run tests
pytest

# Format code
black .

# Lint code
flake8
```

### Frontend

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Format code
npm run format
```

---

## Next Steps

1. **Backend Testing:**
   ```bash
   # Test all API endpoints
   curl http://localhost:5000/api/health
   curl http://localhost:5000/api/patient/list
   ```

2. **Frontend Testing:**
   - Open http://localhost:3000 in browser
   - Navigate to dashboard
   - Check browser console for errors

3. **Database Testing:**
   ```bash
   psql -U caresynvision -d caresynvision
   SELECT COUNT(*) FROM patients;
   ```

4. **Deployment Testing:**
   - Test docker-compose setup in different directory
   - Verify health checks pass
   - Check logs for errors

5. **ESP32 Configuration:**
   - Flash ESP32_CAM with updated firmware (coming next)
   - Configure WiFi via serial provisioning:
     ```
     CONFIG:{"ssid":"Your-Network","password":"password","server":"http://192.168.1.x:5000"}
     ```

---

## Environment Variables

### Backend (.env)

```env
FLASK_ENV=production
FLASK_SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://caresynvision:caresynvision@localhost:5432/caresynvision
UPLOAD_FOLDER=/app/uploads
MAX_UPLOAD_SIZE=52428800
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=CareSyncVision
VITE_ENV=development
```

---

## Support & Issues

If you encounter issues:

1. **Check logs:** `docker-compose -f docker-compose.new.yml logs backend`
2. **Verify connectivity:** `curl http://localhost:5000/api/health`
3. **Reset database:** `docker-compose -f docker-compose.new.yml down -v && docker-compose -f docker-compose.new.yml up --build`
4. **Check documentation:** See `IMPLEMENTATION_SUMMARY.md` for detailed architecture
5. **Review README files:** Each component has a detailed README

---

## Performance Tips

- Use `docker-compose up -d` to run in background
- Frontend caching is handled by Nginx
- Backend has 4 Gunicorn workers (adjust if needed)
- Database queries are indexed for speed
- Redis cache available for future optimization

---

**You're all set! Your CareSyncVision system is ready to monitor patients. 🚀**

For detailed documentation, see `IMPLEMENTATION_SUMMARY.md`
