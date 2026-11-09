/**
 * pages/Cart.jsx — Trang giỏ hàng.
 *   - Liệt kê từng dòng (sản phẩm + size + màu), sửa số lượng, xóa dòng.
 *   - Thanh tiến độ "còn bao nhiêu nữa để được miễn phí vận chuyển".
 *   - Bảng tổng: tạm tính, phí ship (calcShippingFee), tổng cộng.
 * Hàm:
 *   - handleCheckout(): chưa đăng nhập → báo thông báo và sang /login (đăng nhập xong quay lại /checkout);
 *                       đã đăng nhập → sang /checkout.
 *   - Admin không có giỏ hàng: trang này chỉ hiện thông báo dẫn về trang quản trị.
 */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Col, Container, Row } from 'react-bootstrap';
import { EmptyState, PageBanner, QuantityInput } from '../components/common';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { FREE_SHIP_THRESHOLD } from '../utils/constants';
import { calcShippingFee, formatCurrency } from '../utils/helpers';

function Cart() {
  const { items, updateQuantity, removeItem, clearCart, subtotal, totalQuantity } = useCart();
  const { user, isAdmin } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();

  const shippingFee = calcShippingFee(subtotal);
  const remainForFreeShip = FREE_SHIP_THRESHOLD - subtotal;

  const handleCheckout = () => {
    if (!user) {
      notify('Vui lòng đăng nhập để tiến hành đặt hàng.', 'info');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    navigate('/checkout');
  };

  if (isAdmin) {
    return (
      <Container className="py-5">
        <EmptyState
          icon="bi-person-gear"
          title="Tài khoản quản trị không thể mua hàng"
          description="Hãy đăng nhập bằng tài khoản khách hàng để sử dụng giỏ hàng."
          actionText="Về trang quản trị"
          actionTo="/admin"
        />
      </Container>
    );
  }

  return (
    <>
      <PageBanner title="Giỏ hàng" crumbs={[{ label: 'Giỏ hàng' }]} />
      <Container className="py-4 py-lg-5">
        {items.length === 0 ? (
          <EmptyState
            icon="bi-bag"
            title="Giỏ hàng của bạn đang trống"
            description="Khám phá hàng trăm thiết kế mới và thêm món đồ bạn yêu thích vào giỏ nhé."
            actionText="Tiếp tục mua sắm"
            actionTo="/shop"
          />
        ) : (
          <Row className="g-4">
            <Col lg={8}>
              <div className="panel">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">{totalQuantity} sản phẩm</h5>
                  <button type="button" className="btn btn-link text-danger p-0 small" onClick={clearCart}>
                    <i className="bi bi-trash3 me-1"></i>Xóa tất cả
                  </button>
                </div>

                {items.map((item) => (
                  <div className="cart-row" key={item.key}>
                    <Link to={`/products/${item.productId}`} className="cart-thumb">
                      <img src={item.image} alt={item.name} />
                    </Link>
                    <div className="cart-detail">
                      <Link to={`/products/${item.productId}`} className="cart-name">
                        {item.name}
                      </Link>
                      <div className="cart-variant">
                        Size {item.size} · {item.color}
                      </div>
                      <div className="cart-unit">
                        {formatCurrency(item.price)}
                        {item.originalPrice > item.price && <del>{formatCurrency(item.originalPrice)}</del>}
                      </div>
                    </div>
                    <div className="cart-actions">
                      <QuantityInput
                        size="sm"
                        value={item.quantity}
                        max={item.stock}
                        onChange={(q) => updateQuantity(item.key, q)}
                      />
                      <strong className="cart-line-total">{formatCurrency(item.price * item.quantity)}</strong>
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => removeItem(item.key)}
                        aria-label="Xóa sản phẩm"
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/shop" className="link-more d-inline-block mt-3">
                <i className="bi bi-arrow-left"></i> Tiếp tục mua sắm
              </Link>
            </Col>

            <Col lg={4}>
              <div className="panel summary-panel">
                <h5 className="mb-3">Tóm tắt đơn hàng</h5>
                {remainForFreeShip > 0 ? (
                  <div className="freeship-hint">
                    Mua thêm <strong>{formatCurrency(remainForFreeShip)}</strong> để được miễn phí vận chuyển
                    <div className="freeship-bar">
                      <span style={{ width: `${(subtotal / FREE_SHIP_THRESHOLD) * 100}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className="freeship-hint done">
                    <i className="bi bi-check-circle-fill me-1"></i> Đơn hàng được miễn phí vận chuyển
                  </div>
                )}
                <div className="summary-line">
                  <span>Tạm tính</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="summary-line">
                  <span>Phí vận chuyển</span>
                  <span>{shippingFee === 0 ? 'Miễn phí' : formatCurrency(shippingFee)}</span>
                </div>
                <div className="summary-line total">
                  <span>Tổng cộng</span>
                  <span>{formatCurrency(subtotal + shippingFee)}</span>
                </div>
                <small className="text-muted d-block mb-3">Mã giảm giá có thể nhập ở bước thanh toán.</small>
                <button type="button" className="btn btn-sh btn-lg w-100" onClick={handleCheckout}>
                  Tiến hành thanh toán
                </button>
              </div>
            </Col>
          </Row>
        )}
      </Container>
    </>
  );
}

export default Cart;
