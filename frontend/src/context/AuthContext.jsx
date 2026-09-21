import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    useEffect(()=>{
        //check auth
    })
  // Example state: user object with role
  const [user, setUser] = useState({
    // id: 'U12345',
    // name: 'Alex Johnson',
    // role: 'STUDENT' // 'STUDENT' or 'STAFF'
  });

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);