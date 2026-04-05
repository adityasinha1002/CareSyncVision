FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy SSL certificates
COPY certs/cert.pem /etc/nginx/certs/cert.pem
COPY certs/key.pem /etc/nginx/certs/key.pem

# Create certs directory
RUN mkdir -p /etc/nginx/certs

# Expose both HTTP and HTTPS ports
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider https://localhost/api/health || exit 1

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]
