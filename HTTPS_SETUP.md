# HTTPS Setup Documentation

## Overview
CareSyncVision is now configured to run with HTTPS (SSL/TLS) enabled for secure communication between frontend, backend, and database services.

## Architecture

```
HTTPS (Port 443)
    ↓
NGINX Reverse Proxy (with SSL/TLS)
    ├── /api/* → Backend (Flask on port 5000)
    └── /      → Frontend (React on port 80)

HTTP (Port 80) → Redirects to HTTPS (Port 443)
```

## SSL Certificates

The system uses self-signed SSL certificates generated for development/testing:

- **Certificate**: `certs/cert.pem`
- **Private Key**: `certs/key.pem`
- **Validity**: 365 days
- **Common Name**: localhost
- **Usage**: Self-signed for local development (not production)

### Generating New Certificates

To regenerate certificates:

```bash
cd certs/
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365 \
  -subj "/C=IN/ST=State/L=City/O=CareSync/CN=localhost"
```

## Service Configuration

### 1. NGINX Reverse Proxy
- **Listens**: Port 443 (HTTPS), Port 80 (HTTP redirect)
- **SSL/TLS**: Configured with security headers
- **Proxy targets**:
  - Backend API: `http://caresynvision-backend:5000`
  - Frontend: `http://caresynvision-frontend:80`
- **Configuration File**: `nginx.conf`

### 2. Backend (Flask)
- **Port**: 5000 (internal, not exposed)
- **Environment Variable**: `FLASK_APP=wsgi.py`
- **Entry Point**: `wsgi.py` (Gunicorn compatible)
- **Health Check**: `GET /api/health`

### 3. Frontend (React + Vite)
- **Port**: 80 (internal, not exposed)
- **Environment Variables**:
  - `VITE_API_URL=https://localhost/api`
  - Configured to make HTTPS requests to backend
- **Build**: Vite-based React application

### 4. Database (PostgreSQL)
- **Port**: 5432 (exposed only for database access, not through HTTPS)
- **Connection**: Internal network communication

## Accessing the System

### Using HTTPS (Recommended)
```bash
# Frontend
https://localhost/

# Backend API
https://localhost/api/health
```

### Browser Access
- **Frontend**: https://localhost/ (may show self-signed cert warning)
- **Note**: Accept the self-signed certificate warning to proceed

### curl Commands
```bash
# Test backend with self-signed cert
curl -k https://localhost/api/health

# Test frontend
curl -k https://localhost

# Test HTTP redirect
curl -i http://localhost  # Should redirect to HTTPS
```

## Security Features

1. **HTTPS/TLS 1.2+**: All HTTP traffic encrypted
2. **HTTP Redirect**: Automatic redirect from HTTP to HTTPS (301 Moved Permanently)
3. **Security Headers**:
   - `Strict-Transport-Security` (HSTS): Forces HTTPS for full year
   - `X-Frame-Options`: DENY (prevents clickjacking)
   - `X-Content-Type-Options`: nosniff (prevents MIME sniffing)
   - `X-XSS-Protection`: 1; mode=block (legacy XSS protection)

4. **SSL/TLS Configuration**:
   - Protocols: TLSv1.2, TLSv1.3
   - Ciphers: HIGH security level
   - Session caching enabled

## Frontend Configuration

The React frontend is configured to use HTTPS URLs:

### Environment Variables (.env)
```env
VITE_API_URL=https://localhost/api
VITE_APP_NAME=CareSyncVision
VITE_ENV=production
```

### API Service (src/services/api.js)
- Uses `VITE_API_URL` environment variable
- **Axios client** configured with HTTPS endpoints
- **Proxy configuration** in `vite.config.js` for development

## Development Workflow

### Local Development
The Vite proxy in `vite.config.js` is configured to accept self-signed certificates:
```javascript
proxy: {
  '/api': {
    target: 'https://localhost',
    rejectUnauthorized: false,  // Allow self-signed certs
  },
}
```

### Production Deployment
For production, replace self-signed certificates with valid certificates from a CA:
1. Obtain certificates from Let's Encrypt, Comodo, etc.
2. Update `cert.pem` and `key.pem` in `certs/` directory
3. Restart NGINX container

## Troubleshooting

### "Failed to fetch" in browser
**Cause**: Self-signed certificate not trusted
**Solution**: 
- Accept the self-signed certificate warning
- Or import certificate into browser/system trust store

### HTTPS connection refused
**Cause**: NGINX container not healthy
**Solution**:
```bash
# Check NGINX logs
docker logs caresynvision-nginx

# Restart NGINX
docker-compose -f docker-compose.new.yml restart nginx
```

### Certificate expired
**Cause**: Self-signed cert older than 365 days
**Solution**: Regenerate certificates (see section above)

### Mixed content warning
**Cause**: Page loading HTTP resources over HTTPS
**Solution**: Ensure all resource URLs use HTTPS or relative paths

## Docker Commands

```bash
# View all running services
docker-compose -f docker-compose.new.yml ps

# View logs
docker-compose -f docker-compose.new.yml logs -f nginx    # NGINX logs
docker-compose -f docker-compose.new.yml logs -f backend  # Backend logs
docker-compose -f docker-compose.new.yml logs -f frontend # Frontend logs

# Restart services
docker-compose -f docker-compose.new.yml restart nginx
docker-compose -f docker-compose.new.yml restart backend
```

## Files Modified/Created

1. **certs/cert.pem** - SSL Certificate
2. **certs/key.pem** - SSL Private Key
3. **nginx.conf** - NGINX configuration with SSL/TLS
4. **nginx.Dockerfile** - Docker image for NGINX
5. **docker-compose.new.yml** - Updated with NGINX service and HTTPS config
6. **frontend/.env** - Updated with HTTPS URLs
7. **frontend/vite.config.js** - Updated with HTTPS proxy

## Next Steps

1. ✅ Complete - HTTPS enabled for all services
2. ✅ Complete - Self-signed certificates configured
3. ⏳ **TODO** - Export REST API documentation
4. ⏳ **TODO** - Set up OAuth/JWT authentication
5. ⏳ **TODO** - Production certificate setup (Let's Encrypt)

## References

- NGINX SSL Configuration: https://nginx.org/en/docs/http/ngx_http_ssl_module.html
- Mozilla SSL Configuration Generator: https://ssl-config.mozilla.org/
- Self-signed Certificates: https://www.ssl.com/article/how-to-create-self-signed-certificates/
