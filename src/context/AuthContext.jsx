/**
 * context/AuthContext.jsx — Quản lý đăng nhập / tài khoản người dùng (Context API).
 * Lưu phiên vào localStorage (key "stylehub_user"), KHÔNG lưu mật khẩu.
 * Hàm cung cấp qua useAuth():
 *   - user, isAdmin                 : người đang đăng nhập và cờ có phải admin không.
 *   - login(username, password)     : tìm user trên server, sai thông tin → báo lỗi, tài khoản bị khóa (blocked) → chặn.
 *   - register(form)                : kiểm tra trùng username rồi tạo tài khoản customer mới và tự đăng nhập.
 *   - logout()                      : xóa phiên đăng nhập.
 *   - updateProfile(changes)        : cập nhật họ tên / email / SĐT / địa chỉ.
 *   - changePassword(current, new)  : kiểm tra mật khẩu hiện tại rồi đổi mật khẩu mới.
 * Hàm nội bộ: readStoredUser() đọc phiên cũ khi tải trang, persist() lưu user (đã bỏ password).
 */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { userApi } from '../services/api';

const AuthContext = createContext(null);
const STORAGE_KEY = 'stylehub_user';

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  // Lưu phiên đăng nhập (không bao giờ lưu mật khẩu xuống localStorage)
  const persist = useCallback((account) => {
    const { password, ...safeUser } = account;
    setUser(safeUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
    return safeUser;
  }, []);

  const login = useCallback(
    async (username, password) => {
      const users = await userApi.findByUsername(username.trim());
      const account = users.find((u) => u.username === username.trim() && u.password === password);
      if (!account) throw new Error('Tên đăng nhập hoặc mật khẩu không chính xác.');
      if (account.status === 'blocked') {
        throw new Error('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ cửa hàng để được hỗ trợ.');
      }
      return persist(account);
    },
    [persist]
  );

  const register = useCallback(
    async (form) => {
      const existed = await userApi.findByUsername(form.username.trim());
      if (existed.some((u) => u.username === form.username.trim())) {
        throw new Error('Tên đăng nhập đã được sử dụng.');
      }
      const created = await userApi.create({
        username: form.username.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: '',
        role: 'customer',
        status: 'active',
        createdAt: new Date().toISOString(),
      });
      return persist(created);
    },
    [persist]
  );

  const updateProfile = useCallback(
    async (changes) => {
      const updated = await userApi.patch(user.id, changes);
      return persist(updated);
    },
    [user, persist]
  );

  const changePassword = useCallback(
    async (currentPassword, newPassword) => {
      const account = await userApi.getById(user.id);
      if (account.password !== currentPassword) throw new Error('Mật khẩu hiện tại không đúng.');
      await userApi.patch(user.id, { password: newPassword });
    },
    [user]
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAdmin: user?.role === 'admin',
      isCustomer: user?.role === 'customer',
      login,
      register,
      logout,
      updateProfile,
      changePassword,
    }),
    [user, login, register, logout, updateProfile, changePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
