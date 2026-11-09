/**
 * pages/ProductDetail.jsx — Trang chi tiết sản phẩm /products/:id.
 *   - Ảnh, giá (giá giảm, tiết kiệm bao nhiêu), chọn màu, chọn size, chọn số lượng (giới hạn theo tồn kho
 *     trừ đi số đã có trong giỏ), nút Thêm vào giỏ / Mua ngay / Yêu thích.
 *   - Tab Mô tả / Bảo quản / Đổi trả; khối Sản phẩm liên quan (cùng danh mục).
 * Hàm:
 *   - loadProduct()     : lấy sản phẩm theo id (không có → báo không tìm thấy) và các sản phẩm cùng danh mục.
 *   - available         : số lượng còn có thể thêm = tồn kho - số lượng đã có trong giỏ.
 *   - handleAdd(buyNow) : bắt buộc chọn size + màu, kiểm tra còn hàng, thêm vào giỏ và báo thông báo;
 *                         buyNow = true thì chuyển sang trang giỏ hàng.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Col, Container, Row, Tab, Tabs } from 'react-bootstrap';
import ProductCard, { FALLBACK_IMAGE } from '../components/ProductCard';
import { EmptyState, ErrorBox, Loading, PageBanner, QuantityInput } from '../components/common';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage, productApi } from '../services/api';
import { COLOR_SWATCHES, LOW_STOCK_LIMIT } from '../utils/constants';
import { formatCurrency, getSalePrice } from '../utils/helpers';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { addItem, items } = useCart();
  const wishlist = useWishlist();
  const notify = useToast();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectError, setSelectError] = useState('');

  const loadProduct = useCallback(async () => {
    setLoading(true);
    setError('');
    setNotFound(false);
    try {
      const data = await productApi.getById(id);
      setProduct(data);
      // Tự chọn sẵn nếu chỉ có 1 size / 1 màu
      setSize(data.sizes.length === 1 ? data.sizes[0] : '');
      setColor(data.colors.length === 1 ? data.colors[0] : '');
      setQuantity(1);
      setSelectError('');

      const sameCategory = await productApi.getAll({ categoryId: data.categoryId, _expand: 'category' });
      setRelated(sameCategory.filter((p) => p.id !== data.id).slice(0, 4));
    } catch (err) {
      if (err.response?.status === 404) setNotFound(true);
      else setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  if (loading) return <Loading text="Đang tải sản phẩm..." />;
  if (notFound) {
    return (
      <Container className="py-5">
        <EmptyState
          icon="bi-emoji-frown"
          title="Sản phẩm không tồn tại"
          description="Sản phẩm có thể đã ngừng kinh doanh hoặc đường dẫn không đúng."
          actionText="Quay lại cửa hàng"
          actionTo="/shop"
        />
      </Container>
    );
  }
  if (error) {
    return (
      <Container className="py-5">
        <ErrorBox message={error} onRetry={loadProduct} />
      </Container>
    );
  }

  const salePrice = getSalePrice(product);
  const liked = wishlist.has(product.id);
  // Số lượng đã có trong giỏ (mọi size/màu) để không vượt tồn kho
  const inCart = items.filter((i) => i.productId === product.id).reduce((s, i) => s + i.quantity, 0);
  const available = Math.max(0, product.stock - inCart);

  const handleAdd = (buyNow = false) => {
    if (!size || !color) {
      setSelectError(`Vui lòng chọn ${!size ? 'kích cỡ' : 'màu sắc'} trước khi thêm vào giỏ.`);
      return;
    }
    if (available <= 0) {
      notify('Bạn đã thêm toàn bộ số lượng còn lại của sản phẩm này vào giỏ.', 'warning');
      return;
    }
    addItem(product, { size, color, quantity: Math.min(quantity, available) });
    notify(`Đã thêm “${product.name}” (${size} / ${color}) vào giỏ hàng`);
    setQuantity(1);
    if (buyNow) navigate('/cart');
  };

  return (
    <>
      <PageBanner
        title={product.name}
        crumbs={[
          { label: 'Cửa hàng', to: '/shop' },
          { label: product.category?.name, to: `/shop?category=${product.categoryId}` },
          { label: product.name },
        ]}
      />

      <Container className="py-4 py-lg-5">
        <Row className="g-4 g-lg-5">
          <Col md={6}>
            <div className="detail-image">
              <img
                src={product.image.replace('w=600&h=750', 'w=900&h=1100')}
                alt={product.name}
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_IMAGE;
                }}
              />
              <div className="product-tags">
                {product.isNew && <span className="tag tag-new">Mới</span>}
                {product.discount > 0 && <span className="tag tag-sale">-{product.discount}%</span>}
              </div>
            </div>
          </Col>

          <Col md={6}>
            <div className="detail-info">
              <div className="detail-meta">
                <Link to={`/shop?category=${product.categoryId}`}>{product.category?.name}</Link>
                <span>·</span>
                <span>{product.gender}</span>
                <span>·</span>
                <span>Đã bán {product.sold}</span>
              </div>
              <h2 className="detail-name">{product.name}</h2>

              <div className="detail-price">
                <span className={product.discount > 0 ? 'price-sale' : ''}>{formatCurrency(salePrice)}</span>
                {product.discount > 0 && (
                  <>
                    <del>{formatCurrency(product.price)}</del>
                    <span className="save-badge">Tiết kiệm {formatCurrency(product.price - salePrice)}</span>
                  </>
                )}
              </div>

              {/* Chọn màu */}
              <div className="option-group">
                <div className="option-label">
                  Màu sắc: <strong>{color || 'Chưa chọn'}</strong>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`color-option ${color === c ? 'active' : ''}`}
                      onClick={() => {
                        setColor(c);
                        setSelectError('');
                      }}
                    >
                      <span className="swatch-dot" style={{ background: COLOR_SWATCHES[c] || '#ccc' }} />
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chọn size */}
              <div className="option-group">
                <div className="option-label">
                  Kích cỡ: <strong>{size || 'Chưa chọn'}</strong>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`size-option ${size === s ? 'active' : ''}`}
                      onClick={() => {
                        setSize(s);
                        setSelectError('');
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Số lượng + tồn kho */}
              <div className="option-group">
                <div className="option-label">Số lượng</div>
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  <QuantityInput value={quantity} onChange={setQuantity} max={Math.max(1, available)} />
                  {product.stock <= 0 ? (
                    <span className="stock-text out">Hết hàng</span>
                  ) : product.stock <= LOW_STOCK_LIMIT ? (
                    <span className="stock-text low">Chỉ còn {product.stock} sản phẩm</span>
                  ) : (
                    <span className="stock-text">Còn {product.stock} sản phẩm</span>
                  )}
                </div>
                {inCart > 0 && (
                  <small className="text-muted d-block mt-2">Bạn đã có {inCart} sản phẩm này trong giỏ.</small>
                )}
              </div>

              {selectError && (
                <div className="inline-error">
                  <i className="bi bi-exclamation-circle me-1"></i>
                  {selectError}
                </div>
              )}

              {isAdmin ? (
                <Link to="/admin/products" className="btn btn-sh btn-lg w-100 mt-3">
                  <i className="bi bi-pencil-square me-2"></i>Quản lý sản phẩm này
                </Link>
              ) : (
                <div className="d-flex gap-2 mt-3">
                  <button
                    type="button"
                    className="btn btn-sh-outline btn-lg flex-grow-1"
                    disabled={product.stock <= 0}
                    onClick={() => handleAdd(false)}
                  >
                    <i className="bi bi-bag-plus me-2"></i>Thêm vào giỏ
                  </button>
                  <button
                    type="button"
                    className="btn btn-sh btn-lg flex-grow-1"
                    disabled={product.stock <= 0}
                    onClick={() => handleAdd(true)}
                  >
                    Mua ngay
                  </button>
                  <button
                    type="button"
                    className={`btn btn-lg btn-wish ${liked ? 'liked' : ''}`}
                    onClick={() => wishlist.toggle(product.id)}
                    aria-label="Yêu thích"
                  >
                    <i className={`bi ${liked ? 'bi-heart-fill' : 'bi-heart'}`}></i>
                  </button>
                </div>
              )}

              <ul className="detail-perks">
                <li><i className="bi bi-truck"></i>Miễn phí giao hàng cho đơn từ 1.000.000đ</li>
                <li><i className="bi bi-arrow-repeat"></i>Đổi size / đổi màu trong 7 ngày</li>
                <li><i className="bi bi-cash-coin"></i>Kiểm tra hàng trước khi thanh toán</li>
              </ul>
            </div>
          </Col>
        </Row>

        <Tabs defaultActiveKey="desc" className="detail-tabs mt-5">
          <Tab eventKey="desc" title="Mô tả sản phẩm">
            <p>{product.description}</p>
            <ul>
              <li>Giới tính: {product.gender}</li>
              <li>Kích cỡ có sẵn: {product.sizes.join(', ')}</li>
              <li>Màu sắc: {product.colors.join(', ')}</li>
            </ul>
          </Tab>
          <Tab eventKey="care" title="Bảo quản">
            <ul>
              <li>Giặt máy ở chế độ nhẹ, nước dưới 30°C.</li>
              <li>Không dùng chất tẩy, lộn trái khi giặt để giữ màu.</li>
              <li>Phơi nơi thoáng mát, tránh ánh nắng trực tiếp.</li>
            </ul>
          </Tab>
          <Tab eventKey="policy" title="Đổi trả">
            <p>
              Sản phẩm được đổi size/màu trong vòng 7 ngày kể từ khi nhận hàng, còn nguyên tem mác và chưa qua sử
              dụng. Miễn phí đổi trả nếu lỗi từ nhà sản xuất.
            </p>
          </Tab>
        </Tabs>

        {related.length > 0 && (
          <section className="mt-5">
            <h3 className="section-title mb-4">Có thể bạn cũng thích</h3>
            <Row xs={2} md={4} className="g-3 g-md-4">
              {related.map((p) => (
                <Col key={p.id}>
                  <ProductCard product={p} />
                </Col>
              ))}
            </Row>
          </section>
        )}
      </Container>
    </>
  );
}

export default ProductDetail;
