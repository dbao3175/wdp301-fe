import { User } from '../types';

// Global state keys
export const CONFIG_KEY = 'mangaflow_config';
export const USER_KEY = 'mangaflow_user';
export const TOKEN_KEY = 'mangaflow_token';

export interface ClientConfig {
  baseUrl: string;
  useLiveBackend: boolean;
}

const DEFAULT_CONFIG: ClientConfig = {
  baseUrl: 'http://localhost:5000',
  useLiveBackend: true
};

// Configuration getters and setters
export const getClientConfig = (): ClientConfig => {
  const config = localStorage.getItem(CONFIG_KEY);
  return config ? JSON.parse(config) : DEFAULT_CONFIG;
};

export const setClientConfig = (config: ClientConfig) => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};

export const getStoredUser = (): User | null => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredUserSession = (user: User | null, token: string | null) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

// Global API Helper for real HTTP backend communication
export async function makeFetchRequest(
  endpoint: string, 
  method: string, 
  body?: any, 
  token?: string | null
) {
  const config = getClientConfig();
  const url = `${config.baseUrl}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    const storedToken = getStoredToken();
    if (storedToken) {
      headers['Authorization'] = `Bearer ${storedToken}`;
    }
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const responseText = await response.text();
  let responseData;
  try {
    responseData = responseText ? JSON.parse(responseText) : {};
  } catch (e) {
    responseData = { message: responseText || `Request failed with status ${response.status}` };
  }

  if (!response.ok) {
    throw new Error(responseData.message || `Request failed with status ${response.status}`);
  }
  return responseData;
}
