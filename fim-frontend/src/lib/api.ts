// src/lib/api.ts
import axios from 'axios';
import { getSession } from 'next-auth/react';
import logger from './logger';

console.log(process.env.NEXT_PUBLIC_API_URL)

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cache session to avoid repeated calls
interface Session {
  accessToken?: string;
}

let cachedSession: Session | null = null;
let sessionCacheTime = 0;
const SESSION_CACHE_DURATION = 30000; // 30 seconds - increased to reduce API calls

const getCachedSession = async () => {
  const now = Date.now();
  if (cachedSession && (now - sessionCacheTime) < SESSION_CACHE_DURATION) {
    logger.debug('Using cached session', { cacheAge: now - sessionCacheTime }, 'API');
    return cachedSession;
  }
  
  logger.debug('Fetching fresh session', undefined, 'API');
  cachedSession = await getSession() as Session;
  sessionCacheTime = now;
  return cachedSession;
};

// Function to clear session cache (useful for logout or session refresh)
export const clearSessionCache = () => {
  cachedSession = null;
  sessionCacheTime = 0;
};

// Function to force refresh session cache (useful when session might have changed)
export const refreshSessionCache = async () => {
  cachedSession = await getSession() as Session;
  sessionCacheTime = Date.now();
  return cachedSession;
};

// Optimized request interceptor with session caching
api.interceptors.request.use(
  async (config) => {
    const startTime = performance.now();
    const session = await getCachedSession();
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    
    // Log API request
    logger.apiCall(
      config.method?.toUpperCase() || 'UNKNOWN',
      config.url || 'UNKNOWN',
      config.data,
      undefined,
      undefined
    );
    
    // Store start time for performance measurement
    (config as unknown as Record<string, unknown>).__startTime = startTime;
    
    return config;
  },
  (error) => {
    logger.error('API request interceptor error', error, 'API');
    return Promise.reject(error);
  }
);

// Response interceptor for logging
api.interceptors.response.use(
  (response) => {
    const startTime = (response.config as unknown as Record<string, unknown>).__startTime as number;
    const duration = startTime ? performance.now() - startTime : 0;
    
    logger.apiCall(
      response.config.method?.toUpperCase() || 'UNKNOWN',
      response.config.url || 'UNKNOWN',
      response.config.data,
      response.data,
      undefined
    );
    
    if (duration > 0) {
      logger.performance(
        `API ${response.config.method?.toUpperCase()} ${response.config.url}`,
        duration,
        { status: response.status },
        'API'
      );
    }
    
    return response;
  },
  (error) => {
    const startTime = (error.config as unknown as Record<string, unknown>)?.__startTime as number;
    const duration = startTime ? performance.now() - startTime : 0;
    
    logger.apiCall(
      error.config?.method?.toUpperCase() || 'UNKNOWN',
      error.config?.url || 'UNKNOWN',
      error.config?.data,
      undefined,
      error.response?.data || error.message
    );
    
    if (duration > 0) {
      logger.performance(
        `API ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        duration,
        { status: error.response?.status, error: true },
        'API'
      );
    }
    
    return Promise.reject(error);
  }
);

export const getHealthStatus = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    logger.error('Error fetching health status', error, 'API');
    throw error;
  }
};

export default api;