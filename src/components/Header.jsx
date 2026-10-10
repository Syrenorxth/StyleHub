import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Dropdown, Nav, Navbar } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatCurrency } from '../utils/helpers';
import { FREE_SHIP_THRESHOLD } from '../utils/constants';

// match(): kiểm tra link có đang active không dựa trên pathname + query
const NAV_LINKS = [
  { to: '/', label: 'Trang chủ', match: (path) => path === '/' },
  { to: '/shop', label: 'Cửa hàng', match: (path, q) => path === '/shop' && !q.get('gender') && !q.get('sale') },
  { to: '/shop?gender=Nam', label: 'Nam', match: (path, q) => path === '/shop' && q.get('gender') === 'Nam' },
  { to: '/shop?gender=Nữ', label: 'Nữ', match: (path, q) => path === '/shop' && q.get('gender') === 'Nữ' },
  { to: '/shop?sale=1', label: 'Sale', accent: true, match: (path, q) => path === '/shop' && q.get('sale') === '1' },
];

function Header() {
  const { user, isAdmin, logout } = useAuth();
  const { totalQuantity } = useCart();
  const { count: wishCount } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [keyword, setKeyword] = useState('');
  const [expanded, setExpanded] = useState(false);

  // Đồng bộ ô tìm kiếm với tham số ?q= trên URL
  useEffect(() => {
    setKeyword(location.pathname === '/shop' ? searchParams.get('q') || '' : '');
  }, [location.pathname, searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = keyword.trim();
    navigate(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop');
    setExpanded(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };


  return (
    <header className="site-header">
      <div className="announcement-bar">
        <i className="bi bi-truck me-2"></i>
        Miễn phí vận chuyển cho đơn hàng từ {formatCurrency(FREE_SHIP_THRESHOLD)}
        <span className="d-none d-md-inline"> · Đổi trả trong 7 ngày</span>
      </div>

      <Navbar expand="lg" className="main-nav" expanded={expanded} onToggle={setExpanded}>
        <Container>
          <Navbar.Brand as={Link} to="/" className="brand-logo" onClick={() => setExpanded(false)}>
            STYLE<span>HUB</span>
          </Navbar.Brand>

          <div className="d-flex align-items-center gap-1 order-lg-3">
            <Link to="/wishlist" className="icon-btn" title="Yêu thích">
              <i className="bi bi-heart"></i>
              {wishCount > 0 && <span className="icon-badge">{wishCount}</span>}
            </Link>
            {!isAdmin && (
              <Link to="/cart" className="icon-btn" title="Giỏ hàng">
                <i className="bi bi-bag"></i>
                {totalQuantity > 0 && <span className="icon-badge">{totalQuantity}</span>}
              </Link>
            )}

            {user ? (
              <Dropdown align="end">
                <Dropdown.Toggle as="button" className="icon-btn user-toggle" id="user-menu">
                  <span className="user-initial">{user.fullName.charAt(0)}</span>
                </Dropdown.Toggle>
                <Dropdown.Menu className="user-menu">
                  <div className="px-3 py-2 border-bottom mb-1">
                    <div className="fw-semibold">{user.fullName}</div>
                    <small className="text-muted">@{user.username}</small>
                  </div>
                  {isAdmin ? (
                    <Dropdown.Item as={Link} to="/admin">
                      <i className="bi bi-speedometer2 me-2"></i>Trang quản trị
                    </Dropdown.Item>
                  ) : (
                    <Dropdown.Item as={Link} to="/my-orders">
                      <i className="bi bi-receipt me-2"></i>Đơn hàng của tôi
                    </Dropdown.Item>
                  )}
                  <Dropdown.Item as={Link} to="/profile">
                    <i className="bi bi-person me-2"></i>Tài khoản
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout} className="text-danger">
                    <i className="bi bi-box-arrow-right me-2"></i>Đăng xuất
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <Link to="/login" className="btn btn-sh btn-sm ms-1 d-none d-sm-inline-block">
                Đăng nhập
              </Link>
            )}

            <Navbar.Toggle aria-controls="main-menu" className="ms-1 border-0 shadow-none" />
          </div>

          <Navbar.Collapse id="main-menu" className="order-lg-2">
            <Nav className="mx-lg-auto main-links">
              {NAV_LINKS.map((link) => (
                <Nav.Link
                  key={link.to}
                  as={Link}
                  to={link.to}
                  onClick={() => setExpanded(false)}
                  className={`${link.match(location.pathname, searchParams) ? 'is-active' : ''} ${link.accent ? 'text-accent' : ''}`}
                >
                  {link.label}
                </Nav.Link>
              ))}
              {!user && (
                <Nav.Link as={Link} to="/login" className="d-sm-none" onClick={() => setExpanded(false)}>
                  Đăng nhập
                </Nav.Link>
              )}
            </Nav>
            <form className="nav-search" onSubmit={handleSearch} role="search">
              <i className="bi bi-search"></i>
              <input
                type="search"
                placeholder="Tìm áo, quần, váy..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                aria-label="Tìm kiếm sản phẩm"
              />
            </form>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
}

export default Header;
