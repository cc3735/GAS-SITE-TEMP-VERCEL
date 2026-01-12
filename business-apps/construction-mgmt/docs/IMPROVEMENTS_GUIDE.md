# Construction Manager - Improvements Guide

## Overview

This guide covers the enhanced features added to the Construction Manager platform:

1. **Time Tracking & Labor Management** - GPS-based clock in/out, break tracking, overtime calculations, timesheets
2. **Equipment Tracking** - Inventory management, check-out/in, maintenance scheduling, depreciation
3. **Subcontractor Management** - Contracts, work orders, payments, performance reviews, compliance

---

## Table of Contents

1. [Time Tracking](#time-tracking)
2. [Equipment Tracking](#equipment-tracking)
3. [Subcontractor Management](#subcontractor-management)
4. [API Reference](#api-reference)
5. [Database Schema](#database-schema)

---

## Time Tracking

### Features

- GPS-based clock in/clock out
- Break tracking (paid/unpaid)
- Overtime calculations (daily 8h, weekly 40h thresholds)
- Timesheet generation and approval workflow
- Project-level labor summaries
- Real-time active entry tracking

### Clock In/Out

```typescript
import { timeTrackingService } from './services/time-tracking';

// Clock in with GPS location
const entry = await timeTrackingService.clockIn('user-123', 'project-456', {
  taskId: 'task-789',
  notes: 'Starting foundation work',
  location: { lat: 29.7604, lng: -95.3698 }
});

// Clock out
const completed = await timeTrackingService.clockOut('user-123', {
  notes: 'Completed framing',
  location: { lat: 29.7604, lng: -95.3698 }
});
```

### Break Management

```typescript
// Start lunch break (unpaid)
const lunch = await timeTrackingService.startBreak('user-123', 'lunch', false);

// Start 15-min break (paid)
const shortBreak = await timeTrackingService.startBreak('user-123', 'break', true);

// End break
await timeTrackingService.endBreak(lunch.id);
```

### Overtime Calculation

| Type | Threshold | Rate |
|------|-----------|------|
| Daily OT | >8 hours | 1.5x |
| Daily Double | >12 hours | 2.0x |
| Weekly OT | >40 hours | 1.5x |
| Weekly Double | >60 hours | 2.0x |

```typescript
const overtime = timeTrackingService.calculateOvertime(
  totalHours,  // e.g., 45
  dailyHours   // e.g., [9, 9, 8, 10, 9]
);
// Result: { regular: 40, overtime: 5, doubleTime: 0 }
```

### Timesheet Workflow

```
Draft → Submitted → Approved/Rejected
```

```typescript
// Generate timesheet for a week
const timesheet = await timeTrackingService.generateTimesheet(
  'user-123',
  new Date('2024-02-05')  // Monday of the week
);

// Submit for approval
await timeTrackingService.submitTimesheet(timesheet.id);

// Approve timesheet
await timeTrackingService.approveTimesheet(
  timesheet.id,
  'manager-456',
  'Looks good!'
);
```

### Project Labor Summary

```typescript
const summary = await timeTrackingService.getProjectLaborSummary(
  'project-123',
  new Date('2024-01-01'),
  new Date('2024-01-31')
);

// Result:
{
  totalHours: 1250,
  totalRegularHours: 1100,
  totalOvertimeHours: 120,
  totalDoubleTimeHours: 30,
  totalWorkers: 15,
  byWorker: [
    { userId: '...', totalHours: 85, regular: 80, overtime: 5 }
  ]
}
```

---

## Equipment Tracking

### Features

- Equipment inventory management
- Check-out/check-in with condition tracking
- Maintenance scheduling and history
- Depreciation calculations
- Overdue return alerts
- Equipment utilization reports

### Equipment Categories

| Category | Examples |
|----------|----------|
| Power Tools | Drills, saws, grinders |
| Hand Tools | Hammers, wrenches, screwdrivers |
| Heavy Equipment | Excavators, loaders, cranes |
| Vehicles | Trucks, trailers, forklifts |
| Safety | Harnesses, scaffolding |
| Measuring | Levels, lasers, tape measures |
| Specialty | Welding, concrete, electrical |

### Equipment Status

```
Available → Checked Out → Returned
     ↓           ↓
Maintenance   Lost/Damaged
     ↓
  Retired
```

### Creating Equipment

```typescript
import { equipmentTrackingService } from './services/equipment-tracking';

const equipment = await equipmentTrackingService.createEquipment({
  organization_id: 'org-123',
  name: 'DeWalt Cordless Drill',
  category: 'power_tools',
  serial_number: 'DW-2024-001',
  manufacturer: 'DeWalt',
  model: 'DCD791',
  purchase_date: new Date('2024-01-15'),
  purchase_price: 299.99,
  depreciation_method: 'straight_line',
  useful_life_years: 5
});
```

### Check Out/Return

```typescript
// Check out to project
const checkout = await equipmentTrackingService.checkoutEquipment(
  'equipment-123',
  'user-456',
  'project-789',
  {
    expectedReturn: new Date('2024-02-15'),
    notes: 'Needed for framing phase',
    conditionAtCheckout: 'good'
  }
);

// Return equipment
await equipmentTrackingService.returnEquipment(checkout.id, {
  conditionAtReturn: 'fair',
  notes: 'Battery showing wear',
  issues: ['Battery life reduced']
});
```

### Maintenance

```typescript
// Schedule preventive maintenance
const maintenance = await equipmentTrackingService.scheduleMaintenance(
  'equipment-123',
  {
    type: 'preventive',
    description: 'Annual inspection and blade replacement',
    scheduledDate: new Date('2024-03-01'),
    estimatedCost: 150,
    vendor: 'Local Tool Service'
  }
);

// Complete maintenance
await equipmentTrackingService.completeMaintenance(maintenance.id, {
  completedBy: 'tech-123',
  actualCost: 175,
  notes: 'Replaced blades and lubricated motor',
  parts_replaced: ['Circular saw blade', 'Motor oil']
});
```

### Depreciation Methods

| Method | Description |
|--------|-------------|
| Straight Line | Equal depreciation each year |
| Declining Balance | Higher depreciation early |
| None | No depreciation tracking |

```typescript
// Calculate current value
const currentValue = equipmentTrackingService.calculateCurrentValue(equipment);
// $299.99 purchase, 5-year life, 1 year old
// Straight line: $299.99 - ($299.99 / 5) = $239.99
```

### Reports

```typescript
// Get equipment summary
const summary = await equipmentTrackingService.getEquipmentSummary('equipment-123');
// Returns: totalCheckouts, utilization, totalMaintenanceCost, currentValue

// Get overdue equipment
const overdue = await equipmentTrackingService.getOverdueEquipment('org-123');

// Get equipment by project
const projectEquipment = await equipmentTrackingService.getEquipmentByProject('project-123');
```

---

## Subcontractor Management

### Features

- Subcontractor directory with trade specialties
- Contract management with change orders
- Work order assignment and tracking
- Payment processing with retainage
- Performance reviews and ratings
- Compliance tracking (licenses, insurance)

### Subcontractor Trades

| Trade | Examples |
|-------|----------|
| Electrician | Wiring, panel installation |
| Plumber | Pipes, fixtures |
| HVAC | Heating, cooling systems |
| Framing | Wood framing, metal studs |
| Roofing | Shingles, metal roofs |
| Concrete | Foundations, flatwork |
| Drywall | Hanging, finishing |
| Painting | Interior, exterior |

### Subcontractor Lifecycle

```
Pending Verification → Active → (Suspended) → Inactive
```

### Creating Subcontractor

```typescript
import { subcontractorManagementService } from './services/subcontractor-management';

const sub = await subcontractorManagementService.createSubcontractor({
  organization_id: 'org-123',
  company_name: 'ABC Electric LLC',
  contact_name: 'John Smith',
  email: 'john@abcelectric.com',
  phone: '+1-555-123-4567',
  trade: 'electrician',
  license_number: 'EL-123456',
  license_state: 'TX',
  license_expiration: new Date('2025-06-30'),
  insurance_provider: 'State Farm',
  insurance_policy_number: 'INS-789',
  insurance_expiration: new Date('2024-12-31'),
  insurance_coverage_amount: 1000000,
  payment_terms: 'Net 30',
  hourly_rate: 75
});
```

### Document Management

```typescript
// Add insurance certificate
await subcontractorManagementService.addDocument(sub.id, {
  type: 'insurance_certificate',
  name: 'Certificate of Insurance 2024',
  file_url: 'https://storage.example.com/coi-2024.pdf',
  expiration_date: new Date('2024-12-31')
});

// Verify document
await subcontractorManagementService.verifyDocument(
  'document-123',
  'admin-456'
);

// Get expiring documents (next 30 days)
const expiring = await subcontractorManagementService.getExpiringDocuments(
  'org-123',
  30
);
```

### Contract Types

| Type | Description |
|------|-------------|
| Fixed Price | Lump sum for scope |
| Time & Materials | Hourly + materials |
| Cost Plus | Cost + percentage fee |
| Unit Price | Per unit installed |

### Creating Contracts

```typescript
const contract = await subcontractorManagementService.createContract({
  subcontractor_id: 'sub-123',
  project_id: 'project-456',
  organization_id: 'org-123',
  title: 'Electrical Rough-In',
  contract_type: 'fixed_price',
  total_amount: 45000,
  retainage_percentage: 10,
  start_date: new Date('2024-02-01'),
  end_date: new Date('2024-03-15'),
  scope_of_work: 'Complete electrical rough-in per plans...',
  payment_schedule: [
    { description: '50% at start', amount: 22500, percentage: 50 },
    { description: '50% at completion', amount: 22500, percentage: 50 }
  ]
});
```

### Change Orders

```typescript
// Create change order
const changeOrder = await subcontractorManagementService.createChangeOrder(
  contract.id,
  {
    description: 'Add 10 additional outlets in garage',
    amount: 2500,
    days_extension: 2,
    reason: 'Owner requested additional outlets'
  }
);

// Approve change order
await subcontractorManagementService.approveChangeOrder(
  contract.id,
  changeOrder.id,
  'pm-789'
);
// Contract total updated: $45,000 + $2,500 = $47,500
```

### Work Orders

```typescript
// Create work order
const workOrder = await subcontractorManagementService.createWorkOrder({
  subcontractor_id: 'sub-123',
  contract_id: 'contract-456',
  project_id: 'project-789',
  organization_id: 'org-123',
  title: 'Install main panel',
  description: 'Install 200A main panel in utility room',
  location: 'Building A, Utility Room',
  scheduled_start: new Date('2024-02-15'),
  scheduled_end: new Date('2024-02-16'),
  estimated_hours: 8,
  estimated_cost: 3000,
  priority: 'high',
  checklist: [
    { id: '1', description: 'Mount panel', completed: false },
    { id: '2', description: 'Run main feed', completed: false },
    { id: '3', description: 'Wire circuits', completed: false },
    { id: '4', description: 'Label breakers', completed: false }
  ]
});

// Update status
await subcontractorManagementService.updateWorkOrderStatus(
  workOrder.id,
  'in_progress',
  { actual_start: new Date() }
);

// Update checklist item
await subcontractorManagementService.updateChecklistItem(
  workOrder.id,
  '1',
  true,
  'electrician-123'
);

// Inspect completed work
await subcontractorManagementService.inspectWorkOrder(
  workOrder.id,
  'inspector-456',
  'Passed inspection, all circuits properly labeled',
  true
);
```

### Payments with Retainage

```typescript
// Create progress payment (10% retainage held)
const payment = await subcontractorManagementService.createPayment({
  subcontractor_id: 'sub-123',
  contract_id: 'contract-456',
  project_id: 'project-789',
  organization_id: 'org-123',
  payment_type: 'progress',
  amount: 20000,
  invoice_number: 'INV-001',
  description: '50% completion milestone'
});
// Net amount: $20,000 - $2,000 (10%) = $18,000

// Approve payment
await subcontractorManagementService.approvePayment(payment.id, 'pm-789');

// Mark as paid
await subcontractorManagementService.markPaymentPaid(payment.id, {
  payment_method: 'check',
  check_number: '1234',
  lien_waiver_received: true
});

// Release retainage at project end
await subcontractorManagementService.createPayment({
  subcontractor_id: 'sub-123',
  contract_id: 'contract-456',
  project_id: 'project-789',
  organization_id: 'org-123',
  payment_type: 'retainage_release',
  amount: 4500,
  description: 'Final retainage release'
});
```

### Performance Reviews

```typescript
const review = await subcontractorManagementService.createPerformanceReview({
  subcontractor_id: 'sub-123',
  project_id: 'project-789',
  reviewer_id: 'pm-456',
  reviewer_name: 'Mike Johnson',
  quality_rating: 5,
  timeliness_rating: 4,
  communication_rating: 5,
  safety_rating: 5,
  strengths: 'Excellent attention to detail, clean work',
  areas_for_improvement: 'Could provide more advance notice for scheduling',
  would_hire_again: true,
  comments: 'Great electrician, highly recommend'
});
// Overall rating calculated: (5+4+5+5)/4 = 4.75
```

### Compliance Checks

```typescript
const compliance = await subcontractorManagementService.checkSubcontractorCompliance('sub-123');
// Result:
{
  isCompliant: false,
  issues: [
    'Insurance has expired',
    'Missing verified W-9'
  ],
  warnings: [
    'License expires within 30 days'
  ]
}
```

---

## API Reference

### Time Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/workforce/time/clock-in` | Clock in |
| POST | `/api/workforce/time/clock-out` | Clock out |
| POST | `/api/workforce/time/break/start` | Start break |
| POST | `/api/workforce/time/break/:id/end` | End break |
| GET | `/api/workforce/time/entries/:userId` | Get entries |
| GET | `/api/workforce/time/active/:userId` | Get active entry |
| POST | `/api/workforce/time/timesheet/generate` | Generate timesheet |
| POST | `/api/workforce/time/timesheet/:id/submit` | Submit timesheet |
| POST | `/api/workforce/time/timesheet/:id/approve` | Approve timesheet |
| GET | `/api/workforce/time/project/:id/summary` | Labor summary |

### Equipment

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/workforce/equipment` | Create equipment |
| GET | `/api/workforce/equipment/:id` | Get equipment |
| GET | `/api/workforce/equipment` | List equipment |
| POST | `/api/workforce/equipment/:id/checkout` | Checkout |
| POST | `/api/workforce/equipment/checkout/:id/return` | Return |
| GET | `/api/workforce/equipment/project/:id` | By project |
| POST | `/api/workforce/equipment/:id/maintenance` | Schedule maintenance |
| POST | `/api/workforce/equipment/maintenance/:id/complete` | Complete maintenance |
| GET | `/api/workforce/equipment/:id/summary` | Get summary |
| GET | `/api/workforce/equipment/overdue/:orgId` | Overdue list |

### Subcontractors

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/workforce/subcontractors` | Create subcontractor |
| GET | `/api/workforce/subcontractors/:id` | Get subcontractor |
| GET | `/api/workforce/subcontractors` | List subcontractors |
| PUT | `/api/workforce/subcontractors/:id` | Update subcontractor |
| GET | `/api/workforce/subcontractors/trade/:trade` | By trade |
| POST | `/api/workforce/subcontractors/:id/documents` | Add document |
| POST | `/api/workforce/subcontractors/documents/:id/verify` | Verify document |
| GET | `/api/workforce/subcontractors/documents/expiring` | Expiring docs |
| GET | `/api/workforce/subcontractors/:id/summary` | Summary |
| GET | `/api/workforce/subcontractors/:id/compliance` | Compliance check |

### Contracts

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/workforce/contracts` | Create contract |
| GET | `/api/workforce/contracts/:id` | Get contract |
| GET | `/api/workforce/contracts/project/:id` | List by project |
| POST | `/api/workforce/contracts/:id/status` | Update status |
| POST | `/api/workforce/contracts/:id/change-orders` | Add change order |
| POST | `/api/workforce/contracts/:id/change-orders/:coId/approve` | Approve CO |

### Work Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/workforce/work-orders` | Create work order |
| GET | `/api/workforce/work-orders/:id` | Get work order |
| GET | `/api/workforce/work-orders/project/:id` | List by project |
| POST | `/api/workforce/work-orders/:id/status` | Update status |
| POST | `/api/workforce/work-orders/:id/checklist/:itemId` | Update checklist |
| POST | `/api/workforce/work-orders/:id/inspect` | Inspect |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/workforce/payments` | Create payment |
| POST | `/api/workforce/payments/:id/approve` | Approve |
| POST | `/api/workforce/payments/:id/paid` | Mark paid |
| GET | `/api/workforce/payments/subcontractor/:id` | History |

### Reviews & Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/workforce/reviews` | Create review |
| GET | `/api/workforce/reviews/subcontractor/:id` | Get reviews |
| GET | `/api/workforce/reports/project/:id/subcontractors` | Project report |

---

## Database Schema

### New Tables

```sql
-- Time Entries
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID,
  task_id UUID,
  organization_id UUID,
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,
  clock_in_location JSONB,
  clock_out_location JSONB,
  total_hours DECIMAL(10,2),
  regular_hours DECIMAL(10,2),
  overtime_hours DECIMAL(10,2),
  double_time_hours DECIMAL(10,2),
  breaks JSONB DEFAULT '[]',
  notes TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timesheets
CREATE TABLE timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  total_hours DECIMAL(10,2),
  regular_hours DECIMAL(10,2),
  overtime_hours DECIMAL(10,2),
  double_time_hours DECIMAL(10,2),
  entries UUID[],
  status VARCHAR(20) DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  serial_number VARCHAR(100),
  asset_tag VARCHAR(100),
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  warranty_expiration DATE,
  depreciation_method VARCHAR(50),
  useful_life_years INTEGER,
  salvage_value DECIMAL(10,2),
  current_location VARCHAR(255),
  current_project_id UUID,
  status VARCHAR(50) DEFAULT 'available',
  condition VARCHAR(50) DEFAULT 'good',
  last_maintenance DATE,
  next_maintenance DATE,
  notes TEXT,
  image_urls TEXT[],
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment Checkouts
CREATE TABLE equipment_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES equipment(id),
  user_id UUID NOT NULL,
  project_id UUID,
  checked_out_at TIMESTAMPTZ DEFAULT NOW(),
  expected_return TIMESTAMPTZ,
  returned_at TIMESTAMPTZ,
  condition_at_checkout VARCHAR(50),
  condition_at_return VARCHAR(50),
  checkout_notes TEXT,
  return_notes TEXT,
  issues TEXT[],
  status VARCHAR(50) DEFAULT 'active'
);

-- Maintenance Records
CREATE TABLE maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES equipment(id),
  type VARCHAR(50),
  description TEXT,
  scheduled_date DATE,
  completed_date DATE,
  completed_by UUID,
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  vendor VARCHAR(255),
  notes TEXT,
  parts_replaced TEXT[],
  status VARCHAR(50) DEFAULT 'scheduled'
);

-- Subcontractors
CREATE TABLE subcontractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address JSONB,
  trade VARCHAR(100),
  specialties TEXT[],
  license_number VARCHAR(100),
  license_state VARCHAR(10),
  license_expiration DATE,
  insurance_provider VARCHAR(255),
  insurance_policy_number VARCHAR(100),
  insurance_expiration DATE,
  insurance_coverage_amount DECIMAL(12,2),
  workers_comp_provider VARCHAR(255),
  workers_comp_policy VARCHAR(100),
  workers_comp_expiration DATE,
  ein VARCHAR(20),
  payment_terms VARCHAR(50),
  hourly_rate DECIMAL(10,2),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'pending_verification',
  rating DECIMAL(3,1),
  total_projects INTEGER DEFAULT 0,
  total_paid DECIMAL(12,2) DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subcontractor Documents
CREATE TABLE subcontractor_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id UUID REFERENCES subcontractors(id),
  type VARCHAR(50),
  name VARCHAR(255),
  file_url TEXT,
  expiration_date DATE,
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subcontractor Contracts
CREATE TABLE subcontractor_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id UUID REFERENCES subcontractors(id),
  project_id UUID,
  organization_id UUID,
  contract_number VARCHAR(50) UNIQUE,
  title VARCHAR(255),
  description TEXT,
  contract_type VARCHAR(50),
  total_amount DECIMAL(12,2),
  retainage_percentage DECIMAL(5,2),
  start_date DATE,
  end_date DATE,
  scope_of_work TEXT,
  terms_and_conditions TEXT,
  payment_schedule JSONB,
  change_orders JSONB DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'draft',
  signed_date DATE,
  signed_by_contractor VARCHAR(255),
  signed_by_subcontractor VARCHAR(255),
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work Orders
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id UUID REFERENCES subcontractors(id),
  contract_id UUID REFERENCES subcontractor_contracts(id),
  project_id UUID,
  organization_id UUID,
  work_order_number VARCHAR(50) UNIQUE,
  title VARCHAR(255),
  description TEXT,
  location VARCHAR(255),
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  estimated_hours DECIMAL(10,2),
  actual_hours DECIMAL(10,2),
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  priority VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(50) DEFAULT 'pending',
  checklist JSONB DEFAULT '[]',
  materials_required TEXT[],
  notes TEXT,
  completed_by UUID,
  inspected BOOLEAN DEFAULT FALSE,
  inspected_by UUID,
  inspection_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subcontractor Payments
CREATE TABLE subcontractor_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id UUID REFERENCES subcontractors(id),
  contract_id UUID REFERENCES subcontractor_contracts(id),
  project_id UUID,
  organization_id UUID,
  invoice_number VARCHAR(100),
  invoice_date DATE,
  payment_type VARCHAR(50),
  amount DECIMAL(12,2),
  retainage_held DECIMAL(12,2),
  net_amount DECIMAL(12,2),
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  paid_date DATE,
  payment_method VARCHAR(50),
  check_number VARCHAR(50),
  lien_waiver_received BOOLEAN DEFAULT FALSE,
  lien_waiver_document_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Reviews
CREATE TABLE performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id UUID REFERENCES subcontractors(id),
  project_id UUID,
  reviewer_id UUID,
  reviewer_name VARCHAR(255),
  review_date DATE,
  quality_rating INTEGER,
  timeliness_rating INTEGER,
  communication_rating INTEGER,
  safety_rating INTEGER,
  overall_rating DECIMAL(3,1),
  strengths TEXT,
  areas_for_improvement TEXT,
  would_hire_again BOOLEAN,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_time_entries_user ON time_entries(user_id);
CREATE INDEX idx_time_entries_project ON time_entries(project_id);
CREATE INDEX idx_timesheets_user ON timesheets(user_id);
CREATE INDEX idx_equipment_org ON equipment(organization_id);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_checkouts_equipment ON equipment_checkouts(equipment_id);
CREATE INDEX idx_subcontractors_org ON subcontractors(organization_id);
CREATE INDEX idx_subcontractors_trade ON subcontractors(trade);
CREATE INDEX idx_contracts_project ON subcontractor_contracts(project_id);
CREATE INDEX idx_work_orders_project ON work_orders(project_id);
CREATE INDEX idx_payments_subcontractor ON subcontractor_payments(subcontractor_id);
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2026-01-12 | Time tracking, equipment, subcontractor management |
| 1.0.0 | Initial | Project management, OCR, translation, messaging |
