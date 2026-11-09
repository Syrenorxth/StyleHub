/**
 * pages/Checkout.jsx — Trang thanh toán (chỉ khách hàng đã đăng nhập).
 *   - Form thông tin nhận hàng (điền sẵn từ tài khoản), chọn COD / chuyển khoản, nhập mã giảm giá.
 * Hàm:
 *   - validate(form)     : kiểm tra họ tên, SĐT (PHONE_REGEX), email nếu có nhập (EMAIL_REGEX),
 *                          địa chỉ ≥ 10 ký tự; trả về object lỗi.
 *   - handleChange(e)    : cập nhật form và xóa lỗi của ô đang sửa.
 *   - handleApplyCoupon(): tìm mã trên server rồi áp dụng bằng applyCoupon (báo lỗi nếu mã sai/hết hạn/chưa đủ điều kiện).
 *   - handleSubmit(e)    : 1) validate form
 *                          2) lấy tồn kho mới nhất trên server, không đủ hàng thì báo lỗi
 *                          3) tạo đơn hàng (orderApi.create) với trạng thái "pending"
 *                          4) trừ tồn kho (adjustStock -1), xóa giỏ, chuyển sang /order-success/:id.
 *   - Giỏ hàng trống → chuyển về /cart.
 */
import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button, Col, Container, Form, InputGroup, Row, Spinner } from 'react-bootstrap';
import { PageBanner } from '../components/common';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { adjustStock, couponApi, getErrorMessage, orderApi, productApi } from '../services/api';
import { PAYMENT_METHODS } from '../utils/constants';
import { applyCoupon, calcShippingFee, EMAIL_REGEX, formatCurrency, PHONE_REGEX } from '../utils/helpers';

const validate = (form) => {
  const errors = {};
  if (form.fullName.trim().length < 2) errors.fullName = 'Vui lòng nhập họ tên người nhận.';
  if (!PHONE_REGEX.test(form.phone.trim())) errors.phone = 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0.';
  if (form.email && !EMAIL_REGEX.test(form.email.trim())) errors.email = 'Email không hợp lệ.';
  if (form.address.trim().length < 10) errors.address = 'Vui lòng nhập địa chỉ chi tiết (ít nhất 10 ký tự).';
  return errors;
};

function Checkout() {
  const { user, updateProfile } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const notify = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: user.fullName || '',
    phone: user.phone || '',
    email: user.email || '',
    address: user.address || '',
    note: '',
    paymentMethod: 'cod',
  });
  const [errors, setErrors] = useState({});
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  if (items.length === 0 && !submitting) return <Navigate to="/cart" replace />;

  // Mã giảm giá được tính lại mỗi lần render để luôn khớp với tạm tính hiện tại
  let couponResult = { discount: 0, freeShip: false };
  if (coupon) {
    try {
      couponResult = applyCoupon(coupon, subtotal);
    } catch {
      couponResult = { discount: 0, freeShip: false };
    }
  }
  const shippingFee = couponResult.freeShip ? 0 : calcShippingFee(subtotal);
  const total = subtotal + shippingFee - couponResult.discount;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCheckingCoupon(true);
    setCouponError('');
    try {
      const found = await couponApi.findByCode(couponInput);
      applyCoupon(found, subtotal); // ném lỗi nếu không hợp lệ
      setCoupon(found);
      setCouponInput('');
      notify(`Đã áp dụng mã ${found.code}`);
    } catch (err) {
      setCouponError(err.response || err.request ? getErrorMessage(err) : err.message);
    } finally {
      setCheckingCoupon(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validate(form);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      // 1. Kiểm tra lại tồn kho mới nhất trên server
      const latest = await Promise.all([...new Set(items.map((i) => i.productId))].map((pid) => productApi.getById(pid)));
      for (const product of latest) {
        const ordered = items.filter((i) => i.productId === product.id).reduce((s, i) => s + i.quantity, 0);
        if (ordered > product.stock) {
          throw new Error(`“${product.name}” chỉ còn ${product.stock} sản phẩm. Vui lòng cập nhật lại giỏ hàng.`);
        }
      }

      // 2. Tạo đơn hàng
      const order = await orderApi.create({
        userId: user.id,
        receiver: {
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          address: form.address.trim(),
          note: form.note.trim(),
        },
        items: items.map(({ productId, name, image, size, color, price, quantity }) => ({
          productId, name, image, size, color, price, quantity,
        })),
        subtotal,
        shippingFee,
        couponCode: coupon?.code || null,
        discountAmount: couponResult.discount,
        total,
        paymentMethod: form.paymentMethod,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      // 3. Trừ tồn kho, cộng số lượng đã bán
      await adjustStock(order.items, -1);

      // 4. Lưu địa chỉ vào hồ sơ cho lần mua sau (không chặn luồng đặt hàng nếu lỗi)
      if (!user.address) updateProfile({ address: form.address.trim() }).catch(() => {});

      clearCart();
      navigate(`/order-success/${order.id}`, { replace: true });
    } catch (err) {
      setSubmitError(err.response || err.request ? getErrorMessage(err) : err.message);
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageBanner title="Thanh toán" crumbs={[{ label: 'Giỏ hàng', to: '/cart' }, { label: 'Thanh toán' }]} />
      <Container className="py-4 py-lg-5">
        <Form noValidate onSubmit={handleSubmit}>
          <Row className="g-4">
            <Col lg={7}>
              <div className="panel">
                <h5 className="panel-title">
                  <span className="step-num">1</span>Thông tin nhận hàng
                </h5>
                <Row className="g-3">
                  <Col sm={6}>
                    <Form.Group controlId="fullName">
                      <Form.Label>Họ và tên *</Form.Label>
                      <Form.Control name="fullName" value={form.fullName} onChange={handleChange} isInvalid={!!errors.fullName} />
                      <Form.Control.Feedback type="invalid">{errors.fullName}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group controlId="phone">
                      <Form.Label>Số điện thoại *</Form.Label>
                      <Form.Control name="phone" value={form.phone} onChange={handleChange} isInvalid={!!errors.phone} placeholder="0912345678" />
                      <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col xs={12}>
                    <Form.Group controlId="email">
                      <Form.Label>Email (nhận thông báo đơn hàng)</Form.Label>
                      <Form.Control type="email" name="email" value={form.email} onChange={handleChange} isInvalid={!!errors.email} />
                      <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col xs={12}>
                    <Form.Group controlId="address">
                      <Form.Label>Địa chỉ giao hàng *</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        isInvalid={!!errors.address}
                        placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                      />
                      <Form.Control.Feedback type="invalid">{errors.address}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col xs={12}>
                    <Form.Group controlId="note">
                      <Form.Label>Ghi chú</Form.Label>
                      <Form.Control name="note" value={form.note} onChange={handleChange} placeholder="VD: Giao giờ hành chính" />
                    </Form.Group>
                  </Col>
                </Row>
              </div>

              <div className="panel mt-4">
                <h5 className="panel-title">
                  <span className="step-num">2</span>Phương thức thanh toán
                </h5>
                {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
                  <label key={value} className={`pay-option ${form.paymentMethod === value ? 'active' : ''}`}>
                    <Form.Check
                      type="radio"
                      name="paymentMethod"
                      value={value}
                      checked={form.paymentMethod === value}
                      onChange={handleChange}
                    />
                    <i className={`bi ${value === 'cod' ? 'bi-cash-stack' : 'bi-bank'}`}></i>
                    <span>{label}</span>
                  </label>
                ))}
                {form.paymentMethod === 'bank' && (
                  <div className="bank-info">
                    <div>Ngân hàng: <strong>Vietcombank – CN Hòa Lạc</strong></div>
                    <div>Số tài khoản: <strong>0123 4567 89</strong> · Chủ TK: <strong>CONG TY STYLEHUB</strong></div>
                    <div>Nội dung: <strong>Số điện thoại + họ tên</strong>. Đơn được xác nhận sau khi nhận tiền.</div>
                  </div>
                )}
              </div>
            </Col>

            <Col lg={5}>
              <div className="panel summary-panel">
                <h5 className="panel-title">
                  <span className="step-num">3</span>Đơn hàng ({items.length})
                </h5>
                <div className="checkout-items">
                  {items.map((item) => (
                    <div className="checkout-item" key={item.key}>
                      <div className="checkout-thumb">
                        <img src={item.image} alt={item.name} />
                        <span>{item.quantity}</span>
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-medium">{item.name}</div>
                        <small className="text-muted">Size {item.size} · {item.color}</small>
                      </div>
                      <div className="fw-medium">{formatCurrency(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>

                {/* Mã giảm giá */}
                <div className="my-3">
                  {coupon ? (
                    <div className="coupon-applied">
                      <div>
                        <i className="bi bi-ticket-perforated me-1"></i>
                        <strong>{coupon.code}</strong>
                        <div className="small text-muted">{coupon.description}</div>
                        {couponResult.discount === 0 && !couponResult.freeShip && (
                          <div className="small text-danger">Đơn hàng chưa đủ điều kiện áp dụng mã này.</div>
                        )}
                      </div>
                      <button type="button" className="btn-remove" onClick={() => setCoupon(null)} aria-label="Bỏ mã">
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>
                  ) : (
                    <>
                      <InputGroup>
                        <Form.Control
                          placeholder="Nhập mã giảm giá"
                          value={couponInput}
                          onChange={(e) => {
                            setCouponInput(e.target.value.toUpperCase());
                            setCouponError('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleApplyCoupon();
                            }
                          }}
                          isInvalid={!!couponError}
                        />
                        <Button variant="dark" onClick={handleApplyCoupon} disabled={checkingCoupon}>
                          {checkingCoupon ? <Spinner size="sm" /> : 'Áp dụng'}
                        </Button>
                      </InputGroup>
                      {couponError && <div className="small text-danger mt-1">{couponError}</div>}
                      <div className="small text-muted mt-1">Thử: WELCOME50, SALE10, FREESHIP</div>
                    </>
                  )}
                </div>

                <div className="summary-line">
                  <span>Tạm tính</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="summary-line">
                  <span>Phí vận chuyển</span>
                  <span>{shippingFee === 0 ? 'Miễn phí' : formatCurrency(shippingFee)}</span>
                </div>
                {couponResult.discount > 0 && (
                  <div className="summary-line text-success">
                    <span>Giảm giá ({coupon.code})</span>
                    <span>-{formatCurrency(couponResult.discount)}</span>
                  </div>
                )}
                <div className="summary-line total">
                  <span>Tổng thanh toán</span>
                  <span>{formatCurrency(total)}</span>
                </div>

                {submitError && (
                  <div className="inline-error mb-3">
                    <i className="bi bi-exclamation-circle me-1"></i>
                    {submitError}
                  </div>
                )}

                <button type="submit" className="btn btn-sh btn-lg w-100" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Đang đặt hàng...
                    </>
                  ) : (
                    'Đặt hàng'
                  )}
                </button>
              </div>
            </Col>
          </Row>
        </Form>
      </Container>
    </>
  );
}

export default Checkout;
