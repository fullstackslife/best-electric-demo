FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY index.html /usr/share/caddy/index.html
COPY truck-hero.jpg truck-pano.jpg bolt-logo.jpg now-hiring.png work-panels.jpg work-agriculture.jpg work-meters.jpg work-meter-install.jpg work-bucket-truck.jpg work-crew.jpg work-kitchen.jpg /usr/share/caddy/
