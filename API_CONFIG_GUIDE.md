# API Configuration Guide

## Overview

The app now uses a centralized configuration system in `constants/config.ts` that automatically handles different environments.

## How It Works

### 1. **Automatic IP Detection**

The system reads `EXPO_PUBLIC_LOCAL_IP` from `.env` file:

```
EXPO_PUBLIC_LOCAL_IP=192.168.1.8
```

**To find your IP:**

- **Mac**: `ipconfig | grep "inet " | grep -v 127.0.0.1`
- **Windows**: `ipconfig` (look for IPv4 Address)
- **Linux**: `hostname -I`

### 2. **Environment-Based Configuration**

- **Development**: Uses local IP + port from `.env`
- **Production**: Uses `EXPO_PUBLIC_API_URL` from `.env` (optional)

### 3. **Configuration File (`constants/config.ts`)**

```typescript
{
  env: "development",
  isDev: true,
  api: {
    baseURL: "http://192.168.1.8:5001/api",
    debug: { /* ... */ }
  },
  features: { /* ... */ },
  timeouts: { /* ... */ }
}
```

## Setup Instructions

### Step 1: Find Your IP

```bash
# Mac/Linux
ipconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

### Step 2: Update `.env`

```bash
EXPO_PUBLIC_LOCAL_IP=192.168.1.8    # Your actual IP
EXPO_PUBLIC_API_PORT=5001            # Backend port
```

### Step 3: Ensure Backend is Running

```bash
# In a separate terminal
cd backend
npm start
# Should show: 🚀 Server running on port 5001
```

### Step 4: Restart Expo

```bash
# Press Ctrl+C to stop
npm start
```

## Troubleshooting

### "Network request failed"

✅ **Solution**: Verify your local IP is correct

```bash
# Test connection from terminal
curl http://192.168.1.8:5001/api/auth/me
# Should get: {"success":false,"message":"..."} (not "Connection refused")
```

### IP Changed After Restart

✅ **Solution**: Update `EXPO_PUBLIC_LOCAL_IP` in `.env` and restart Expo

### Using on Different Networks

✅ **Solution**: `.env` file is not committed to git, so each machine can have its own IP

## Environment Variables

| Variable               | Example               | Purpose                                     |
| ---------------------- | --------------------- | ------------------------------------------- |
| `EXPO_PUBLIC_LOCAL_IP` | `192.168.1.8`         | Your computer's local IP for mobile testing |
| `EXPO_PUBLIC_API_PORT` | `5001`                | Backend server port                         |
| `EXPO_PUBLIC_API_URL`  | `https://api.com/api` | Production API URL (optional)               |

## File Structure

```
constants/
├── api.ts          # ← Uses config.api.baseURL
├── config.ts       # ← Main configuration system (NEW)
├── Colors.ts
├── Store.ts
└── ...
```

## Benefits of This Approach

✅ No hardcoded IPs in code  
✅ Easy to switch between environments  
✅ Each machine can have different IP  
✅ Production-ready configuration  
✅ Centralized configuration system  
✅ Easy debugging with built-in logs
