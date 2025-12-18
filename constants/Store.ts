import { create } from 'zustand';

// Types
export interface Worker {
    id: string;
    name: string;
    category: string;
    rating: number;
    hourlyRate: number;
    image: string;
    location: string;
    about: string;
    reviews: { id: string; user: string; text: string; rating: number }[];
}

export interface Job {
    id: string;
    customerId: string;
    workerId: string;
    workerName: string;
    service: string;
    description: string;
    status: 'Pending' | 'Accepted' | 'Rejected' | 'Completed';
    date: string;
    price: number;
    attachedMedia?: string[];
}

// Initial Data
const MOCK_WORKERS: Worker[] = [
    {
        id: '1',
        name: 'Nimal ',
        category: 'Plumber',
        rating: 4.8,
        hourlyRate: 1500,
        image: 'https://randomuser.me/api/portraits/men/32.jpg',
        location: 'Colombo 03',
        about: 'Experienced plumber with over 10 years in residential repairs. Specialist in leak detection and pipe fitting.',
        reviews: [
            { id: 'r1', user: 'Kamal', text: 'Great service, very fast!', rating: 5 },
            { id: 'r2', user: 'Sunil', text: 'Fixed the leak but came a bit late.', rating: 4 },
        ],
    },
    {
        id: '2',
        name: 'Saman ',
        category: 'Electrician',
        rating: 4.9,
        hourlyRate: 2000,
        image: 'https://randomuser.me/api/portraits/men/45.jpg',
        location: 'Dehiwala',
        about: 'Certified industrial and residential electrician. Safety first guaranteed.',
        reviews: [
            { id: 'r3', user: 'Mala', text: 'Very professional.', rating: 5 },
        ],
    },
    {
        id: '3',
        name: ' Devi',
        category: 'Cleaner',
        rating: 4.7,
        hourlyRate: 1000,
        image: 'https://randomuser.me/api/portraits/women/44.jpg',
        location: 'Nugegoda',
        about: 'Reliable and thorough cleaning services for homes and offices.',
        reviews: [],
    },
    {
        id: '4',
        name: 'Ravi Raj',
        category: 'Carpenter',
        rating: 4.5,
        hourlyRate: 1800,
        image: 'https://randomuser.me/api/portraits/men/22.jpg',
        location: 'Wattala',
        about: 'Custom furniture and repair works.',
        reviews: [],
    },
];

const MOCK_JOBS: Job[] = [
    {
        id: 'j1',
        customerId: 'c1',
        workerId: '1',
        workerName: 'Nimal ',
        service: 'Plumber',
        description: 'Kitchen sink request',
        status: 'Completed',
        date: '2023-10-10',
        price: 1500,
    }
];

interface AppState {
    workers: Worker[];
    jobs: Job[];
    addJob: (job: Job) => void;
    updateJobStatus: (jobId: string, status: Job['status']) => void;
}

// Zustand Store for simple state management
export const useStore = create<AppState>((set) => ({
    workers: MOCK_WORKERS,
    jobs: MOCK_JOBS,
    addJob: (job) => set((state) => ({ jobs: [job, ...state.jobs] })),
    updateJobStatus: (id, status) =>
        set((state) => ({
            jobs: state.jobs.map((job) => (job.id === id ? { ...job, status } : job)),
        })),
}));
