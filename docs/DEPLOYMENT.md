# Deployment Guide - APK Rental Management System

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Backend Deployment](#backend-deployment)
3. [Database Setup](#database-setup)
4. [Android App Release](#android-app-release)
5. [Production Configuration](#production-configuration)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing locally
- [ ] Code review completed
- [ ] No console errors or warnings
- [ ] Performance optimized (images compressed, code minified)
- [ ] Security audit completed

### Documentation
- [ ] API documentation updated
- [ ] README updated
- [ ] Setup guide current
- [ ] Changelog updated

### Environment
- [ ] Environment variables configured
- [ ] Database backups available
- [ ] SSL certificates ready
- [ ] DNS records configured

## Backend Deployment

### Using Heroku

#### 1. Prepare for Deployment
```bash
# Create Heroku account and install CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login to Heroku
heroku login

# Create new Heroku app
heroku create rental-management-api

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:standard-0 -a rental-management-api
```

#### 2. Configure Environment Variables
```bash
heroku config:set JWT_SECRET=your_production_secret -a rental-management-api
heroku config:set STRIPE_API_KEY=your_stripe_key -a rental-management-api
heroku config:set SMTP_PASSWORD=your_email_password -a rental-management-api
# ... set other variables
```

#### 3. Deploy
```bash
# Add Heroku remote
heroku git:remote -a rental-management-api

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Using AWS EC2

#### 1. Launch EC2 Instance
```bash
# Choose Ubuntu 20.04 LTS AMI
# Instance type: t3.medium (for production)
# Security group: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)
```

#### 2. Connect and Setup
```bash
ssh -i your-key.pem ubuntu@your-instance-ip

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Install Nginx (reverse proxy)
sudo apt-get install -y nginx
```

#### 3. Deploy Application
```bash
# Create app directory
sudo mkdir -p /var/www/rental-api
sudo chown -R ubuntu:ubuntu /var/www/rental-api

# Clone repository
cd /var/www/rental-api
git clone https://github.com/surf95564/GITHUA.git .
cd backend

# Install dependencies
npm install

# Create .env file with production values
nano .env
```

#### 4. Setup PM2 (Process Manager)
```bash
# Install PM2
sudo npm install -g pm2

# Start application
pm2 start server.js --name "rental-api"

# Enable startup on reboot
pm2 startup
pm2 save

# View logs
pm2 logs rental-api
```

#### 5. Configure Nginx
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/rental-api

# Add this configuration:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable the site
sudo ln -s /etc/nginx/sites-available/rental-api /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### 6. Setup SSL with Let's Encrypt
```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot certonly --nginx -d your-domain.com

# Auto-renew certificates
sudo systemctl enable certbot.timer
```

## Database Setup

### PostgreSQL on Production

#### 1. Initial Setup
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database
CREATE DATABASE rental_db;

# Create user
CREATE USER rental_user WITH PASSWORD 'strong_password_here';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE rental_db TO rental_user;

# Exit
\q
```

#### 2. Run Migrations
```bash
cd /var/www/rental-api/backend

# Run migrations
npm run migrate

# Seed data (optional)
npm run seed
```

#### 3. Backup Strategy
```bash
# Daily backup script
sudo nano /usr/local/bin/backup-db.sh

#!/bin/bash
BACKUP_DIR="/backups/postgresql"
DATE=$(date +\%Y\%m\%d_%H\%M\%S)
BACKUP_FILE="$BACKUP_DIR/rental_db_$DATE.sql"

mkdir -p $BACKUP_DIR
pg_dump -U rental_user -h localhost rental_db > $BACKUP_FILE
gzip $BACKUP_FILE

# Keep only last 30 days of backups
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

# Make executable
sudo chmod +x /usr/local/bin/backup-db.sh

# Add to crontab
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-db.sh
```

## Android App Release

### Build Release APK

#### 1. Configure Release Build
Edit `build.gradle`:
```gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        
        buildConfigField 'String', 'API_BASE_URL', '"https://api.rentalapp.com/api/v1"'
    }
}
```

#### 2. Sign APK
```bash
# Generate keystore (one time only)
keytool -genkey -v -keystore ~/my-app.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias my-key-alias

# Build signed APK
./gradlew assembleRelease

# APK location: app/release/app-release.apk
```

#### 3. Test APK
```bash
# Install on device
adb install -r app/release/app-release.apk

# Test thoroughly
# - Login/registration
# - Item browsing
# - Booking process
# - Payment processing
# - Notifications
```

### Upload to Google Play Store

#### 1. Create Google Play Console Account
- Go to https://play.google.com/console
- Create project
- Add app information

#### 2. Prepare Store Listing
- App title and description
- Screenshots and videos
- Privacy policy
- Content rating questionnaire

#### 3. Upload Release
```bash
# Use Google Play Console web interface
# Upload app bundle or APK
# Set version code: 1
# Set version name: 1.0.0
# Save and review
```

## Production Configuration

### API Configuration (.env)
```env
# Server
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com

# Database
DATABASE_URL=postgresql://user:pass@prod-db.example.com:5432/rental_db

# Authentication
JWT_SECRET=use-strong-random-string-here
JWT_EXPIRE=7d

# Payment
STRIPE_API_KEY=sk_live_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notifications@rentalapp.com
SMTP_PASSWORD=your_app_password

# Logging
LOG_LEVEL=info

# Other
API_RATE_LIMIT=1000
SESSION_SECRET=your_session_secret
```

### Android Configuration
- Update API_BASE_URL to production API
- Update API_KEY
- Disable debug logging
- Disable mock data

## Monitoring

### Backend Monitoring

#### Using PM2 Plus
```bash
# Sign up at pm2.io
pm2 link <secret_key> <api_key>

# Monitor from dashboard
# - Application health
# - CPU/Memory usage
# - Error logs
```

#### Using LogRocket
```bash
# Install in backend
npm install logrocket

# Configure in server.js
const LogRocket = require('logrocket');
LogRocket.init('your-app-id');
```

### Database Monitoring
```bash
# Monitor connections
SELECT * FROM pg_stat_activity;

# Monitor disk usage
SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename))
FROM pg_tables WHERE schemaname != 'information_schema';
```

### Application Metrics
- API response times
- Error rates
- User authentication success/failure
- Payment transaction success rates

## Troubleshooting

### Backend Won't Start
```bash
# Check logs
pm2 logs rental-api

# Check port availability
sudo lsof -i :3000

# Check database connection
npm test:db
```

### High Memory Usage
```bash
# Monitor memory
free -h
top

# Check for memory leaks
node --inspect server.js

# Monitor with Chrome DevTools
```

### Database Connection Errors
```bash
# Test connection
psql -h your-db-host -U rental_user -d rental_db -c "SELECT 1;"

# Check connection pool
SELECT count(*) FROM pg_stat_activity;
```

### SSL Certificate Issues
```bash
# Check certificate validity
sudo ssl-cert-check -c /etc/letsencrypt/live/your-domain.com/cert.pem

# Renew manually if needed
sudo certbot renew --force-renewal
```

## Security Checklist

- [ ] SSL/TLS enabled
- [ ] HTTPS only
- [ ] JWT secrets are strong
- [ ] Database passwords secure
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] Input validation enabled
- [ ] SQL injection protection active
- [ ] XSS protection enabled
- [ ] Dependencies updated
- [ ] Security headers configured
- [ ] Regular backups scheduled

## Support

For deployment issues:
- Email: deploy-support@rentalapp.com
- Documentation: https://docs.rentalapp.com
- GitHub Issues: https://github.com/surf95564/GITHUA/issues
