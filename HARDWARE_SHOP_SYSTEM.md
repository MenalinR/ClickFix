# Hardware Shop & Management System

## Overview

The ClickFix Hardware Shop is a complete system for managing hardware items and orders throughout the service workflow. It involves multiple actors: Hardware Shop Admin, Workers, Customers, and the System itself.

## System Actors

### 1. Hardware Shop Admin

**Responsibilities:**

- Manage hardware inventory (add, edit, delete items)
- Update item availability and stock status
- View all hardware orders and their status
- Track hardware requests across the platform

**Access:** Admin Dashboard → Hardware Shop page

### 2. Worker

**Responsibilities:**

- Request hardware parts for approved jobs
- View hardware requests they've made
- Confirm when hardware is delivered
- Use hardware to complete service jobs

**Access:** Worker → Hardware Request page

### 3. Customer

**Responsibilities:**

- Review hardware recommendations from workers
- Approve or reject hardware requests
- Confirm hardware orders
- Pay for hardware as part of total service cost

**Access:** Customer → Job Details → Review Hardware Recommendations

### 4. System

- Sends orders to hardware shop when approved
- Tracks order status
- Updates job pricing with hardware costs
- Manages hardware request workflow

---

## Hardware Workflow

### Step 1: Customer Books a Service

- Customer searches and selects a service category
- Books a worker for the job
- Job is created with `status: 'pending'`

### Step 2: Worker Reviews the Request

- Worker receives job notification
- Reviews job details and requirements
- Accepts the job

### Step 3: Worker Recommends Hardware (if needed)

**Flow:**

```
Worker opens Job Details
  ↓
Clicks "Request Hardware Parts"
  ↓
Selects hardware items from inventory
  ↓
Submits hardware request with:
  - Selected items and quantities
  - Total cost estimate
  - Notes (if any)
  ↓
HardwareRequest created with status: 'pending'
  ↓
Customer notified of hardware recommendation
```

**Backend:**

```
POST /api/hardware/requests
- jobId: Job ID
- items: [{ itemId, quantity }, ...]
- Creates HardwareRequest with status: 'pending'
- Updates Job with hardware items
```

**Database Schema:**

```javascript
HardwareRequest {
  jobId: ObjectId (ref: Job),
  workerId: ObjectId (ref: Worker),
  customerId: ObjectId (ref: Customer),
  items: [
    {
      hardwareId: ObjectId (ref: HardwareItem),
      name: String,
      quantity: Number,
      price: Number,
      unit: String
    }
  ],
  totalCost: Number,
  status: 'pending' | 'approved' | 'rejected' | 'delivered',
  createdAt: Date
}
```

### Step 4: Customer Confirms Hardware Order

**Flow:**

```
Customer views job details
  ↓
Reviews recommended hardware
  ↓
Sees item details, quantities, and cost
  ↓
Approves hardware request
  ↓
HardwareRequest status → 'approved'
  ↓
Job.pricing.hardwareCost updated
  ↓
Worker receives approval notification
```

**Backend:**

```
PUT /api/hardware/requests/:id/status
- status: 'approved' | 'rejected'
- If approved:
  - approvedAt: Date
  - Updates Job.pricing.hardwareCost
```

### Step 5: System Sends Order to Hardware Shop

**Flow:**

```
HardwareRequest approved
  ↓
New order entry in Admin Hardware Shop
  ↓
Admin can view request with:
  - Worker details
  - Customer details
  - Service type
  - Items and quantities
  - Total cost
  - Status
  ↓
Admin marks order as received/processing
```

**Admin Hardware Shop Page - Orders Tab:**

- Shows all hardware requests
- Filters by status: pending, approved, rejected, delivered
- Displays request details
- Can track fulfillment

### Step 6: Worker Collects Parts and Completes Service

**Flow:**

```
Worker receives hardware items
  ↓
Uses parts to complete the service
  ↓
Marks hardware as delivered
  ↓
HardwareRequest status → 'delivered'
  ↓
Job completion initiated
```

**Backend:**

```
PUT /api/hardware/requests/:id/delivered
- status: 'delivered'
- deliveredAt: Date
- Only worker assigned to job can mark as delivered
- Only works if status is 'approved'
```

### Step 7: Payment Processing

**Flow:**

```
Service completed
  ↓
Job.pricing includes:
  - Service charge: Job.pricing.serviceCost
  - Hardware cost: Job.pricing.hardwareCost (if requested)
  - Labour cost: Job.pricing.labourCost (if applicable)
  ↓
Total = serviceCost + hardwareCost + labourCost
  ↓
Customer processes payment
  ↓
Payment distributed to worker and platform
```

---

## Hardware Shop Admin Page

### Inventory Tab

**Features:**

1. **View All Hardware Items**
   - Item name, category, price
   - Unit type (piece, meter, kg, liter, box)
   - Stock status (In Stock / Out of Stock)
   - Description

2. **Add New Item**
   - Modal form with fields:
     - Item name (required)
     - Category dropdown (Plumbing, Electrical, Carpentry, General)
     - Price per unit (required)
     - Unit type dropdown
     - Description (optional)
   - Creates HardwareItem with `inStock: true`

3. **Edit Item**
   - Update any field
   - Changes reflected immediately

4. **Delete Item**
   - Confirmation prompt
   - Removes item from inventory

5. **Toggle Stock Status**
   - Click to mark as "In Stock" or "Out of Stock"
   - Affects what workers can request
   - Out of stock items don't appear in worker's hardware request page

6. **Search & Filter**
   - Search by item name
   - Filter by category
   - Real-time filtering

**API Endpoints:**

```
GET /api/hardware/admin/items - Get all items (including out of stock)
POST /api/hardware/admin/items - Create new item
PUT /api/hardware/admin/items/:id - Update item
DELETE /api/hardware/admin/items/:id - Delete item
PUT /api/hardware/admin/items/:id/stock - Toggle stock status
```

### Orders Tab

**Features:**

1. **View All Hardware Requests**
   - Worker name and phone
   - Customer name and phone
   - Service type
   - Items list with quantities
   - Total cost
   - Order status

2. **Status Filter**
   - Pending: Waiting for customer approval
   - Approved: Customer approved, worker can collect
   - Rejected: Customer rejected the hardware request
   - Delivered: Worker confirmed hardware delivery

3. **Request Details**
   - View all items in order
   - See associated worker and customer
   - Track order timeline
   - Monitor fulfillment status

**API Endpoint:**

```
GET /api/hardware/admin/requests - Get all hardware requests
- Query filters: ?status=pending, ?workerId=..., ?customerId=...
```

---

## Hardware Item Schema

```javascript
{
  _id: ObjectId,
  name: String (required),
  category: String (required),
    // enum: ['Plumbing', 'Electrical', 'Carpentry', 'General']
  price: Number (required, min: 0),
  unit: String (default: 'piece'),
    // enum: ['piece', 'meter', 'kg', 'liter', 'box']
  description: String,
  image: String (URL to item image),
  inStock: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Reference

### Worker Access

```
POST /api/hardware/requests
- Body: { jobId, items: [{ itemId, quantity }] }
- Response: Created HardwareRequest

GET /api/hardware/requests
- Response: All requests by current worker

GET /api/hardware/requests/:id
- Response: Single hardware request details

PUT /api/hardware/requests/:id/delivered
- Body: {}
- Response: Updated request (status: 'delivered')

GET /api/hardware/items
- Query: ?category=..., ?search=...
- Response: All in-stock items (for browsing)
```

### Customer Access

```
GET /api/hardware/requests
- Response: All requests for current customer's jobs

GET /api/hardware/requests/:id
- Response: Single hardware request details

PUT /api/hardware/requests/:id/status
- Body: { status: 'approved' | 'rejected' }
- Response: Updated request
```

### Admin Access

```
GET /api/hardware/admin/items
- Response: All items (in-stock and out-of-stock)

POST /api/hardware/admin/items
- Body: { name, category, price, unit, description, image }
- Response: Created HardwareItem

PUT /api/hardware/admin/items/:id
- Body: { name, category, price, unit, description, image, inStock }
- Response: Updated HardwareItem

DELETE /api/hardware/admin/items/:id
- Response: Deleted HardwareItem details

PUT /api/hardware/admin/items/:id/stock
- Body: { inStock: boolean }
- Response: Updated HardwareItem

GET /api/hardware/admin/requests
- Query: ?status=..., ?workerId=..., ?customerId=...
- Response: All hardware requests (filtered)
```

---

## User Flow Diagrams

### Customer Journey

```
Customer Books Service
    ↓
Worker Reviews & Accepts Job
    ↓
Worker Recommends Hardware (optional)
    ↓
Customer Receives Notification
    ↓
Customer Reviews Hardware Details
    ├─→ [Reject] → Hardware request cancelled
    └─→ [Approve] → Hardware cost added to total
        ↓
    Hardware Shop Admin Receives Order
        ↓
    Worker Collects Hardware Parts
        ↓
    Worker Uses Parts for Service
        ↓
    Worker Marks Delivered
        ↓
    Service Complete
        ↓
    Payment Processing
```

### Hardware Shop Admin Journey

```
Admin Dashboard
    ↓
Navigate to Hardware Shop
    ├─→ Inventory Tab
    │   ├─ Add New Items
    │   ├─ Edit Items
    │   ├─ Delete Items
    │   ├─ Toggle Stock Status
    │   └─ Search & Filter
    │
    └─→ Orders Tab
        ├─ View All Requests
        ├─ Filter by Status
        ├─ Track Order Details
        └─ Monitor Fulfillment
```

---

## Key Features Summary

| Feature                        | Admin | Worker | Customer |
| ------------------------------ | ----- | ------ | -------- |
| Add hardware items             | ✓     | -      | -        |
| Edit hardware items            | ✓     | -      | -        |
| Delete hardware items          | ✓     | -      | -        |
| Update stock status            | ✓     | -      | -        |
| View all hardware requests     | ✓     | -      | -        |
| Request hardware for job       | -     | ✓      | -        |
| View own hardware requests     | -     | ✓      | -        |
| Mark hardware delivered        | -     | ✓      | -        |
| Review hardware recommendation | -     | -      | ✓        |
| Approve/reject hardware        | -     | -      | ✓        |
| See hardware cost estimate     | -     | -      | ✓        |

---

## Integration Points

### With Job Management

- Hardware requests are linked to specific jobs
- Hardware cost is added to job pricing
- Job completion requires hardware delivery confirmation

### With Payment System

- Hardware cost is included in total job cost
- Hardware payments are separate line item in invoice
- Payment processing includes hardware charges

### With Notifications

- Worker notified when customer approves hardware
- Customer notified when hardware is recommended
- Admin can track all orders in one place

---

## Best Practices

1. **Stock Management**
   - Regularly update stock status
   - Mark items as out-of-stock when not available
   - Only items marked "In Stock" appear to workers

2. **Inventory Control**
   - Monitor popular items
   - Remove obsolete items
   - Keep prices updated

3. **Order Tracking**
   - Review pending requests regularly
   - Track worker deliveries
   - Monitor customer approvals

4. **Cost Management**
   - Accurate pricing for items
   - Regular inventory audit
   - Track hardware cost trends

---

## Future Enhancements

1. **Advanced Inventory Management**
   - Stock quantity tracking
   - Low stock alerts
   - Automatic reordering

2. **Analytics**
   - Most requested items
   - Hardware cost analysis
   - Popular categories

3. **Supplier Integration**
   - Direct supplier ordering
   - Bulk discounts
   - Delivery tracking

4. **Price Management**
   - Dynamic pricing
   - Discount rules
   - Category-based pricing

5. **Reviews & Ratings**
   - Item quality feedback
   - Worker ratings on item quality
   - Customer satisfaction with hardware
