
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '@/services/api.service';

// Authentication response interface
interface AuthResponse {
  token: string;
}

// Auth context interface
interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Default auth context
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  token: null,
  login: async () => {},
  logout: () => {},
});

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Check if there's a token in localStorage on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      // Set the token in state
      setToken(storedToken);
      setIsAuthenticated(true);
      
      // Update API service auth headers
      updateApiServiceHeaders(storedToken);
    }
    setIsInitialized(true);
  }, []);

  // Set auth token in API service headers
  const updateApiServiceHeaders = (authToken: string | null) => {
    if (authToken) {
      // Set the Authorization header for all future API requests
      apiService.setAuthToken(authToken);
      // Also set the idToken for all future API requests
      // Using the same token as both auth token and idToken
      apiService.setIdToken(authToken);
    } else {
      // Clear the Authorization header
      apiService.clearAuthToken();
      // Clear the idToken
      apiService.clearIdToken();
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.post<{ email: string; password: string }, AuthResponse>(
        '/students/sign-in',
        { email, password }
      );

      if (response.error) {
        throw new Error(response.error);
      }

      const { token } = response.data as AuthResponse;
      
      // Store token in localStorage
      localStorage.setItem('auth_token', token);
      
      // Update API service headers
      updateApiServiceHeaders(token);
      
      // Update state
      setToken(token);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    // Clear token from localStorage
    localStorage.removeItem('auth_token');
    
    // Clear API service auth headers
    updateApiServiceHeaders(null);
    
    // Update state
    setToken(null);
    setIsAuthenticated(false);
  };

  // Only render children when authentication state is initialized
  if (!isInitialized) {
    return null; // or a loading spinner if you prefer
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => useContext(AuthContext);
