# Deployment Guide - Production

Panduan lengkap untuk deploy Performa Dashboard ke production.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Migration](#database-migration)
4. [Build & Deploy](#build--deploy)
5. [Post-Deployment](#post-deployment)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### System Requirements

- **Node.js**: 18.x or higher
- **PostgreSQL**: 14.x or higher
- **Memory**: Minimum 2GB RAM
- **Storage**: Minimum 10GB available space
- **SSL Certificate**: For HTTPS (required for production)

### Services Required

- PostgreSQL database server
- Redis server (recommended for caching)
- Reverse proxy (Nginx/Apache)
- Process manager (PM2/Docker)

---

## 🌍 Environment Setup

### 1. Production Environment Variables

Create `.env.production`:

```env
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Database
DATABASE_URL="postgresql://username:password@hostname:5432/database_name?schema=public&sslmode=require"

# JWT
JWT_SECRET="your-very-secure-secret-key-here-minimum-32-chars"
JWT_EXPIRES_IN="7d"

# Security
AUTH_COOKIE_NAME="auth-token"
AUTH_COOKIE_SECURE=true  # HTTPS only
AUTH_COOKIE_HTTPONLY=true
AUTH_COOKIE_SAMESITE="strict"

# Optional: Redis for caching
REDIS_URL="redis://username:password@hostname:6379"

# Optional: Email notifications
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Optional: File upload
MAX_FILE_SIZE=10485760  # 10MB in bytes
UPLOAD_DIR="/var/uploads"

# Logging
LOG_LEVEL="info"
```

### 2. Security Checklist

✅ **Generate strong JWT_SECRET**:
```bash
openssl rand -base64 64
```

✅ **Use SSL/TLS** for database connections
✅ **Enable HTTPS** for all traffic
✅ **Set secure cookie flags** (httpOnly, secure, sameSite)
✅ **Configure CORS** properly
✅ **Enable rate limiting**
✅ **Set up firewall rules**

---

## 🗄️ Database Migration

### 1. Backup Existing Database (if upgrading)

```bash
# PostgreSQL backup
pg_dump -U username -h hostname database_name > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Run Prisma Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Apply migrations
npx prisma migrate deploy

# Verify migration
npx prisma migrate status
```

### 3. Seed Initial Data

```bash
# Run seed script
npx prisma db seed
```

This creates:
- Default roles (ADMINISTRATOR, DIREKTUR, MARKETING, ACCOUNTING)
- Default permissions (25 permissions)
- Default admin user

**⚠️ Important:** Change default admin password after first login!

---

## 🚀 Build & Deploy

### Option 1: Traditional Deployment (PM2)

#### 1. Install Dependencies

```bash
npm ci --production
```

#### 2. Build Application

```bash
npm run build
```

#### 3. Install PM2

```bash
npm install -g pm2
```

#### 4. Create PM2 Ecosystem File

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'performa-dashboard',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
  }]
};
```

#### 5. Start Application

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### 6. Monitor Application

```bash
# View logs
pm2 logs

# Monitor resources
pm2 monit

# View status
pm2 status
```

---

### Option 2: Docker Deployment

#### 1. Create Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

#### 3. Build and Run

```bash
# Build image
docker-compose build

# Run migrations
docker-compose run app npx prisma migrate deploy

# Start services
docker-compose up -d

# View logs
docker-compose logs -f app
```

---

### Option 3: Vercel Deployment

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Configure vercel.json

```json
{
  "buildCommand": "npx prisma generate && npm run build",
  "env": {
    "DATABASE_URL": "@database_url",
    "JWT_SECRET": "@jwt_secret"
  }
}
```

#### 3. Deploy

```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

**⚠️ Note:** Serverless platforms have limitations:
- No long-running processes
- Limited SSE support
- Cold starts may affect performance

---

## 🔧 Nginx Configuration

### Reverse Proxy Setup

Create `/etc/nginx/sites-available/performa-dashboard`:

```nginx
upstream performa_dashboard {
    server 127.0.0.1:3000;
    keepalive 64;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/performa-dashboard.access.log;
    error_log /var/log/nginx/performa-dashboard.error.log;

    # Client body size (for file uploads)
    client_max_body_size 10M;

    location / {
        proxy_pass http://performa_dashboard;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # SSE endpoint needs special handling
    location /api/notifications/stream {
        proxy_pass http://performa_dashboard;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;
    }
}
```

### Enable Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/performa-dashboard /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🔒 SSL Certificate (Let's Encrypt)

### Install Certbot

```bash
# Ubuntu/Debian
sudo apt-get install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

### Generate Certificate

```bash
# Generate and configure
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

---

## ✅ Post-Deployment

### 1. Health Check

Create health check endpoint (optional):

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  });
}
```

Test: `https://yourdomain.com/api/health`

### 2. Change Default Admin Password

1. Login as admin@example.com / admin123
2. Navigate to `/admin/users`
3. Edit admin user
4. Change password
5. Save

### 3. Create Additional Admin Users

1. Navigate to `/admin/users`
2. Create new users with appropriate roles
3. Test their access

### 4. Configure Permissions

1. Review default permissions
2. Create custom permissions if needed
3. Assign to appropriate roles

### 5. Backup Strategy

Set up automated backups:

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/var/backups/performa-dashboard"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
pg_dump -U username database_name > "$BACKUP_DIR/db_$DATE.sql"

# Compress
gzip "$BACKUP_DIR/db_$DATE.sql"

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

Add to crontab:
```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

---

## 📊 Monitoring

### Application Monitoring

#### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# View metrics
pm2 describe performa-dashboard
```

#### Log Monitoring

```bash
# Tail logs
pm2 logs performa-dashboard --lines 100

# Filter errors
pm2 logs performa-dashboard --err
```

### Database Monitoring

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check slow queries
SELECT
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### Server Monitoring

```bash
# CPU and Memory
htop

# Disk usage
df -h

# Network
netstat -tulpn

# Process monitoring
ps aux | grep node
```

---

## 🐛 Troubleshooting

### Issue: Application won't start

**Check:**
1. Port availability: `lsof -i :3000`
2. Environment variables: `printenv | grep DATABASE_URL`
3. Prisma client: `npx prisma generate`
4. Dependencies: `npm install`

**Solution:**
```bash
# Kill process on port 3000
kill -9 $(lsof -t -i:3000)

# Restart application
pm2 restart performa-dashboard
```

### Issue: Database connection failed

**Check:**
1. Database running: `sudo systemctl status postgresql`
2. Connection string correct
3. Firewall rules
4. Database credentials

**Solution:**
```bash
# Test connection
psql -U username -h hostname -d database_name

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Issue: 502 Bad Gateway

**Check:**
1. Application running: `pm2 status`
2. Nginx configuration: `sudo nginx -t`
3. Logs: `pm2 logs`

**Solution:**
```bash
# Restart application
pm2 restart performa-dashboard

# Restart Nginx
sudo systemctl restart nginx
```

### Issue: High memory usage

**Check:**
```bash
pm2 describe performa-dashboard
```

**Solution:**
```bash
# Restart with memory limit
pm2 restart performa-dashboard --max-memory-restart 1G

# Or update ecosystem.config.js
```

### Issue: Permission cache not clearing

**Solution:**
```typescript
// Clear cache manually in code
import { clearPermissionCache } from '@/lib/permissions';
await clearPermissionCache();
```

Or restart application:
```bash
pm2 restart performa-dashboard
```

---

## 🔄 Updates & Maintenance

### Update Process

1. **Backup Database**
   ```bash
   pg_dump database_name > backup_pre_update.sql
   ```

2. **Pull Latest Code**
   ```bash
   git pull origin main
   ```

3. **Install Dependencies**
   ```bash
   npm ci
   ```

4. **Run Migrations**
   ```bash
   npx prisma migrate deploy
   ```

5. **Build Application**
   ```bash
   npm run build
   ```

6. **Restart Application**
   ```bash
   pm2 restart performa-dashboard
   ```

7. **Verify**
   - Check health endpoint
   - Test critical features
   - Monitor logs

### Rollback Process

```bash
# Restore database
psql database_name < backup_pre_update.sql

# Revert code
git revert HEAD
npm ci
npm run build

# Restart
pm2 restart performa-dashboard
```

---

## 📋 Production Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database backup created
- [ ] SSL certificate installed
- [ ] Domain DNS configured
- [ ] Firewall rules set
- [ ] Strong JWT secret generated
- [ ] Default passwords changed

### Deployment
- [ ] Application built successfully
- [ ] Migrations run without errors
- [ ] Application starts without errors
- [ ] Health check passes
- [ ] Nginx configured correctly
- [ ] HTTPS working
- [ ] SSE connections working

### Post-Deployment
- [ ] Default admin password changed
- [ ] Additional users created
- [ ] Permissions verified
- [ ] Monitoring configured
- [ ] Backup schedule set
- [ ] Logs configured
- [ ] Performance tested
- [ ] Security audit passed

---

## 📞 Support

For deployment issues:
1. Check application logs: `pm2 logs`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Check database logs
4. Review this documentation
5. Contact DevOps team

---

**Last Updated:** 2024-01-23
**Version:** 1.0.0
