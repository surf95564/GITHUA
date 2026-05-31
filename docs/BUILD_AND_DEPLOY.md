# App Build and Deployment Guide

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Project Setup](#project-setup)
3. [Database Setup](#database-setup)
4. [Backend Build](#backend-build)
5. [Frontend Build](#frontend-build)
6. [Configuration](#configuration)
7. [Running the Application](#running-the-application)
8. [Docker Deployment](#docker-deployment)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum Requirements
- **OS**: Windows 10/11, macOS 10.15+, Ubuntu 18.04+
- **RAM**: 8GB minimum (16GB recommended)
- **Disk Space**: 10GB minimum
- **Node.js**: v16.x or v18.x (LTS recommended)
- **NPM**: v8.x or higher
- **Git**: v2.30+

### Development Tools
- Visual Studio Code or similar IDE
- Android Studio (for Android app development)
- Docker & Docker Compose (optional, for containerization)
- Postman (optional, for API testing)

### Required Services
- MongoDB or PostgreSQL database
- SMTP server (for email backups)
- Bluetooth adapter (for printer testing)

---

## Project Setup

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/surf95564/GITHUA.git
cd GITHUA

# Verify project structure
ls -la
```

### Step 2: Install Node.js Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install global development tools
npm install -g nodemon
npm install -g concurrently
```

### Step 3: Install Required Packages

```bash
# Bluetooth and printing
npm install noble nodemailer

# File handling
npm install archiver pdf-lib sharp

# Database (choose one)
npm install mongodb  # For MongoDB
# OR
npm install pg      # For PostgreSQL

# Utilities
npm install dotenv joi express-validator
```

### Step 4: Create Environment Files

Create `.env` file in backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
LOG_LEVEL=debug

# Database Configuration
DB_TYPE=mongodb  # or postgresql
DB_HOST=localhost
DB_PORT=27017    # 5432 for PostgreSQL
DB_NAME=githua_db
DB_USER=admin
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Bluetooth Configuration
BLUETOOTH_ENABLED=true
BLUETOOTH_SCAN_TIMEOUT=10000
BLUETOOTH_CONNECTION_TIMEOUT=30000

# Receipt Settings
RECEIPT_PAPER_WIDTH=80
RECEIPT_AUTO_CUT=true
RECEIPT_AUTO_SAVE=true
RECEIPT_SAVE_FORMAT=pdf

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_RETENTION_DAYS=90
BACKUP_EMAIL_ENABLED=true

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your_app_specific_password
SMTP_FROM_EMAIL=noreply@rentalapp.com
SMTP_FROM_NAME=APK Rental Management

# API Configuration
API_BASE_URL=http://localhost:5000/api
CORS_ORIGIN=http://localhost:3000,http://localhost:8080

# File Storage
UPLOAD_DIR=./uploads
RECEIPT_DIR=./receipts
BACKUP_DIR=./backups
MAX_UPLOAD_SIZE=50mb
```

---

## Database Setup

### MongoDB Setup

```bash
# Install MongoDB (macOS)
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Create database and collections
mongo
> use githua_db
> db.createCollection("users")
> db.createCollection("transactions")
> db.createCollection("rentals")
> db.createCollection("receipts")
> db.createCollection("amendments")
> db.createCollection("backup_schedules")
> db.createCollection("bluetooth_printers")
```

### PostgreSQL Setup

```bash
# Install PostgreSQL (macOS)
brew install postgresql

# Start PostgreSQL service
brew services start postgresql

# Create database
createdb githua_db

# Create tables (run migrations)
psql -d githua_db -f database/schema.sql
```

### Run Migrations

```bash
cd backend
npm run migrate

# Or manually run migration files
node database/migrations/001_create_tables.js
```

---

## Backend Build

### Step 1: Build Backend Code

```bash
cd backend

# Install dependencies
npm install

# Run linting
npm run lint

# Run unit tests
npm test

# Build/compile (if using TypeScript)
npm run build
```

### Step 2: Create Directory Structure

```bash
# Create required directories
mkdir -p uploads receipts backups logs

# Set permissions
chmod 755 uploads receipts backups logs
```

### Step 3: Verify Backend Setup

```bash
# Start development server
npm run dev

# Expected output:
# Server running on port 5000
# Database connected
# Bluetooth service initialized
```

---

## Frontend Build

### Android App Build (if applicable)

```bash
cd app

# Build APK (debug)
./gradlew assembleDebug

# Build APK (release)
./gradlew assembleRelease

# Run on emulator
./gradlew emulator
```

### Web Frontend Build (if applicable)

```bash
cd frontend

# Install dependencies
npm install

# Build production version
npm run build

# Start development server
npm run dev
```

---

## Configuration

### Admin User Setup

```bash
# Create admin user script
node backend/scripts/create-admin.js

# Or via API
curl -X POST http://localhost:5000/api/auth/admin-setup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "secure_password_123",
    "email": "admin@rentalapp.com"
  }'
```

### Configure Printers

```bash
# Access admin panel
# Navigate to Settings → Printer Configuration
# 1. Scan for Bluetooth devices
# 2. Pair available printers
# 3. Set default printer
# 4. Configure auto-save settings
```

### Configure Backups

```bash
# Access admin panel
# Navigate to Settings → Data Backup
# 1. Create backup schedule
# 2. Set frequency (daily at 2:00 AM)
# 3. Add recipient emails
# 4. Set retention policy (90 days)
# 5. Enable backup
```

### Configure Receipt Numbering

```bash
# Access admin panel
# Navigate to Settings → Receipt Numbering
# 1. Review default sequence (RCP-001000)
# 2. Create custom sequences if needed
# 3. Set format: RCP-{YYYY}-{MM}-{SEQUENCE}
# 4. Configure zero-padding (6 digits)
```

---

## Running the Application

### Development Mode

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend (if applicable)
cd frontend
npm run dev

# Terminal 3: Start database (if using MongoDB local)
mongod
```

### Production Mode

```bash
# Build frontend
cd frontend
npm run build

# Start backend in production
cd backend
NODE_ENV=production npm start
```

### Using PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start ecosystem.config.js

# Monitor processes
pm2 monit

# View logs
pm2 logs

# Restart application
pm2 restart all
```

### Using Docker

```bash
# Build Docker image
docker build -t githua-app .

# Run container
docker run -d \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e DB_HOST=mongo \
  --link mongo:mongo \
  githua-app

# Or use Docker Compose
docker-compose up -d
```

---

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY backend/ .

# Create directories
RUN mkdir -p uploads receipts backups logs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "server.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DB_HOST=mongo
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis
    volumes:
      - ./uploads:/app/uploads
      - ./receipts:/app/receipts
      - ./backups:/app/backups
    restart: unless-stopped

  mongo:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=githua_db
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

volumes:
  mongo_data:
```

---

## Testing

### Unit Tests

```bash
cd backend

# Run all tests
npm test

# Run specific test file
npm test -- tests/services/BluetoothPrinterService.test.js

# Run with coverage
npm test -- --coverage
```

### Integration Tests

```bash
# Run integration tests
npm run test:integration

# Run with verbose output
npm test -- --verbose
```

### API Testing with Postman

```bash
# Import Postman collection
# 1. Open Postman
# 2. Import: postman/GITHUA-API.collection.json
# 3. Set environment variables
# 4. Run requests
```

### Manual Testing Checklist

- [ ] User registration and login
- [ ] Create rental transaction
- [ ] Bluetooth printer connection
- [ ] Receipt printing
- [ ] Receipt auto-save
- [ ] Data amendment
- [ ] Backup scheduling
- [ ] Backup email delivery
- [ ] Admin panel access

---

## Troubleshooting

### Backend Won't Start

```bash
# Check Node.js version
node --version  # Should be v16+ or v18+

# Check port availability
lsof -i :5000

# Check logs
tail -f logs/error.log

# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Error

```bash
# Test MongoDB connection
mongo --host localhost --port 27017

# Test PostgreSQL connection
psql -h localhost -d githua_db -U admin

# Check connection string in .env
cat .env | grep DB_
```

### Bluetooth Issues

```bash
# Check Bluetooth adapter
hciconfig  # On Linux

# Verify Bluetooth permissions
sudo setcap cap_net_raw,cap_net_admin+ep $(npm bin)/noble

# Check Bluetooth service status
systemctl status bluetooth  # Linux
```

### Email/SMTP Issues

```bash
# Test SMTP connection
npm run test:smtp

# Check email logs
tail -f logs/email.log

# Verify SMTP credentials in .env
cat .env | grep SMTP_
```

### Printer Issues

```bash
# List connected Bluetooth devices
hcitool scan

# Check printer driver
lpstat -t  # On Linux

# Verify ESC/POS compatibility
npm run test:printer
```

---

## Production Checklist

- [ ] Update all environment variables
- [ ] Enable HTTPS/SSL
- [ ] Set strong JWT secret
- [ ] Enable database backups
- [ ] Configure monitoring and alerts
- [ ] Set up log aggregation
- [ ] Enable rate limiting
- [ ] Set up CDN for static files
- [ ] Enable CORS properly
- [ ] Test all functionality
- [ ] Run security audit
- [ ] Document deployment process

---

## Support

For issues and questions:
1. Check documentation: `docs/`
2. Review logs: `logs/`
3. Check GitHub issues: github.com/surf95564/GITHUA/issues
4. Contact support: support@rentalapp.com

