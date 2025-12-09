# VPS & MySQL Database Setup Guide - ACME Training

## Fasthosts VPS & Database Recommendations

### VPS Requirements for ACME Training

#### Minimum VPS Specs
- **CPU:** 1-2 vCPU cores
- **RAM:** 2-4 GB
- **Storage:** 20-40 GB SSD
- **Bandwidth:** 1TB+ monthly
- **OS:** Ubuntu 22.04 LTS or CentOS 8

#### Recommended VPS Specs (Growth Ready)
- **CPU:** 2-4 vCPU cores
- **RAM:** 4-8 GB
- **Storage:** 40-80 GB SSD
- **Bandwidth:** Unlimited
- **OS:** Ubuntu 22.04 LTS

### Fasthosts VPS Options

#### Cloud VPS Standard
- **Small:** 1 vCPU, 2GB RAM, 30GB SSD - £10-15/month
- **Medium:** 2 vCPU, 4GB RAM, 40GB SSD - £20-30/month
- **Large:** 4 vCPU, 8GB RAM, 80GB SSD - £40-60/month

#### Recommended: **Medium VPS** for ACME Training
- Handles 50-100 concurrent users
- Room for database growth
- Cost-effective for small business

### MySQL Database Options

#### Fasthosts Managed MySQL
- **Basic:** 1GB storage, 10 connections - £5-10/month
- **Standard:** 5GB storage, 50 connections - £15-25/month
- **Premium:** 20GB storage, 100 connections - £30-50/month

#### Self-Hosted MySQL on VPS
- **Pros:** Full control, cost-effective
- **Cons:** Requires maintenance, backup management

## MySQL Database Setup Options

### Option 1: Fasthosts Managed MySQL (Recommended)

#### Benefits
- Automatic backups
- Security patches handled
- Monitoring included
- Easy scaling
- 99.9% uptime SLA

#### Setup Steps
1. **Order MySQL Database**
   - Log into Fasthosts control panel
   - Navigate to "Databases" → "MySQL"
   - Select appropriate plan (Standard recommended)
   - Complete order

2. **Get Connection Details**
   ```
   Host: mysql.your-domain.com
   Port: 3306
   Database: acme_training_db
   Username: acme_user
   Password: [generated-password]
   ```

3. **Configure Connection String**
   ```
   DATABASE_URL="mysql://acme_user:password@mysql.your-domain.com:3306/acme_training_db"
   ```

### Option 2: Self-Hosted MySQL on VPS

#### Installation Steps (Ubuntu 22.04)

1. **Connect to VPS**
   ```bash
   ssh root@your-vps-ip
   ```

2. **Update System**
   ```bash
   apt update && apt upgrade -y
   ```

3. **Install MySQL Server**
   ```bash
   apt install mysql-server -y
   ```

4. **Secure MySQL Installation**
   ```bash
   mysql_secure_installation
   ```
   - Set root password
   - Remove anonymous users
   - Disable remote root login
   - Remove test database

5. **Create Database & User**
   ```sql
   mysql -u root -p
   
   CREATE DATABASE acme_training_db;
   CREATE USER 'acme_user'@'%' IDENTIFIED BY 'strong_password_here';
   GRANT ALL PRIVILEGES ON acme_training_db.* TO 'acme_user'@'%';
   FLUSH PRIVILEGES;
   EXIT;
   ```

6. **Configure Remote Access**
   ```bash
   # Edit MySQL config
   nano /etc/mysql/mysql.conf.d/mysqld.cnf
   
   # Change bind-address
   bind-address = 0.0.0.0
   
   # Restart MySQL
   systemctl restart mysql
   ```

7. **Setup Firewall**
   ```bash
   # Allow MySQL port
   ufw allow 3306
   ufw enable
   ```

## Production Environment Setup

### Environment Variables (.env.production)
```bash
# Database
DATABASE_URL="mysql://acme_user:password@mysql-host:3306/acme_training_db"

# Stripe (Live Keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# App Configuration
NEXT_PUBLIC_APP_URL="https://acme-training.co.uk"
NODE_ENV="production"
```

### SSL Certificate Setup
```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d acme-training.co.uk -d www.acme-training.co.uk
```

## Migration from SQLite to MySQL

### 1. Backup Current Data
```bash
# Export SQLite data
npx prisma db pull
npx prisma generate
```

### 2. Update Prisma Schema
```prisma
// prisma/schema.prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

### 3. Deploy Schema to MySQL
```bash
# Push schema to MySQL
npx prisma db push

# Generate new client
npx prisma generate
```

### 4. Data Migration Script
```typescript
// scripts/migrate-data.ts
import { PrismaClient as SQLiteClient } from '../src/generated/prisma-sqlite'
import { PrismaClient as MySQLClient } from '../src/generated/prisma'

const sqlite = new SQLiteClient()
const mysql = new MySQLClient()

async function migrateData() {
  // Export from SQLite
  const courses = await sqlite.course.findMany({ include: { sessions: true } })
  const customers = await sqlite.customer.findMany({ include: { bookings: true } })
  
  // Import to MySQL
  for (const course of courses) {
    await mysql.course.create({ data: course })
  }
  
  // ... continue for all models
}

migrateData()
```

## Backup Strategy

### Automated MySQL Backups
```bash
#!/bin/bash
# /home/backup/mysql-backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/backup/mysql"
DB_NAME="acme_training_db"
DB_USER="acme_user"
DB_PASS="your_password"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/acme_backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/acme_backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.gz" -type f -mtime +7 -delete

echo "Backup completed: acme_backup_$DATE.sql.gz"
```

### Crontab Setup
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /home/backup/mysql-backup.sh
```

## Performance Optimization

### MySQL Configuration (/etc/mysql/mysql.conf.d/mysqld.cnf)
```ini
[mysqld]
# Memory settings
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
max_connections = 100

# Performance
query_cache_type = 1
query_cache_size = 64M
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
```

### Connection Pooling (Prisma)
```typescript
// prisma/schema.prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
}

// .env
DATABASE_URL="mysql://user:pass@host:3306/db?connection_limit=10&pool_timeout=20"
```

## Monitoring & Maintenance

### Essential Monitoring
- **Disk Usage:** Monitor MySQL data directory
- **Memory Usage:** Track buffer pool efficiency
- **Connection Count:** Monitor active connections
- **Query Performance:** Review slow query log
- **Backup Verification:** Test restore procedures monthly

### Monthly Tasks
1. Update system packages
2. Review MySQL logs
3. Test backup restoration
4. Check disk space usage
5. Review database performance metrics

## Cost Estimation

### Fasthosts Monthly Costs
- **VPS Medium:** £25-30
- **Managed MySQL Standard:** £20-25
- **SSL Certificate:** £10-15 (or free with Let's Encrypt)
- **Total:** £55-70/month

### Self-Hosted Alternative
- **VPS Large:** £45-60
- **Backup Storage:** £5-10
- **Total:** £50-70/month (+ management time)

## Recommended Setup for ACME Training

1. **Fasthosts Cloud VPS Medium** (2 vCPU, 4GB RAM, 40GB SSD)
2. **Fasthosts Managed MySQL Standard** (5GB, 50 connections)
3. **Let's Encrypt SSL** (Free)
4. **Daily automated backups**
5. **Monitoring with Uptime Robot** (Free tier)

**Total Cost:** ~£50/month
**Benefits:** Professional hosting, managed database, automatic backups, room for growth

---
*Last Updated: September 2025*  
**ACME Training Centre - Production Infrastructure Guide**