import { api, apiCall } from "@/constants/api";

/**
 * EXAMPLE: How to use the API in your Expo app
 */

// ============================================
// 1. REGISTER A WORKER
// ============================================
export const registerWorker = async (workerData: {
  name: string;
  email: string;
  phone: string;
  password: string;
  category: string;
  experience: string;
  hourlyRate: number;
  location: { type: string; coordinates: number[] };
}) => {
  try {
    const response = await apiCall(api.auth.workerRegister, "POST", workerData);
    return response;
  } catch (error) {
    console.error("Register failed:", error);
    throw error;
  }
};

// ============================================
// 2. LOGIN A WORKER
// ============================================
export const loginWorker = async (email: string, password: string) => {
  try {
    const response = await apiCall(api.auth.workerLogin, "POST", {
      email,
      password,
    });
    // Save token in Store
    // useStore.setState({ token: response.token, user: response.user });
    return response;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

// ============================================
// 3. GET ALL WORKERS
// ============================================
export const fetchWorkers = async (filters?: {
  category?: string;
  latitude?: number;
  longitude?: number;
  minRating?: number;
}) => {
  try {
    let url = api.workers.getAll;
    if (filters) {
      const params = new URLSearchParams();
      if (filters.category) params.append("category", filters.category);
      if (filters.latitude)
        params.append("latitude", filters.latitude.toString());
      if (filters.longitude)
        params.append("longitude", filters.longitude.toString());
      if (filters.minRating)
        params.append("minRating", filters.minRating.toString());

      url += `?${params.toString()}`;
    }

    const response = await apiCall(url);
    return response.data;
  } catch (error) {
    console.error("Fetch workers failed:", error);
    throw error;
  }
};

// ============================================
// 4. GET SINGLE WORKER
// ============================================
export const fetchWorkerById = async (workerId: string) => {
  try {
    const response = await apiCall(api.workers.getById(workerId));
    return response.data;
  } catch (error) {
    console.error("Fetch worker failed:", error);
    throw error;
  }
};

// ============================================
// 5. CREATE A JOB (Customer books a service)
// ============================================
export const createJob = async (
  jobData: {
    serviceType: string;
    description: string;
    images: string[];
    location: { type: string; coordinates: number[] };
    scheduledDate: string;
    urgency: string;
    estimatedHours: number;
  },
  token: string,
) => {
  try {
    const response = await apiCall(api.jobs.create, "POST", jobData, token);
    return response.data;
  } catch (error) {
    console.error("Create job failed:", error);
    throw error;
  }
};

// ============================================
// 6. GET ALL JOBS FOR USER
// ============================================
export const fetchJobs = async (token: string) => {
  try {
    const response = await apiCall(api.jobs.getAll, "GET", undefined, token);
    return response.data;
  } catch (error) {
    console.error("Fetch jobs failed:", error);
    throw error;
  }
};

// ============================================
// 7. WORKER ACCEPT A JOB
// ============================================
export const acceptJob = async (jobId: string, token: string) => {
  try {
    const response = await apiCall(
      api.jobs.assignWorker(jobId),
      "PUT",
      {},
      token,
    );
    return response.data;
  } catch (error) {
    console.error("Accept job failed:", error);
    throw error;
  }
};

// ============================================
// 8. UPDATE JOB STATUS
// ============================================
export const updateJobStatus = async (
  jobId: string,
  status: string,
  token: string,
) => {
  try {
    const response = await apiCall(
      api.jobs.updateStatus(jobId),
      "PUT",
      { status },
      token,
    );
    return response.data;
  } catch (error) {
    console.error("Update job status failed:", error);
    throw error;
  }
};

// ============================================
// 9. SEND MESSAGE
// ============================================
export const sendMessage = async (
  messageData: {
    chatId: string;
    receiverId: string;
    receiverModel: string;
    jobId: string;
    messageType: string;
    content: string;
  },
  token: string,
) => {
  try {
    const response = await apiCall(
      api.chat.sendMessage,
      "POST",
      messageData,
      token,
    );
    return response.data;
  } catch (error) {
    console.error("Send message failed:", error);
    throw error;
  }
};

// ============================================
// 10. GET HARDWARE ITEMS
// ============================================
export const fetchHardwareItems = async (category?: string) => {
  try {
    let url = api.hardware.getItems;
    if (category) {
      url += `?category=${category}`;
    }

    const response = await apiCall(url);
    return response.data;
  } catch (error) {
    console.error("Fetch hardware items failed:", error);
    throw error;
  }
};

// ============================================
// 11. CREATE REVIEW
// ============================================
export const createReview = async (
  reviewData: {
    jobId: string;
    workerId: string;
    rating: number;
    aspectRatings: {
      professionalism: number;
      quality: number;
      punctuality: number;
      communication: number;
    };
    comment: string;
    beforeImages: string[];
    afterImages: string[];
    anonymous: boolean;
    wouldRecommend: boolean;
  },
  token: string,
) => {
  try {
    const response = await apiCall(
      api.reviews.create,
      "POST",
      reviewData,
      token,
    );
    return response.data;
  } catch (error) {
    console.error("Create review failed:", error);
    throw error;
  }
};

// ============================================
// 12. GET WORKER REVIEWS
// ============================================
export const fetchWorkerReviews = async (workerId: string) => {
  try {
    const response = await apiCall(api.reviews.getByWorker(workerId));
    return {
      reviews: response.data,
      stats: response.stats,
    };
  } catch (error) {
    console.error("Fetch worker reviews failed:", error);
    throw error;
  }
};
