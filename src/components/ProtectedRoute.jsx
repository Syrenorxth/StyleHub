import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Bảo vệ route theo trạng thái đăng nhập và vai trò.
 * - Chưa đăng nhập  → chuyển tới /login (kèm trang muốn vào để quay lại sau)
 * - Sai vai trò     → admin về /admin, khách hàng về trang chủ
 */
function ProtectedRoute({ roles, children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
  }

  return children ?? <Outlet />;
}

export default ProtectedRoute;
