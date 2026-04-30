#!/bin/sh
cat > /etc/nginx/conf.d/default.conf << EOF
server {
    listen ${PORT:-80};
    location / {
        root /usr/share/nginx/html;
        try_files \$uri \$uri/ /index.html;
    }
    location /api {
        proxy_pass http://CareSyncVision.railway.internal:5000;
    }
}
EOF
nginx -g "daemon off;"