import React, { createContext, useState } from "react";

export const AuthContext = createContext(null); 

export const AuthProvider = ({ children }) => {
  const [isAuth, setIsAuth] = useState(
    localStorage.getItem("isAuth") === "true"
  ); 

  const login = () => {
    setIsAuth(true);
    localStorage.setItem("isAuth", "true");
  };

  const logout = () => {
    setIsAuth(false);
    localStorage.removeItem("isAuth");
  };

  return (
    <AuthContext.Provider value={{ isAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};