// API Configuration
// Change IP in .env file instead of hardcoding here
// EXPO_PUBLIC_API_URL=http://192.168.1.8:5001/api
import { config } from "./config";

const API_URL = config.api.baseURL;

export const api = {
  // Authentication
  auth: {
    workerRegister: `${API_URL}/auth/worker/register`,
    customerRegister: `${API_URL}/auth/customer/register`,
    workerLogin: `${API_URL}/auth/worker/login`,
    customerLogin: `${API_URL}/auth/customer/login`,
    adminLogin: `${API_URL}/auth/admin/login`,
    getMe: `${API_URL}/auth/me`,
  },

  // Workers
  workers: {
    getAll: `${API_URL}/workers`,
    getById: (id: string) => `${API_URL}/workers/${id}`,
    update: (id: string) => `${API_URL}/workers/${id}`,
    addCertificate: (id: string) => `${API_URL}/workers/${id}/certificates`,
    updateAvailability: (id: string) => `${API_URL}/workers/${id}/availability`,
    uploadImage: (id: string) => `${API_URL}/workers/${id}/upload-image`,
    // Document Verification
    uploadIDProof: (id: string) => `${API_URL}/workers/${id}/upload-id-proof`,
    uploadExperience: (id: string) =>
      `${API_URL}/workers/${id}/upload-experience`,
    uploadEducation: (id: string) =>
      `${API_URL}/workers/${id}/upload-education`,
    getVerificationStatus: (id: string) =>
      `${API_URL}/workers/${id}/verification-status`,
    verifyIDProof: (id: string) => `${API_URL}/workers/${id}/verify-id-proof`,
    verifyExperience: (id: string, docId: string) =>
      `${API_URL}/workers/${id}/verify-experience/${docId}`,
  },

  // Admin
  admin: {
    getPendingDocuments: `${API_URL}/workers/admin/pending`,
  },

  // Notifications
  notifications: {
    getAll: `${API_URL}/notifications`,
    getUnreadCount: `${API_URL}/notifications/unread-count`,
    markAsRead: (id: string) => `${API_URL}/notifications/${id}/read`,
    markAllAsRead: `${API_URL}/notifications/read-all`,
    delete: (id: string) => `${API_URL}/notifications/${id}`,
  },

  // Customers
  customers: {
    getById: (id: string) => `${API_URL}/customers/${id}`,
    update: (id: string) => `${API_URL}/customers/${id}`,
    addAddress: (id: string) => `${API_URL}/customers/${id}/addresses`,
    addFavorite: (id: string, workerId: string) =>
      `${API_URL}/customers/${id}/favorites/${workerId}`,
    removeFavorite: (id: string, workerId: string) =>
      `${API_URL}/customers/${id}/favorites/${workerId}`,
    addWallet: (id: string) => `${API_URL}/customers/${id}/wallet`,
  },

  // Jobs
  jobs: {
    create: `${API_URL}/jobs`,
    getAll: `${API_URL}/jobs`,
    getAvailable: `${API_URL}/jobs/available`,
    getById: (id: string) => `${API_URL}/jobs/${id}`,
    assignWorker: (id: string) => `${API_URL}/jobs/${id}/assign`,
    updateStatus: (id: string) => `${API_URL}/jobs/${id}/status`,
    cancel: (id: string) => `${API_URL}/jobs/${id}/cancel`,
  },

  // Chat
  chat: {
    getChats: `${API_URL}/chat`,
    getMessages: (chatId: string) => `${API_URL}/chat/${chatId}`,
    sendMessage: `${API_URL}/chat`,
    updateMessageStatus: (messageId: string) =>
      `${API_URL}/chat/${messageId}/status`,
    markChatAsRead: (chatId: string) => `${API_URL}/chat/${chatId}/read`,
  },

  // Reviews
  reviews: {
    create: `${API_URL}/reviews`,
    getByWorker: (workerId: string) => `${API_URL}/reviews/worker/${workerId}`,
    getById: (id: string) => `${API_URL}/reviews/${id}`,
    respond: (id: string) => `${API_URL}/reviews/${id}/response`,
    markHelpful: (id: string) => `${API_URL}/reviews/${id}/helpful`,
  },

  // Hardware
  hardware: {
    getItems: `${API_URL}/hardware/items`,
    getItemById: (id: string) => `${API_URL}/hardware/items/${id}`,
    createRequest: `${API_URL}/hardware/requests`,
    getRequests: `${API_URL}/hardware/requests`,
    getRequestById: (id: string) => `${API_URL}/hardware/requests/${id}`,
    updateRequestStatus: (id: string) =>
      `${API_URL}/hardware/requests/${id}/status`,
    markDelivered: (id: string) =>
      `${API_URL}/hardware/requests/${id}/delivered`,
  },

  // Health
  health: `${API_URL}/health`,
};

// API Helper Functions
export const apiCall = async (
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  data?: any,
  token?: string,
) => {
  const headers: any = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    console.log(`🌐 API Request: ${method} ${url}`);
    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`❌ API Error [${response.status}]:`, result.message);
      throw new Error(result.message || "API Error");
    }

    console.log(`✅ API Success: ${method} ${url}`);
    return result;
  } catch (error: any) {
    console.error(`❌ Network Error: ${error.message}`, { url, method });
    if (error.message === "Network request failed") {
      throw new Error(
        `Cannot reach server at ${url.split("/api")[0]}. Check: 1) Backend running? 2) Correct IP? 3) Same WiFi?`,
      );
    }
    throw new Error(error.message || "Network Error");
  }
};

// API Helper for File Uploads (multipart/form-data)
export const apiUpload = async (
  url: string,
  formData: FormData,
  token?: string,
) => {
  const headers: any = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Don't set Content-Type - let the browser set it automatically with boundary

  try {
    console.log(`🌐 API Upload: POST ${url}`);
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`❌ API Error [${response.status}]:`, result.message);
      throw new Error(result.message || "Upload Error");
    }

    console.log(`✅ Upload Success: ${url}`);
    return result;
  } catch (error: any) {
    console.error(`❌ Network Error: ${error.message}`, { url });
    if (error.message === "Network request failed") {
      throw new Error(
        `Cannot reach server at ${url.split("/api")[0]}. Check: 1) Backend running? 2) Correct IP? 3) Same WiFi?`,
      );
    }
    throw new Error(error.message || "Upload Error");
  }
};
