# Firebase Quick Start - ClickFix

## 5-Minute Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Firebase Project

Go to [Firebase Console](https://console.firebase.google.com/) and:

- Create new project named "ClickFix"
- Get your Firebase config from Project Settings

### 3. Create .env File

Copy `.env.example` to `.env` and fill in your Firebase credentials:

```
EXPO_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

### 4. Enable Firebase Services

In Firebase Console:

1. **Authentication** → Enable "Email/Password"
2. **Firestore Database** → Create in Test Mode
3. **Storage** → Get Started in Test Mode

### 5. Create Collections in Firestore

Create these collections (click **Start Collection**):

- `customers`
- `workers`
- `jobs`
- `hardwareRequests`
- `hardwareItems`
- `messages`

### 6. Use Firebase in Code

**Import the service:**

```typescript
import { authService, firestoreService } from "@/services/firebaseService";
```

**Example: Register user**

```typescript
const user = await authService.register("user@example.com", "password", {
  name: "John",
  phone: "123456",
  userType: "customer",
});
```

**Example: Get workers**

```typescript
const workers = await firestoreService.getWorkers({ category: "Plumbing" });
```

**Example: Create job**

```typescript
const job = await firestoreService.createJob(jobData, userId);
```

## File Structure

```
ClickFix/
├── constants/
│   ├── firebase.ts          ← Firebase initialization
│   └── Store.ts             ← Zustand store
├── services/
│   └── firebaseService.ts   ← Firebase operations
├── .env                     ← Your Firebase config (not in git)
├── .env.example            ← Template for .env
└── FIREBASE_SETUP.md       ← Full setup guide
```

## Common Tasks

### Authenticate User

```typescript
// Login
const user = await authService.login(email, password);

// Register
const user = await authService.register(email, password, userData);

// Logout
await authService.logout();

// Get Current User
const user = await authService.getCurrentUser();
```

### Work with Jobs

```typescript
// Create
const job = await firestoreService.createJob(jobData, userId);

// Get all for user
const jobs = await firestoreService.getJobsByUser(userId, "customer");

// Get single
const job = await firestoreService.getJob(jobId);

// Update
await firestoreService.updateJob(jobId, { status: "in-progress" });

// Accept (worker)
await firestoreService.acceptJob(jobId, workerId);

// Get available
const jobs = await firestoreService.getAvailableJobs();
```

### Work with Hardware

```typescript
// Create request
const request = await firestoreService.createHardwareRequest(requestData);

// Get requests
const requests = await firestoreService.getHardwareRequests({
  status: "pending",
});
```

### Work with Users

```typescript
// Get workers
const workers = await firestoreService.getWorkers({
  category: "Plumbing",
});

// Get single worker
const worker = await firestoreService.getWorker(workerId);

// Update profile
await firestoreService.updateUserProfile(userId, "worker", profileData);
```

## Troubleshooting

| Issue                         | Solution                                     |
| ----------------------------- | -------------------------------------------- |
| "Firebase is not initialized" | Check `.env` file exists with correct values |
| "Permission denied"           | Edit Firestore security rules for testing    |
| "User not found"              | Register user first before logging in        |
| "Collection not found"        | Create collection in Firestore console       |

## Next Steps

1. ✅ **Setup**: Complete the 5 steps above
   2.📚 **Learn**: Read [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for detailed guide
2. 🧪 **Test**: Try authentication in your app
3. 🔄 **Migrate**: Update Store.ts to use Firebase services
4. 🚀 **Deploy**: Set up production security rules

## Resources

- [Firebase Docs](https://firebase.google.com/docs)
- [Firestore Guide](https://firebase.google.com/docs/firestore/start)
- [Auth Guide](https://firebase.google.com/docs/auth)
- [YouTube: Firebase Setup](https://www.youtube.com/results?search_query=firebase+setup)

---

**Need help?** Check the detailed guide in `FIREBASE_SETUP.md` or refer to the Firebase documentation.
