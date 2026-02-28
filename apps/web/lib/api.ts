import axios from 'axios';
import { auth } from './firebase';

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(async (config) => {
    // Wait for Firebase to initialize before checking currentUser
    await auth.authStateReady();
    const user = auth.currentUser;
    if (user && config.headers) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        console.warn('API Error Response:', error.response?.status, error.response?.data);
        if (error.response?.status === 401) {
            console.warn('Unauthorized access detected. Current path:', typeof window !== 'undefined' ? window.location.pathname : 'unknown');
            // Sign out from Firebase if the backend rejects the token
            await auth.signOut();
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                console.log('Redirecting to login due to 401...');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);
