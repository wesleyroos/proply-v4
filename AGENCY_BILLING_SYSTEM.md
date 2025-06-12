# Agency Billing System Documentation

## Overview
This document outlines the agency-specific billing system using Yoco payments for charging agencies based on monthly report generation usage.

## Architecture

### Core Concept
- Agencies are billed monthly based on actual report usage
- Branch admins add company payment methods
- Super admins control billing activation and pricing
- Variable monthly amounts (not fixed subscriptions)

## Database Schema

### New Tables Required

#### `agency_payment_methods`
```sql
CREATE TABLE agency_payment_methods (
  id SERIAL PRIMARY KEY,
  agency_branch_id INTEGER NOT NULL REFERENCES agency_branches(id),
  yoco_token VARCHAR(255) NOT NULL,
  card_last_four VARCHAR(4) NOT NULL,
  expiry_month INTEGER NOT NULL,
  expiry_year INTEGER NOT NULL,
  card_brand VARCHAR(50), -- visa, mastercard, etc
  is_active BOOLEAN DEFAULT true,
  added_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `agency_billing_cycles`
```sql
CREATE TABLE agency_billing_cycles (
  id SERIAL PRIMARY KEY,
  agency_branch_id INTEGER NOT NULL REFERENCES agency_branches(id),
  billing_period VARCHAR(7) NOT NULL, -- YYYY-MM format
  report_count INTEGER DEFAULT 0,
  price_per_report DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  vat_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, paid, failed, cancelled
  due_date DATE NOT NULL,
  paid_at TIMESTAMP,
  yoco_payment_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(agency_branch_id, billing_period)
);
```

#### `agency_invoices`
```sql
CREATE TABLE agency_invoices (
  id SERIAL PRIMARY KEY,
  agency_branch_id INTEGER NOT NULL REFERENCES agency_branches(id),
  billing_cycle_id INTEGER NOT NULL REFERENCES agency_billing_cycles(id),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  vat_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft', -- draft, sent, paid, overdue
  pdf_path VARCHAR(500),
  sent_at TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `agency_billing_settings`
```sql
CREATE TABLE agency_billing_settings (
  id SERIAL PRIMARY KEY,
  agency_branch_id INTEGER NOT NULL REFERENCES agency_branches(id),
  billing_enabled BOOLEAN DEFAULT false,
  price_per_report DECIMAL(10,2) DEFAULT 200.00,
  billing_contact_email VARCHAR(255),
  billing_day INTEGER DEFAULT 1, -- day of month to bill
  auto_billing BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(agency_branch_id)
);
```

## User Flows

### 1. Branch Admin - Payment Method Setup
```
1. Branch Admin logs in → Settings → Billing Tab
2. Clicks "Add Payment Method" 
3. Yoco Checkout widget loads
4. Admin enters company card details
5. Yoco processes and returns secure token
6. System stores token in agency_payment_methods table
7. Card shows as "ending in ****1234" with expiry date
```

### 2. Super Admin - Billing Configuration
```
1. Super Admin → Agency Management Dashboard
2. Select agency branch
3. Configure billing settings:
   - Enable/disable billing
   - Set price per report
   - Set billing contact email
   - Set billing day of month
4. Save settings to agency_billing_settings table
```

### 3. Monthly Billing Process
```
1. Monthly cron job runs (1st of each month)
2. For each agency with billing_enabled = true:
   a. Count reports from report_generations table for previous month
   b. Calculate: subtotal = report_count × price_per_report
   c. Calculate: vat_amount = subtotal × 0.15
   d. Calculate: total_amount = subtotal + vat_amount
   e. Create record in agency_billing_cycles
   f. Generate invoice in agency_invoices
   g. Charge stored Yoco token
   h. Generate PDF invoice
   i. Email invoice to billing contact
   j. Update payment status
```

## API Endpoints

### Payment Methods
- `POST /api/agency/payment-methods` - Add payment method
- `GET /api/agency/payment-methods` - List payment methods
- `DELETE /api/agency/payment-methods/:id` - Remove payment method

### Billing Cycles
- `GET /api/agency/billing-cycles` - List billing history
- `GET /api/agency/billing-cycles/:id` - Get specific cycle
- `POST /api/agency/billing-cycles/:id/retry` - Retry failed payment

### Invoices
- `GET /api/agency/invoices` - List invoices
- `GET /api/agency/invoices/:id/pdf` - Download PDF
- `POST /api/agency/invoices/:id/email` - Resend invoice email

### Super Admin
- `GET /api/admin/agencies/billing` - List all agency billing status
- `PUT /api/admin/agencies/:id/billing-settings` - Update billing settings
- `POST /api/admin/agencies/:id/manual-bill` - Generate manual bill

## Invoice Generation

### Invoice Details
```
Invoice Header:
- Company: [agency.companyName]
- VAT Number: [agency.vatNumber]
- Registration: [agency.registrationNumber]
- Address: [agency.businessAddress]

Line Items:
- Property Reports Generated: [count] × R[price] = R[subtotal]
- VAT (15%): R[vat_amount]
- Total: R[total_amount]

Payment Info:
- Payment Method: Card ending in [last_four]
- Payment Status: [status]
- Due Date: [due_date]
```

### PDF Generation
- Uses company branding from agency profile
- Includes detailed report breakdown
- Stored in secure location
- Accessible via authenticated URL

## Security Considerations

1. **PCI Compliance**: No card data stored locally, only Yoco tokens
2. **Access Control**: Only branch admins can manage payment methods
3. **Webhook Security**: Verify Yoco webhook signatures
4. **Data Encryption**: Sensitive data encrypted at rest
5. **Audit Trail**: All billing actions logged

## Integration Points

### Yoco Integration
- Checkout widget for card capture
- Token-based recurring payments
- Webhook notifications for payment status
- Refund capabilities

### Report Tracking
- Links to existing `report_generations` table
- Counts by agency_branch_id and date range
- Excludes cancelled/failed reports

### Email System
- Invoice delivery via existing email system
- PDF attachments
- Payment confirmations
- Overdue notifications

## Monitoring & Alerts

### Dashboard Metrics
- Monthly revenue by agency
- Payment success rates
- Overdue accounts
- Report generation trends

### Automated Alerts
- Failed payments
- Overdue invoices
- High usage spikes
- Payment method expiring

## Pricing Model

### Volume-Based Pricing Structure
```
Base Rate: 1-50 reports/month = R200 per report (no discount)
Tier 1: 51-100 reports/month = R180 per report (10% discount)
Tier 2: 101-200 reports/month = R160 per report (20% discount)
Tier 3: 201+ reports/month = R140 per report (30% discount)
```

### Calculation Logic
Progressive pricing where discounts apply only to reports above each threshold:

```javascript
function calculateMonthlyBill(reportCount) {
  let total = 0;
  
  if (reportCount <= 50) {
    // All reports at base rate
    total = reportCount * 200;
  } else if (reportCount <= 100) {
    // First 50 at base rate, remainder at tier 1
    total = (50 * 200) + ((reportCount - 50) * 180);
  } else if (reportCount <= 200) {
    // 50 base + 50 tier 1 + remainder tier 2
    total = (50 * 200) + (50 * 180) + ((reportCount - 100) * 160);
  } else {
    // 50 base + 50 tier 1 + 100 tier 2 + remainder tier 3
    total = (50 * 200) + (50 * 180) + (100 * 160) + ((reportCount - 200) * 140);
  }
  
  return total;
}
```

### Example Monthly Bills
- **25 reports**: 25 × R200 = R5,000
- **75 reports**: (50 × R200) + (25 × R180) = R10,000 + R4,500 = R14,500
- **150 reports**: (50 × R200) + (50 × R180) + (50 × R160) = R27,000
- **250 reports**: (50 × R200) + (50 × R180) + (100 × R160) + (50 × R140) = R42,000

### Benefits
- Protects smaller agencies with full rate for typical usage (1-50 reports)
- Encourages high usage with meaningful enterprise-level discounts
- Progressive savings structure rewards power users
- Clear breakpoints that are easy to understand and communicate

## Future Enhancements

1. **Multi-currency support** for international agencies
2. **Credit notes** for refunds/adjustments
3. **Payment plans** for large bills
4. **Annual commitment discounts** for long-term contracts
5. **API access** for agencies to integrate billing data