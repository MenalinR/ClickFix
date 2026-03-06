# Worker Document Verification System

## Overview

The worker document verification system allows workers to upload ID proof and experience certificates for admin verification. This ensures trust and safety in the ClickFix marketplace by validating worker credentials.

## Features

### For Workers

- **Upload ID Proof**: Upload government-issued ID (NIC, Passport, Driving License, etc.)
- **Upload Experience Documents**: Upload certificates, licenses, training documents
- **Verification Status**: Real-time tracking of document verification status
- **Get Feedback**: View admin notes if documents are rejected
- **Resubmit**: Can resubmit rejected documents

### For Admins

- **Document Review Queue**: See all pending documents needing verification
- **Worker Details**: Access worker information and category
- **Document Viewing**: Quick access to view uploaded documents
- **Approval/Rejection**: Approve verified documents or reject with detailed notes
- **Summary Dashboard**: See total pending documents count

## Database Schema

### Worker Model Updates

```javascript
// ID Proof
idProof: {
  url: String,                              // Secure URL to document
  documentType: String,                     // NIC, Passport, DrivingLicense, Other
  uploadedAt: Date,                         // When document was uploaded
  verificationStatus: String,               // Pending, Verified, Rejected
  verificationNotes: String,                // Admin notes if rejected
  verifiedAt: Date                          // When admin verified/rejected
}

// Experience Documents
experienceDocuments: [{
  name: String,                             // Certificate/License name
  url: String,                              // Secure URL
  documentType: String,                     // Certificate, License, Training, Other
  issueDate: Date,                          // When document was issued
  expiryDate: Date,                         // When document expires (if applicable)
  uploadedAt: Date,                         // When document was uploaded
  verificationStatus: String,               // Pending, Verified, Rejected
  verificationNotes: String,                // Admin notes if rejected
  verifiedAt: Date                          // When admin verified/rejected
}]
```

## API Endpoints

### Worker Endpoints (Protected - Requires Worker Auth)

#### 1. Upload ID Proof

```
POST /api/workers/:id/upload-id-proof
Authorization: Bearer {token}

Body:
{
  "documentUrl": "https://cloudinary.com/...",
  "documentType": "NIC"  // NIC, Passport, DrivingLicense, Other
}

Response:
{
  "success": true,
  "message": "ID proof uploaded successfully. Waiting for admin verification.",
  "data": { ...updatedWorker }
}
```

#### 2. Upload Experience Document

```
POST /api/workers/:id/upload-experience
Authorization: Bearer {token}

Body:
{
  "documentUrl": "https://cloudinary.com/...",
  "documentName": "HVAC Technician Training",
  "documentType": "Certificate",  // Certificate, License, Training, Other
  "issueDate": "2022-01-15",      // Optional
  "expiryDate": "2025-01-15"      // Optional
}

Response:
{
  "success": true,
  "message": "Document uploaded successfully. Waiting for admin verification.",
  "data": { ...updatedWorker }
}
```

#### 3. Get Verification Status

```
GET /api/workers/:id/verification-status
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "idProof": { ...document },
    "experienceDocuments": [ ...documents ],
    "isFullyVerified": true
  }
}
```

### Admin Endpoints (Protected - Requires Admin Auth)

#### 1. Get All Pending Documents

```
GET /api/workers/admin/pending
Authorization: Bearer {adminToken}

Response:
{
  "success": true,
  "data": [
    {
      "workerId": "639...",
      "workerName": "John Doe",
      "workerEmail": "john@example.com",
      "workerPhone": "03001234567",
      "category": "Electrician",
      "documentType": "ID Proof",
      "document": { ...document },
      "uploadedAt": "2024-01-15T10:30:00Z"
    },
    ...
  ],
  "count": 5
}
```

#### 2. Verify ID Proof

```
PUT /api/workers/:id/verify-id-proof
Authorization: Bearer {adminToken}

Body:
{
  "status": "Verified",  // or "Rejected"
  "notes": "Document looks valid"
}

Response:
{
  "success": true,
  "message": "ID proof verified successfully",
  "data": { ...updatedWorker }
}
```

#### 3. Verify Experience Document

```
PUT /api/workers/:id/verify-experience/:docId
Authorization: Bearer {adminToken}

Body:
{
  "status": "Rejected",
  "notes": "Certificate is expired, please upload recent certification"
}

Response:
{
  "success": true,
  "message": "Document rejected successfully",
  "data": { ...updatedWorker }
}
```

## Frontend Components

### Worker Document Upload Screen

**File**: `app/(worker)/documents.tsx`

Features:

- Upload ID proof with type selection
- Upload multiple experience documents
- Real-time verification status display
- Admin notes feedback display
- Document type specific information fields

Status indicators:

- 🟢 **Verified**: Document approved
- 🟡 **Pending**: Awaiting admin review
- 🔴 **Rejected**: Resubmit with corrections

### Admin Document Verification Screen

**File**: `app/(admin)/documents.tsx`

Features:

- List all pending documents
- Expandable document details
- Worker information display
- Document viewing link
- Approve/Reject with notes
- Real-time update after action

## Workflow

### Worker Submission Workflow

1. Worker logs in and goes to Documents section
2. Selects document type (ID/Certificate)
3. Picks document from device
4. Submits for verification
5. Document status changes to "Pending"
6. Receives notification when verified/rejected

### Admin Verification Workflow

1. Admin logs in and goes to Document Verification
2. Sees queue of pending documents
3. Expands document to view details
4. Views full document
5. Either:
   - **Approve**: Marks as Verified (worker can start accepting jobs)
   - **Reject**: Provides specific notes (worker must resubmit)
6. Document removed from pending queue

## Security Considerations

### Current Implementation

- JWT token authentication on all endpoints
- Role-based access control (worker/admin)
- Document URLs stored (ready for secure storage service)
- Verification workflow with admin approval

### Recommended Enhancements

1. **File Storage**
   - Use Cloudinary or AWS S3 for secure document hosting
   - Enable automatic scanning/virus detection
   - Set file size limits (max 5MB recommended)
   - Restrict file types (PDF, JPG, PNG)

2. **Verification Workflow**
   - Implement document expiry validation
   - Cross-reference with official databases (optional)
   - Multiple admin approvals for high-value certifications
   - Audit trail of all verification actions

3. **Privacy**
   - Store documents securely (encrypted at rest)
   - Auto-delete rejected documents after retention period
   - Mask sensitive information in listings
   - GDPR compliance for document retention

## Frontend Integration

### File Upload Implementation

Currently using `expo-document-picker`. For production:

```typescript
import * as DocumentPicker from "expo-document-picker";

// File selection
const result = await DocumentPicker.getDocumentAsync({
  type: ["application/pdf", "image/*"],
});

// Upload to Cloudinary or backend
const formData = new FormData();
formData.append("file", {
  uri: result.assets[0].uri,
  type: "application/pdf",
  name: result.assets[0].name,
});

// Send to backend
const response = await fetch(uploadUrl, {
  method: "POST",
  body: formData,
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

## State Management

All verification data flows through Zustand store:

```typescript
const useStore = create((set) => ({
  user: null,  // Contains updated idProof and experienceDocuments

  // API calls update user state
  loginWorker: async (credentials) => {
    // Response includes verification fields
    const response = await apiCall(...);
    set({ user: response.data });
  }
}));
```

## Error Handling

### Common Errors & Solutions

**"Document not found"**

- Ensure document ID is correct
- Document may have been deleted

**"Invalid document type"**

- Use only: NIC, Passport, DrivingLicense, Other (for ID)
- Use only: Certificate, License, Training, Other (for experience)

**"Verification in progress"**

- Admin is reviewing the document
- Check status in a few hours

**"Rejected - see admin notes"**

- View rejection reason in document details
- Address concerns and resubmit

## Testing

### Manual Testing Steps

1. **Worker Upload Flow**
   - Create new worker account
   - Navigate to Documents section
   - Select document type
   - Pick document using file picker
   - Verify status changes to "Pending"

2. **Admin Verification Flow**
   - Log in as admin
   - Go to Document Verification
   - See pending documents list
   - Expand a document
   - Approve/reject with notes
   - Verify document removed from queue

3. **Feedback Loop**
   - Worker checks document status
   - Sees admin feedback if rejected
   - Can resubmit with corrections
   - Status updates in real-time

## Future Enhancements

1. **Document Expiry Alerts**: Notify workers when certificates expiring soon
2. **Auto-Verification**: Integration with official databases for instant verification
3. **Batch Export**: Admin ability to export verification reports
4. **Document Templates**: Provide standards for document submission
5. **Payment Hold**: Prevent payout until documents verified
6. **Recurring Verification**: Require re-verification after certain period
7. **Mobile Document Capture**: Built-in camera for document photos
8. **OCR Integration**: Automatic data extraction from documents

## API Constants

```typescript
// constants/api.ts
workers: {
  uploadIDProof: (id) => `${API_URL}/workers/${id}/upload-id-proof`,
  uploadExperience: (id) => `${API_URL}/workers/${id}/upload-experience`,
  getVerificationStatus: (id) => `${API_URL}/workers/${id}/verification-status`,
  verifyIDProof: (id) => `${API_URL}/workers/${id}/verify-id-proof`,
  verifyExperience: (id, docId) => `${API_URL}/workers/${id}/verify-experience/${docId}`,
}

admin: {
  getPendingDocuments: `${API_URL}/workers/admin/pending`,
}
```

## Summary

The document verification system provides:

- ✅ Secure document upload for workers
- ✅ Real-time verification status tracking
- ✅ Admin review and approval workflow
- ✅ Feedback mechanism for rejected documents
- ✅ Role-based access control
- ✅ Scalable architecture for future enhancements
