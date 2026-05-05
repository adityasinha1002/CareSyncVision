#!/bin/sh
cat > /etc/nginx/conf.d/default.conf << EOF
server {
    listen ${PORT:-80};
    location / {
        root /usr/share/nginx/html;
        try_files \$uri \$uri/ /index.html;
    }
    location /api {
        proxy_pass http://caresyncvision.railway.internal:5000;
        proxy_http_version 1.1;
        proxy_set_header Host caresyncvision.railway.internal;  # internal Railway hostname required for service discovery
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
nginx -g "daemon off;"