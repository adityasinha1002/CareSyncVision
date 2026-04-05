# SSL/TLS Certificates Directory

**⚠️ IMPORTANT: This directory contains placeholder SSL certificates for development only.**

## Development Setup

The self-signed certificates included are for **local development and testing only**:
- `cert.pem` - SSL certificate (development only)
- `key.pem` - Private key (development only)

These will generate browser warnings. They are suitable only for:
- Local testing with `localhost`
- Development Docker environments
- CI/CD pipelines

## Production Deployment

For production, you **MUST** replace these with real certificates:

### Option 1: Let's Encrypt (Free, Recommended)
```bash
# Using Certbot with NGINX
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# Certificates will be at:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### Option 2: Commercial CA
- DigiCert
- Comodo/Sectigo
- GlobalSign
- Others via your hosting provider

### Option 3: Self-Generate (Enterprise)
```bash
# Generate private key
openssl genrsa -out key.pem 2048

# Generate certificate signing request
openssl req -new -key key.pem -out cert.csr

# Self-sign certificate
openssl x509 -req -days 365 -in cert.csr -signkey key.pem -out cert.pem

# Remove CSR
rm cert.csr
```

## Using Real Certificates with Docker

1. **Place certificates in this directory:**
   ```
   certs/
   ├── cert.pem (or fullchain.pem from Let's Encrypt)
   └── key.pem  (or privkey.pem from Let's Encrypt)
   ```

2. **Update nginx.conf paths if needed** for Let's Encrypt:
   ```nginx
   ssl_certificate /etc/nginx/certs/fullchain.pem;
   ssl_certificate_key /etc/nginx/certs/privkey.pem;
   ```

3. **Update docker-compose:**
   ```yaml
   volumes:
     - ./certs/cert.pem:/etc/nginx/certs/cert.pem:ro
     - ./certs/key.pem:/etc/nginx/certs/key.pem:ro
   ```

## Certificate Renewal

For Let's Encrypt, set up automatic renewal:

```bash
# Test renewal
sudo certbot renew --dry-run

# Auto-renewal (typically runs via cron)
sudo systemctl enable certbot.timer
```

## Security Best Practices

- [ ] Never commit real private keys to Git
- [ ] Rotate certificates annually
- [ ] Monitor certificate expiration dates
- [ ] Use strong key sizes (2048-bit RSA minimum, 4096 recommended)
- [ ] Enable HSTS in nginx.conf (already configured)
- [ ] Pin certificates in mobile apps if applicable
- [ ] Use certificate monitoring services

## Verification

```bash
# Check certificate validity
openssl x509 -in cert.pem -text -noout

# Check private key
openssl rsa -in key.pem -check

# Test HTTPS connection
curl -I https://localhost --cacert cert.pem

# For real certificates:
curl -I https://yourdomain.com
```

---

**Remember:** Proper SSL/TLS certificates are critical for security. Always use real certificates in production.
