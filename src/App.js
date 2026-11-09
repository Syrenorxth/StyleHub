/**
 * App.js — Khai báo toàn bộ đường dẫn (route) của ứng dụng.
 * Cấu trúc:
 *   - Nhóm dùng MainLayout (Header + Footer):
 *       /                    → Home (trang chủ)
 *       /shop                → Shop (danh sách, lọc, tìm kiếm sản phẩm)
 *       /products/:id        → ProductDetail (chi tiết sản phẩm)
 *       /cart, /wishlist     → Giỏ hàng, Yêu thích
 *       /login, /register    → Đăng nhập, Đăng ký
 *       /checkout, /order-success/:id, /my-orders → chỉ cho khách hàng (ProtectedRoute roles=['customer'])
 *       /profile             → cần đăng nhập (mọi vai trò)
 *   - Nhóm /admin/* dùng AdminLayout, chỉ cho admin (ProtectedRoute roles=['admin']):
 *       /admin (Dashboard), /admin/products, /admin/categories, /admin/orders, /admin/users
 *   - Đường dẫn không tồn tại (*) → NotFound (trang 404).
 */
import React from 'react';
import { Route, Routes } from 'react-router-dom';

import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import MyOrders from './pages/MyOrders';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

import Dashboard from './pages/admin/Dashboard';
import ManageProducts from './pages/admin/ManageProducts';
import ManageCategories from './pages/admin/ManageCategories';
import ManageOrders from './pages/admin/ManageOrders';
import ManageUsers from './pages/admin/ManageUsers';

function App() {
  return (
    <Routes>
      {/* ── Khu vực khách hàng ── */}
      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        {/* Chỉ khách hàng đã đăng nhập mới đặt hàng được */}
        <Route element={<ProtectedRoute roles={['customer']} />}>
          <Route path="checkout" element={<Checkout />} />
          <Route path="order-success/:id" element={<OrderSuccess />} />
          <Route path="my-orders" element={<MyOrders />} />
        </Route>

        {/* Mọi tài khoản đã đăng nhập */}
        <Route element={<ProtectedRoute />}>
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>

      {/* ── Khu vực quản trị ── */}
      <Route
        path="admin"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<ManageProducts />} />
        <Route path="categories" element={<ManageCategories />} />
        <Route path="orders" element={<ManageOrders />} />
        <Route path="users" element={<ManageUsers />} />
      </Route>
    </Routes>
  );
}

export default App;
