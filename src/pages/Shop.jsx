import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Col, Container, Form, Row } from 'react-bootstrap';
import ProductCard from '../components/ProductCard';
import { EmptyState, ErrorBox, Loading, PageBanner, Pager } from '../components/common';
import { categoryApi, getErrorMessage, productApi } from '../services/api';
import { GENDERS, PRICE_RANGES, SHOP_PAGE_SIZE, SORT_OPTIONS } from '../utils/constants';
import { getSalePrice, normalizeText } from '../utils/helpers';

function Shop() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilter, setShowFilter] = useState(false); // chỉ dùng trên mobile

  // Toàn bộ bộ lọc được lưu trên URL → có thể chia sẻ link / bấm Back không mất lọc
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || 'all';
  const gender = searchParams.get('gender') || 'all';
  const price = searchParams.get('price') || 'all';
  const saleOnly = searchParams.get('sale') === '1';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page')) || 1;

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all') next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page'); // đổi bộ lọc → quay về trang 1
    setSearchParams(next);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [productData, categoryData] = await Promise.all([
        productApi.getAll({ _expand: 'category' }),
        categoryApi.getAll(),
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

  const filtered = useMemo(() => {
    const keyword = normalizeText(q);
    const range = PRICE_RANGES.find((r) => r.value === price);

    const result = products.filter((p) => {
      const finalPrice = getSalePrice(p);
      if (keyword && !normalizeText(`${p.name} ${p.category?.name || ''}`).includes(keyword)) return false;
      if (category !== 'all' && p.categoryId !== Number(category)) return false;
      if (gender !== 'all' && p.gender !== gender && p.gender !== 'Unisex') return false;
      if (range && range.value !== 'all' && (finalPrice < range.min || finalPrice >= range.max)) return false;
      if (saleOnly && !(p.discount > 0)) return false;
      return true;
    });

    const sorters = {
      newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      best: (a, b) => b.sold - a.sold,
      'price-asc': (a, b) => getSalePrice(a) - getSalePrice(b),
      'price-desc': (a, b) => getSalePrice(b) - getSalePrice(a),
      name: (a, b) => a.name.localeCompare(b.name, 'vi'),
    };
    return result.sort(sorters[sort] || sorters.newest);
  }, [products, q, category, gender, price, saleOnly, sort]);

  const totalPages = Math.ceil(filtered.length / SHOP_PAGE_SIZE);
  const currentPage = Math.min(page, totalPages || 1);
  const pageItems = filtered.slice((currentPage - 1) * SHOP_PAGE_SIZE, currentPage * SHOP_PAGE_SIZE);
  const hasFilter = q || category !== 'all' || gender !== 'all' || price !== 'all' || saleOnly;

  const bannerTitle = saleOnly
    ? 'Khuyến mãi'
    : gender !== 'all'
    ? `Thời trang ${gender}`
    : categories.find((c) => c.id === Number(category))?.name || 'Tất cả sản phẩm';

  return (
    <>
      <PageBanner
        title={bannerTitle}
        subtitle={q ? `Kết quả tìm kiếm cho “${q}”` : 'Khám phá các thiết kế mới nhất của StyleHub'}
        crumbs={[{ label: 'Cửa hàng' }]}
      />

      <Container className="py-4 py-lg-5">
        <Row className="g-4">
          {/* ── Bộ lọc ── */}
          <Col lg={3}>
            <button
              type='button'
              className="btn btn-sh-outline w-100 d-lg-none"
              onClick={() => setShowFilter((v) => !v)}
              aria-expanded={showFilter}
            >
              <i className='bi bi-sliders me-2'></i>
              {showFilter ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
              {hasFilter && <span className="filter-dot" />}
            </button>
            <aside className={`filter-panel ${showFilter ? 'mt-3' : 'd-none'} d-lg-block`}>
              <div className="filter-group">
                <h6>Danh mục</h6>
                <button
                  type="button"
                  className={`filter-option ${category === 'all' ? 'active' : ''}`}
                  onClick={() => updateParam('category', 'all')}
                >
                  Tất cả
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`filter-option ${category === String(c.id) ? 'active' : ''}`}
                    onClick={() => updateParam('category', String(c.id))}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              <div className="filter-group">
                <h6>Giới tính</h6>
                <div className="d-flex flex-wrap gap-2">
                  {['all', ...GENDERS.filter((g) => g !== 'Unisex')].map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`pill ${gender === g ? 'active' : ''}`}
                      onClick={() => updateParam('gender', g)}
                    >
                      {g === 'all' ? 'Tất cả' : g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <h6>Khoảng giá</h6>
                {PRICE_RANGES.map((r) => (
                  <Form.Check
                    key={r.value}
                    type="radio"
                    id={`price-${r.value}`}
                    name="price"
                    label={r.label}
                    checked={price === r.value}
                    onChange={() => updateParam('price', r.value)}
                    className="mb-1"
                  />
                ))}
              </div>

              <div className="filter-group">
                <Form.Check
                  type="switch"
                  id="sale-only"
                  label="Chỉ hiện sản phẩm đang giảm giá"
                  checked={saleOnly}
                  onChange={(e) => updateParam('sale', e.target.checked ? '1' : '')}
                />
              </div>

              {hasFilter && (
                <button type="button" className="btn btn-sh-outline btn-sm w-100" onClick={() => setSearchParams({})}>
                  <i className="bi bi-x-lg me-1"></i>Xóa bộ lọc
                </button>
              )}
            </aside>
          </Col>

          {/* ── Danh sách ── */}
          <Col lg={9}>
            <div className="shop-toolbar">
              <span>
                Hiển thị <strong>{filtered.length}</strong> sản phẩm
              </span>
              <Form.Select
                size="sm"
                value={sort}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="sort-select"
                aria-label="Sắp xếp"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    Sắp xếp: {o.label}
                  </option>
                ))}
              </Form.Select>
            </div>

            {loading && <Loading text="Đang tải sản phẩm..." />}
            {error && !loading && <ErrorBox message={error} onRetry={loadData} />}

            {!loading && !error && (
              <>
                {pageItems.length === 0 ? (
                  <EmptyState
                    icon="bi-search"
                    title="Không tìm thấy sản phẩm phù hợp"
                    description="Hãy thử từ khóa khác hoặc bỏ bớt bộ lọc."
                  />
                ) : (
                  <Row xs={2} md={3} className="g-3 g-md-4">
                    {pageItems.map((p) => (
                      <Col key={p.id}>
                        <ProductCard product={p} />
                      </Col>
                    ))}
                  </Row>
                )}
                <Pager
                  page={currentPage}
                  totalPages={totalPages}
                  onChange={(p) => {
                    updateParam('page', String(p));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </>
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default Shop;
