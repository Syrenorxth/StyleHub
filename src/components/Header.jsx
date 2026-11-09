/**
 * components/Header.jsx — Thanh điều hướng trên cùng (bố cục theo mẫu Figma MEJIWOO).
 *   - Thanh thông báo miễn phí vận chuyển.
 *   - Trái: menu NAV_LINKS (Trang chủ, Sản phẩm, Nữ, Nam, SALE); hàm match() xác định link đang active
 *     dựa vào pathname + query (?gender=, ?sale=).
 *   - Giữa: logo STYLEHUB.
 *   - Phải: ô tìm kiếm, icon Yêu thích / Giỏ hàng (có badge số lượng), menu tài khoản hoặc icon Đăng nhập.
 * Hàm:
 *   - SearchBox       : component ô tìm kiếm (dùng lại cho desktop và menu mobile).
 *   - useEffect       : đồng bộ ô tìm kiếm với ?q= trên URL khi ở trang /shop.
 *   - handleSearch(e) : chuyển sang /shop?q=từ-khóa.
 *   - handleLogout()  : đăng xuất và về trang chủ.
 */
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
  { to: '/shop', label: 'Sản phẩm', match: (path, q) => path === '/shop' && !q.get('gender') && !q.get('sale') },
  { to: '/shop?gender=Nữ', label: 'Nữ', match: (path, q) => path === '/shop' && q.get('gender') === 'Nữ' },
  { to: '/shop?gender=Nam', label: 'Nam', match: (path, q) => path === '/shop' && q.get('gender') === 'Nam' },
  { to: '/shop?sale=1', label: 'SALE', accent: true, match: (path, q) => path === '/shop' && q.get('sale') === '1' },
];

function SearchBox({ keyword, setKeyword, onSubmit, className }) {
  return (
    <form className={`nav-search ${className}`} onSubmit={onSubmit} role="search">
      <input
        type="search"
        placeholder="Tìm kiếm"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        aria-label="Tìm kiếm sản phẩm"
      />
      <button type="submit" aria-label="Tìm">
        <i className="bi bi-search"></i>
      </button>
    </form>
  );
}

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
        Miễn phí vận chuyển cho đơn từ {formatCurrency(FREE_SHIP_THRESHOLD)}
        <span className="d-none d-md-inline"> · Đổi trả trong 7 ngày</span>
      </div>

      <Navbar expand="lg" className="main-nav" expanded={expanded} onToggle={setExpanded}>
        <Container className="nav-shell">
          {/* Cột giữa: logo */}
          <Navbar.Brand as={Link} to="/" className="brand-logo" onClick={() => setExpanded(false)}>
            STYLEHUB
            <small>thời trang mỗi ngày</small>
          </Navbar.Brand>

          {/* Cột phải: tìm kiếm + icon */}
          <div className="nav-right">
            <SearchBox
              keyword={keyword}
              setKeyword={setKeyword}
              onSubmit={handleSearch}
              className="d-none d-lg-flex"
            />
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
              <Link to="/login" className="icon-btn" title="Đăng nhập">
                <i className="bi bi-person"></i>
              </Link>
            )}

            <Navbar.Toggle aria-controls="main-menu" className="nav-toggle border-0 shadow-none" />
          </div>

          {/* Cột trái: menu điều hướng */}
          <Navbar.Collapse id="main-menu" className="nav-left">
            <Nav className="main-links">
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
            </Nav>
            <SearchBox keyword={keyword} setKeyword={setKeyword} onSubmit={handleSearch} className="d-lg-none" />
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
}

export default Header;
