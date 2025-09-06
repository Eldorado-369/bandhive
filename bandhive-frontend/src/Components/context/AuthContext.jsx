// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import api from "../api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(localStorage.getItem("accessToken") || null);
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("refreshToken") || null);
  const [profileImage, setProfileImage] = useState(localStorage.getItem("profileImage") || null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/user/profile/");
      console.log("Fetched profile on login:", res.data);
      setProfileImage(res.data.profile_image || null);
      localStorage.setItem("profileImage", res.data.profile_image || "");
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      setProfileImage(null);
      localStorage.setItem("profileImage", "");
    }
  };

  useEffect(() => {
    const storedUserData = localStorage.getItem("userData");
    if (accessToken && storedUserData) {
      setUser(JSON.parse(storedUserData));
      fetchProfile();
    }
    setLoading(false);
  }, [accessToken]);
  

  const login = async (userData, token, refresh) => {
    localStorage.setItem("accessToken", token);
    localStorage.setItem("refreshToken", refresh);
    localStorage.setItem("userData", JSON.stringify(userData));
    setAccessToken(token);
    setRefreshToken(refresh);
    setUser(userData);
    await fetchProfile();
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("profileImage");
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setProfileImage(null);
  };

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        accessToken, 
        refreshToken, 
        profileImage, 
        setProfileImage, 
        login, 
        logout, 
        loading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);