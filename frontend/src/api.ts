import axios from 'axios';

// Используем относительный путь для работы через Vite Proxy (dev) или Nginx (prod)
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Task {
  id: number;
  title: string;
  description?: string;
  is_completed: boolean;
  created_at?: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  is_completed?: boolean;
}