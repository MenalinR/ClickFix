# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ClickFix is a mobile service marketplace platform connecting workers (service providers) with customers. Built with Expo (React Native) frontend and Express.js backend with MongoDB. Three user roles: Customer, Worker, Admin.

## Commands

### Frontend (root directory)
```bash
npm start              # Start Expo dev server
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator
npm run web            # Run web version
npm run lint           # ESLint
npm run reset-project  # Reset to fresh state
```

### Backend (backend/ directory)
```bash
cd backend
npm run dev            # Start with nodemon (development)
npm start              # Start production server
npm run seed           # Seed database with test data
npm run db:all         # Show all database info (collections, schemas, sample data)
```

## Architecture

### Frontend (Expo Router - file-based routing)
- **`app/`** — Screens organized by role using route groups:
  - `(auth)/` — Login, signup, admin-login
  - `(customer)/` — Customer tabs (home, bookings, profile), booking flow, chat, payments
  - `(worker)/` — Worker dashboard, job requests, earnings, documents, schedule
  - `(admin)/` — Admin dashboard, document verification, hardware management, user management
- **`constants/Store.ts`** — Zustand store: central state management (user, token, auth actions, API calls)
- **`constants/api.ts`** — API helper functions (`apiCall`, `apiUpload`) and endpoint definitions. Handles dynamic API URL resolution for mobile development (auto IP detection from Expo host)
- **`constants/config.ts`** — Environment-based configuration and API URL selection
- **`constants/Colors.ts`** / **`constants/theme.ts`** — Theming (primary: #0F4C75, accent: #FF7E00)
- **`services/firebaseService.ts`** — Firebase Auth & Firestore utilities (secondary auth system)
- **`components/`** — Reusable UI components (Button, themed-text, themed-view)

### Backend (Express REST API at `backend/`)
- **`server.js`** — Express + Socket.io setup, route mounting under `/api`
- **`controllers/`** — Route handlers: auth, worker, job, customer, chat, review, hardware, notification
- **`models/`** — Mongoose schemas: Worker, Customer, Job, Message, Review, Hardware, Notification, Admin
- **`routes/`** — Express route definitions mapping to controllers
- **`middleware/auth.js`** — JWT authentication (`protect`) and role-based authorization (`authorize`)
- **`utils/upload.js`** — Multer + Cloudinary file upload pipeline
- **`db.js`** — MongoDB connection (Atlas or local fallback)

### Key Patterns
- **Authentication**: JWT Bearer tokens with userType (worker/customer/admin) stored in token payload. Three separate user collections.
- **API calls**: Frontend uses `apiCall(url, method, data, token)` and `apiUpload(url, formData, token)` from `constants/api.ts`. Consistent response format: `{ success: bool, message?, data? }`.
- **File uploads**: expo-image-picker / expo-document-picker → FormData → Multer → Cloudinary
- **Real-time**: Socket.io for chat (join-chat, send-message, typing events)
- **Job workflow**: Pending → Accepted → On the way → In progress → Completed/Cancelled/Rejected
- **Document verification**: Workers upload ID/experience/education docs → Admin reviews → Verified/Rejected with notes

### Environment Setup
- **Backend `.env`**: MONGODB_URI, JWT_SECRET, JWT_EXPIRE, CLOUDINARY_* credentials, CLIENT_URL
- **Frontend `.env`**: EXPO_PUBLIC_FIREBASE_* keys, EXPO_PUBLIC_API_URL, EXPO_PUBLIC_LOCAL_IP
- See `.env.example` files in root and `backend/` directories
