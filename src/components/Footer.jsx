/**
 * components/Footer.jsx — Chân trang: logo + giới thiệu, mạng xã hội, link mua sắm, link hỗ trợ, thông tin liên hệ.
 * Chỉ hiển thị, không có hàm xử lý.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Col, Container, Row } from 'react-bootstrap';

function Footer() {
  return (
    <footer className="site-footer">
      <Container>
        <Row className="gy-4">
          <Col lg={4}>
            <div className="brand-logo footer-logo mb-3">
              STYLEHUB
              <small>thời trang mỗi ngày</small>
            </div>
            <p className="footer-text">
              Thời trang tối giản, chất liệu bền đẹp và giá hợp lý cho người trẻ Việt. Mặc đẹp mỗi ngày, không
              cần cầu kỳ.
            </p>
            <div className="d-flex gap-2 mt-3">
              {['facebook', 'instagram', 'tiktok', 'youtube'].map((s) => (
                <span key={s} className="social-btn" aria-label={s}>
                  <i className={`bi bi-${s}`}></i>
                </span>
              ))}
            </div>
          </Col>
          <Col xs={6} lg={2}>
            <h6 className="footer-title">Mua sắm</h6>
            <ul className="footer-links">
              <li><Link to="/shop">Tất cả sản phẩm</Link></li>
              <li><Link to="/shop?gender=Nữ">Thời trang Nữ</Link></li>
              <li><Link to="/shop?gender=Nam">Thời trang Nam</Link></li>
              <li><Link to="/shop?sale=1">Khuyến mãi</Link></li>
            </ul>
          </Col>
          <Col xs={6} lg={2}>
            <h6 className="footer-title">Hỗ trợ</h6>
            <ul className="footer-links">
              <li><Link to="/my-orders">Tra cứu đơn hàng</Link></li>
              <li><Link to="/profile">Tài khoản</Link></li>
              <li><span>Chính sách đổi trả</span></li>
              <li><span>Hướng dẫn chọn size</span></li>
            </ul>
          </Col>
          <Col lg={4}>
            <h6 className="footer-title">Liên hệ</h6>
            <ul className="footer-links">
              <li><i className="bi bi-geo-alt me-2"></i>Khu CNC Hòa Lạc, Thạch Thất, Hà Nội</li>
              <li><i className="bi bi-telephone me-2"></i>1900 6868</li>
              <li><i className="bi bi-envelope me-2"></i>hotro@stylehub.vn</li>
              <li><i className="bi bi-clock me-2"></i>8:00 – 22:00, tất cả các ngày</li>
            </ul>
          </Col>
        </Row>
        <div className="footer-bottom">
          © {new Date().getFullYear()} StyleHub · Dự án Assignment FER202 · ReactJS · React Router · React Bootstrap ·
          json-server
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
