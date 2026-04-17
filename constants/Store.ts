import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { api, apiCall } from "./api";

// ============================================
// Types
// ============================================
export interface User {
  id: string;
  _id?: string; // Added for API calls
  name: string;
  email: string;
  phone?: string;
  userType: "worker" | "customer" | "admin" | "hardwareShop";
}

export interface Worker extends User {
  category: string;
  rating: number;
  hourlyRate: number;
  verified: boolean;
  experience?: string;
  image?: string;
  location?: { type: string; coordinates: [number, number] };
  reviews?: any[];
}

export interface Customer extends User {
  addresses?: any[];
  wallet?: { balance: number };
  favoriteWorkers?: string[];
}

export interface Job {
  id: string;
  customerId: string;
  workerId?: string;
  serviceType: string;
  description: string;
  status: "pending" | "accepted" | "in-progress" | "completed" | "cancelled";
  date?: string;
  location?: { type: string; coordinates: [number, number] };
  pricing?: { totalAmount: number; hourlyRate: number };
  images?: string[];
}

// ============================================
// Store
// ============================================
interface StoreState {
  // User State
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;

  // Data State
  workers: Worker[];
  jobs: Job[];
  availableJobs: Job[];

  // Loading State
  loading: boolean;
  error: string | null;

  // Actions
  loginWorker: (email: string, password: string) => Promise<void>;
  loginCustomer: (email: string, password: string) => Promise<void>;
  loginAdmin: (email: string, password: string) => Promise<void>;
  loginHardwareShop: (email: string, password: string) => Promise<void>;
  registerWorker: (data: any) => Promise<void>;
  registerCustomer: (data: any) => Promise<void>;
  registerHardwareShop: (data: any) => Promise<void>;
  logout: () => void;
  setToken: (token: string) => void;
  setUser: (user: User | null) => void;
  setUserType: (userType: "worker" | "customer" | "admin" | "hardwareShop") => void;

  // Fetch Data
  fetchWorkers: (filters?: any) => Promise<void>;
  fetchJobs: () => Promise<void>;
  fetchAvailableJobs: () => Promise<void>;

  // Create/Update
  createJob: (jobData: any) => Promise<Job>;
  acceptJob: (jobId: string) => Promise<void>;
  updateJobStatus: (jobId: string, status: string) => Promise<void>;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
  // Initial State
  user: null,
  token: null,
  isLoggedIn: false,
  workers: [],
  jobs: [],
  availableJobs: [],
  loading: false,
  error: null,

  // ============================================
  // AUTH ACTIONS
  // ============================================

  loginWorker: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response = await apiCall(api.auth.workerLogin, "POST", {
        email,
        password,
      });
      const user = { ...response.user, _id: response.user.id };
      set({
        user,
        token: response.token,
        isLoggedIn: true,
      });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  loginCustomer: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response = await apiCall(api.auth.customerLogin, "POST", {
        email,
        password,
      });
      const user = { ...response.user, _id: response.user.id };
      set({
        user,
        token: response.token,
        isLoggedIn: true,
      });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  loginAdmin: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response = await apiCall(api.auth.adminLogin, "POST", {
        email,
        password,
      });
      const user = { ...response.user, _id: response.user.id };
      set({
        user,
        token: response.token,
        isLoggedIn: true,
      });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  loginHardwareShop: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response = await apiCall(api.auth.hardwareShopLogin, "POST", {
        email,
        password,
      });
      const user = { ...response.user, _id: response.user.id };
      set({
        user,
        token: response.token,
        isLoggedIn: true,
      });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  registerWorker: async (data: any) => {
    set({ loading: true, error: null });
    try {
      const response = await apiCall(api.auth.workerRegister, "POST", data);
      const user = { ...response.user, _id: response.user.id };
      set({
        user,
        token: response.token,
        isLoggedIn: true,
      });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  registerCustomer: async (data: any) => {
    set({ loading: true, error: null });
    try {
      const response = await apiCall(api.auth.customerRegister, "POST", data);
      const user = { ...response.user, _id: response.user.id };
      set({
        user,
        token: response.token,
        isLoggedIn: true,
      });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  registerHardwareShop: async (data: any) => {
    set({ loading: true, error: null });
    try {
      const response = await apiCall(api.auth.hardwareShopRegister, "POST", data);
      const user = { ...response.user, _id: response.user.id };
      set({
        user,
        token: response.token,
        isLoggedIn: true,
      });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    set({
      user: null,
      token: null,
      isLoggedIn: false,
      workers: [],
      jobs: [],
    });
  },

  setToken: (token: string) => {
    set({ token, isLoggedIn: !!token });
  },

  setUser: (user: User | null) => {
    set({ user, isLoggedIn: !!user || !!get().token });
  },

  setUserType: (userType: "worker" | "customer" | "admin") => {
    const currentUser = get().user;
    if (!currentUser) return;
    set({ user: { ...currentUser, userType } });
  },

  // ============================================
  // FETCH ACTIONS
  // ============================================

  fetchWorkers: async (filters?: any) => {
    set({ loading: true, error: null });
    try {
      let url = api.workers.getAll;
      const params = new URLSearchParams();

      if (filters?.category) params.append("category", filters.category);
      if (filters?.latitude)
        params.append("latitude", filters.latitude.toString());
      if (filters?.longitude)
        params.append("longitude", filters.longitude.toString());
      if (filters?.approved) params.append("approved", "true");

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await apiCall(url);
      const mappedWorkers = (response.data || []).map((worker: any) => ({
        ...worker,
        id: worker.id || worker._id,
        image: worker.image || "https://via.placeholder.com/150",
        reviews: worker.reviews || [],
        about: worker.bio || worker.about || "",
      }));
      set({ workers: mappedWorkers });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchJobs: async () => {
    set({ loading: true, error: null });
    const { token } = get();

    if (!token) {
      set({ error: "Not logged in" });
      set({ loading: false });
      return;
    }

    try {
      const response = await apiCall(api.jobs.getAll, "GET", undefined, token);
      set({ jobs: response.data });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchAvailableJobs: async () => {
    set({ loading: true, error: null });
    const { token } = get();

    if (!token) {
      set({ error: "Not logged in" });
      set({ loading: false });
      return;
    }

    try {
      const response = await apiCall(
        api.jobs.getAvailable,
        "GET",
        undefined,
        token,
      );
      set({ availableJobs: response.data });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  // ============================================
  // CREATE/UPDATE ACTIONS
  // ============================================

  createJob: async (jobData: any) => {
    set({ loading: true, error: null });
    const { token } = get();

    if (!token) {
      throw new Error("Not logged in");
    }

    try {
      const response = await apiCall(api.jobs.create, "POST", jobData, token);
      const newJob = response.data;
      set({ jobs: [...get().jobs, newJob] });
      return newJob;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  acceptJob: async (jobId: string) => {
    set({ loading: true, error: null });
    const { token, availableJobs } = get();

    if (!token) {
      throw new Error("Not logged in");
    }

    try {
      const response = await apiCall(
        api.jobs.assignWorker(jobId),
        "PUT",
        {},
        token,
      );

      const jobs = get().jobs;
      const updatedJobs = jobs.some(
        (j) => (j as any)._id === jobId || (j as any).id === jobId
      )
        ? jobs.map((j) =>
            (j as any)._id === jobId || (j as any).id === jobId
              ? response.data
              : j
          )
        : [...jobs, response.data];
      set({
        availableJobs: availableJobs.filter(
          (j) => (j as any)._id !== jobId && (j as any).id !== jobId
        ),
        jobs: updatedJobs,
      });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateJobStatus: async (jobId: string, status: string) => {
    set({ loading: true, error: null });
    const { token, jobs } = get();

    if (!token) {
      throw new Error("Not logged in");
    }

    try {
      const response = await apiCall(
        api.jobs.updateStatus(jobId),
        "PUT",
        { status },
        token,
      );

      const updatedJobs = jobs.map((j) =>
        (j as any)._id === jobId || (j as any).id === jobId
          ? { ...j, ...response.data, status: response.data.status }
          : j
      );
      set({ jobs: updatedJobs });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
    }),
    {
      name: "clickfix-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isLoggedIn: state.isLoggedIn,
      }),
    },
  ),
);
