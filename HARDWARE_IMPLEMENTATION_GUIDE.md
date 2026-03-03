# Hardware Shop Implementation Guide

## Quick Reference for Developers

### 1. Database Models

#### HardwareItem
```javascript
// File: backend/models/Hardware.js
const hardwareItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ["Plumbing", "Electrical", "Carpentry", "General"],
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  unit: {
    type: String,
    default: "piece",
    enum: ["piece", "meter", "kg", "liter", "box"],
  },
  description: String,
  image: String,
  inStock: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});
```

#### HardwareRequest
```javascript
const hardwareRequestSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true,
  },
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Worker",
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  items: [
    {
      hardwareId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "HardwareItem",
      },
      name: String,
      quantity: { type: Number, default: 1 },
      price: Number,
    },
  ],
  totalCost: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "delivered"],
    default: "pending",
  },
  customerNote: String,
  workerNote: String,
}, {
  timestamps: true,
});
```

---

### 2. API Examples

#### Create Hardware Request (Worker)
```javascript
async function requestHardware(jobId, items) {
  const response = await fetch('http://localhost:5000/api/hardware/requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`,
    },
    body: JSON.stringify({
      jobId: jobId,
      items: [
        { itemId: '507f1f77bcf86cd799439011', quantity: 2 },
        { itemId: '507f1f77bcf86cd799439012', quantity: 1 }
      ]
    })
  });
  
  const data = await response.json();
  return data;
}

// Response:
// {
//   success: true,
//   data: {
//     _id: '507f...',
//     jobId: '507f...',
//     workerId: '507f...',
//     customerId: '507f...',
//     items: [...],
//     totalCost: 1200,
//     status: 'pending',
//     createdAt: '2026-02-19T...'
//   }
// }
```

#### Approve Hardware Request (Customer)
```javascript
async function approveHardware(requestId) {
  const response = await fetch(
    `http://localhost:5000/api/hardware/requests/${requestId}/status`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        status: 'approved'
      })
    }
  );
  
  const data = await response.json();
  return data;
}
```

#### Mark Hardware Delivered (Worker)
```javascript
async function markHardwareDelivered(requestId) {
  const response = await fetch(
    `http://localhost:5000/api/hardware/requests/${requestId}/delivered`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${workerToken}`,
      }
    }
  );
  
  const data = await response.json();
  return data;
}
```

#### Get Available Hardware Items (Public)
```javascript
async function getHardwareItems(category = null, search = null) {
  let url = 'http://localhost:5000/api/hardware/items';
  const params = new URLSearchParams();
  
  if (category) params.append('category', category);
  if (search) params.append('search', search);
  
  if (params.toString()) {
    url += '?' + params.toString();
  }
  
  const response = await fetch(url);
  const data = await response.json();
  return data.data; // Returns only in-stock items
}

// Response:
// [
//   {
//     _id: '507f...',
//     name: 'PVC Pipe (1 inch)',
//     category: 'Plumbing',
//     price: 450,
//     unit: 'piece',
//     description: 'High-quality PVC pipe...',
//     inStock: true
//   },
//   ...
// ]
```

---

### 3. Admin Hardware Management

#### Create Hardware Item (Admin)
```javascript
async function createHardwareItem(itemData) {
  const response = await fetch('http://localhost:5000/api/hardware/admin/items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: 'PVC Pipe (1 inch)',
      category: 'Plumbing',
      price: 450,
      unit: 'piece',
      description: 'High-quality PVC pipe for water lines',
      image: 'https://...'
    })
  });
  
  const data = await response.json();
  return data;
}
```

#### Update Hardware Item (Admin)
```javascript
async function updateHardwareItem(itemId, updates) {
  const response = await fetch(
    `http://localhost:5000/api/hardware/admin/items/${itemId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        price: 500, // Updated price
        description: 'Updated description',
        inStock: true
      })
    }
  );
  
  const data = await response.json();
  return data;
}
```

#### Toggle Stock Status (Admin)
```javascript
async function toggleStock(itemId, inStock) {
  const response = await fetch(
    `http://localhost:5000/api/hardware/admin/items/${itemId}/stock`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        inStock: inStock
      })
    }
  );
  
  const data = await response.json();
  return data;
}
```

#### Delete Hardware Item (Admin)
```javascript
async function deleteHardwareItem(itemId) {
  const response = await fetch(
    `http://localhost:5000/api/hardware/admin/items/${itemId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      }
    }
  );
  
  const data = await response.json();
  return data;
}
```

#### Get All Hardware Items (Admin - including out of stock)
```javascript
async function getAdminHardwareItems(category = null) {
  let url = 'http://localhost:5000/api/hardware/admin/items';
  
  if (category) {
    url += `?category=${category}`;
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${adminToken}`,
    }
  });
  
  const data = await response.json();
  return data.data; // Includes out-of-stock items
}
```

#### Get Hardware Requests (Admin)
```javascript
async function getHardwareRequests(filters = {}) {
  let url = 'http://localhost:5000/api/hardware/admin/requests';
  const params = new URLSearchParams();
  
  if (filters.status) params.append('status', filters.status);
  if (filters.workerId) params.append('workerId', filters.workerId);
  if (filters.customerId) params.append('customerId', filters.customerId);
  
  if (params.toString()) {
    url += '?' + params.toString();
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${adminToken}`,
    }
  });
  
  const data = await response.json();
  return data.data;
}

// Response:
// [
//   {
//     _id: '507f...',
//     jobId: {
//       _id: '507f...',
//       serviceType: 'Plumbing Repair',
//       status: 'in-progress'
//     },
//     workerId: {
//       _id: '507f...',
//       name: 'John Doe',
//       phone: '9876543210'
//     },
//     customerId: {
//       _id: '507f...',
//       name: 'Jane Smith',
//       phone: '9876543211'
//     },
//     items: [
//       {
//         hardwareId: '507f...',
//         name: 'PVC Pipe',
//         quantity: 2,
//         price: 450
//       }
//     ],
//     totalCost: 900,
//     status: 'pending',
//     createdAt: '2026-02-19T...'
//   }
// ]
```

---

### 4. React Component Hooks

#### useHardwareItems (for workers/public)
```typescript
function useHardwareItems(category?: string, search?: string) {
  const [items, setItems] = useState<HardwareItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        let url = 'http://localhost:5000/api/hardware/items';
        const params = new URLSearchParams();
        
        if (category) params.append('category', category);
        if (search) params.append('search', search);
        
        if (params.toString()) {
          url += '?' + params.toString();
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
          setItems(data.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching items');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [category, search]);

  return { items, loading, error };
}
```

#### useHardwareRequests (for workers/customers)
```typescript
function useHardwareRequests() {
  const [requests, setRequests] = useState<HardwareRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/hardware/requests', {
        headers: {
          'Authorization': `Bearer ${global.userToken}`,
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setRequests(data.data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return { requests, loading, refetch: fetchRequests };
}
```

---

### 5. State Management with Zustand/Context

#### Global Hardware Store
```typescript
// constants/Store.ts
export interface HardwareStore {
  hardwareItems: HardwareItem[];
  hardwareRequests: HardwareRequest[];
  
  fetchHardwareItems: (category?: string) => Promise<void>;
  fetchHardwareRequests: () => Promise<void>;
  createHardwareRequest: (jobId: string, items: any[]) => Promise<HardwareRequest>;
  approveHardware: (requestId: string) => Promise<void>;
  markDelivered: (requestId: string) => Promise<void>;
}

// Usage in components:
const hardwareItems = useStore((state) => state.hardwareItems);
const createRequest = useStore((state) => state.createHardwareRequest);
```

---

### 6. Error Handling Examples

#### Try-Catch Pattern
```typescript
async function handleHardwareApproval(requestId: string) {
  try {
    const response = await fetch(
      `http://localhost:5000/api/hardware/requests/${requestId}/status`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'approved' })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to approve hardware');
    }

    Alert.alert('Success', 'Hardware approved successfully');
    // Refresh UI
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    Alert.alert('Error', errorMsg);
    
    // Log for debugging
    console.error('Hardware approval failed:', error);
  }
}
```

---

### 7. Validation Examples

#### Validate Hardware Request
```typescript
function validateHardwareRequest(items: any[]) {
  const errors: string[] = [];

  if (!items || items.length === 0) {
    errors.push('Please select at least one item');
  }

  items.forEach((item, index) => {
    if (!item.itemId) {
      errors.push(`Item ${index + 1}: Missing item ID`);
    }
    if (!item.quantity || item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Invalid quantity`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}
```

---

### 8. File Structure

```
ClickFix/
├── backend/
│   ├── models/
│   │   └── Hardware.js
│   ├── controllers/
│   │   └── hardwareController.js
│   ├── routes/
│   │   └── hardware.js
│   └── server.js
│
├── app/
│   ├── (admin)/
│   │   └── hardware.tsx (Hardware Shop page)
│   │
│   ├── (worker)/
│   │   └── hardware-request.tsx (Hardware Request page)
│   │
│   └── (customer)/
│       └── (tabs)/
│           └── (job details page with hardware review)
│
└── constants/
    └── Store.ts (Global state management)
```

---

### 9. Testing Examples

#### Test Hardware Creation
```javascript
// Jest example
describe('Hardware Controller', () => {
  test('Should create a new hardware item', async () => {
    const itemData = {
      name: 'PVC Pipe',
      category: 'Plumbing',
      price: 450,
      unit: 'piece'
    };

    const response = await request(app)
      .post('/api/hardware/admin/items')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(itemData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('PVC Pipe');
  });

  test('Should not allow non-admin to create items', async () => {
    const response = await request(app)
      .post('/api/hardware/admin/items')
      .set('Authorization', `Bearer ${workerToken}`)
      .send({ name: 'Test' });

    expect(response.status).toBe(403);
  });
});
```

---

### 10. Common Issues & Solutions

#### Issue: Hardware items not showing for worker
**Solution:** Check if items are marked `inStock: true` in database
```javascript
// Check in database
db.hardwareitems.find({ inStock: false })

// Update if needed
db.hardwareitems.updateMany(
  { inStock: false },
  { $set: { inStock: true } }
)
```

#### Issue: Customer not seeing hardware request
**Solution:** Verify hardware request is linked to correct job and customer
```javascript
// Check relationship
db.hardwarerequests.findById(requestId)
  .populate('jobId')
  .populate('customerId')
```

#### Issue: Authorization errors on admin routes
**Solution:** Verify user has 'admin' role in authentication middleware
```javascript
// In auth middleware
if (req.userType !== 'admin') {
  return res.status(403).json({
    success: false,
    message: 'Admin access required'
  });
}
```

---

## Performance Optimization Tips

1. **Index Hardware Requests**
```javascript
// Add to Hardware.js model
hardwareRequestSchema.index({ jobId: 1 });
hardwareRequestSchema.index({ workerId: 1 });
hardwareRequestSchema.index({ customerId: 1 });
hardwareRequestSchema.index({ status: 1 });
```

2. **Cache Hardware Items**
```javascript
// In controller
const cacheKey = `hardware_items_${category}`;
const cached = cache.get(cacheKey);
if (cached) return cached;
// ... fetch from DB
cache.set(cacheKey, items, 3600); // 1 hour TTL
```

3. **Pagination for Large Lists**
```javascript
const limit = 20;
const page = req.query.page || 1;
const skip = (page - 1) * limit;
const items = await HardwareItem.find(query)
  .skip(skip)
  .limit(limit);
```
