/**
 * layouts/AdminLayout.jsx — Khung trang quản trị (/admin/*).
 *   - MENU: danh sách mục trên sidebar (Tổng quan, Sản phẩm, Danh mục, Đơn hàng, Khách hàng).
 *   - Sidebar dùng NavLink để tô sáng mục đang mở; trên mobile có nút mở/đóng sidebar.
 *   - handleLogout(): đăng xuất và quay về trang chủ.
 *   - Nội dung từng trang admin hiển thị qua <Outlet />.
 */
import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MENU = [
  { to: '/admin', label: 'Tổng quan', icon: 'bi-speedometer2', end: true },
  { to: '/admin/products', label: 'Sản phẩm', icon: 'bi-bag' },
  { to: '/admin/categories', label: 'Danh mục', icon: 'bi-tags' },
  { to: '/admin/orders', label: 'Đơn hàng', icon: 'bi-receipt' },
  { to: '/admin/users', label: 'Khách hàng', icon: 'bi-people' },
];

function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
        <Link to="/admin" className="admin-brand" onClick={() => setOpen(false)}>
          STYLE<span>HUB</span>
          <small>Admin</small>
        </Link>

        <nav className="admin-menu">
          {MENU.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setOpen(false)}>
              <i className={`bi ${item.icon}`}></i>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-side-link">
            <i className="bi bi-shop"></i> Xem cửa hàng
          </Link>
          <button type="button" className="admin-side-link" onClick={handleLogout}>
            <i className="bi bi-box-arrow-left"></i> Đăng xuất
          </button>
        </div>
      </aside>

      {open && <div className="admin-backdrop" onClick={() => setOpen(false)} />}

      <div className="admin-main">
        <header className="admin-topbar">
          <button type="button" className="admin-menu-toggle" onClick={() => setOpen(true)} aria-label="Mở menu">
            <i className="bi bi-list"></i>
          </button>
          <div className="ms-auto d-flex align-items-center gap-2">
            <div className="admin-avatar">{user.fullName.charAt(0)}</div>
            <div className="lh-sm">
              <div className="fw-semibold">{user.fullName}</div>
              <small className="text-muted">@{user.username}</small>
            </div>
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
