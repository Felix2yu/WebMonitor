import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// 设置 axios 基础 URL
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

// 401 拦截器：token 过期或无效时尝试静默刷新，失败再登出
let isRefreshing = false;
let pendingRequests = [];

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 刷新接口自身失败、或非 401，直接拒绝
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // 已在登录页则不处理
    if (window.location.pathname === '/login') {
      return Promise.reject(error);
    }

    const token = localStorage.getItem('token');
    if (!token) {
      return Promise.reject(error);
    }

    // 避免并发请求重复刷新
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push({ resolve, reject });
      }).then(() => axios(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post('/api/auth/refresh', { token });
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
      originalRequest.headers['Authorization'] = `Bearer ${data.access_token}`;

      // 释放排队中的请求
      pendingRequests.forEach(({ resolve }) => resolve());
      pendingRequests = [];

      return axios(originalRequest);
    } catch (refreshError) {
      // 刷新失败，清除登录态并跳转到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      pendingRequests.forEach(({ reject }) => reject(refreshError));
      pendingRequests = [];
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 初始化认证状态
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        // 设置axios默认header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        // 清除无效的已保存用户数据
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = async () => {
    try {
      // 调用后端登出接口（可选）
      await axios.post('/api/auth/logout');
    } finally {
      // 清除本地数据
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const isAdmin = () => {
    return user?.is_admin || false;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};