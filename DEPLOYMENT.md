# DDP Calculator - Deployment Guide

## Overview

The DDP Calculator is a standalone React + Vite application for calculating China-Qatar shipping costs with complete DDP (Delivered Duty Paid) breakdown. It can be deployed as a containerized service using Docker and nginx.

## Table of Contents

- [Local Development](#local-development)
- [Building for Production](#building-for-production)
- [Docker Deployment](#docker-deployment)
- [Integration with Traefik](#integration-with-traefik)
- [Environment Configuration](#environment-configuration)
- [Troubleshooting](#troubleshooting)

---

## Local Development

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher

### Setup

1. **Install Dependencies**
   ```bash
   npm ci --legacy-peer-deps
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:8080`

3. **Available Pages**
   - Main Calculator: `http://localhost:8080/`
   - Quotation Builder: `http://localhost:8080/quotation.html`

### Development Scripts

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests (if available)
npm test
```

---

## Building for Production

### Vite Build Configuration

The project uses Vite with multi-page configuration defined in `vite.config.js`:

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    open: true
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        quotation: resolve(__dirname, 'quotation.html')
      }
    }
  }
});
```

### Build Output

```bash
npm run build
```

This generates:
- `dist/index.html` - Main calculator page
- `dist/quotation.html` - Quotation builder page
- `dist/assets/*` - Bundled JavaScript and CSS files
- `dist/public/*` - Static assets (fonts, images, PDFs)

**Build Output Structure:**
```
dist/
├── index.html
├── quotation.html
├── assets/
│   ├── index-[hash].js
│   ├── quotation-[hash].js
│   ├── index-[hash].css
│   └── ...
├── Roboto/
│   └── static/roboto/*.ttf
├── logo-standalone-web.png
├── footer.png
└── QATAR - LOCAL SCES 29-07.pdf
```

---

## Docker Deployment

### Dockerfile Structure

The project uses a **multi-stage Docker build**:

**Stage 1: Builder (Node.js)**
- Base: `node:20-alpine`
- Installs dependencies
- Runs production build

**Stage 2: Runtime (Nginx)**
- Base: `nginx:alpine`
- Copies built files from builder
- Serves static content

### Building Docker Image

```bash
docker build -t ddp-calculator:latest .
```

### Running Docker Container

**Standalone:**
```bash
docker run -d \
  --name ddp-calculator \
  -p 8080:80 \
  ddp-calculator:latest
```

Access at `http://localhost:8080`

### Docker Compose

**Minimal docker-compose.yml:**
```yaml
services:
  ddp-calculator:
    build:
      context: .
      dockerfile: Dockerfile
    image: ddp-calculator:latest
    container_name: ddp-calculator
    restart: unless-stopped
    ports:
      - "8080:80"
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
```

Start the service:
```bash
docker compose up -d
```

---

## Integration with Traefik

### Traefik Labels for Docker Compose

When integrating with Traefik reverse proxy:

```yaml
services:
  ddp-calculator:
    build:
      context: .
      dockerfile: Dockerfile
    image: ddp-calculator:latest
    container_name: ddp-calculator
    restart: unless-stopped
    networks:
      - traefik-network
    labels:
      # Enable Traefik
      - "traefik.enable=true"
      - "traefik.docker.network=traefik-network"

      # Route with path prefix
      - "traefik.http.routers.ddp-calculator.rule=Host(`example.com`) && PathPrefix(`/ddp-calculator`)"
      - "traefik.http.routers.ddp-calculator.entrypoints=websecure"
      - "traefik.http.routers.ddp-calculator.service=ddp-calculator"
      - "traefik.http.routers.ddp-calculator.priority=200"
      - "traefik.http.routers.ddp-calculator.tls=true"

      # Strip path prefix before forwarding to container
      - "traefik.http.routers.ddp-calculator.middlewares=ddp-calculator-stripprefix"
      - "traefik.http.middlewares.ddp-calculator-stripprefix.stripprefix.prefixes=/ddp-calculator"

      # Service definition
      - "traefik.http.services.ddp-calculator.loadbalancer.server.port=80"
      - "traefik.http.services.ddp-calculator.loadbalancer.healthcheck.path=/health"
      - "traefik.http.services.ddp-calculator.loadbalancer.healthcheck.interval=30s"

networks:
  traefik-network:
    external: true
```

### Access URLs

With the above configuration:
- Calculator: `https://example.com/ddp-calculator/`
- Quotation: `https://example.com/ddp-calculator/quotation.html`

**Important:** The StripPrefix middleware removes `/ddp-calculator` before forwarding to nginx, so the container serves `/` and `/quotation.html`.

---

## Environment Configuration

### Nginx Configuration

The `nginx.conf` file configures static file serving:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/javascript application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Serve HTML files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### Key Configuration Points

1. **Compression:** Gzip enabled for text-based assets
2. **Caching:** Static assets cached for 1 year
3. **Health Check:** `/health` endpoint for container monitoring
4. **SPA Routing:** Falls back to `index.html` for client-side routing

---

## Troubleshooting

### Issue: Assets Not Loading (404 errors)

**Symptoms:** JavaScript/CSS files return 404

**Solution:**
1. Check build output: `ls -la dist/assets/`
2. Verify nginx is serving from correct directory
3. Check browser console for asset paths
4. Ensure StripPrefix middleware is configured in Traefik

### Issue: Quotation Page Blank/Not Loading

**Symptoms:** Quotation page opens but stays blank

**Possible Causes:**
1. **Absolute paths in navigation** - Use relative paths
   ```javascript
   // WRONG
   window.open('/quotation.html', '_blank');

   // CORRECT
   window.open('quotation.html', '_blank');
   ```

2. **SessionStorage not accessible** - Check browser console for errors

3. **CORS issues** - Ensure both pages served from same origin

### Issue: Container Health Check Failing

**Symptoms:** Container constantly restarting

**Solution:**
1. Check nginx is running: `docker exec <container> ps aux | grep nginx`
2. Test health endpoint: `docker exec <container> wget -qO- http://localhost/health`
3. Check nginx logs: `docker logs <container>`
4. Verify port 80 is listening: `docker exec <container> netstat -tlpn`

### Issue: Traefik Not Routing Correctly

**Symptoms:** 404 or 502 errors from Traefik

**Solution:**
1. Check Traefik dashboard for router configuration
2. Verify container is on correct Docker network
3. Check priority values (higher = takes precedence)
4. Ensure service name matches in labels
5. Verify StripPrefix middleware is applied

### Issue: Build Fails with Memory Error

**Symptoms:** `JavaScript heap out of memory`

**Solution:**
Increase Node.js memory:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

Or in Dockerfile:
```dockerfile
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

---

## Production Checklist

Before deploying to production:

- [ ] Run production build locally: `npm run build`
- [ ] Test build output: `npm run preview`
- [ ] Build Docker image: `docker build -t ddp-calculator .`
- [ ] Test container locally: `docker run -p 8080:80 ddp-calculator`
- [ ] Verify both pages work:
  - [ ] Main calculator loads
  - [ ] Quotation page loads
  - [ ] Navigation between pages works
  - [ ] PDF generation works
  - [ ] Import/Export functionality works
- [ ] Configure Traefik labels correctly
- [ ] Set up health checks
- [ ] Configure proper logging
- [ ] Test under load (optional)
- [ ] Set up monitoring/alerts

---

## Additional Resources

- **Vite Documentation:** https://vitejs.dev/
- **React Documentation:** https://react.dev/
- **Nginx Documentation:** https://nginx.org/en/docs/
- **Traefik Documentation:** https://doc.traefik.io/traefik/
- **Docker Best Practices:** https://docs.docker.com/develop/dev-best-practices/

---

## Support

For issues specific to this calculator:
- Check logs: `docker logs ddp-calculator`
- Review nginx config: `docker exec ddp-calculator cat /etc/nginx/conf.d/default.conf`
- Inspect built files: `docker exec ddp-calculator ls -la /usr/share/nginx/html/`

For integration issues with Arabian Trade Route:
- See parent project documentation
- Check Traefik logs: `docker logs traefik`
- Verify network connectivity: `docker network inspect <network-name>`
