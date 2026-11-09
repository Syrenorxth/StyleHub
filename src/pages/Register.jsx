/**
 * pages/Register.jsx — Trang đăng ký tài khoản khách hàng.
 * Hàm:
 *   - validate(f)     : kiểm tra họ tên (≥ 2 ký tự), username (4–20 ký tự: chữ, số, dấu chấm, gạch dưới), email, SĐT, mật khẩu (≥ 6 ký tự),
 *                       nhập lại mật khẩu khớp, đồng ý điều khoản.
 *   - handleChange(e) : cập nhật form (cả checkbox) và xóa lỗi ô đang sửa.
 *   - handleSubmit(e) : validate rồi gọi register() (báo lỗi nếu trùng username); thành công thì tự đăng nhập.
 *   - field(name, label, props): hàm tạo nhanh 1 ô nhập kèm thông báo lỗi.
 */
import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Col, Form, Row, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { EMAIL_REGEX, PHONE_REGEX } from '../utils/helpers';

const AUTH_IMAGE = 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=900&h=1200&fit=crop';

const EMPTY = { fullName: '', username: '', email: '', phone: '', password: '', confirmPassword: '', agree: false };

const validate = (f) => {
  const e = {};
  if (f.fullName.trim().length < 2) e.fullName = 'Họ tên phải có ít nhất 2 ký tự.';
  if (!/^[a-zA-Z0-9._]{4,20}$/.test(f.username.trim()))
    e.username = 'Tên đăng nhập 4–20 ký tự, chỉ gồm chữ, số, dấu chấm hoặc gạch dưới.';
  if (!EMAIL_REGEX.test(f.email.trim())) e.email = 'Email không hợp lệ.';
  if (!PHONE_REGEX.test(f.phone.trim())) e.phone = 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0.';
  if (f.password.length < 6) e.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
  if (f.confirmPassword !== f.password) e.confirmPassword = 'Mật khẩu nhập lại không khớp.';
  if (!f.agree) e.agree = 'Bạn cần đồng ý với điều khoản để tiếp tục.';
  return e;
};

function Register() {
  const { user, register } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();
  const from = useLocation().state?.from;

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user && !loading) return <Navigate to="/" replace />;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validate(form);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    setLoading(true);
    try {
      const account = await register(form);
      notify(`Tạo tài khoản thành công. Chào mừng ${account.fullName}!`);
      navigate(from || '/', { replace: true });
    } catch (err) {
      setServerError(err.response || err.request ? getErrorMessage(err) : err.message);
      setLoading(false);
    }
  };

  const field = (name, label, props = {}) => (
    <Form.Group controlId={`reg-${name}`}>
      <Form.Label>{label}</Form.Label>
      <Form.Control name={name} value={form[name]} onChange={handleChange} isInvalid={!!errors[name]} {...props} />
      <Form.Control.Feedback type="invalid">{errors[name]}</Form.Control.Feedback>
    </Form.Group>
  );

  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="auth-visual d-none d-md-block">
          <img src={AUTH_IMAGE} alt="Thời trang StyleHub" />
          <div className="auth-quote">
            <span className="brand-logo brand-logo-light">STYLE<span>HUB</span></span>
            <p>Đăng ký để lưu địa chỉ, theo dõi đơn hàng và nhận ưu đãi thành viên.</p>
          </div>
        </div>

        <div className="auth-form">
          <h1>Tạo tài khoản</h1>
          <p className="text-muted mb-4">Chỉ mất chưa đến 1 phút.</p>

          {serverError && (
            <div className="inline-error mb-3">
              <i className="bi bi-exclamation-circle me-1"></i>
              {serverError}
            </div>
          )}

          <Form noValidate onSubmit={handleSubmit}>
            <Row className="g-3">
              <Col xs={12}>{field('fullName', 'Họ và tên', { autoFocus: true })}</Col>
              <Col sm={6}>{field('username', 'Tên đăng nhập', { autoComplete: 'username' })}</Col>
              <Col sm={6}>{field('phone', 'Số điện thoại')}</Col>
              <Col xs={12}>{field('email', 'Email', { type: 'email' })}</Col>
              <Col sm={6}>{field('password', 'Mật khẩu', { type: 'password', autoComplete: 'new-password' })}</Col>
              <Col sm={6}>{field('confirmPassword', 'Nhập lại mật khẩu', { type: 'password', autoComplete: 'new-password' })}</Col>
              <Col xs={12}>
                <Form.Check
                  id="agree"
                  name="agree"
                  checked={form.agree}
                  onChange={handleChange}
                  isInvalid={!!errors.agree}
                  feedback={errors.agree}
                  feedbackType="invalid"
                  label="Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật của StyleHub"
                />
              </Col>
            </Row>
            <button type="submit" className="btn btn-sh btn-lg w-100 mt-4" disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Đăng ký'}
            </button>
          </Form>

          <p className="text-center mt-4 mb-0">
            Đã có tài khoản?{' '}
            <Link to="/login" state={{ from }} className="link-accent">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export default Register;
