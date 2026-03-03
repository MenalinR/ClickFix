# Firebase Setup Guide for ClickFix

## Overview
This guide explains how to set up and use Firebase in the ClickFix application. Firebase provides backend services including authentication, real-time database, cloud storage, and push notifications.

## What's Been Added

### 1. **Dependencies**
The following packages have been added to `package.json`:
- `firebase` - Core Firebase SDK
- `@react-native-firebase/app` - React Native Firebase wrapper
- `@react-native-firebase/auth` - Authentication
- `@react-native-firebase/firestore` - Database
- `@react-native-firebase/messaging` - Push notifications
- `@react-native-async-storage/async-storage` - Local persistence
- `expo-notifications` - Expo notification handling

### 2. **Files Created**

#### `constants/firebase.ts`
- Firebase app initialization
- Auth, Firestore, and Storage setup
- Configuration loading from environment variables

#### `services/firebaseService.ts`
- **Authentication Service**: register, login, logout, password reset
- **Firestore Service**: CRUD operations for users, jobs, hardware requests
- **Real-time Service**: Setup for listening to data changes

#### `.env.example`
- Template for Firebase configuration variables

## Setup Steps

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a new project"**
3. Enter project name: `ClickFix`
4. Enable Google Analytics (optional)
5. Click **"Create project"**

### Step 2: Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Under **General** tab, scroll to **Your apps** section
3. Choose **Web** (</>) to register a web app
4. Enter app name: `ClickFix`
5. Copy the Firebase config object

**Your config will look like:**
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "clickfix-xxxxx.firebaseapp.com",
  projectId: "clickfix-xxxxx",
  storageBucket: "clickfix-xxxxx.appspot.com",
  messagingSenderId: "234567890123",
  appId: "1:234567890123:web:abcdef123456",
  databaseURL: "https://clickfix-xxxxx.firebaseio.com"
};
```

### Step 3: Create .env File

1. Copy `.env.example` to `.env` in the root directory
2. Fill in your Firebase credentials:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=clickfix-xxxxx.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=clickfix-xxxxx
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=clickfix-xxxxx.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=234567890123
EXPO_PUBLIC_FIREBASE_APP_ID=1:234567890123:web:abcdef123456
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://clickfix-xxxxx.firebaseio.com
```

### Step 4: Enable Firebase Services

#### Authentication
1. In Firebase Console, go to **Authentication**
2. Click **"Get Started"**
3. Enable **Email/Password** provider
4. Enable **Google** provider (optional, for social login)

#### Firestore Database
1. Go to **Firestore Database**
2. Click **"Create Database"**
3. Start in **Test Mode** (for development)
4. Choose location closest to your users
5. Click **"Enable"**

#### Storage
1. Go to **Storage**
2. Click **"Get Started"**
3. Start in **Test Mode**
4. Choose location
5. Click **"Done"**

### Step 5: Create Firestore Collections

Create these collections in your Firestore database:

#### `customers` Collection
```
- Document ID: [user-uid]
- Fields:
  - id: string (user UID)
  - email: string
  - name: string
  - phone: string
  - userType: "customer"
  - addresses: array
  - wallet: { balance: number }
  - favoriteWorkers: array
  - createdAt: timestamp
  - updatedAt: timestamp
```

#### `workers` Collection
```
- Document ID: [user-uid]
- Fields:
  - id: string (user UID)
  - email: string
  - name: string
  - phone: string
  - userType: "worker"
  - category: string
  - rating: number
  - hourlyRate: number
  - verified: boolean
  - experience: string
  - image: string
  - createdAt: timestamp
  - updatedAt: timestamp
```

#### `jobs` Collection
```
- Document ID: [auto-generated]
- Fields:
  - id: string
  - customerId: string
  - workerId: string (optional)
  - serviceType: string
  - description: string
  - status: "pending" | "accepted" | "in-progress" | "completed" | "cancelled"
  - date: timestamp
  - location: { type: "Point", coordinates: [lat, long] }
  - pricing: { totalAmount: number, serviceCost: number, labourCost: number, hardwareCost: number }
  - createdAt: timestamp
  - updatedAt: timestamp
```

#### `hardwareRequests` Collection
```
- Document ID: [auto-generated]
- Fields:
  - id: string
  - jobId: string
  - workerId: string
  - customerId: string
  - items: array
  - totalCost: number
  - status: "pending" | "approved" | "rejected" | "delivered"
  - createdAt: timestamp
  - updatedAt: timestamp
```

#### `messages` Collection
```
- Document ID: [auto-generated]
- Fields:
  - id: string
  - chatId: string
  - senderId: string
  - receiverId: string
  - message: string
  - read: boolean
  - createdAt: timestamp
```

#### `hardwareItems` Collection
```
- Document ID: [auto-generated]
- Fields:
  - id: string
  - name: string
  - category: string
  - price: number
  - unit: string
  - description: string
  - image: string
  - inStock: boolean
  - createdAt: timestamp
  - updatedAt: timestamp
```

## Usage Examples

### Authentication

#### Register a new customer:
```typescript
import { authService } from '@/services/firebaseService';

const handleRegister = async () => {
  try {
    const user = await authService.register(
      'customer@example.com',
      'password123',
      {
        name: 'John Doe',
        phone: '1234567890',
        userType: 'customer'
      }
    );
    console.log('User registered:', user);
  } catch (error) {
    console.error('Registration error:', error);
  }
};
```

#### Login:
```typescript
const handleLogin = async () => {
  try {
    const user = await authService.login('customer@example.com', 'password123');
    console.log('Logged in:', user);
  } catch (error) {
    console.error('Login error:', error);
  }
};
```

#### Logout:
```typescript
const handleLogout = async () => {
  try {
    await authService.logout();
    console.log('Logged out');
  } catch (error) {
    console.error('Logout error:', error);
  }
};
```

### Data Operations

#### Get all workers:
```typescript
import { firestoreService } from '@/services/firebaseService';

const getWorkers = async () => {
  try {
    const workers = await firestoreService.getWorkers({
      category: 'Plumbing',
      rating: 4
    });
    console.log('Workers:', workers);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

#### Create a job:
```typescript
const createJob = async () => {
  try {
    const job = await firestoreService.createJob(
      {
        serviceType: 'Plumbing Repair',
        description: 'Fix leaky faucet',
        location: {
          type: 'Point',
          coordinates: [6.9271, 80.7789] // Colombo, Sri Lanka
        },
        pricing: {
          totalAmount: 5000,
          serviceCost: 3000,
          labourCost: 2000
        }
      },
      userId
    );
    console.log('Job created:', job);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

#### Accept a job (worker):
```typescript
const acceptJob = async (jobId: string, workerId: string) => {
  try {
    await firestoreService.acceptJob(jobId, workerId);
    console.log('Job accepted');
  } catch (error) {
    console.error('Error:', error);
  }
};
```

#### Get my jobs:
```typescript
const getMyJobs = async (userId: string, userType: 'customer' | 'worker') => {
  try {
    const jobs = await firestoreService.getJobsByUser(userId, userType);
    console.log('My jobs:', jobs);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## Integrating with Zustand Store

Update `constants/Store.ts` to use Firebase services:

```typescript
import { authService, firestoreService } from '@/services/firebaseService';

export const useStore = create<StoreState>((set, get) => ({
  // ... initial state ...

  loginWorker: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const user = await authService.login(email, password);
      set({
        user,
        token: await auth.currentUser?.getIdToken(),
        isLoggedIn: true,
      });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createJob: async (jobData: any) => {
    set({ loading: true });
    try {
      const job = await firestoreService.createJob(jobData, get().user?.id!);
      const jobs = get().jobs;
      set({ jobs: [...jobs, job] });
      return job;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // ... other methods ...
}));
```

## Firestore Security Rules

Add these rules for development (go to **Firestore** → **Rules"):

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to access their own documents
    match /customers/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    match /workers/{userId} {
      allow read: if true;
      allow write: if request.auth.uid == userId;
    }

    match /jobs/{jobId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.customerId || request.auth.uid == resource.data.workerId;
    }

    match /hardwareRequests/{docId} {
      allow read, write: if request.auth != null;
    }

    match /hardwareItems/{docId} {
      allow read: if true;
      allow write: if false; // Only backend can modify
    }

    match /messages/{docId} {
      allow read: if request.auth.uid == resource.data.senderId || request.auth.uid == resource.data.receiverId;
      allow create: if request.auth != null;
    }
  }
}
```

## Push Notifications Setup

### For iOS:
1. Go to Firebase Console → Project Settings
2. Download `GoogleService-Info.plist`
3. Add to Xcode project

### For Android:
1. Go to Firebase Console → Project Settings
2. Download `google-services.json`
3. Place in `android/app/` directory

## Testing

Use Firebase Emulator Suite for local testing:

```bash
firebase emulators:start
```

This allows testing without connecting to live Firebase.

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Create `.env` file with Firebase credentials
3. ✅ Set up Firestore collections
4. ✅ Enable authentication providers
5. ✅ Test authentication flow
6. ✅ Implement real-time listeners for live updates
7. ✅ Set up push notifications

## Troubleshooting

### "Firebase is not initialized"
- Make sure environment variables are set correctly
- Check `.env` file is in the root directory
- Restart the development server

### "Permission denied" errors
- Check Firestore security rules
- Verify user is authenticated
- Check collection and document permissions

### Real-time data not updating
- Make sure you're using `onSnapshot` for real-time listeners
- Check Firestore rules allow read access
- Verify network connectivity

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Docs](https://firebase.google.com/docs/firestore)
- [React Native Firebase](https://rnfirebase.io/)
- [Expo Firebase](https://docs.expo.dev/guides/using-firebase/)
