import axios from 'axios';
import { API_URL } from '../utils/constants';

// Một axios instance dùng chung cho toàn bộ ứng dụng
const http = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 8000,
});

const data = (res) => res.data;

export const getErrorMessage = (error) => {
  if (error.response) return `Lỗi máy chủ (${error.response.status}). Vui lòng thử lại.`;
  if (error.request) return 'Không kết nối được tới máy chủ. Hãy chắc chắn json-server đang chạy ở cổng 9999.';
  return error.message;
};

export const productApi = {
  getAll: (params) => http.get('/products', { params }).then(data),
  getById: (id) => http.get(`/products/${id}`, { params: { _expand: 'category' } }).then(data),
  create: (product) => http.post('/products', product).then(data),
  update: (id, product) => http.put(`/products/${id}`, product).then(data),
  patch: (id, changes) => http.patch(`/products/${id}`, changes).then(data),
  remove: (id) => http.delete(`/products/${id}`),
};

export const categoryApi = {
  getAll: (params) => http.get('/categories', { params }).then(data),
  create: (category) => http.post('/categories', category).then(data),
  update: (id, category) => http.put(`/categories/${id}`, category).then(data),
  remove: (id) => http.delete(`/categories/${id}`),
};

export const orderApi = {
  getAll: (params) => http.get('/orders', { params: { _sort: 'createdAt', _order: 'desc', ...params } }).then(data),
  getById: (id) => http.get(`/orders/${id}`).then(data),
  create: (order) => http.post('/orders', order).then(data),
  updateStatus: (id, status) =>
    http.patch(`/orders/${id}`, { status, updatedAt: new Date().toISOString() }).then(data),
};

export const userApi = {
  getAll: (params) => http.get('/users', { params }).then(data),
  getById: (id) => http.get(`/users/${id}`).then(data),
  findByUsername: (username) => http.get('/users', { params: { username } }).then(data),
  create: (user) => http.post('/users', user).then(data),
  patch: (id, changes) => http.patch(`/users/${id}`, changes).then(data),
};

export const couponApi = {
  findByCode: (code) =>
    http.get('/coupons', { params: { code: code.trim().toUpperCase() } }).then((res) => res.data[0] || null),
};

/**
 * Cập nhật tồn kho & số lượng đã bán cho danh sách sản phẩm trong đơn.
 * direction = -1 khi đặt hàng (trừ kho), +1 khi hủy đơn (hoàn kho).
 */
export const adjustStock = async (items, direction) => {
  const totals = items.reduce((acc, item) => {
    acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
    return acc;
  }, {});

  await Promise.all(
    Object.entries(totals).map(async ([productId, quantity]) => {
      try {
        const product = await productApi.getById(productId);
        await productApi.patch(productId, {
          stock: Math.max(0, product.stock + direction * quantity),
          sold: Math.max(0, (product.sold || 0) - direction * quantity),
        });
      } catch {
        // Sản phẩm có thể đã bị xóa — bỏ qua
      }
    })
  );
};
