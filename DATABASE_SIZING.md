# Database Sizing & Infrastructure Planning

## Estimated Database Size for UK-Wide Training Centers

### Growth Projections

#### Conservative Estimate (Year 1)
- **Training Centers**: 50-100 tenants
- **Courses per Tenant**: 10-20 courses
- **Students**: 2,000-5,000 total across all tenants
- **Bookings per Month**: 500-1,000
- **Database Size**: **2-5 GB**

#### Medium Growth (Year 2-3)
- **Training Centers**: 200-500 tenants
- **Courses per Tenant**: 15-30 courses
- **Students**: 20,000-50,000 total
- **Bookings per Month**: 5,000-10,000
- **Database Size**: **20-50 GB**

#### Large Scale (Year 5+)
- **Training Centers**: 1,000+ tenants (covering most UK regions)
- **Courses per Tenant**: 20-50 courses
- **Students**: 100,000+ total
- **Bookings per Month**: 20,000-50,000
- **Database Size**: **100-200 GB**

### Database Breakdown by Table

| Table | Records (Year 1) | Size per Record | Total Size |
|-------|------------------|-----------------|------------|
| Tenant | 100 | 2 KB | 200 KB |
| AdminUser | 200 | 1 KB | 200 KB |
| Course | 1,500 | 3 KB | 4.5 MB |
| Session | 5,000 | 2 KB | 10 MB |
| Customer/Student | 5,000 | 2 KB | 10 MB |
| Booking | 10,000 | 3 KB | 30 MB |
| Achievement | 20,000 | 1 KB | 20 MB |
| Email Templates | 500 | 5 KB | 2.5 MB |
| Logs/Audit | 100,000 | 500 B | 50 MB |

**Total Year 1**: ~130 MB + overhead = **2-5 GB** (with indexes, temp tables, etc.)

---

## Recommended Database: PostgreSQL

### Why PostgreSQL?

✅ **Production-Ready Features**
- ACID compliance (data integrity)
- Row-level security (perfect for multi-tenant)
- Full-text search
- JSON/JSONB support (your app uses JSON fields)
- Excellent Prisma support
- Free and open-source

✅ **Scalability**
- Handles millions of rows easily
- Supports replication
- Partition tables for large datasets

✅ **Security**
- SSL/TLS connections
- Role-based access control
- Encryption at rest

### Initial Database Specs (Year 1)

**Minimum Requirements:**
- **Storage**: 20 GB SSD (allows 4x growth)
- **RAM**: 2 GB dedicated
- **CPU**: 2 vCPU cores
- **Connections**: 100 max concurrent
- **Backups**: Daily automated backups with 30-day retention

**Recommended Specs:**
- **Storage**: 50 GB SSD
- **RAM**: 4 GB dedicated
- **CPU**: 4 vCPU cores
- **Connections**: 200 max concurrent
- **Backups**: Daily + point-in-time recovery

---

## Migration from SQLite to PostgreSQL

Your app currently uses SQLite. Here's how to migrate:

### 1. Update Prisma Schema

```prisma
// In prisma/schema.prisma, change:
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. Update DATABASE_URL

```bash
# PostgreSQL connection string format:
DATABASE_URL="postgresql://username:password@host:5432/database_name?schema=public&sslmode=require"
```

### 3. Run Migration

```bash
# Generate new migration for PostgreSQL
npx prisma migrate dev --name postgresql_migration

# Or deploy to production
npx prisma migrate deploy
```

### 4. Data Migration (if needed)

If you have existing SQLite data:

```bash
# Export SQLite data
sqlite3 prisma/dev.db .dump > backup.sql

# Use pgloader or manual import to PostgreSQL
# Or use Prisma Studio to export/import data
```

---

## Database Connection Pooling

For production, use connection pooling to handle multiple requests efficiently:

### Option 1: PgBouncer (Recommended)
- Reduces database connections
- Improves performance under load
- Standard PostgreSQL tool

### Option 2: Prisma Data Proxy
- Managed connection pooling
- Serverless-friendly
- Built-in to Prisma

### Configuration

```javascript
// In src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

## Backup Strategy

### Daily Backups (Minimum)
```bash
# Automated PostgreSQL backup
pg_dump -h host -U user -d database > backup_$(date +%Y%m%d).sql
```

### Point-in-Time Recovery (Recommended)
- Continuous WAL (Write-Ahead Log) archiving
- Restore to any point within last 7-30 days
- Essential for production

### Off-Site Backups
- Store backups in different location (S3, Backblaze, etc.)
- Test restore procedures monthly

---

## Monitoring & Maintenance

### Essential Metrics to Monitor
1. **Database Size** - Growth rate
2. **Connections** - Number of active connections
3. **Query Performance** - Slow query log
4. **Disk Space** - Available storage
5. **CPU/Memory** - Resource usage

### Maintenance Tasks
- **Weekly**: Vacuum and analyze tables
- **Monthly**: Review slow queries and add indexes
- **Quarterly**: Review growth and plan scaling
- **Annually**: Archive old data

### Recommended Tools
- **pgAdmin** - Database management
- **pg_stat_statements** - Query performance tracking
- **Grafana + Prometheus** - Monitoring dashboards

---

## Cost Estimates

### Database Hosting Options

#### Option 1: Fasthosts VPS + Self-Managed PostgreSQL
- **VPS**: £20-40/month (4 GB RAM, 50 GB SSD)
- **Backups**: Included or +£5/month
- **Total**: ~£25-45/month
- **Pros**: Full control, UK-based
- **Cons**: Manual management, setup required

#### Option 2: Managed PostgreSQL (Recommended for Production)
**DigitalOcean Managed Database:**
- **Starter**: £15/month (1 GB RAM, 10 GB storage)
- **Production**: £40/month (2 GB RAM, 25 GB storage)
- **Scaling**: £80/month (4 GB RAM, 50 GB storage)

**AWS RDS PostgreSQL:**
- **Starter (db.t3.micro)**: £15/month
- **Production (db.t3.small)**: £35/month
- **Pros**: Auto-scaling, automated backups, high availability
- **Cons**: Higher cost, US-based (add latency)

**Railway.app (Great for startups):**
- **Starter**: $5/month (500 MB storage)
- **Pro**: $20/month (8 GB storage)
- **Pros**: Simple setup, includes automatic backups
- **Cons**: Limited to smaller databases

---

## Scaling Strategy

### When to Scale Up

**Database needs upgrading when:**
- ✓ Storage > 70% full
- ✓ CPU consistently > 70%
- ✓ RAM usage > 80%
- ✓ Query response times > 500ms
- ✓ Connection pool maxing out

### Vertical Scaling (Easier)
1. Increase RAM (2 GB → 4 GB → 8 GB)
2. Add storage (50 GB → 100 GB → 200 GB)
3. Upgrade CPU cores

### Horizontal Scaling (Advanced)
1. **Read Replicas** - Offload read queries
2. **Sharding** - Split data across databases (by region)
3. **Caching Layer** - Redis for frequently accessed data

---

## Security Best Practices

### Database Security Checklist
- [ ] Use strong database passwords (20+ characters)
- [ ] Enable SSL/TLS for all connections
- [ ] Restrict database access to application server IP only
- [ ] Disable public database access
- [ ] Use separate database users for application vs admin
- [ ] Enable query logging for audit trail
- [ ] Regular security updates
- [ ] Encrypt backups
- [ ] Implement database firewall rules

### Connection String Security
```bash
# NEVER commit this to git!
# Store in environment variables only

# Format with SSL:
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# For extra security, use connection pooling proxy
DATABASE_URL="postgresql://user:pass@pgbouncer:6432/db?sslmode=require"
```

---

## Performance Optimization

### Essential Indexes (Already in Prisma Schema)
Your schema already has most indexes, but verify:

```sql
-- Check existing indexes
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Add custom indexes if needed for performance
CREATE INDEX idx_bookings_session_date ON "Booking"("sessionId", "createdAt");
CREATE INDEX idx_sessions_tenant_date ON "Session"("tenantId", "startDate");
```

### Query Optimization
1. Use `SELECT` with specific fields (not `SELECT *`)
2. Add `take` limits to large queries
3. Use Prisma's `findMany` with pagination
4. Implement caching for frequently accessed data

### Connection Pool Settings

```javascript
// Optimal settings for 4 GB RAM database
datasourceUrl: `${process.env.DATABASE_URL}?connection_limit=20&pool_timeout=20`
```

---

## Recommended Setup for Your Use Case

### Year 1 Starter Setup (50-100 Tenants)

**VPS/Server:**
- **RAM**: 4 GB
- **CPU**: 2-4 cores
- **Storage**: 80 GB SSD (40 GB app, 40 GB database)
- **Bandwidth**: 2 TB/month

**Database:**
- **PostgreSQL 16** (latest stable)
- **Storage**: 50 GB (shared with app or separate)
- **RAM**: 2 GB dedicated
- **Backups**: Daily automated

**Estimated Cost**: £30-50/month total

### Year 2-3 Growth Setup (200-500 Tenants)

**VPS/Server:**
- **RAM**: 8 GB
- **CPU**: 4 cores
- **Storage**: 200 GB SSD
- **Bandwidth**: 5 TB/month

**Database:**
- **PostgreSQL 16**
- **Storage**: 100 GB
- **RAM**: 4 GB dedicated
- **Backups**: Daily + point-in-time recovery

**Estimated Cost**: £60-100/month total

---

## Next Steps

1. **Choose Hosting Provider** (see analysis below)
2. **Set up PostgreSQL database**
3. **Update Prisma schema to PostgreSQL**
4. **Configure backups**
5. **Set up monitoring**
6. **Test with production-like data volume**
7. **Plan scaling strategy**

