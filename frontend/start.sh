#!/bin/sh
cat > /etc/nginx/conf.d/default.conf << EOF
server {
    listen ${PORT:-80};
    location / {
        root /usr/share/nginx/html;
        try_files \$uri \$uri/ /index.html;
    }
    location /api {
        proxy_pass http://caresyncvision.railway.internal:8080;
    }
}
EOF
nginx -g "daemon off;"