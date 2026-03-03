import {
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from "firebase/auth";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { Job, User } from "./Store";

// ============================================
// Authentication Services
// ============================================

export const authService = {
  // Register user
  async register(
    email: string,
    password: string,
    userData: Partial<User> & { userType: "worker" | "customer" },
  ) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const firebaseUser = userCredential.user;

      // Update Firebase Auth profile
      await updateProfile(firebaseUser, {
        displayName: userData.name,
      });

      // Create user document in Firestore
      const userCollection =
        userData.userType === "worker" ? "workers" : "customers";
      await setDoc(doc(db, userCollection, firebaseUser.uid), {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        name: userData.name,
        phone: userData.phone,
        userType: userData.userType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...userData,
      });

      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        ...userData,
      };
    } catch (error: any) {
      throw new Error(error.message || "Registration failed");
    }
  },

  // Login user
  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const firebaseUser = userCredential.user;

      // Get user data from Firestore
      const customerDoc = await getDoc(doc(db, "customers", firebaseUser.uid));
      const workerDoc = await getDoc(doc(db, "workers", firebaseUser.uid));

      if (customerDoc.exists()) {
        return customerDoc.data();
      } else if (workerDoc.exists()) {
        return workerDoc.data();
      }

      throw new Error("User profile not found");
    } catch (error: any) {
      throw new Error(error.message || "Login failed");
    }
  },

  // Get current user
  async getCurrentUser() {
    if (!auth.currentUser) return null;

    try {
      const customerDoc = await getDoc(
        doc(db, "customers", auth.currentUser.uid),
      );
      const workerDoc = await getDoc(doc(db, "workers", auth.currentUser.uid));

      if (customerDoc.exists()) {
        return customerDoc.data();
      } else if (workerDoc.exists()) {
        return workerDoc.data();
      }

      return null;
    } catch (error) {
      console.error("Error fetching current user:", error);
      return null;
    }
  },

  // Logout user
  async logout() {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message || "Logout failed");
    }
  },

  // Reset password
  async resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(error.message || "Password reset failed");
    }
  },
};

// ============================================
// Firestore Data Services
// ============================================

export const firestoreService = {
  // Get all workers
  async getWorkers(filters?: any) {
    try {
      let constraints: any[] = [];

      if (filters?.category) {
        constraints.push(where("category", "==", filters.category));
      }

      if (filters?.rating) {
        constraints.push(where("rating", ">=", filters.rating));
      }

      const q = query(collection(db, "workers"), ...constraints);
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching workers:", error);
      throw error;
    }
  },

  // Get single worker
  async getWorker(workerId: string) {
    try {
      const doc = await getDoc(doc(db, "workers", workerId));
      if (doc.exists()) {
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error("Error fetching worker:", error);
      throw error;
    }
  },

  // Create job
  async createJob(jobData: Partial<Job>, userId: string) {
    try {
      const jobRef = doc(collection(db, "jobs"));
      const jobWithTimestamp = {
        ...jobData,
        customerId: userId,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(jobRef, jobWithTimestamp);

      return {
        id: jobRef.id,
        ...jobWithTimestamp,
      };
    } catch (error) {
      console.error("Error creating job:", error);
      throw error;
    }
  },

  // Get jobs by user
  async getJobsByUser(userId: string, userType: "customer" | "worker") {
    try {
      const fieldName = userType === "customer" ? "customerId" : "workerId";
      const q = query(
        collection(db, "jobs"),
        where(fieldName, "==", userId),
        orderBy("createdAt", "desc"),
        limit(50),
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching jobs:", error);
      throw error;
    }
  },

  // Get single job
  async getJob(jobId: string) {
    try {
      const jobDoc = await getDoc(doc(db, "jobs", jobId));
      if (jobDoc.exists()) {
        return { id: jobDoc.id, ...jobDoc.data() };
      }
      return null;
    } catch (error) {
      console.error("Error fetching job:", error);
      throw error;
    }
  },

  // Update job
  async updateJob(jobId: string, jobData: Partial<Job>) {
    try {
      await updateDoc(doc(db, "jobs", jobId), {
        ...jobData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating job:", error);
      throw error;
    }
  },

  // Accept job (worker)
  async acceptJob(jobId: string, workerId: string) {
    try {
      await updateDoc(doc(db, "jobs", jobId), {
        workerId: workerId,
        status: "accepted",
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error accepting job:", error);
      throw error;
    }
  },

  // Get available jobs
  async getAvailableJobs(filters?: any) {
    try {
      let constraints = [where("status", "==", "pending")];

      if (filters?.serviceType) {
        constraints.push(where("serviceType", "==", filters.serviceType));
      }

      if (filters?.category) {
        constraints.push(where("category", "==", filters.category));
      }

      const q = query(
        collection(db, "jobs"),
        ...constraints,
        orderBy("createdAt", "desc"),
        limit(50),
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching available jobs:", error);
      throw error;
    }
  },

  // Create hardware request
  async createHardwareRequest(requestData: any) {
    try {
      const ref = doc(collection(db, "hardwareRequests"));
      await setDoc(ref, {
        ...requestData,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { id: ref.id, ...requestData };
    } catch (error) {
      console.error("Error creating hardware request:", error);
      throw error;
    }
  },

  // Get hardware requests
  async getHardwareRequests(filters?: any) {
    try {
      let constraints: any[] = [];

      if (filters?.workerId) {
        constraints.push(where("workerId", "==", filters.workerId));
      }

      if (filters?.customerId) {
        constraints.push(where("customerId", "==", filters.customerId));
      }

      if (filters?.status) {
        constraints.push(where("status", "==", filters.status));
      }

      const q = query(
        collection(db, "hardwareRequests"),
        ...constraints,
        orderBy("createdAt", "desc"),
        limit(50),
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching hardware requests:", error);
      throw error;
    }
  },

  // Update user profile
  async updateUserProfile(
    userId: string,
    userType: "worker" | "customer",
    data: any,
  ) {
    try {
      const collection_name = userType === "worker" ? "workers" : "customers";
      await updateDoc(doc(db, collection_name, userId), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  },
};

// ============================================
// Real-time Listeners
// ============================================

export const realtimeService = {
  // Listen to job updates
  onJobUpdate(
    jobId: string,
    callback: (job: any) => void,
    errorCallback?: (error: any) => void,
  ) {
    const unsubscribe = auth.currentUser ? null : () => {}; // Placeholder, implement actual listener

    // For real-time updates, use Firestore onSnapshot
    // This would require wrapping with onSnapshot in the component or custom hook
    return unsubscribe;
  },

  // Listen to messages
  onMessagesUpdate(
    chatId: string,
    callback: (messages: any[]) => void,
    errorCallback?: (error: any) => void,
  ) {
    // Implement with onSnapshot from Firestore
    return () => {}; // Unsubscribe function
  },
};
