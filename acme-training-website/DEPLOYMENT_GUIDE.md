# Production Deployment Guide

## 1. How to Generate Secure Passwords

### On Mac/Linux (Terminal)

```bash
# Generate admin password (16 bytes = 24 characters base64)
openssl rand -base64 16

# Generate longer password (32 bytes = 44 characters base64)
openssl rand -base64 32

# Example output:
# 7MoX4CVebuxuzLGPIl2URw==
```

**To run this:**
1. Open **Terminal** (Mac) or **Command Line** (Linux)
2. Type: `openssl rand -base64 16`
3. Press **Enter**
4. Copy the output (the random string)
5. Paste into your `.env.production` file

### On Windows

#### Method 1: PowerShell
```powershell
# Open PowerShell and run:
[Convert]::ToBase64String((1..24 | ForEach-Object {Get-Random -Minimum 0 -Maximum 256}))
```

#### Method 2: Git Bash (if you have Git installed)
```bash
openssl rand -base64 16
```

#### Method 3: Online Generator (Less Secure)
- Visit: https://www.random.org/passwords/
- Set: Length = 24, Numbers + Letters + Symbols
- **WARNING**: Only use for development, never production

### Best Practice

Generate **different** passwords for:
1. Default admin password
2. Database password
3. Any API keys

**Example workflow:**
```bash
# Run this 3 times and save each result
openssl rand -base64 16
# Result 1: Use for DEFAULT_ADMIN_PASSWORD

openssl rand -base64 16
# Result 2: Use for database password

openssl rand -base64 16
# Result 3: Use for any other secret
```

---

## 2. Fasthosts VPS Evaluation

### ✅ Is Fasthosts Suitable? **YES, with considerations**

### Fasthosts Advantages for Your Use Case

✅ **UK-Based Hosting**
- Your training centers are UK-wide
- Low latency for UK users (~10-20ms)
- GDPR compliant (data stays in UK)
- 24/7 UK support

✅ **Competitive Pricing**
- VPS plans start from £20/month
- Flexible scaling options
- No setup fees

✅ **Managed Services Available**
- Optional managed PostgreSQL
- Automated backups
- Security patches

### Recommended Fasthosts Plans

#### Starter Plan (50-100 Tenants)
**VPS Essential Plus**
- **RAM**: 4 GB
- **CPU**: 4 cores
- **Storage**: 80 GB SSD
- **Bandwidth**: Unlimited
- **Cost**: ~£30/month
- **Suitable for**: First 6-12 months

#### Growth Plan (200-500 Tenants)
**VPS Performance**
- **RAM**: 8 GB
- **CPU**: 6 cores
- **Storage**: 160 GB SSD
- **Bandwidth**: Unlimited
- **Cost**: ~£50/month
- **Suitable for**: 1-2 years

#### Scale Plan (500+ Tenants)
**VPS High Performance**
- **RAM**: 16 GB
- **CPU**: 8 cores
- **Storage**: 320 GB SSD
- **Bandwidth**: Unlimited
- **Cost**: ~£80/month
- **Suitable for**: 2+ years

### What You'll Need to Set Up

#### On the Fasthosts VPS:

1. **Operating System**
   - Ubuntu 22.04 LTS (recommended)
   - CentOS 8 (alternative)

2. **Node.js & PM2**
   ```bash
   # Install Node.js 20.x
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2 (process manager)
   sudo npm install -g pm2
   ```

3. **PostgreSQL Database**
   ```bash
   # Install PostgreSQL 16
   sudo apt install postgresql-16 postgresql-contrib

   # Create database and user
   sudo -u postgres psql
   CREATE DATABASE acme_training;
   CREATE USER acme_user WITH PASSWORD 'your-secure-password';
   GRANT ALL PRIVILEGES ON DATABASE acme_training TO acme_user;
   ```

4. **Nginx (Web Server)**
   ```bash
   # Install Nginx
   sudo apt install nginx

   # Configure reverse proxy
   sudo nano /etc/nginx/sites-available/acme-training
   ```

5. **SSL Certificate**
   ```bash
   # Install Certbot for free SSL
   sudo apt install certbot python3-certbot-nginx

   # Get certificate
   sudo certbot --nginx -d yourdomain.com
   ```

### Alternative: Fasthosts Database Options

#### Option 1: Self-Managed PostgreSQL on Same VPS
- **Cost**: Included in VPS price
- **Pros**: Cheaper, full control
- **Cons**: You manage backups, updates, scaling
- **Recommended for**: Tight budget, technical team

#### Option 2: Separate Database VPS
- **Cost**: +£20/month
- **Pros**: Isolated, easier to scale
- **Cons**: More complex setup
- **Recommended for**: Growth phase

#### Option 3: Managed PostgreSQL Service
Fasthosts doesn't offer managed PostgreSQL, so use:
- **DigitalOcean Managed Database** (£15-40/month)
- **AWS RDS** (£15-50/month)
- **Railway.app** ($5-20/month)

**Recommended**: Start with Option 1, move to managed when you hit 200+ tenants

---

## 3. Complete Fasthosts Deployment Checklist

### Phase 1: Initial Setup (Day 1)

- [ ] Order Fasthosts VPS (VPS Essential Plus minimum)
- [ ] Set up SSH key authentication
- [ ] Configure firewall (allow ports 22, 80, 443 only)
- [ ] Install Ubuntu 22.04 LTS
- [ ] Update system: `sudo apt update && sudo apt upgrade`
- [ ] Create non-root user with sudo access

### Phase 2: Install Dependencies (Day 1-2)

- [ ] Install Node.js 20.x
- [ ] Install PostgreSQL 16
- [ ] Install Nginx
- [ ] Install PM2 process manager
- [ ] Install Git

### Phase 3: Database Setup (Day 2)

- [ ] Create PostgreSQL database
- [ ] Create database user with secure password
- [ ] Configure PostgreSQL for remote connections (if needed)
- [ ] Set up automated backups

### Phase 4: Application Deployment (Day 2-3)

- [ ] Clone your repository to VPS
- [ ] Create `.env.production` with all secrets
- [ ] Install dependencies: `npm install --production`
- [ ] Run database migrations: `npx prisma migrate deploy`
- [ ] Build Next.js app: `npm run build`
- [ ] Start with PM2: `pm2 start npm --name "acme-training" -- start`

### Phase 5: Web Server Configuration (Day 3)

- [ ] Configure Nginx reverse proxy
- [ ] Set up SSL certificate with Let's Encrypt
- [ ] Configure HTTPS redirect
- [ ] Test application is accessible

### Phase 6: Security Hardening (Day 3-4)

- [ ] Configure firewall (ufw or iptables)
- [ ] Set up fail2ban for SSH protection
- [ ] Enable automatic security updates
- [ ] Configure PostgreSQL security
- [ ] Test all security features

### Phase 7: Monitoring & Backups (Day 4-5)

- [ ] Set up PM2 monitoring
- [ ] Configure daily database backups
- [ ] Set up log rotation
- [ ] Configure uptime monitoring (UptimeRobot, Pingdom)
- [ ] Test backup restoration

### Phase 8: Go Live (Day 5)

- [ ] Update DNS to point to VPS IP
- [ ] Test all functionality
- [ ] Monitor error logs
- [ ] Create first admin account
- [ ] Onboard first tenant

---

## 4. Deployment Script

Save this as `deploy.sh` on your VPS:

```bash
#!/bin/bash

# ACME Training Platform Deployment Script
# Run with: bash deploy.sh

echo "🚀 Deploying ACME Training Platform..."

# Pull latest code
cd /var/www/acme-training
git pull origin main

# Install dependencies
npm install --production

# Run database migrations
npx prisma migrate deploy
npx prisma generate

# Build application
npm run build

# Restart application
pm2 restart acme-training

# Show status
pm2 status

echo "✅ Deployment complete!"
echo "📊 Check logs: pm2 logs acme-training"
```

Make executable:
```bash
chmod +x deploy.sh
```

---

## 5. Nginx Configuration

Create `/etc/nginx/sites-available/acme-training`:

```nginx
# Upstream Next.js server
upstream nextjs {
    server 127.0.0.1:3000;
    keepalive 64;
}

# Rate limiting zone
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL configuration (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy settings
    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Rate limit login endpoints
    location /api/admin/login {
        limit_req zone=login_limit burst=3 nodelay;
        proxy_pass http://nextjs;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/acme-training /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 6. PM2 Ecosystem File

Create `ecosystem.config.js` in your project:

```javascript
module.exports = {
  apps: [{
    name: 'acme-training',
    script: 'npm',
    args: 'start',
    instances: 2, // Use multiple instances for load balancing
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
}
```

Start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 7. Backup Script

Create `/usr/local/bin/backup-database.sh`:

```bash
#!/bin/bash

# Database backup script
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/postgresql"
DB_NAME="acme_training"
DB_USER="acme_user"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Perform backup
pg_dump -U $DB_USER -d $DB_NAME -F c -f "$BACKUP_DIR/backup_$DATE.dump"

# Compress backup
gzip "$BACKUP_DIR/backup_$DATE.dump"

# Delete backups older than 30 days
find $BACKUP_DIR -name "backup_*.dump.gz" -mtime +30 -delete

echo "Backup completed: backup_$DATE.dump.gz"
```

Add to crontab:
```bash
sudo crontab -e

# Add this line for daily backups at 2 AM:
0 2 * * * /usr/local/bin/backup-database.sh
```

---

## 8. Cost Summary

### Fasthosts Setup (Year 1)

| Item | Cost/Month | Cost/Year |
|------|------------|-----------|
| VPS Essential Plus (4GB) | £30 | £360 |
| Domain Name | £1 | £12 |
| SSL Certificate | £0 (Let's Encrypt) | £0 |
| Backups (included) | £0 | £0 |
| **Total** | **£31** | **£372** |

### Alternative: Managed Setup

| Item | Cost/Month | Cost/Year |
|------|------------|-----------|
| Fasthosts VPS (smaller) | £20 | £240 |
| DigitalOcean Database | £15 | £180 |
| Domain Name | £1 | £12 |
| **Total** | **£36** | **£432** |

**Recommendation**: Start with Fasthosts VPS + self-managed PostgreSQL (£30/month), migrate to managed database when revenue supports it.

---

## 9. When to Upgrade

### Upgrade VPS when:
- ✓ CPU usage consistently > 70%
- ✓ RAM usage > 80%
- ✓ Response times > 500ms
- ✓ More than 200 active tenants

### Add Managed Database when:
- ✓ More than 500 tenants
- ✓ Database > 50 GB
- ✓ Need high availability (99.99% uptime)
- ✓ Team lacks PostgreSQL expertise

### Add CDN when:
- ✓ National/international users
- ✓ Serving static assets (images, videos)
- ✓ Need faster page loads

**Recommended CDN**: Cloudflare (Free tier is excellent)

---

## 10. Support & Maintenance

### Fasthosts Support
- **Phone**: Available 24/7
- **Live Chat**: Available 24/7
- **Email**: Response within 4 hours
- **Knowledge Base**: Extensive documentation

### Your Maintenance Schedule

**Daily**: Check PM2 logs for errors
**Weekly**: Review database size and performance
**Monthly**:
- Update system packages
- Review security logs
- Test backup restoration
**Quarterly**:
- Update Node.js version
- Update npm packages
- Review and optimize database queries

---

## Quick Reference Commands

```bash
# View application logs
pm2 logs acme-training

# Restart application
pm2 restart acme-training

# Check database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('acme_training'));"

# Check disk usage
df -h

# Check memory usage
free -h

# Check active connections
netstat -an | grep :3000 | wc -l

# Backup database manually
pg_dump -U acme_user -d acme_training -F c > backup.dump

# Restore database
pg_restore -U acme_user -d acme_training -c backup.dump
```

---

## Final Recommendation

**For your UK-wide training center SaaS:**

✅ **Start with Fasthosts VPS Essential Plus (£30/month)**
- 4 GB RAM, 80 GB SSD
- Self-managed PostgreSQL
- Supports 50-200 tenants comfortably
- UK-based (low latency for UK users)
- 24/7 UK support

✅ **Upgrade Path** (after 12-18 months):
- Move to VPS Performance (8 GB RAM)
- Add managed database service
- Add CDN for static assets
- Implement Redis caching

✅ **Alternative** (if budget allows):
- Vercel for Next.js hosting (£20/month)
- DigitalOcean Managed PostgreSQL (£15/month)
- **Total**: £35/month with zero DevOps work

**Choose Fasthosts if**: You want full control and UK-based hosting
**Choose Vercel+DO if**: You want simplicity and automatic scaling

Both are excellent choices for your use case!
