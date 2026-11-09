/**
 * utils/helpers.js — Các hàm tiện ích thuần (không phụ thuộc React).
 *   - formatCurrency(value)        : định dạng số thành tiền Việt (vd 199000 → "199.000 ₫").
 *   - formatDate(iso, withTime)    : định dạng ngày giờ kiểu dd/mm/yyyy hh:mm.
 *   - getSalePrice(product)        : tính giá sau giảm theo % discount, làm tròn đến nghìn đồng.
 *   - formatOrderCode(id)          : tạo mã đơn hiển thị dạng SH00001.
 *   - calcShippingFee(subtotal)    : phí ship = 0 nếu đạt ngưỡng miễn phí, ngược lại 30.000đ.
 *   - applyCoupon(coupon, subtotal): kiểm tra mã giảm giá (còn hiệu lực, đủ giá trị tối thiểu) và trả về
 *                                    { discount, freeShip }; ném lỗi nếu mã không hợp lệ.
 *   - normalizeText(text)          : bỏ dấu tiếng Việt + chữ thường để tìm kiếm không phân biệt dấu.
 *   - PHONE_REGEX, EMAIL_REGEX     : biểu thức kiểm tra số điện thoại (10 số, bắt đầu bằng 0) và email.
 */
import { FREE_SHIP_THRESHOLD, SHIPPING_FEE } from './constants';

export const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

export const formatDate = (iso, withTime = true) =>
  new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });

// Giá sau giảm, làm tròn đến nghìn đồng
export const getSalePrice = (product) =>
  product.discount > 0
    ? Math.round((product.price * (100 - product.discount)) / 100 / 1000) * 1000
    : product.price;

export const formatOrderCode = (id) => `SH${String(id).padStart(5, '0')}`;

export const calcShippingFee = (subtotal) =>
  subtotal === 0 || subtotal >= FREE_SHIP_THRESHOLD ? 0 : SHIPPING_FEE;

// Tính tiền giảm của mã khuyến mãi; trả về { discount, freeShip } hoặc ném lỗi nếu không hợp lệ
export const applyCoupon = (coupon, subtotal) => {
  if (!coupon || !coupon.active) throw new Error('Mã giảm giá không tồn tại hoặc đã hết hạn.');
  if (subtotal < coupon.minOrder) {
    throw new Error(`Mã ${coupon.code} chỉ áp dụng cho đơn từ ${formatCurrency(coupon.minOrder)}.`);
  }
  if (coupon.type === 'freeship') return { discount: 0, freeShip: true };
  if (coupon.type === 'percent') {
    const value = Math.round((subtotal * coupon.value) / 100);
    return { discount: Math.min(value, coupon.maxDiscount || value), freeShip: false };
  }
  return { discount: Math.min(coupon.value, subtotal), freeShip: false };
};

// Bỏ dấu tiếng Việt để tìm kiếm không phân biệt dấu
export const normalizeText = (text = '') =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .trim();

export const PHONE_REGEX = /^0\d{9}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
