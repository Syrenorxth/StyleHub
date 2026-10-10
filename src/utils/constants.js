// ─── Cấu hình chung ──────────────────────────────────────────────────────────
export const API_URL = 'http://localhost:9999';

export const SHIPPING_FEE = 30000;
export const FREE_SHIP_THRESHOLD = 1000000;
export const LOW_STOCK_LIMIT = 5;

export const SHOP_PAGE_SIZE = 8;
export const ADMIN_PAGE_SIZE = 8;

export const GENDERS = ['Nam', 'Nữ', 'Unisex'];

export const SIZE_OPTIONS = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL',
  '26', '27', '28', '29', '30', '31', '32', '33', '34',
  '36', '37', '38', '39', '40', '41', '42', '43',
  'Free size',
];

// Mã màu hiển thị cho ô chọn màu (swatch)
export const COLOR_SWATCHES = {
  'Trắng': '#ffffff',
  'Đen': '#1c1917',
  'Xám': '#9ca3af',
  'Be': '#e7d8c3',
  'Nâu': '#7c4a2d',
  'Đỏ': '#b91c1c',
  'Hồng': '#f9a8d4',
  'Vàng': '#facc15',
  'Xanh navy': '#1e3a8a',
  'Xanh nhạt': '#93c5fd',
  'Xanh đậm': '#1d4ed8',
  'Xanh rêu': '#4d5d3a',
  'Xanh mint': '#a7f3d0',
};

export const PRICE_RANGES = [
  { value: 'all', label: 'Tất cả mức giá' },
  { value: 'u300', label: 'Dưới 300.000đ', min: 0, max: 300000 },
  { value: '300-700', label: '300.000đ – 700.000đ', min: 300000, max: 700000 },
  { value: '700-1500', label: '700.000đ – 1.500.000đ', min: 700000, max: 1500000 },
  { value: 'o1500', label: 'Trên 1.500.000đ', min: 1500000, max: Infinity },
];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'best', label: 'Bán chạy' },
  { value: 'price-asc', label: 'Giá thấp → cao' },
  { value: 'price-desc', label: 'Giá cao → thấp' },
  { value: 'name', label: 'Tên A → Z' },
];

// ─── Trạng thái đơn hàng ────────────────────────────────────────────────────
export const ORDER_STATUS = {
  pending: { label: 'Chờ xác nhận', bg: 'warning', icon: 'bi-hourglass-split' },
  confirmed: { label: 'Đã xác nhận', bg: 'info', icon: 'bi-clipboard-check' },
  shipping: { label: 'Đang giao', bg: 'primary', icon: 'bi-truck' },
  delivered: { label: 'Đã giao', bg: 'success', icon: 'bi-bag-check' },
  cancelled: { label: 'Đã hủy', bg: 'secondary', icon: 'bi-x-circle' },
};

// Trạng thái kế tiếp hợp lệ (admin chỉ được chuyển theo luồng này)
export const STATUS_FLOW = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipping', 'cancelled'],
  shipping: ['delivered'],
  delivered: [],
  cancelled: [],
};

export const PAYMENT_METHODS = {
  cod: 'Thanh toán khi nhận hàng (COD)',
  bank: 'Chuyển khoản ngân hàng',
};
