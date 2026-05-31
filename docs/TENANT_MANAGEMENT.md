# Tenant Management System - Feature Documentation

## Overview

The APK Rental Management System now includes comprehensive tenant management with:
- Multi-apartment support with dropdown selection
- Admin-configurable fees (rent, guard fees, garbage fees, water rate)
- New tenant creation with house deposit tracking
- Monthly charge generation
- Deposit refund management

## Admin Configurable Charges

### Charge Types

1. **RENT** - Monthly rent per unit
2. **GUARD_FEES** - Security/guard fee per month
3. **GARBAGE_FEES** - Waste management fee per month
4. **WATER_RATE** - Water consumption rate per month

### Setting Charges

#### API Endpoint
```
POST /api/v1/charges/apartment/{apartmentId}/set
Authorization: Bearer {token}
```

#### Request Body
```json
{
  "charges": [
    {
      "chargeType": "RENT",
      "amount": 5000,
      "description": "Monthly rent",
      "frequency": "monthly"
    },
    {
      "chargeType": "GUARD_FEES",
      "amount": 500,
      "description": "Security guard fee",
      "frequency": "monthly"
    },
    {
      "chargeType": "GARBAGE_FEES",
      "amount": 200,
      "description": "Garbage collection",
      "frequency": "monthly"
    },
    {
      "chargeType": "WATER_RATE",
      "amount": 300,
      "description": "Water consumption",
      "frequency": "monthly"
    }
  ]
}
```

#### Response
```json
{
  "success": true,
  "message": "Charges set successfully",
  "data": [
    {
      "id": 1,
      "apartment_id": 5,
      "charge_type": "RENT",
      "amount": 5000,
      "frequency": "monthly",
      "is_active": true
    },
    ...
  ]
}
```

## Tenant Management

### Create New Tenant with Deposit

#### Android Activity
- `CreateTenantActivity.java` - Comprehensive form for tenant creation
- Collects personal and employment information
- Calculates and tracks house deposit
- Auto-generates monthly charges based on admin fees

#### API Endpoint
```
POST /api/v1/tenants
Authorization: Bearer {token}
```

#### Request Body
```json
{
  "tenant": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "idNumber": "ID123456",
    "occupation": "Engineer",
    "employerName": "Tech Corp",
    "moveInDate": "2026-06-15",
    "apartmentId": 5,
    "unitId": 12
  },
  "depositAmount": 10000,
  "depositDate": "2026-06-15"
}
```

#### Response
```json
{
  "success": true,
  "message": "Tenant created successfully with deposit",
  "data": {
    "tenantId": 25,
    "depositId": 8
  }
}
```

### Tenant Information Collected

**Personal Details:**
- First Name & Last Name
- Email Address
- Phone Number
- ID Number/Passport
- Occupation
- Employer Name

**Tenancy Details:**
- Unit Selection
- Move-In Date
- House Deposit Amount

### Database Tables

#### `apartment_charges`
Stores admin-configured fees per apartment
```sql
- apartment_id: References apartment
- charge_type: RENT, GUARD_FEES, GARBAGE_FEES, WATER_RATE
- amount: Charge amount
- frequency: monthly, quarterly, annual
```

#### `tenants`
Stores tenant information
```sql
- apartment_id, unit_id: Property references
- first_name, last_name, email, phone_number
- id_number, occupation, employer_name
- move_in_date, move_out_date
- status: active, inactive, moved_out
```

#### `tenant_deposits`
Tracks house deposits
```sql
- tenant_id: Tenant reference
- deposit_amount: Initial deposit
- deposit_date: Date received
- status: held, refunded, partial_deduction, full_deduction
- refund_amount, refund_date: Refund tracking
```

#### `tenant_charges`
Monthly charges breakdown
```sql
- tenant_id, apartment_id, unit_id
- charge_month: Month for charges
- rent_amount, guard_fees, garbage_fees, water_rate
- total_amount: Sum of all charges
- paid_amount: Amount paid so far
- status: pending, partial, paid, overdue
```

#### `unit_rent_config`
Per-unit rent configuration (can override apartment defaults)
```sql
- unit_id: Unit reference
- monthly_rent, guard_fee, garbage_fee, water_rate
- is_active: Config active status
```

#### `tenant_payments`
Payment history
```sql
- tenant_id, tenant_charge_id
- payment_amount, payment_method
- payment_date, transaction_id
- receipt_url: Payment receipt
```

## Workflows

### 1. Create Tenant Workflow

```
Select Apartment ↓
Select Unit ↓
Enter Tenant Info ↓
Enter Deposit Amount ↓
System Creates:
  - Tenant record
  - Deposit record
  - Updates unit status to "occupied"
  - Generates first month charges ↓
Confirmation
```

### 2. Monthly Charges Generation

```
Admin sets charges per apartment ↓
New tenant created ↓
System auto-generates monthly charges:
  - Rent Amount (from config)
  - Guard Fees (from config)
  - Garbage Fees (from config)
  - Water Rate (from config)
  - Total Amount (sum) ↓
Charges saved in pending status
```

### 3. Deposit Refund Workflow

```
Tenant moves out ↓
Specify move-out date ↓
Calculate deductions (if any) ↓
System Updates:
  - Tenant status: moved_out
  - Unit status: available
  - Deposit status: refunded or partial_deduction
  - Refund amount and date
```

## API Endpoints Summary

### Apartment Charges
- `POST /api/v1/charges/apartment/{id}/set` - Set charges (admin)
- `GET /api/v1/charges/apartment/{id}` - Get apartment charges
- `PUT /api/v1/charges/{chargeId}` - Update charge

### Unit Configuration
- `POST /api/v1/charges/unit/{unitId}/config` - Set unit rent config
- `GET /api/v1/charges/unit/{unitId}/config` - Get unit config

### Tenant Management
- `POST /api/v1/tenants` - Create tenant with deposit
- `GET /api/v1/tenants/apartment/{apartmentId}` - List apartment tenants
- `GET /api/v1/tenants/{tenantId}` - Get tenant details
- `PUT /api/v1/tenants/{tenantId}` - Update tenant
- `POST /api/v1/tenants/{tenantId}/moveout` - Move out tenant
- `POST /api/v1/tenants/deposit/{depositId}/refund` - Refund deposit

### Monthly Charges
- `POST /api/v1/charges/tenant/{tenantId}/generate` - Generate monthly charges

## Features Implemented

✅ Admin-set configurable fees (4 types)
✅ Multi-unit support per apartment
✅ New tenant creation form
✅ House deposit tracking
✅ Automatic monthly charge generation
✅ Deposit refund management
✅ Payment history tracking
✅ Unit occupation tracking
✅ Tenant move-out workflow
✅ Database schema with proper relationships
✅ Backend controllers and routes
✅ Android activities and layouts

## Security Features

- JWT authentication required
- Ownership verification (owner can only manage their apartments)
- Role-based access control
- Input validation
- Secure data transmission
