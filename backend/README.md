# ClickFix Backend API

Complete Node.js/Express backend for ClickFix mobile marketplace application.

## Features

- **Authentication**: JWT-based authentication for workers and customers
- **Real-time Chat**: Socket.io integration for live messaging
- **Geospatial Queries**: Location-based worker search using MongoDB 2dsphere indexes
- **File Upload**: Cloudinary integration for images
- **Job Management**: Complete job lifecycle from creation to completion
- **Hardware Requests**: Workers can request hardware approval from customers
- **Reviews & Ratings**: Comprehensive review system with aspect ratings

## Installation

1. Install dependencies:

```bash
cd backend
npm install
```

2. Create `.env` file from `.env.example`:

```bash
cp .env.example .env
```

3. Update `.env` with your credentials:
   - MongoDB Atlas connection string
   - JWT secret key
   - Cloudinary credentials (for image uploads)

4. Start the server:

```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/worker/register` - Register new worker
- `POST /api/auth/customer/register` - Register new customer
- `POST /api/auth/worker/login` - Worker login
- `POST /api/auth/customer/login` - Customer login
- `GET /api/auth/me` - Get current user (requires auth)

### Workers

- `GET /api/workers` - Get all workers (with filters: category, location, rating)
- `GET /api/workers/:id` - Get single worker
- `PUT /api/workers/:id` - Update worker profile (worker only)
- `POST /api/workers/:id/certificates` - Add certificate (worker only)
- `PUT /api/workers/:id/availability` - Update availability (worker only)

### Customers

- `GET /api/customers/:id` - Get customer profile (customer only)
- `PUT /api/customers/:id` - Update customer profile (customer only)
- `POST /api/customers/:id/addresses` - Add address (customer only)
- `POST /api/customers/:id/favorites/:workerId` - Add to favorites
- `DELETE /api/customers/:id/favorites/:workerId` - Remove from favorites
- `POST /api/customers/:id/wallet` - Add wallet transaction

### Jobs

- `POST /api/jobs` - Create new job (customer only)
- `GET /api/jobs` - Get jobs (filtered by user role)
- `GET /api/jobs/available` - Get available jobs for workers (worker only)
- `GET /api/jobs/:id` - Get single job
- `PUT /api/jobs/:id/assign` - Worker accepts job (worker only)
- `PUT /api/jobs/:id/status` - Update job status
- `PUT /api/jobs/:id/cancel` - Cancel job

### Chat

- `GET /api/chat` - Get all chats for user
- `GET /api/chat/:chatId` - Get messages for a chat
- `POST /api/chat` - Send message
- `PUT /api/chat/:messageId/status` - Update message status (delivered/read)
- `PUT /api/chat/:chatId/read` - Mark all messages as read

### Reviews

- `POST /api/reviews` - Create review (customer only, completed jobs)
- `GET /api/reviews/worker/:workerId` - Get reviews for worker
- `GET /api/reviews/:id` - Get single review
- `PUT /api/reviews/:id/response` - Worker response to review (worker only)
- `PUT /api/reviews/:id/helpful` - Mark review as helpful

### Hardware

- `GET /api/hardware/items` - Get all hardware items
- `GET /api/hardware/items/:id` - Get single hardware item
- `POST /api/hardware/requests` - Create hardware request (worker only)
- `GET /api/hardware/requests` - Get hardware requests
- `GET /api/hardware/requests/:id` - Get single request
- `PUT /api/hardware/requests/:id/status` - Approve/reject request (customer only)
- `PUT /api/hardware/requests/:id/delivered` - Mark as delivered (worker only)

## Socket.io Events

### Client to Server

- `join-chat` - Join a chat room
- `send-message` - Send a message
- `typing` - User is typing

### Server to Client

- `receive-message` - Receive new message
- `user-typing` - Another user is typing

## Models

### Worker

- Authentication (email, password with bcrypt)
- Category, experience, hourly rate
- Location (GeoJSON Point with 2dsphere index)
- Ratings, certifications, availability
- Earnings tracking

### Customer

- Authentication (email, password with bcrypt)
- Multiple addresses with geolocation
- Wallet system with transaction history
- Favorite workers

### Job

- Customer and worker references
- Service type, description, images
- Location (GeoJSON Point)
- Status tracking (9 states)
- Pricing with auto-calculation
- Hardware items with approval workflow
- Timeline tracking

### Message

- Polymorphic sender/receiver (Worker or Customer)
- Chat ID for grouping
- Message status (sending/sent/delivered/read)
- Support for text, images, locations

### Review

- Job, customer, and worker references
- Overall rating + aspect ratings (professionalism, quality, punctuality, communication)
- Before/after images
- Worker response capability
- Anonymous option

### Hardware

- HardwareItem: Catalog of available items
- HardwareRequest: Worker requests with customer approval workflow

## Middleware

### Authentication (`middleware/auth.js`)

- `protect` - Verify JWT token and attach user to request
- `authorize(...userTypes)` - Restrict routes to specific user types

### Error Handler (`middleware/error.js`)

- Centralized error handling
- Handles Mongoose errors (validation, cast, duplicate key)

## Utilities

### Auth Utils (`utils/auth.js`)

- `generateToken(id, userType)` - Create JWT token
- `sendTokenResponse(user, statusCode, res, userType)` - Send token response

### Upload Utils (`utils/upload.js`)

- Multer + Cloudinary integration
- Different upload types (job images, certificates, profile pictures, reviews)
- Image deletion

## Database Seeding

To populate the database with sample data, you can create a seed script:

```javascript
// Create seed.js file
const mongoose = require("mongoose");
const { HardwareItem } = require("./models/Hardware");
require("dotenv").config();

// Add sample hardware items, workers, etc.
```

Run with: `node seed.js`

## Environment Variables

Required variables in `.env`:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/clickfix
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=5000
NODE_ENV=development
```

## Frontend Integration

Update your frontend to use the API:

1. Create `constants/api.ts`:

```typescript
const API_URL = "http://localhost:5000/api";

export const api = {
  auth: {
    workerLogin: `${API_URL}/auth/worker/login`,
    customerLogin: `${API_URL}/auth/customer/login`,
    // ... more endpoints
  },
  workers: {
    getAll: `${API_URL}/workers`,
    // ... more endpoints
  },
};
```

2. Update Store.ts to fetch from API instead of mock data

3. Add Socket.io client connection in your app

## Error Handling

All errors return consistent format:

```json
{
  "success": false,
  "message": "Error description"
}
```

Success responses:

```json
{
  "success": true,
  "data": { ... }
}
```

## Testing

Recommended tools:

- **Postman**: API endpoint testing
- **MongoDB Compass**: Database visualization
- **Socket.io Client**: Test real-time features

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use MongoDB Atlas for database
3. Deploy to platforms like:
   - Heroku
   - AWS EC2
   - DigitalOcean
   - Railway
   - Render

## Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with expiration
- Protected routes with authentication middleware
- CORS enabled
- Input validation on all endpoints
- Mongoose schema validation

## License

MIT
