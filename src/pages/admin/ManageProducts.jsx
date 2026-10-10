import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Col, Form, InputGroup, Modal, Row, Spinner, Table } from 'react-bootstrap';
import { ConfirmModal, ErrorBox, Loading, Pager } from '../../components/common';
import { FALLBACK_IMAGE } from '../../components/ProductCard';
import { useToast } from '../../context/ToastContext';
import { categoryApi, getErrorMessage, productApi } from '../../services/api';
import { ADMIN_PAGE_SIZE, GENDERS, LOW_STOCK_LIMIT, SIZE_OPTIONS } from '../../utils/constants';
import { formatCurrency, getSalePrice, normalizeText } from '../../utils/helpers';

const EMPTY_FORM = {
  name: '',
  categoryId: '',
  gender: 'Unisex',
  price: '',
  discount: '0',
  stock: '',
  image: '',
  sizes: [],
  colors: '',
  description: '',
  isNew: false,
};

const validate = (f) => {
  const e = {};
  if (f.name.trim().length < 3) e.name = 'Tên sản phẩm phải có ít nhất 3 ký tự.';
  if (!f.categoryId) e.categoryId = 'Vui lòng chọn danh mục.';
  if (!(Number(f.price) >= 1000)) e.price = 'Giá phải là số và tối thiểu 1.000đ.';
  if (!(Number(f.discount) >= 0 && Number(f.discount) <= 90)) e.discount = 'Giảm giá từ 0 đến 90%.';
  if (f.stock === '' || !Number.isInteger(Number(f.stock)) || Number(f.stock) < 0) e.stock = 'Tồn kho là số nguyên ≥ 0.';
  if (!/^https?:\/\/.+/.test(f.image.trim())) e.image = 'URL ảnh phải bắt đầu bằng http:// hoặc https://';
  if (f.sizes.length === 0) e.sizes = 'Chọn ít nhất một kích cỡ.';
  if (f.colors.split(',').map((c) => c.trim()).filter(Boolean).length === 0) e.colors = 'Nhập ít nhất một màu.';
  if (f.description.trim().length < 10) e.description = 'Mô tả phải có ít nhất 10 ký tự.';
  return e;
};

function ManageProducts() {
  const notify = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // null = thêm mới
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setError('');
    try {
      const [productData, categoryData] = await Promise.all([
        productApi.getAll({ _expand: 'category', _sort: 'id', _order: 'desc' }),
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
    const kw = normalizeText(keyword);
    return products.filter(
      (p) =>
        (!kw || normalizeText(p.name).includes(kw)) &&
        (categoryFilter === 'all' || p.categoryId === Number(categoryFilter)) &&
        (stockFilter === 'all' ||
          (stockFilter === 'low' && p.stock > 0 && p.stock <= LOW_STOCK_LIMIT) ||
          (stockFilter === 'out' && p.stock === 0))
    );
  }, [products, keyword, categoryFilter, stockFilter]);

  const totalPages = Math.ceil(filtered.length / ADMIN_PAGE_SIZE);
  const currentPage = Math.min(page, totalPages || 1);
  const pageItems = filtered.slice((currentPage - 1) * ADMIN_PAGE_SIZE, currentPage * ADMIN_PAGE_SIZE);

  // ─── Thêm / Sửa ───────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name,
      categoryId: String(p.categoryId),
      gender: p.gender,
      price: String(p.price),
      discount: String(p.discount),
      stock: String(p.stock),
      image: p.image,
      sizes: p.sizes,
      colors: p.colors.join(', '),
      description: p.description,
      isNew: p.isNew,
    });
    setErrors({});
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const toggleSize = (size) => {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : SIZE_OPTIONS.filter((s) => prev.sizes.includes(s) || s === size), // giữ đúng thứ tự size
    }));
    setErrors((prev) => ({ ...prev, sizes: '' }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formErrors = validate(form);
    // Không cho trùng tên với sản phẩm khác
    if (products.some((p) => p.id !== editing?.id && normalizeText(p.name) === normalizeText(form.name))) {
      formErrors.name = 'Đã có sản phẩm khác trùng tên.';
    }
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    const payload = {
      name: form.name.trim(),
      categoryId: Number(form.categoryId),
      gender: form.gender,
      price: Number(form.price),
      discount: Number(form.discount),
      stock: Number(form.stock),
      image: form.image.trim(),
      sizes: form.sizes,
      colors: [...new Set(form.colors.split(',').map((c) => c.trim()).filter(Boolean))],
      description: form.description.trim(),
      isNew: form.isNew,
    };

    setSaving(true);
    try {
      if (editing) {
        await productApi.update(editing.id, { ...payload, sold: editing.sold, createdAt: editing.createdAt });
        notify(`Đã cập nhật “${payload.name}”`);
      } else {
        await productApi.create({ ...payload, sold: 0, createdAt: new Date().toISOString() });
        notify(`Đã thêm sản phẩm “${payload.name}”`);
        setPage(1);
      }
      setShowForm(false);
      loadData();
    } catch (err) {
      notify(getErrorMessage(err), 'danger');
    } finally {
      setSaving(false);
    }
  };

  // ─── Xóa ───────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await productApi.remove(deleteTarget.id);
      notify(`Đã xóa “${deleteTarget.name}”`);
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      notify(getErrorMessage(err), 'danger');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={loadData} />;

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>Sản phẩm</h1>
          <p>{products.length} sản phẩm trong cửa hàng</p>
        </div>
        <Button variant="dark" onClick={openCreate}>
          <i className="bi bi-plus-lg me-1"></i>Thêm sản phẩm
        </Button>
      </div>

      <div className="admin-card">
        <div className="admin-filters">
          <InputGroup className="filter-search">
            <InputGroup.Text>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Tìm theo tên sản phẩm..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(1);
              }}
            />
          </InputGroup>
          <Form.Select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Form.Select>
          <Form.Select
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Mọi tình trạng kho</option>
            <option value="low">Sắp hết hàng</option>
            <option value="out">Hết hàng</option>
          </Form.Select>
        </div>

        <Table responsive hover className="admin-table align-middle mb-0">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Danh mục</th>
              <th className="text-end">Giá bán</th>
              <th className="text-center">Tồn kho</th>
              <th className="text-center">Đã bán</th>
              <th className="text-end">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-muted py-4">
                  Không có sản phẩm phù hợp.
                </td>
              </tr>
            )}
            {pageItems.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <img src={p.image} alt={p.name} className="table-thumb" />
                    <div>
                      <div className="fw-medium">
                        {p.name} {p.isNew && <span className="tag tag-new tag-inline">Mới</span>}
                      </div>
                      <small className="text-muted">
                        {p.gender} · {p.sizes.join(', ')}
                      </small>
                    </div>
                  </div>
                </td>
                <td>{p.category?.name || '—'}</td>
                <td className="text-end">
                  <div className="fw-medium">{formatCurrency(getSalePrice(p))}</div>
                  {p.discount > 0 && (
                    <small className="text-muted">
                      <del>{formatCurrency(p.price)}</del> -{p.discount}%
                    </small>
                  )}
                </td>
                <td className="text-center">
                  <span className={`stock-pill ${p.stock === 0 ? 'out' : p.stock <= LOW_STOCK_LIMIT ? 'low' : ''}`}>{p.stock}</span>
                </td>
                <td className="text-center">{p.sold}</td>
                <td className="text-end text-nowrap">
                  <Button size="sm" variant="outline-dark" className="me-1" onClick={() => openEdit(p)} title="Sửa">
                    <i className="bi bi-pencil"></i>
                  </Button>
                  <Button size="sm" variant="outline-danger" onClick={() => setDeleteTarget(p)} title="Xóa">
                    <i className="bi bi-trash3"></i>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Pager page={currentPage} totalPages={totalPages} onChange={setPage} />
      </div>

      {/* ── Modal thêm / sửa ── */}
      <Modal show={showForm} onHide={() => !saving && setShowForm(false)} size="lg" centered scrollable>
        <Form noValidate onSubmit={handleSave}>
          <Modal.Header closeButton>
            <Modal.Title as="h5">{editing ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row className="g-3">
              <Col md={8}>
                <Form.Group controlId="f-name">
                  <Form.Label>Tên sản phẩm *</Form.Label>
                  <Form.Control name="name" value={form.name} onChange={handleChange} isInvalid={!!errors.name} />
                  <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="f-category">
                  <Form.Label>Danh mục *</Form.Label>
                  <Form.Select name="categoryId" value={form.categoryId} onChange={handleChange} isInvalid={!!errors.categoryId}>
                    <option value="">-- Chọn --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.categoryId}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col sm={6} md={3}>
                <Form.Group controlId="f-price">
                  <Form.Label>Giá gốc (đ) *</Form.Label>
                  <Form.Control type="number" name="price" value={form.price} onChange={handleChange} isInvalid={!!errors.price} min={0} step={1000} />
                  <Form.Control.Feedback type="invalid">{errors.price}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col sm={6} md={3}>
                <Form.Group controlId="f-discount">
                  <Form.Label>Giảm giá (%)</Form.Label>
                  <Form.Control type="number" name="discount" value={form.discount} onChange={handleChange} isInvalid={!!errors.discount} min={0} max={90} />
                  <Form.Control.Feedback type="invalid">{errors.discount}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col sm={6} md={3}>
                <Form.Group controlId="f-stock">
                  <Form.Label>Tồn kho *</Form.Label>
                  <Form.Control type="number" name="stock" value={form.stock} onChange={handleChange} isInvalid={!!errors.stock} min={0} />
                  <Form.Control.Feedback type="invalid">{errors.stock}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col sm={6} md={3}>
                <Form.Group controlId="f-gender">
                  <Form.Label>Giới tính</Form.Label>
                  <Form.Select name="gender" value={form.gender} onChange={handleChange}>
                    {GENDERS.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              {Number(form.price) > 0 && Number(form.discount) > 0 && (
                <Col xs={12}>
                  <small className="text-muted">
                    Giá bán sau giảm:{' '}
                    <strong>{formatCurrency(getSalePrice({ price: Number(form.price), discount: Number(form.discount) }))}</strong>
                  </small>
                </Col>
              )}

              <Col xs={12}>
                <Form.Label>Kích cỡ *</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {SIZE_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`size-option size-option-sm ${form.sizes.includes(s) ? 'active' : ''}`}
                      onClick={() => toggleSize(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {errors.sizes && <div className="small text-danger mt-1">{errors.sizes}</div>}
              </Col>

              <Col xs={12}>
                <Form.Group controlId="f-colors">
                  <Form.Label>Màu sắc * (cách nhau bởi dấu phẩy)</Form.Label>
                  <Form.Control name="colors" value={form.colors} onChange={handleChange} isInvalid={!!errors.colors} placeholder="Đen, Trắng, Be" />
                  <Form.Control.Feedback type="invalid">{errors.colors}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={8}>
                <Form.Group controlId="f-image">
                  <Form.Label>URL hình ảnh *</Form.Label>
                  <Form.Control name="image" value={form.image} onChange={handleChange} isInvalid={!!errors.image} placeholder="https://..." />
                  <Form.Control.Feedback type="invalid">{errors.image}</Form.Control.Feedback>
                </Form.Group>
                <Form.Group controlId="f-description" className="mt-3">
                  <Form.Label>Mô tả *</Form.Label>
                  <Form.Control as="textarea" rows={4} name="description" value={form.description} onChange={handleChange} isInvalid={!!errors.description} />
                  <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
                </Form.Group>
                <Form.Check type="switch" id="f-isNew" name="isNew" checked={form.isNew} onChange={handleChange} label="Đánh dấu là hàng mới về" className="mt-3" />
              </Col>
              <Col md={4}>
                <Form.Label>Xem trước</Form.Label>
                <div className="image-preview">
                  {form.image ? (
                    <img src={form.image} alt="preview" onError={(e) => (e.currentTarget.src = FALLBACK_IMAGE)} />
                  ) : (
                    <span>
                      <i className="bi bi-image"></i>
                      Chưa có ảnh
                    </span>
                  )}
                </div>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowForm(false)} disabled={saving}>
              Hủy
            </Button>
            <Button type="submit" variant="dark" disabled={saving}>
              {saving && <Spinner size="sm" className="me-2" />}
              {editing ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ConfirmModal
        show={!!deleteTarget}
        title="Xóa sản phẩm"
        body={
          deleteTarget && (
            <>
              Bạn chắc chắn muốn xóa <strong>{deleteTarget.name}</strong>? Thao tác này không thể hoàn tác. Các đơn
              hàng cũ vẫn giữ nguyên thông tin sản phẩm.
            </>
          )
        }
        confirmText="Xóa"
        loading={deleting}
        onConfirm={handleDelete}
        onHide={() => setDeleteTarget(null)}
      />
    </>
  );
}

export default ManageProducts;
