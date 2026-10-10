import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Col, Container, Row } from 'react-bootstrap';
import ProductCard from '../components/ProductCard';
import { ErrorBox, Loading } from '../components/common';
import { categoryApi, getErrorMessage, productApi } from '../services/api';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1400&h=900&fit=crop';

const PERKS = [
  { icon: 'bi-truck', title: 'Giao hàng toàn quốc', text: 'Miễn phí cho đơn từ 1 triệu' },
  { icon: 'bi-arrow-repeat', title: 'Đổi trả 7 ngày', text: 'Đổi size, đổi màu dễ dàng' },
  { icon: 'bi-shield-check', title: 'Chất lượng đảm bảo', text: 'Kiểm tra hàng trước khi nhận' },
  { icon: 'bi-headset', title: 'Hỗ trợ tận tình', text: 'Hotline 1900 6868' },
];

function ProductSection({ title, subtitle, products, linkTo }) {
  return (
    <section className="section">
      <Container>
        <div className="section-head">
          <div>
            <h2 className="section-title">{title}</h2>
            <p className="section-sub">{subtitle}</p>
          </div>
          <Link to={linkTo} className="link-more">
            Xem tất cả <i className="bi bi-arrow-right"></i>
          </Link>
        </div>
        <Row xs={2} md={3} lg={4} className="g-3 g-md-4">
          {products.map((p) => (
            <Col key={p.id}>
              <ProductCard product={p} />
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
}

function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // _embed=products: json-server trả kèm danh sách sản phẩm của mỗi danh mục
      const [productData, categoryData] = await Promise.all([
        productApi.getAll({ _expand: 'category' }),
        categoryApi.getAll({ _embed: 'products' }),
      ]);
      setProducts(productData);
      setCategories(categoryData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const newArrivals = products.filter((p) => p.isNew).slice(0, 8);
  const onSale = [...products].filter((p) => p.discount > 0).sort((a, b) => b.discount - a.discount).slice(0, 4);
  const bestSellers = [...products].sort((a, b) => b.sold - a.sold).slice(0, 4);

  return (
    <>
      {/* ── Hero ── */}
      <section className="hero">
        <Container>
          <Row className="align-items-center g-5">
            <Col lg={6}>
              <span className="eyebrow">Bộ sưu tập Thu – Đông 2026</span>
              <h1 className="hero-title">
                Mặc đơn giản,
                <br />
                <em>sống</em> thật chất.
              </h1>
              <p className="hero-text">
                Những thiết kế tối giản, chất liệu tự nhiên và form dáng chuẩn người Việt. Phối đồ dễ dàng cho đi
                học, đi làm hay dạo phố cuối tuần.
              </p>
              <div className="d-flex flex-wrap gap-2 mt-4">
                <Link to="/shop" className="btn btn-sh btn-lg">
                  Mua sắm ngay
                </Link>
                <Link to="/shop?sale=1" className="btn btn-sh-outline btn-lg">
                  Xem khuyến mãi
                </Link>
              </div>
              <div className="hero-stats">
                <div>
                  <strong>{products.length || '—'}</strong>
                  <span>Mẫu thiết kế</span>
                </div>
                <div>
                  <strong>{categories.length || '—'}</strong>
                  <span>Danh mục</span>
                </div>
                <div>
                  <strong>4.9★</strong>
                  <span>Đánh giá khách hàng</span>
                </div>
              </div>
            </Col>
            <Col lg={6}>
              <div className="hero-visual">
                <img src={HERO_IMAGE} alt="Bộ sưu tập thời trang StyleHub" />
                <div className="hero-card">
                  <i className="bi bi-stars"></i>
                  <div>
                    <strong>Giảm đến 25%</strong>
                    <small>Cho các mẫu đang sale</small>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── Ưu đãi dịch vụ ── */}
      <section className="perks">
        <Container>
          <Row xs={2} lg={4} className="g-3">
            {PERKS.map((perk) => (
              <Col key={perk.title}>
                <div className="perk">
                  <i className={`bi ${perk.icon}`}></i>
                  <div>
                    <strong>{perk.title}</strong>
                    <span>{perk.text}</span>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {loading && <Loading text="Đang tải sản phẩm..." />}
      {error && !loading && (
        <Container className="py-5">
          <ErrorBox message={error} onRetry={loadData} />
        </Container>
      )}

      {!loading && !error && (
        <>
          {/* ── Danh mục ── */}
          <section className="section pb-0">
            <Container>
              <div className="section-head">
                <div>
                  <h2 className="section-title">Mua theo danh mục</h2>
                  <p className="section-sub">Tìm nhanh món đồ bạn cần</p>
                </div>
              </div>
              <div className="category-strip">
                {categories.map((c) => (
                  <Link key={c.id} to={`/shop?category=${c.id}`} className="category-chip">
                    <img src={c.products[0]?.image} alt={c.name} />
                    <div>
                      <strong>{c.name}</strong>
                      <span>{c.products.length} sản phẩm</span>
                    </div>
                  </Link>
                ))}
              </div>
            </Container>
          </section>

          <ProductSection
            title="Hàng mới về"
            subtitle="Những thiết kế vừa lên kệ tuần này"
            products={newArrivals}
            linkTo="/shop?sort=newest"
          />

          {/* ── Banner khuyến mãi ── */}
          <section className="promo-banner">
            <Container>
              <div className="promo-inner">
                <div>
                  <span className="eyebrow eyebrow-light">Ưu đãi thành viên</span>
                  <h2>Nhập mã <code>WELCOME50</code> giảm ngay 50.000đ</h2>
                  <p>Áp dụng cho đơn hàng từ 300.000đ. Thêm mã <code>SALE10</code> giảm 10% cho đơn từ 500.000đ.</p>
                </div>
                <Link to="/shop" className="btn btn-light btn-lg">
                  Mua ngay
                </Link>
              </div>
            </Container>
          </section>

          <ProductSection
            title="Đang giảm giá"
            subtitle="Số lượng có hạn — nhanh tay kẻo lỡ"
            products={onSale}
            linkTo="/shop?sale=1"
          />
          <ProductSection
            title="Bán chạy nhất"
            subtitle="Được khách hàng StyleHub chọn mua nhiều nhất"
            products={bestSellers}
            linkTo="/shop?sort=best"
          />
        </>
      )}
    </>
  );
}

export default Home;
