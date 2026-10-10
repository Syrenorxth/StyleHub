import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Form, InputGroup, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';

const AUTH_IMAGE = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&h=1200&fit=crop';

function Login() {
  const { user, login } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Đã đăng nhập thì không cho vào trang login nữa
  if (user && !loading) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu.');
      return;
    }
    setLoading(true);
    try {
      const account = await login(form.username, form.password);
      notify(`Xin chào, ${account.fullName}!`);
      if (account.role === 'admin') navigate('/admin', { replace: true });
      else navigate(from && !from.startsWith('/admin') ? from : '/', { replace: true });
    } catch (err) {
      setError(err.response || err.request ? getErrorMessage(err) : err.message);
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="auth-visual d-none d-md-block">
          <img src={AUTH_IMAGE} alt="StyleHub store" />
          <div className="auth-quote">
            <span className="brand-logo brand-logo-light">STYLE<span>HUB</span></span>
            <p>“Phong cách không phải là thứ bạn mặc, mà là cách bạn mặc nó.”</p>
          </div>
        </div>

        <div className="auth-form">
          <h1>Đăng nhập</h1>
          <p className="text-muted mb-4">Chào mừng bạn quay lại StyleHub.</p>

          {from && !error && (
            <div className="auth-notice">
              <i className="bi bi-lock me-1"></i>Vui lòng đăng nhập để tiếp tục.
            </div>
          )}
          {error && (
            <div className="inline-error mb-3">
              <i className="bi bi-exclamation-circle me-1"></i>
              {error}
            </div>
          )}

          <Form noValidate onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="username">
              <Form.Label>Tên đăng nhập</Form.Label>
              <Form.Control name="username" value={form.username} onChange={handleChange} autoComplete="username" autoFocus />
            </Form.Group>
            <Form.Group className="mb-4" controlId="password">
              <Form.Label>Mật khẩu</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
                <InputGroup.Text
                  as="button"
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </InputGroup.Text>
              </InputGroup>
            </Form.Group>
            <button type="submit" className="btn btn-sh btn-lg w-100" disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Đăng nhập'}
            </button>
          </Form>

          <p className="text-center mt-4 mb-0">
            Chưa có tài khoản?{' '}
            <Link to="/register" state={{ from }} className="link-accent">
              Đăng ký ngay
            </Link>
          </p>

          <div className="demo-accounts">
            <div className="fw-semibold mb-1">Tài khoản dùng thử</div>
            <div>Khách hàng: <code>lan.nguyen</code> / <code>123456</code></div>
            <div>Quản trị: <code>admin</code> / <code>admin123</code></div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Login;
