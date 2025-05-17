import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// Create the authentication context
const AuthContext = createContext(null);

// Create a provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in (on component mount)
  useEffect(() => {
    // Check for tokens in localStorage
    const accessToken = localStorage.getItem('accessToken');
    const userInfo = localStorage.getItem('userInfo');

    if (accessToken && userInfo) {
      const userData = JSON.parse(userInfo);
      setUser(userData);
      setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    }

    setIsLoading(false);
  }, []);

  // Login function
  const login = async (username, password) => {
    try {
      const res = await axios.post('http://localhost:8000/api/v1/login', {
        username,
        password
      }, { withCredentials: true });

      if (res.data.statusCode === 200) {
        const userData = res.data.data.user;
        const isUserAdmin = userData.is_admin;
        
        // Store auth tokens
        localStorage.setItem("accessToken", res.data.data.accessToken);
        localStorage.setItem("refreshToken", res.data.data.refreshToken);
        
        // Store user info
        localStorage.setItem("userInfo", JSON.stringify(userData));
        localStorage.setItem("isAdmin", isUserAdmin ? "true" : "false");
        
        // Update state
        setUser(userData);
        setIsAdmin(isUserAdmin);
        
        return { success: true, message: "Login Successful" };
      } else {
        return { success: false, message: "Login Failed" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "User ID or Password incorrect" };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      
      await axios.post('http://localhost:8000/api/v1/logout', {}, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        withCredentials: true
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear all localStorage items
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('isAdmin');
      
      // Update state
      setUser(null);
      setIsAdmin(false);
    }
  };

  // Provide the context value
  const contextValue = {
    user,
    isAdmin,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;