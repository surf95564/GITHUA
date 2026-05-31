# Printer & Email Configuration Guide

## Overview

This document describes the admin printer settings and email configuration for the APK Rental Management System's receipt and report printing/emailing feature.

## Table of Contents

1. [Printer Configuration](#printer-configuration)
2. [Email Configuration](#email-configuration)
3. [Print Jobs](#print-jobs)
4. [API Endpoints](#api-endpoints)
5. [Setup Instructions](#setup-instructions)

---

## Printer Configuration

### Supported Printer Types

- **Local Printers**: Directly connected to the server via USB or parallel port
- **Network Printers**: Accessed over LAN/WAN via IP address
- **Cloud Printers**: Google Cloud Print, Octoprint, or similar services
- **Bluetooth Printers**: Mobile printers connected via Bluetooth

### Printer Settings

Each printer configuration includes:

```javascript
{
  id: String,                    // Unique printer ID
  name: String,                  // Friendly name (e.g., "Receipt Printer - Counter 1")
  type: String,                  // local, network, cloud, bluetooth
  ip: String,                    // IP address (for network printers)
  port: Number,                  // Port number (default: 9100)
  hostname: String,              // Hostname (alternative to IP)
  model: String,                 // Printer model
  brand: String,                 // Printer brand
  paperSize: String,             // A4, LETTER, RECEIPT_80MM, RECEIPT_58MM
  printQuality: String,          // low, medium, high, best
  colorMode: String,             // monochrome or color
  isDefault: Boolean,            // Default printer for all print jobs
  isActive: Boolean,             // Currently enabled
  status: String,                // idle, printing, error, offline
  lastStatusCheck: Date,         // Last connection check
}
```

### Supported Paper Sizes

- **A4**: Standard office paper (210 × 297 mm)
- **A5**: Half A4 (148 × 210 mm)
- **LETTER**: US Letter (8.5 × 11 in)
- **LEGAL**: US Legal (8.5 × 14 in)
- **RECEIPT_80MM**: Receipt paper 80mm width
- **RECEIPT_58MM**: Receipt paper 58mm width

### Setting a Default Printer

1. Go to Admin Panel → Printer Settings
2. Select the printer to set as default
3. Toggle "Set as Default"
4. All print jobs will route to this printer if no specific printer is selected

---

## Email Configuration

### SMTP Configuration

Store the following in your environment variables or secure config:

```javascript
{
  enabled: Boolean,              // Enable/disable email
  smtpHost: String,              // e.g., "smtp.gmail.com"
  smtpPort: Number,              // Usually 587 (TLS) or 465 (SSL)
  smtpSecure: Boolean,           // true for 465, false for 587
  senderEmail: String,           // "noreply@rentalapp.com"
  senderName: String,            // "Rental App"
  authUser: String,              // SMTP username
  authPassword: String,          // SMTP password (ENCRYPTED)
  defaultRecipient: String,      // Default email for reports
  allowUserEmail: Boolean,       // Allow users to email reports
  emailTemplateType: String,     // html, text, or both
  includeAttachment: Boolean,    // Attach document to email
  attachmentFormat: String,      // pdf, image, etc.
}
```

### Environment Variables

Create a `.env` file in the backend directory:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM_EMAIL=noreply@rentalapp.com
SMTP_FROM_NAME=APK Rental Management
```

**Note**: For Gmail, use an [App-Specific Password](https://myaccount.google.com/apppasswords) instead of your regular password.

---

## Print Jobs

### Print Job Status Workflow

```
Queued → Printing → Completed
          ↓
        Failed → (Retry) → Queued
```

### Print Job Priority Levels

1. **Urgent** (0): Emergency or priority receipts
2. **High** (1): Management reports
3. **Normal** (2): Regular receipts and reports (default)
4. **Low** (3): Background jobs, logs

Jobs are processed based on priority; higher priority jobs queue before lower priority ones.

### Print Job Properties

```javascript
{
  id: String,                    // Unique job ID
  printerId: String,             // Target printer ID
  documentType: String,          // receipt, report, invoice, label
  documentId: String,            // Reference to rental/transaction ID
  fileName: String,              // Original file name
  fileSize: Number,              // Size in bytes
  priority: String,              // urgent, high, normal, low
  status: String,                // queued, printing, completed, failed, cancelled
  pages: Number,                 // Number of pages to print
  copies: Number,                // Number of copies
  paperSize: String,             // Paper size
  colorMode: String,             // monochrome or color
  printQuality: String,          // Print quality
  userId: String,                // User who initiated print
  createdAt: Date,
  startedAt: Date,
  completedAt: Date,
  errorMessage: String,          // Error details if failed
}
```

---

## API Endpoints

### Printer Management

#### Get All Printers
```
GET /api/printers
Authorization: Bearer {token}
Admin only
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "printer_1",
      "name": "Receipt Printer",
      "type": "network",
      "isDefault": true,
      "status": "idle"
    }
  ]
}
```

#### Add New Printer
```
POST /api/printers
Authorization: Bearer {token}
Admin only

Body:
{
  "name": "Receipt Printer",
  "type": "network",
  "ip": "192.168.1.100",
  "port": 9100,
  "paperSize": "RECEIPT_80MM",
  "colorMode": "monochrome",
  "isDefault": true
}
```

#### Update Printer Configuration
```
PUT /api/printers/{printerId}
Authorization: Bearer {token}
Admin only
```

#### Delete Printer
```
DELETE /api/printers/{printerId}
Authorization: Bearer {token}
Admin only
```

#### Check Printer Status
```
GET /api/printers/{printerId}/status
Authorization: Bearer {token}
Admin only
```

#### Send Test Print
```
POST /api/printers/{printerId}/test
Authorization: Bearer {token}
Admin only
```

### Print Jobs

#### Submit Print Job
```
POST /api/print-jobs
Authorization: Bearer {token}

Body:
{
  "printerId": "printer_1",
  "documentType": "receipt",
  "documentId": "rental_12345",
  "fileName": "receipt_12345.pdf",
  "priority": "normal",
  "copies": 1
}
```

#### Get Job Status
```
GET /api/print-jobs/{jobId}
Authorization: Bearer {token}
```

#### Get Job History
```
GET /api/print-jobs?status=completed&startDate=2026-05-01
Authorization: Bearer {token}
```

#### Cancel Job
```
POST /api/print-jobs/{jobId}/cancel
Authorization: Bearer {token}
```

#### Retry Failed Job
```
POST /api/print-jobs/{jobId}/retry
Authorization: Bearer {token}
Admin only
```

### Email Configuration

#### Get Email Configuration
```
GET /api/printers/config/email
Authorization: Bearer {token}
Admin only
```

#### Update Email Configuration
```
POST /api/printers/config/email
Authorization: Bearer {token}
Admin only

Body:
{
  "smtpHost": "smtp.gmail.com",
  "smtpPort": 587,
  "senderEmail": "noreply@rentalapp.com",
  "authUser": "your-email@gmail.com",
  "authPassword": "encrypted-password"
}
```

---

## Setup Instructions

### 1. Admin Panel - Printer Setup

1. Log in as Admin
2. Navigate to **Settings → Printer Configuration**
3. Click **Add New Printer**
4. Fill in printer details:
   - **Name**: Descriptive name for identification
   - **Type**: Select printer type (local, network, cloud, bluetooth)
   - **IP/Port**: For network printers, enter IP and port
   - **Paper Size**: Select default paper size
   - **Color Mode**: Monochrome or Color
   - **Set as Default**: Check to make this the default printer
5. Click **Test Print** to verify configuration
6. Click **Save**

### 2. Email Configuration

1. Navigate to **Settings → Email Configuration**
2. Enable email functionality
3. Enter SMTP details:
   - **SMTP Host**: Your email provider's SMTP server
   - **SMTP Port**: Usually 587 or 465
   - **From Email**: System email address
   - **Username**: SMTP account username
   - **Password**: SMTP account password (will be encrypted)
4. Test connection
5. Save configuration

### 3. Configure Report Distribution

1. Navigate to **Settings → Report Distribution**
2. Set up automatic report schedules:
   - **Daily Sales Report**: Emailed daily at specified time
   - **Weekly Inventory**: Weekly reporting to stakeholders
3. Specify recipients and format (PDF, CSV, etc.)

---

## Troubleshooting

### Printer Not Printing

- **Check Status**: Verify printer status is "idle" or "ready"
- **Network Connection**: For network printers, verify IP/port connectivity
- **Paper/Toner**: Ensure printer has paper and toner
- **Test Print**: Send a test print job to diagnose

### Email Not Sending

- **SMTP Credentials**: Verify correct SMTP host, port, username, password
- **Firewall**: Check if port 587 or 465 is open
- **Password**: For Gmail, use app-specific password, not your account password
- **Sender Address**: Verify sender email is authorized for SMTP account

### Job Queue Issues

- **Clear Queue**: Admin can clear stuck jobs from the admin panel
- **Retry Failed**: Retry failed jobs after resolving underlying issue
- **Logs**: Check system logs for detailed error messages

---

## Security Considerations

1. **Encrypt Credentials**: SMTP passwords stored encrypted in database
2. **Role-Based Access**: Only admins can configure printers/email
3. **Audit Logging**: Track all print and email activities
4. **Network Security**: Use SSL/TLS for network printer connections
5. **Data Privacy**: Ensure compliance with data protection regulations

---

## Future Enhancements

- [ ] Cloud printing integration (Google Cloud Print, AirPrint)
- [ ] Mobile app print support via Bluetooth
- [ ] Print analytics and reporting
- [ ] Automatic report scheduling and distribution
- [ ] QR code integration for receipt tracking
- [ ] Multi-language receipt templates

