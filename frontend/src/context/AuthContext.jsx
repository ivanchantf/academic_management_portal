// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { checkIdentity } from '../utils/checkIdentity'; // Adjust path to your function

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Runs ONCE whenever the app reloads or opens via browser address bar
  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await checkIdentity();
        // Assuming your API returns { success: true, user: { ... } } 
        // or directly the user object
        if (response?.user) {
          setUser(response.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to restore identity:', error);
        setUser(null);
      } finally {
        // Essential: Signal that initial session check is complete
        setLoading(false); 
      }
    };

    initAuth();
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    // Add logout API call here if needed
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);