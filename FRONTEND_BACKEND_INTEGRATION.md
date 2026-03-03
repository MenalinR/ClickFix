# Frontend-Backend Integration Guide

## 🎯 How It Works

When you use the app on your phone/simulator:

```
1. User enters data in Frontend (Expo app)
   ↓
2. App sends HTTP request to Backend API
   ↓
3. Backend saves data to MongoDB
   ↓
4. App fetches data from Backend and displays it
```

## 📁 Files Created

### 1. **constants/api.ts** - API Configuration

- All API endpoints
- Helper function `apiCall()` for requests
- Supports authentication with JWT tokens

### 2. **constants/apiExamples.ts** - Usage Examples

- How to register users
- How to create jobs
- How to fetch workers
- How to send messages
- And more...

### 3. **constants/Store-new.ts** - Updated Store

- Uses real API instead of mock data
- Login/Register functions
- Fetch and create data functions

## 🔧 How to Use

### Step 1: Example - Login a Worker

**In your login page:**

```tsx
import { useStore } from "@/constants/Store";

export default function LoginScreen() {
  const loginWorker = useStore((state) => state.loginWorker);

  const handleLogin = async () => {
    try {
      await loginWorker("john@test.com", "password123");
      // Navigate to home page
    } catch (error) {
      alert("Login failed: " + error);
    }
  };

  return (
    <TouchableOpacity onPress={handleLogin}>
      <Text>Login</Text>
    </TouchableOpacity>
  );
}
```

### Step 2: Example - Get All Workers

**In your worker list page:**

```tsx
import { useStore } from "@/constants/Store";
import { useEffect } from "react";

export default function WorkersScreen() {
  const workers = useStore((state) => state.workers);
  const fetchWorkers = useStore((state) => state.fetchWorkers);

  useEffect(() => {
    fetchWorkers({ category: "Electrician" });
  }, []);

  return (
    <FlatList
      data={workers}
      renderItem={({ item }) => (
        <Text>
          {item.name} - ${item.hourlyRate}/hr
        </Text>
      )}
    />
  );
}
```

### Step 3: Example - Create a Job

**In your book service page:**

```tsx
import { useStore } from "@/constants/Store";

export default function BookServiceScreen() {
  const createJob = useStore((state) => state.createJob);

  const handleBookService = async () => {
    try {
      const job = await createJob({
        serviceType: "Electrician",
        description: "Need to fix broken socket",
        images: [],
        location: {
          type: "Point",
          coordinates: [-73.935242, 40.73061],
        },
        scheduledDate: "2026-02-20",
        urgency: "normal",
        estimatedHours: 2,
      });

      alert("Job created! Job ID: " + job.id);
    } catch (error) {
      alert("Error: " + error);
    }
  };

  return (
    <TouchableOpacity onPress={handleBookService}>
      <Text>Book Service</Text>
    </TouchableOpacity>
  );
}
```

## 🚀 Setup Steps

1. **Make sure backend is running:**

```bash
cd backend
node server.js
# Should show: 🚀 Server running on port 5001
```

2. **Update .env (if needed):**

```
# In constants/api.ts, change API_URL if using different port:
const API_URL = 'http://localhost:5001/api';
```

3. **Replace your Store.ts:**

```bash
# Backup old one
mv constants/Store.ts constants/Store-old.ts

# Use new one
mv constants/Store-new.ts constants/Store.ts
```

4. **Update your pages to use the Store:**

See the examples in `constants/apiExamples.ts`

## 📊 Data Flow Examples

### Register and Login:

```
User fills form
  ↓
Calls registerWorker()
  ↓
POSTs to /api/auth/worker/register
  ↓
Backend saves to MongoDB
  ↓
Returns user + token
  ↓
App stores token in memory
  ↓
Can now make authenticated requests
```

### Create a Job:

```
Customer fills job details
  ↓
Calls createJob(jobData)
  ↓
POSTs to /api/jobs with token
  ↓
Backend creates job in MongoDB
  ↓
Returns job object
  ↓
App updates local state
  ↓
Job appears in customer's job list
```

### Fetch Workers:

```
Customer searches for workers
  ↓
Calls fetchWorkers(filters)
  ↓
GETs from /api/workers?category=Electrician
  ↓
Backend queries MongoDB
  ↓
Returns array of workers
  ↓
App displays them in FlatList
```

## ✅ Test It Now

1. Start backend: `node server.js` (port 5001)
2. In your app, try registering a worker
3. Data will be saved to MongoDB
4. Fetch workers to see it listed

All data is now persisted! 🎉
