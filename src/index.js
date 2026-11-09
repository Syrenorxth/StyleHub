/**
 * index.js — Điểm khởi chạy của ứng dụng React.
 * Việc làm:
 *   - Import CSS của Bootstrap, Bootstrap Icons và 2 file CSS tự viết (global.css, admin.css).
 *   - Render <App /> vào thẻ #root, bọc bên ngoài bằng:
 *       BrowserRouter     → bật điều hướng bằng React Router
 *       ToastProvider     → hiển thị thông báo (toast) ở mọi trang
 *       AuthProvider      → lưu thông tin người đăng nhập
 *       WishlistProvider  → danh sách sản phẩm yêu thích
 *       CartProvider      → giỏ hàng
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/global.css';
import './styles/admin.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ToastProvider } from './context/ToastContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <App />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
