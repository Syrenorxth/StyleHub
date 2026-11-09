import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Col, Container, Row } from 'react-bootstrap';
import ProductCard from '../components/ProductCard';
import { ErrorBox, Loading } from '../components/common';
import { categoryApi, getErrorMessage, productApi } from '../services/api';

const unsplash = (id, w = 600, h = 800) => `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop`;

// Ảnh người mẫu 2 bên banner (bố cục theo mẫu MEJIWOO trên Figma)
const HERO_LEFT = [
  { src: unsplash('1515886657613-9f3515b0c78f'), alt: 'Bộ nỉ thể thao màu vàng' },
  { src: unsplash('1617137968427-85924c800a22'), alt: 'Bộ suit nam xanh navy' },
];
const HERO_RIGHT = [
  { src: unsplash('1503342217505-b0a15ec3261c'), alt: 'Áo thun đen phối quần jean' },
  { src: unsplash('1509631179647-0177331693ae'), alt: 'Quần ống rộng kẻ sọc' },
];

const COLLECTIONS = [
  { title: 'Nữ', to: '/shop?gender=Nữ', image: unsplash('1539109136881-3be0616acf4b', 600, 760) },
  { title: 'Nam', to: '/shop?gender=Nam', image: unsplash('1487222477894-8943e31ef7b2', 600, 760) },
  { title: 'Sale', to: '/shop?sale=1', image: unsplash('1483985988355-763728e1935b', 600, 760) },
];

const TESTIMONIALS = [
  {
    productId: 17,
    name: 'Ngọc Anh',
    city: 'Hà Nội',
    text: 'Đầm lên form đẹp đúng như ảnh, chất vải mát. Giao hàng nhanh, đóng gói cẩn thận.',
  },
  {
    productId: 8,
    name: 'Đức Minh',
    city: 'TP. Hồ Chí Minh',
    text: 'Áo khoác da mặc rất đứng dáng. Mình đổi size một lần, shop hỗ trợ nhanh và miễn phí.',
  },
  {
    productId: 22,
    name: 'Thu Trang',
    city: 'Đà Nẵng',
    text: 'Túi nhỏ gọn mà đựng được nhiều. Giá sale quá hời, chắc chắn sẽ quay lại mua tiếp.',
  },
];

const PERKS = [
  { icon: 'bi-truck', title: 'Giao hàng toàn quốc', text: 'Miễn phí cho đơn từ 1 triệu' },
  { icon: 'bi-arrow-repeat', title: 'Đổi trả 7 ngày', text: 'Đổi size, đổi màu dễ dàng' },
  { icon: 'bi-shield-check', title: 'Kiểm tra khi nhận', text: 'Thanh toán COD hoặc chuyển khoản' },
  { icon: 'bi-headset', title: 'Hỗ trợ tận tình', text: 'Hotline 1900 6868' },
];

function SectionTitle({ children, sub }) {
  return (
    <div className="section-head-center">
      <h2 className="section-title">{children}</h2>
      {sub && <p className="section-sub">{sub}</p>}
    </div>
  );
}

function ProductGrid({ products }) {
  return (
    <Row xs={2} md={3} lg={4} className="g-3 g-md-4">
      {products.map((p) => (
        <Col key={p.id}>
          <ProductCard product={p} />
        </Col>
      ))}
    </Row>
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
  // 5 danh mục nhiều sản phẩm nhất cho khối "Bộ sưu tập nổi bật"
  const featuredCategories = [...categories]
    .filter((c) => c.products.length > 0)
    .sort((a, b) => b.products.length - a.products.length)
    .slice(0, 5);
  const findProduct = (id) => products.find((p) => p.id === id);

  return (
    <>
      {/* ── Banner chính ── */}
      <section className="hero">
        <Container>
          <div className="hero-banner">
            <div className="hero-models">
              {HERO_LEFT.map((img) => (
                <img key={img.src} src={img.src} alt={img.alt} />
              ))}
            </div>
            <div className="hero-brand">
              <h1>STYLEHUB</h1>
              <span className="hero-sub">thời trang mỗi ngày</span>
              <hr />
              <p>
                Mặc đẹp mỗi ngày với những thiết kế tối giản,
                <br className="d-none d-md-inline" /> chất liệu tốt và giá vừa túi tiền.
              </p>
              <Link to="/shop" className="btn btn-sh mt-2">
                Mua sắm ngay
              </Link>
            </div>
            <div className="hero-models">
              {HERO_RIGHT.map((img) => (
                <img key={img.src} src={img.src} alt={img.alt} />
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── Bộ sưu tập (Season Collections) ── */}
      <section className="section">
        <Container>
          <SectionTitle>Bộ sưu tập</SectionTitle>
          <Row xs={1} md={3} className="g-4 justify-content-center collection-row">
            {COLLECTIONS.map((c) => (
              <Col key={c.title}>
                <Link to={c.to} className="collection-card">
                  <div className="collection-img">
                    <img src={c.image} alt={`Thời trang ${c.title}`} loading="lazy" />
                  </div>
                  <h3>{c.title}</h3>
                  <span className="pill-btn">Xem thêm</span>
                </Link>
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
          {/* ── Hàng mới về (khối nền kem) ── */}
          <section className="section">
            <Container>
              <div className="cream-block">
                <SectionTitle sub="Những thiết kế vừa lên kệ tuần này">Hàng mới về</SectionTitle>
                <ProductGrid products={newArrivals} />
                <div className="text-center mt-4">
                  <Link to="/shop?sort=newest" className="pill-btn pill-btn-white">
                    Xem thêm <i className="bi bi-arrow-right"></i>
                  </Link>
                </div>
              </div>
            </Container>
          </section>

          {/* ── Bộ sưu tập nổi bật (mosaic danh mục) ── */}
          <section className="section">
            <Container>
              <SectionTitle>Danh mục nổi bật</SectionTitle>
              <div className="featured-grid">
                {featuredCategories.map((c, index) => (
                  <Link
                    key={c.id}
                    to={`/shop?category=${c.id}`}
                    className={`featured-tile ${index === 0 ? 'featured-tall' : ''}`}
                  >
                    <img src={c.products[0]?.image} alt={c.name} loading="lazy" />
                    <span className="featured-label">
                      {c.name}
                      <small>{c.products.length} sản phẩm</small>
                    </span>
                    <span className="featured-arrow">
                      <i className="bi bi-arrow-up-right"></i>
                    </span>
                  </Link>
                ))}
              </div>
            </Container>
          </section>

          {/* ── Đang giảm giá ── */}
          <section className="section">
            <Container>
              <SectionTitle sub="Số lượng có hạn, nhanh tay kẻo lỡ">Đang giảm giá</SectionTitle>
              <ProductGrid products={onSale} />
              <div className="text-center mt-4">
                <Link to="/shop?sale=1" className="pill-btn">
                  Xem tất cả sản phẩm sale <i className="bi bi-arrow-right"></i>
                </Link>
              </div>
            </Container>
          </section>

          {/* ── Banner mã giảm giá ── */}
          <section className="section pt-0">
            <Container>
              <div className="promo-strip">
                <div>
                  <span className="promo-eyebrow">Ưu đãi thành viên mới</span>
                  <h2>
                    Nhập mã <code>WELCOME50</code> giảm ngay 50.000đ
                  </h2>
                  <p>
                    Áp dụng cho đơn từ 300.000đ. Thêm mã <code>SALE10</code> giảm 10% cho đơn từ 500.000đ.
                  </p>
                </div>
                <Link to="/shop" className="btn btn-sh">
                  Mua ngay
                </Link>
              </div>
            </Container>
          </section>

          {/* ── Bán chạy ── */}
          <section className="section pt-0">
            <Container>
              <div className="cream-block">
                <SectionTitle sub="Được khách hàng StyleHub chọn mua nhiều nhất">Bán chạy nhất</SectionTitle>
                <ProductGrid products={bestSellers} />
              </div>
            </Container>
          </section>

          {/* ── Khách hàng nói gì (What They Said) ── */}
          <section className="section">
            <Container>
              <SectionTitle>Khách hàng nói gì</SectionTitle>
              <Row xs={1} md={3} className="g-4">
                {TESTIMONIALS.map((t) => {
                  const product = findProduct(t.productId);
                  return (
                    <Col key={t.name}>
                      <article className="review-card">
                        {product && (
                          <Link to={`/products/${product.id}`} className="review-img">
                            <img src={product.image} alt={product.name} loading="lazy" />
                          </Link>
                        )}
                        <div className="review-body">
                          <div className="review-stars" aria-label="5 sao">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <i key={s} className="bi bi-star-fill"></i>
                            ))}
                          </div>
                          <p>“{t.text}”</p>
                          <strong>{t.name}</strong>
                          <small>
                            {t.city}
                            {product && ` · đã mua ${product.name}`}
                          </small>
                        </div>
                      </article>
                    </Col>
                  );
                })}
              </Row>
            </Container>
          </section>
        </>
      )}

      {/* ── Cam kết dịch vụ ── */}
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
    </>
  );
}

export default Home;
