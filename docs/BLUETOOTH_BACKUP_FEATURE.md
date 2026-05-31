## Bluetooth Printer & Automatic Backup Feature

### Overview

This document details the implementation of Bluetooth printer support and automatic data backup functionality for the APK Rental Management System.

### Table of Contents

1. [Bluetooth Printer Feature](#bluetooth-printer-feature)
2. [Receipt Auto-Save](#receipt-auto-save)
3. [Automatic Data Backup](#automatic-data-backup)
4. [API Endpoints](#api-endpoints)
5. [Configuration](#configuration)
6. [Implementation Guide](#implementation-guide)

---

## Bluetooth Printer Feature

### Supported Devices

- **Thermal Receipt Printers** (80mm, 58mm)
- **Portable Bluetooth Printers**
- **Mobile Label Printers**
- Standard ESC/POS compatible devices

### Device Discovery and Pairing

#### 1. Scan for Devices
```javascript
// Admin scans for available Bluetooth devices
POST /api/bluetooth/scan
Response:
{
  "success": true,
  "deviceCount": 3,
  "devices": [
    {
      "mac": "00:1A:7D:DA:71:13",
      "name": "Thermal Printer 1",
      "signalStrength": -45,
      "isPrinter": true
    }
  ]
}
```

#### 2. Pair Device
```javascript
POST /api/bluetooth/pair
Body:
{
  "macAddress": "00:1A:7D:DA:71:13",
  "pinCode": "0000"
}
```

#### 3. Connect to Printer
```javascript
POST /api/bluetooth/connect
Body:
{
  "macAddress": "00:1A:7D:DA:71:13"
}
```

### Printing Process

#### Print Receipt
```javascript
POST /api/bluetooth/print
Body:
{
  "macAddress": "00:1A:7D:DA:71:13",
  "receiptContent": {
    "header": "APK Rental Store",
    "items": [
      {
        "description": "Bike Rental - 24 hours",
        "quantity": 1,
        "price": 25.00,
        "total": 25.00
      }
    ],
    "subtotal": 25.00,
    "tax": 2.50,
    "total": 27.50,
    "paymentMethod": "Cash",
    "footer": "Thank you for your business!"
  },
  "copies": 1,
  "autoSave": true,
  "autoSaveFormat": "pdf",
  "transactionId": "TXN_12345"
}

Response:
{
  "success": true,
  "printedAt": "2026-05-31T12:30:00Z",
  "printerMAC": "00:1A:7D:DA:71:13",
  "copies": 1,
  "bytesTransferred": 2048,
  "autoSavedPath": "./receipts/receipt_20260531_123000.pdf"
}
```

---

## Receipt Auto-Save

### How It Works

1. **During Print**: When a receipt is printed to Bluetooth printer, system auto-saves it
2. **Multiple Formats**: Save as PDF, Image, or CSV
3. **Automatic Metadata**: Captures transaction ID, user, time, and printer info
4. **Searchable Archive**: Users can retrieve saved receipts anytime

### File Storage

```
./receipts/
├── receipt_20260531_123000.pdf
├── receipt_20260531_123001.pdf
├── receipt_20260530_145030.pdf
└── ...
```

### Retrieve Auto-Saved Receipts

```javascript
// Get all saved receipts
GET /api/bluetooth/receipts?limit=50&offset=0&format=pdf
Response:
{
  "success": true,
  "count": 50,
  "receipts": [
    {
      "id": "saved_1717130400000",
      "fileName": "receipt_20260531_123000.pdf",
      "receiptNumber": "RCP_001234",
      "transactionId": "TXN_12345",
      "printerUsed": "00:1A:7D:DA:71:13",
      "printedBy": "user_123",
      "savedAt": "2026-05-31T12:30:00Z",
      "printedAt": "2026-05-31T12:30:00Z",
      "format": "pdf",
      "fileSize": 15360
    }
  ]
}

// Get specific receipt
GET /api/bluetooth/receipts/saved_1717130400000
```

---

## Automatic Data Backup

### Backup Types

| Type | Description | Frequency |
|------|-------------|-----------|
| **receipts** | All receipt records | Daily, Weekly, Monthly |
| **transactions** | All transaction records | Daily, Weekly, Monthly |
| **all** | Complete data snapshot | Daily, Weekly, Monthly |

### Backup Formats

- **ZIP**: Compressed archive (recommended for large datasets)
- **TAR**: Unix tape archive
- **CSV**: Comma-separated values (for spreadsheet import)
- **PDF**: Formatted report with charts

### Email Delivery

All backups can be automatically emailed to specified recipients:

```javascript
POST /api/backup/schedules
Body:
{
  "backupType": "all",
  "frequency": "daily",
  "scheduledTime": "02:00",
  "emailEnabled": true,
  "recipientEmails": [
    "admin@rentalapp.com",
    "manager@rentalapp.com"
  ],
  "attachmentFormat": "zip",
  "retentionDays": 90
}

Response:
{
  "success": true,
  "scheduleId": "backup_1717130400000",
  "schedule": {
    "id": "backup_1717130400000",
    "backupType": "all",
    "frequency": "daily",
    "scheduledTime": "02:00",
    "status": "active",
    "nextBackupTime": "2026-06-01T02:00:00Z"
  }
}
```

### Manual Backup

Create an immediate backup:

```javascript
POST /api/backup/instant
Body:
{
  "backupType": "receipts",
  "attachmentFormat": "zip",
  "emailRecipients": [
    "admin@rentalapp.com"
  ]
}

Response:
{
  "success": true,
  "backupId": "exec_1717130500000",
  "backupFile": {
    "fileName": "backup_20260531_exec_1717130500000.zip",
    "filePath": "./backups/backup_20260531_exec_1717130500000.zip",
    "size": 102400,
    "format": "zip"
  },
  "sentTo": ["admin@rentalapp.com"]
}
```

### Backup Retention

- **Default**: 90 days
- **Automatic Cleanup**: Old backups deleted after retention period
- **Configuration**: Set per schedule in admin panel

---

## API Endpoints

### Bluetooth Printer APIs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/bluetooth/scan` | Scan for Bluetooth devices | Admin |
| POST | `/api/bluetooth/pair` | Pair with device | Admin |
| POST | `/api/bluetooth/connect` | Connect to printer | Admin |
| POST | `/api/bluetooth/disconnect` | Disconnect printer | Admin |
| GET | `/api/bluetooth/connected` | List connected printers | Admin |
| POST | `/api/bluetooth/print` | Send print job | User |
| GET | `/api/bluetooth/receipts` | Get auto-saved receipts | User |
| GET | `/api/bluetooth/receipts/:id` | Get specific receipt | User |
| DELETE | `/api/bluetooth/receipts/:id` | Delete receipt | Admin |

### Backup APIs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/backup/schedules` | List all schedules | Admin |
| GET | `/api/backup/schedules/:id` | Get schedule details | Admin |
| POST | `/api/backup/schedules` | Create new schedule | Admin |
| PUT | `/api/backup/schedules/:id` | Update schedule | Admin |
| DELETE | `/api/backup/schedules/:id` | Delete schedule | Admin |
| POST | `/api/backup/execute` | Execute scheduled backup | Admin |
| POST | `/api/backup/instant` | Create instant backup | Admin |
| GET | `/api/backup/history` | Get backup history | Admin |
| GET | `/api/backup/status` | Get current status | Admin |

---

## Configuration

### Environment Variables

```env
# Bluetooth Configuration
BLUETOOTH_ENABLED=true
BLUETOOTH_SCAN_TIMEOUT=10000
BLUETOOTH_CONNECTION_TIMEOUT=30000

# Printer Settings
RECEIPT_PAPER_WIDTH=80
RECEIPT_AUTO_CUT=true
RECEIPT_AUTO_SAVE=true
RECEIPT_SAVE_FORMAT=pdf

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_RETENTION_DAYS=90
BACKUP_MAX_CONCURRENT=1

# Email for Backups
BACKUP_EMAIL_ENABLED=true
BACKUP_EMAIL_HOST=smtp.gmail.com
BACKUP_EMAIL_PORT=587
BACKUP_EMAIL_SECURE=false
BACKUP_EMAIL_USER=backup@rentalapp.com
BACKUP_EMAIL_PASSWORD=your_app_specific_password
```

### Admin Panel Settings

1. **Printer Setup**
   - Navigate to Settings → Bluetooth Printers
   - Scan for devices
   - Pair printers
   - Set default printer
   - Configure auto-save settings

2. **Backup Configuration**
   - Navigate to Settings → Data Backup
   - Create backup schedule
   - Set frequency and time
   - Configure email recipients
   - Set retention policy

---

## Implementation Guide

### Step 1: Install Dependencies

```bash
npm install noble nodemailer archiver pdf-lib sharp
```

### Step 2: Initialize Services

```javascript
// server.js
const BluetoothPrinterService = require('./services/BluetoothPrinterService');
const AutoBackupService = require('./services/AutoBackupService');

const bluetoothService = new BluetoothPrinterService(database, config);
const backupService = new AutoBackupService(database, emailConfig);

// Register event listeners
bluetoothService.on('print-completed', (data) => {
  console.log('Print job completed:', data);
});

backupService.on('backup-completed', (data) => {
  console.log('Backup completed:', data);
});
```

### Step 3: Register Routes

```javascript
// server.js
const bluetoothRoutes = require('./routes/bluetoothPrinterRoutes');
const backupRoutes = require('./routes/backupRoutes');

app.use('/api/bluetooth', bluetoothRoutes);
app.use('/api/backup', backupRoutes);
```

### Step 4: Create Directories

```bash
mkdir -p receipts backups logs
chmod 755 receipts backups logs
```

### Step 5: Run Migrations

```bash
# Create database tables for:
# - bluetooth_printers
# - saved_receipts
# - backup_schedules
# - backup_history
# - backup_email_logs
npm run migrate
```

---

## Security Considerations

### Bluetooth Security
- Require PIN for pairing
- Encryption enabled for all connections
- MAC address whitelisting
- Auto-disconnect after timeout

### Backup Security
- Encrypt sensitive data before backup
- Use secure SMTP with TLS/SSL
- Encrypt email attachments
- Audit all backup operations
- Implement access control for backup files

### Receipt Privacy
- Auto-saved receipts accessible only to authorized users
- Audit logging for receipt access
- Secure file storage with appropriate permissions
- Regular cleanup of old receipts

---

## Troubleshooting

### Bluetooth Connection Issues
- Ensure device is in pairing mode
- Check signal strength
- Verify Bluetooth adapter is enabled
- Check MAC address is correct

### Printer Not Printing
- Verify connection status
- Check paper and toner levels
- Test ESC/POS command format
- Review printer error logs

### Backup Not Sending
- Verify SMTP credentials
- Check email recipient addresses
- Ensure backup file was created
- Review email service logs

### Auto-Save Not Working
- Verify receipts directory exists
- Check disk space
- Verify user permissions
- Review receipt save logs

---

## Future Enhancements

- [ ] Mobile app Bluetooth printing support
- [ ] Cloud backup integration (AWS S3, Google Drive)
- [ ] Advanced receipt templates
- [ ] Scheduled backup notifications
- [ ] Backup integrity verification
- [ ] Incremental backups
- [ ] Backup encryption
- [ ] Receipt digital signatures
- [ ] Multi-printer load balancing
- [ ] Print job history and analytics

