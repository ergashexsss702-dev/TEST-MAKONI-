import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  activeRole: UserRole;
  toasts: ToastMessage[];
  lastSimulatedCode: string | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;
  register: (firstName: string, lastName: string, phone: string, role?: UserRole) => Promise<{ success: boolean; simulatedCode?: string; error?: string }>;
  login: (phone: string) => Promise<{ success: boolean; simulatedCode?: string; error?: string }>;
  verifyCode: (phone: string, code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [lastSimulatedCode, setLastSimulatedCode] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const refreshUser = async () => {
    try {
      const savedPhone = localStorage.getItem('testmakon_phone');
      const url = savedPhone ? `/api/auth/me?phone=${encodeURIComponent(savedPhone)}` : '/api/auth/me';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          localStorage.setItem('testmakon_phone', data.user.phone);
        }
      }
    } catch (err) {
      console.error('Failed to load active user:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const register = async (firstName: string, lastName: string, phone: string, role: UserRole = 'STUDENT') => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, phone, role })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Ro'yxatdan o'tishda xatolik." };
      }

      if (data.simulatedCode) {
        setLastSimulatedCode(data.simulatedCode);
      }
      return { success: true, simulatedCode: data.simulatedCode };
    } catch (err: any) {
      return { success: false, error: err.message || "Tarmoqda xatolik yuz berdi." };
    }
  };

  const login = async (phone: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Kirishda xatolik." };
      }

      if (data.simulatedCode) {
        setLastSimulatedCode(data.simulatedCode);
      }
      return { success: true, simulatedCode: data.simulatedCode };
    } catch (err: any) {
      return { success: false, error: err.message || "Tarmoqda xatolik yuz berdi." };
    }
  };

  const verifyCode = async (phone: string, code: string) => {
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Kodni tasdiqlashda xatolik." };
      }

      setUser(data.user);
      localStorage.setItem('testmakon_phone', data.user.phone);
      showToast("Tizimga muvaffaqiyatli kirdingiz!", 'success');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Tarmoq xatosi." };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
    setUser(null);
    localStorage.removeItem('testmakon_phone');
    showToast("Tizimdan chiqildi.", 'info');
  };

  const switchRole = async (targetRole: UserRole) => {
    try {
      const res = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        localStorage.setItem('testmakon_phone', data.user.phone);
        showToast(`Rol o'zgartirildi: ${targetRole === 'STUDENT' ? 'Talaba' : targetRole === 'TEACHER' ? 'Ustoz' : 'Admin'}`, 'success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeRole: UserRole = user ? user.role : 'STUDENT';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        activeRole,
        toasts,
        lastSimulatedCode,
        showToast,
        removeToast,
        register,
        login,
        verifyCode,
        logout,
        switchRole,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
