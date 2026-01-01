# KGC ERP - Deployment & Infrastruktúra

**Diagram típus:** Deployment & Infrastructure
**Verzió:** 2.0
**Dátum:** 2025-12-20

---

## 1. Docker Compose Architektúra

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     HETZNER VPS DEDICATED SERVER                        │
│                   8 vCPU, 32GB RAM, 500GB NVMe SSD                      │
│                     Ubuntu 22.04 LTS + Docker 24.x                      │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
          ▼                        ▼                        ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  FRONTEND NET    │   │   BACKEND NET    │   │  DATABASE NET    │
│   (public)       │   │   (internal)     │   │   (internal)     │
└──────────────────┘   └──────────────────┘   └──────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                       DOCKER COMPOSE SERVICES                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      FRONTEND LAYER                              │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │  nginx-proxy (Reverse Proxy + SSL)                         │ │  │
│  │  │  Image: nginx:alpine                                       │ │  │
│  │  │  Ports: 80:80, 443:443                                     │ │  │
│  │  │  Volumes:                                                  │ │  │
│  │  │    • ./nginx.conf:/etc/nginx/nginx.conf                   │ │  │
│  │  │    • ./ssl:/etc/nginx/ssl (Let's Encrypt certs)           │ │  │
│  │  │  Networks: frontend-net                                    │ │  │
│  │  │                                                            │ │  │
│  │  │  Routing:                                                  │ │  │
│  │  │  • kgc-erp.hu           → kgc-frontend:3000                │ │  │
│  │  │  • kgc-erp.hu/api       → kgc-backend:3000                 │ │  │
│  │  │  • crm.kgc-erp.hu       → twenty:3001                      │ │  │
│  │  │  • support.kgc-erp.hu   → chatwoot:3002                    │ │  │
│  │  │  • hr.kgc-erp.hu        → horilla:3003                     │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │  kgc-frontend (React SPA)                                  │ │  │
│  │  │  Build: ./frontend/Dockerfile                              │ │  │
│  │  │  Environment:                                              │ │  │
│  │  │    • REACT_APP_API_URL=https://kgc-erp.hu/api              │ │  │
│  │  │    • REACT_APP_WS_URL=wss://kgc-erp.hu/ws                  │ │  │
│  │  │  Volumes:                                                  │ │  │
│  │  │    • ./frontend/build:/usr/share/nginx/html (static)      │ │  │
│  │  │  Networks: frontend-net, backend-net                       │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    APPLICATION LAYER                             │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │  kgc-backend (NestJS API)                                  │ │  │
│  │  │  Build: ./backend/Dockerfile                               │ │  │
│  │  │  Command: npm run start:prod                               │ │  │
│  │  │  Environment:                                              │ │  │
│  │  │    • NODE_ENV=production                                   │ │  │
│  │  │    • DATABASE_URL=postgresql://postgres:5432/kgc           │ │  │
│  │  │    • REDIS_URL=redis://redis:6379                          │ │  │
│  │  │    • JWT_SECRET=***                                        │ │  │
│  │  │    • TWENTY_API_URL=http://twenty:3001/graphql             │ │  │
│  │  │    • CHATWOOT_API_URL=http://chatwoot:3002/api/v1          │ │  │
│  │  │    • HORILLA_API_URL=http://horilla:3003/api               │ │  │
│  │  │    • SZAMLAZZ_HU_AGENT_KEY=***                             │ │  │
│  │  │  Healthcheck:                                              │ │  │
│  │  │    • curl -f http://localhost:3000/health || exit 1       │ │  │
│  │  │  Resources:                                                │ │  │
│  │  │    • CPU: 2 cores                                          │ │  │
│  │  │    • Memory: 4GB                                           │ │  │
│  │  │  Networks: backend-net, database-net                       │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │  twenty (CRM - Fork)                                       │ │  │
│  │  │  Image: twentycrm/twenty:latest (custom build)             │ │  │
│  │  │  Environment:                                              │ │  │
│  │  │    • PG_DATABASE_URL=postgresql://postgres:5432/twenty     │ │  │
│  │  │    • FRONT_BASE_URL=https://crm.kgc-erp.hu                 │ │  │
│  │  │    • SERVER_URL=https://crm.kgc-erp.hu/api                 │ │  │
│  │  │    • CUSTOM_THEME_PRIMARY_COLOR=#1E40AF (KGC kék)          │ │  │
│  │  │  Volumes:                                                  │ │  │
│  │  │    • ./twenty-theme:/app/theme (custom theme)             │ │  │
│  │  │  Resources:                                                │ │  │
│  │  │    • CPU: 1 core                                           │ │  │
│  │  │    • Memory: 2GB                                           │ │  │
│  │  │  Networks: backend-net, database-net                       │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │  chatwoot (Support - Fork)                                 │ │  │
│  │  │  Image: chatwoot/chatwoot:latest (custom build)            │ │  │
│  │  │  Environment:                                              │ │  │
│  │  │    • POSTGRES_HOST=postgres                                │ │  │
│  │  │    • POSTGRES_DATABASE=chatwoot                            │ │  │
│  │  │    • REDIS_URL=redis://redis:6379                          │ │  │
│  │  │    • FRONTEND_URL=https://support.kgc-erp.hu               │ │  │
│  │  │    • INSTALLATION_NAME=KGC Support                         │ │  │
│  │  │    • BRAND_NAME=KGC                                        │ │  │
│  │  │    • BRAND_PRIMARY_COLOR=#1E40AF                           │ │  │
│  │  │  Volumes:                                                  │ │  │
│  │  │    • ./chatwoot-theme:/app/app/javascript/dashboard/theme │ │  │
│  │  │  Resources:                                                │ │  │
│  │  │    • CPU: 1 core                                           │ │  │
│  │  │    • Memory: 2GB                                           │ │  │
│  │  │  Networks: backend-net, database-net                       │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │  horilla (HR - Fork)                                       │ │  │
│  │  │  Build: ./horilla/Dockerfile (custom build)                │ │  │
│  │  │  Environment:                                              │ │  │
│  │  │    • DATABASE_URL=postgresql://postgres:5432/horilla       │ │  │
│  │  │    • REDIS_URL=redis://redis:6379                          │ │  │
│  │  │    • SECRET_KEY=***                                        │ │  │
│  │  │    • ALLOWED_HOSTS=hr.kgc-erp.hu                           │ │  │
│  │  │    • COMPANY_NAME=KGC                                      │ │  │
│  │  │    • PRIMARY_COLOR=#1E40AF                                 │ │  │
│  │  │  Volumes:                                                  │ │  │
│  │  │    • ./horilla-theme:/app/static/theme                    │ │  │
│  │  │  Resources:                                                │ │  │
│  │  │    • CPU: 1 core                                           │ │  │
│  │  │    • Memory: 2GB                                           │ │  │
│  │  │  Networks: backend-net, database-net                       │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                       DATA LAYER                                 │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │  postgres (PostgreSQL 15)                                  │ │  │
│  │  │  Image: postgres:15-alpine                                 │ │  │
│  │  │  Environment:                                              │ │  │
│  │  │    • POSTGRES_PASSWORD=***                                 │ │  │
│  │  │    • POSTGRES_MULTIPLE_DATABASES=kgc,twenty,chatwoot,...   │ │  │
│  │  │  Volumes:                                                  │ │  │
│  │  │    • postgres-data:/var/lib/postgresql/data (persistent)  │ │  │
│  │  │    • ./init-db.sh:/docker-entrypoint-initdb.d/init.sh     │ │  │
│  │  │  Command:                                                  │ │  │
│  │  │    • postgres -c max_connections=200                       │ │  │
│  │  │    • postgres -c shared_buffers=4GB                        │ │  │
│  │  │    • postgres -c effective_cache_size=12GB                 │ │  │
│  │  │  Healthcheck:                                              │ │  │
│  │  │    • pg_isready -U postgres                                │ │  │
│  │  │  Resources:                                                │ │  │
│  │  │    • CPU: 4 cores                                          │ │  │
│  │  │    • Memory: 16GB                                          │ │  │
│  │  │  Networks: database-net                                    │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │  redis (Cache + Sessions)                                  │ │  │
│  │  │  Image: redis:7-alpine                                     │ │  │
│  │  │  Command: redis-server --maxmemory 2gb --maxmemory-policy  │ │  │
│  │  │           allkeys-lru                                      │ │  │
│  │  │  Volumes:                                                  │ │  │
│  │  │    • redis-data:/data (persistent)                         │ │  │
│  │  │  Healthcheck:                                              │ │  │
│  │  │    • redis-cli ping                                        │ │  │
│  │  │  Resources:                                                │ │  │
│  │  │    • CPU: 1 core                                           │ │  │
│  │  │    • Memory: 2GB                                           │ │  │
│  │  │  Networks: backend-net                                     │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    MONITORING & BACKUP                           │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │  backup-service (Cron)                                     │ │  │
│  │  │  Image: postgres:15-alpine                                 │ │  │
│  │  │  Command: crond -f                                         │ │  │
│  │  │  Crontab:                                                  │ │  │
│  │  │    • 0 2 * * * /backup.sh (Napi 2:00 AM)                   │ │  │
│  │  │  Script: pg_dump → S3 upload (Wasabi)                      │ │  │
│  │  │  Retention: 30 nap                                         │ │  │
│  │  │  Networks: database-net                                    │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │  prometheus (Metrics)                                      │ │  │
│  │  │  Image: prom/prometheus:latest                             │ │  │
│  │  │  Scrape targets:                                           │ │  │
│  │  │    • kgc-backend:3000/metrics                              │ │  │
│  │  │    • postgres-exporter:9187                                │ │  │
│  │  │    • redis-exporter:9121                                   │ │  │
│  │  │  Volumes:                                                  │ │  │
│  │  │    • prometheus-data:/prometheus (persistent)              │ │  │
│  │  │  Networks: backend-net                                     │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │  grafana (Visualization)                                   │ │  │
│  │  │  Image: grafana/grafana:latest                             │ │  │
│  │  │  Datasource: Prometheus                                    │ │  │
│  │  │  Dashboards:                                               │ │  │
│  │  │    • KGC API Performance                                   │ │  │
│  │  │    • PostgreSQL Health                                     │ │  │
│  │  │    • Redis Cache Hit Rate                                  │ │  │
│  │  │    • User Activity                                         │ │  │
│  │  │  Networks: backend-net, frontend-net                       │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘


PERSISTENT VOLUMES:
┌──────────────────────────────────────────────────────────┐
│ • postgres-data    (100GB)  - PostgreSQL adatbázis       │
│ • redis-data       (5GB)    - Redis cache                │
│ • uploads          (50GB)   - Fájl feltöltések (PDF, stb)│
│ • prometheus-data  (20GB)   - Metrics history            │
│ • grafana-data     (5GB)    - Dashboards + configs       │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Hálózati Topológia

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         INTERNET                                        │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ HTTPS (443)
                             │
                             ▼
                ┌────────────────────────────┐
                │  Cloudflare CDN + Firewall │
                │  • DDoS protection         │
                │  • SSL/TLS termination     │
                │  • Static asset cache      │
                │  • WAF rules               │
                └──────────┬─────────────────┘
                           │
                           │ Proxied traffic
                           │
                           ▼
          ┌────────────────────────────────────────┐
          │   Hetzner VPS (Public IP: x.x.x.x)     │
          │                                        │
          │  ┌──────────────────────────────────┐  │
          │  │   Nginx Reverse Proxy            │  │
          │  │   (frontend-net bridge)          │  │
          │  │                                  │  │
          │  │   Routing Rules:                 │  │
          │  │   • kgc-erp.hu/*                 │  │
          │  │     → kgc-frontend:3000          │  │
          │  │   • kgc-erp.hu/api/*             │  │
          │  │     → kgc-backend:3000           │  │
          │  │   • kgc-erp.hu/ws/*              │  │
          │  │     → kgc-backend:3000 (WS)      │  │
          │  │   • crm.kgc-erp.hu/*             │  │
          │  │     → twenty:3001                │  │
          │  │   • support.kgc-erp.hu/*         │  │
          │  │     → chatwoot:3002              │  │
          │  │   • hr.kgc-erp.hu/*              │  │
          │  │     → horilla:3003               │  │
          │  │   • grafana.kgc-erp.hu/*         │  │
          │  │     → grafana:3004 (internal)    │  │
          │  └──────────────┬───────────────────┘  │
          │                 │                      │
          │  ┌──────────────┴───────────────────┐  │
          │  │   backend-net (internal)         │  │
          │  │   172.20.0.0/16                  │  │
          │  │                                  │  │
          │  │   ┌──────────────────────────┐   │  │
          │  │   │  kgc-backend   172.20.1  │   │  │
          │  │   │  twenty        172.20.2  │   │  │
          │  │   │  chatwoot      172.20.3  │   │  │
          │  │   │  horilla       172.20.4  │   │  │
          │  │   │  redis         172.20.5  │   │  │
          │  │   └──────────────────────────┘   │  │
          │  └──────────────┬───────────────────┘  │
          │                 │                      │
          │  ┌──────────────┴───────────────────┐  │
          │  │   database-net (internal)        │  │
          │  │   172.21.0.0/16                  │  │
          │  │                                  │  │
          │  │   ┌──────────────────────────┐   │  │
          │  │   │  postgres      172.21.1  │   │  │
          │  │   │  backup-svc    172.21.2  │   │  │
          │  │   └──────────────────────────┘   │  │
          │  └──────────────────────────────────┘  │
          │                                        │
          └────────────────────────────────────────┘

FIREWALL RULES (iptables):
┌──────────────────────────────────────────────────────────┐
│ ALLOW:                                                   │
│ • 443/tcp (HTTPS from Cloudflare IPs only)               │
│ • 80/tcp  (HTTP redirect to HTTPS)                       │
│ • 22/tcp  (SSH from admin IP only)                       │
│                                                          │
│ DENY:                                                    │
│ • All other inbound traffic                              │
│ • Direct access to internal networks                     │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Deployment Folyamat (CI/CD)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    GIT REPOSITORY (GitHub)                              │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ git push (main branch)
                             │
                             ▼
                ┌────────────────────────────┐
                │  GitHub Actions Workflow   │
                │  (.github/workflows/       │
                │   deploy.yml)              │
                │                            │
                │  Trigger: push to main     │
                └──────────┬─────────────────┘
                           │
                           │ Run pipeline
                           │
                ┌──────────▼─────────────────┐
                │  STEP 1: Build & Test      │
                │                            │
                │  Jobs (parallel):          │
                │  ┌──────────────────────┐  │
                │  │ kgc-backend          │  │
                │  │ • npm install        │  │
                │  │ • npm run test       │  │
                │  │ • npm run build      │  │
                │  │ • docker build       │  │
                │  └──────────────────────┘  │
                │  ┌──────────────────────┐  │
                │  │ kgc-frontend         │  │
                │  │ • npm install        │  │
                │  │ • npm run test       │  │
                │  │ • npm run build      │  │
                │  │ • docker build       │  │
                │  └──────────────────────┘  │
                │                            │
                │  Exit if tests fail ❌     │
                └──────────┬─────────────────┘
                           │
                           │ All green ✅
                           │
                ┌──────────▼─────────────────┐
                │  STEP 2: Docker Registry   │
                │                            │
                │  • docker login ghcr.io    │
                │  • docker tag              │
                │  • docker push             │
                │    - kgc-backend:latest    │
                │    - kgc-frontend:latest   │
                │                            │
                │  Artifacts:                │
                │  • ghcr.io/kgc/backend:v123│
                │  • ghcr.io/kgc/frontend:v123│
                └──────────┬─────────────────┘
                           │
                           │ Push complete
                           │
                ┌──────────▼─────────────────┐
                │  STEP 3: Deploy to Server  │
                │                            │
                │  SSH to production:        │
                │  • ssh deploy@kgc-erp.hu   │
                │                            │
                │  Commands:                 │
                │  1. cd /opt/kgc            │
                │  2. git pull origin main   │
                │  3. docker compose pull    │
                │  4. docker compose up -d   │
                │     --no-deps              │
                │     --force-recreate       │
                │     kgc-backend            │
                │     kgc-frontend           │
                │  5. docker image prune -f  │
                │                            │
                │  Health check:             │
                │  • curl /health (3 retry)  │
                └──────────┬─────────────────┘
                           │
                           │ Deploy success ✅
                           │
                ┌──────────▼─────────────────┐
                │  STEP 4: Smoke Tests       │
                │                            │
                │  Automated checks:         │
                │  • Login test              │
                │  • Dashboard load test     │
                │  • API health endpoints    │
                │  • Database connectivity   │
                │                            │
                │  If fail:                  │
                │  • Rollback to previous    │
                │  • Alert team (Slack)      │
                └──────────┬─────────────────┘
                           │
                           │ All pass ✅
                           │
                ┌──────────▼─────────────────┐
                │  STEP 5: Notification      │
                │                            │
                │  Slack notification:       │
                │  "✅ Deploy v123 SUCCESS"  │
                │  • Commit: abc123          │
                │  • Author: @dev            │
                │  • Duration: 4 min 32 sec  │
                │  • URL: kgc-erp.hu         │
                └────────────────────────────┘


ROLLBACK PROCESS:
┌──────────────────────────────────────────────────────────┐
│ Manual rollback command (SSH to server):                 │
│                                                          │
│ 1. cd /opt/kgc                                           │
│ 2. docker compose down kgc-backend kgc-frontend          │
│ 3. docker tag ghcr.io/kgc/backend:v122 :latest           │
│ 4. docker tag ghcr.io/kgc/frontend:v122 :latest          │
│ 5. docker compose up -d kgc-backend kgc-frontend         │
│ 6. Verify health                                         │
│                                                          │
│ OR automated (GitHub Actions):                           │
│ • Re-run previous successful workflow                    │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Monitoring & Alerting

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       MONITORING STACK                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Prometheus (Metrics)                          │  │
│  │                                                                  │  │
│  │  Scrape Targets (every 15s):                                    │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │ kgc-backend:3000/metrics                                   │ │  │
│  │  │ • http_requests_total                                      │ │  │
│  │  │ • http_request_duration_seconds                            │ │  │
│  │  │ • websocket_connections_active                             │ │  │
│  │  │ • sync_jobs_total                                          │ │  │
│  │  │ • sync_jobs_failed                                         │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │ postgres-exporter:9187/metrics                             │ │  │
│  │  │ • pg_stat_database_numbackends                             │ │  │
│  │  │ • pg_stat_database_tup_fetched                             │ │  │
│  │  │ • pg_locks_count                                           │ │  │
│  │  │ • pg_database_size_bytes                                   │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │ redis-exporter:9121/metrics                                │ │  │
│  │  │ • redis_connected_clients                                  │ │  │
│  │  │ • redis_keyspace_hits_total                                │ │  │
│  │  │ • redis_keyspace_misses_total                              │ │  │
│  │  │ • redis_memory_used_bytes                                  │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Grafana (Dashboards)                          │  │
│  │                                                                  │  │
│  │  Dashboard: "KGC API Performance"                               │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │ Request Rate (req/sec)                                     │ │  │
│  │  │ ████████████████████████░░░░░░░░ 245 req/sec              │ │  │
│  │  │                                                            │ │  │
│  │  │ Response Time (p95)                                        │ │  │
│  │  │ ██████████░░░░░░░░░░░░░░░░░░░░░░ 120ms                    │ │  │
│  │  │                                                            │ │  │
│  │  │ Error Rate                                                 │ │  │
│  │  │ ███░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0.3% ✅                 │ │  │
│  │  │                                                            │ │  │
│  │  │ Active Connections                                         │ │  │
│  │  │ ████████████████░░░░░░░░░░░░░░░░ 45 users                 │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  │                                                                  │  │
│  │  Dashboard: "PostgreSQL Health"                                 │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │ Database Size                                              │ │  │
│  │  │ ████████████████████████████░░░░ 12.5 GB / 100 GB         │ │  │
│  │  │                                                            │ │  │
│  │  │ Active Connections                                         │ │  │
│  │  │ ███████░░░░░░░░░░░░░░░░░░░░░░░░░ 23 / 200                 │ │  │
│  │  │                                                            │ │  │
│  │  │ Query Performance (slow queries > 1s)                      │ │  │
│  │  │ ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 2 queries ⚠️            │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  │                                                                  │  │
│  │  Dashboard: "Redis Cache Performance"                           │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │ Cache Hit Rate                                             │ │  │
│  │  │ ███████████████████████████████░ 92.5% ✅                 │ │  │
│  │  │                                                            │ │  │
│  │  │ Memory Usage                                               │ │  │
│  │  │ ████████████████░░░░░░░░░░░░░░░░ 1.2 GB / 2 GB            │ │  │
│  │  │                                                            │ │  │
│  │  │ Evicted Keys (last 1h)                                     │ │  │
│  │  │ ██████░░░░░░░░░░░░░░░░░░░░░░░░░░ 234 keys                 │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Uptime Robot (External)                       │  │
│  │                                                                  │  │
│  │  Monitored URLs (every 5 min):                                  │  │
│  │  • https://kgc-erp.hu (main app)                                │  │
│  │  • https://kgc-erp.hu/api/health (backend)                      │  │
│  │  • https://crm.kgc-erp.hu (Twenty)                              │  │
│  │  • https://support.kgc-erp.hu (Chatwoot)                        │  │
│  │  • https://hr.kgc-erp.hu (Horilla)                              │  │
│  │                                                                  │  │
│  │  Alert channels:                                                │  │
│  │  • Email → admin@kgc.hu                                         │  │
│  │  • SMS → +36 20 XXX XXXX (critical only)                        │  │
│  │  • Slack → #alerts channel                                      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘


ALERT RULES:
┌──────────────────────────────────────────────────────────┐
│ CRITICAL (SMS + Email + Slack):                          │
│ • Uptime < 99% (5 min window)                            │
│ • Error rate > 5% (1 min window)                         │
│ • Database connections > 180/200 (90%)                   │
│ • Disk usage > 90%                                       │
│                                                          │
│ WARNING (Email + Slack):                                 │
│ • Response time p95 > 2 sec                              │
│ • Cache hit rate < 85%                                   │
│ • Sync job failures > 10 (1 hour)                        │
│ • Memory usage > 80%                                     │
│                                                          │
│ INFO (Slack only):                                       │
│ • Deployment started                                     │
│ • Deployment completed                                   │
│ • Backup completed                                       │
└──────────────────────────────────────────────────────────┘
```

---

**Készítette:** Winston (Architect), DevOps Team
**Verzió:** 2.0
**Dátum:** 2025-12-20
