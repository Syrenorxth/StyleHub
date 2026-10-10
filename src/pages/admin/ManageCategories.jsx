import React, { useCallback, useEffect, useState } from 'react';
import { Button, Col, Form, Row, Spinner, Table } from 'react-bootstrap';
import { ConfirmModal, ErrorBox, Loading } from '../../components/common';
import { useToast } from '../../context/ToastContext';
import { categoryApi, getErrorMessage } from '../../services/api';
import { normalizeText } from '../../utils/helpers';

const EMPTY = { name: '', description: '' };

function ManageCategories() {
  const notify = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      // _embed=products để đếm số sản phẩm trong mỗi danh mục
      setCategories(await categoryApi.getAll({ _embed: 'products' }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm(EMPTY);
    setEditingId(null);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (name.length < 2) {
      setFormError('Tên danh mục phải có ít nhất 2 ký tự.');
      return;
    }
    if (categories.some((c) => c.id !== editingId && normalizeText(c.name) === normalizeText(name))) {
      setFormError('Tên danh mục đã tồn tại.');
      return;
    }

    setSaving(true);
    try {
      const payload = { name, description: form.description.trim() };
      if (editingId) {
        await categoryApi.update(editingId, payload);
        notify(`Đã cập nhật danh mục “${name}”`);
      } else {
        await categoryApi.create(payload);
        notify(`Đã thêm danh mục “${name}”`);
      }
      resetForm();
      load();
    } catch (err) {
      notify(getErrorMessage(err), 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await categoryApi.remove(deleteTarget.id);
      notify(`Đã xóa danh mục “${deleteTarget.name}”`);
      if (editingId === deleteTarget.id) resetForm();
      setDeleteTarget(null);
      load();
    } catch (err) {
      notify(getErrorMessage(err), 'danger');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={load} />;

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>Danh mục</h1>
          <p>Phân loại sản phẩm hiển thị trên cửa hàng</p>
        </div>
      </div>

      <Row className="g-3">
        <Col lg={4}>
          <div className="admin-card">
            <div className="admin-card-head">
              <h5>{editingId ? 'Sửa danh mục' : 'Thêm danh mục'}</h5>
            </div>
            <Form noValidate onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="c-name">
                <Form.Label>Tên danh mục *</Form.Label>
                <Form.Control
                  value={form.name}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, name: e.target.value }));
                    setFormError('');
                  }}
                  isInvalid={!!formError}
                />
                <Form.Control.Feedback type="invalid">{formError}</Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3" controlId="c-desc">
                <Form.Label>Mô tả</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
              </Form.Group>
              <div className="d-flex gap-2">
                <Button type="submit" variant="dark" disabled={saving}>
                  {saving && <Spinner size="sm" className="me-2" />}
                  {editingId ? 'Lưu' : 'Thêm'}
                </Button>
                {editingId && (
                  <Button variant="light" onClick={resetForm}>
                    Hủy sửa
                  </Button>
                )}
              </div>
            </Form>
          </div>
        </Col>

        <Col lg={8}>
          <div className="admin-card">
            <Table responsive hover className="admin-table align-middle mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tên danh mục</th>
                  <th>Mô tả</th>
                  <th className="text-center">Sản phẩm</th>
                  <th className="text-end">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className={editingId === c.id ? 'table-active' : ''}>
                    <td className="text-muted">{c.id}</td>
                    <td className="fw-medium">{c.name}</td>
                    <td className="text-muted small">{c.description || '—'}</td>
                    <td className="text-center">{c.products.length}</td>
                    <td className="text-end text-nowrap">
                      <Button
                        size="sm"
                        variant="outline-dark"
                        className="me-1"
                        onClick={() => {
                          setEditingId(c.id);
                          setForm({ name: c.name, description: c.description || '' });
                          setFormError('');
                        }}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      {/* json-server xóa danh mục sẽ xóa luôn sản phẩm con → chỉ cho xóa danh mục rỗng */}
                      <Button
                        size="sm"
                        variant="outline-danger"
                        disabled={c.products.length > 0}
                        title={c.products.length > 0 ? 'Danh mục còn sản phẩm, không thể xóa' : 'Xóa'}
                        onClick={() => setDeleteTarget(c)}
                      >
                        <i className="bi bi-trash3"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Col>
      </Row>

      <ConfirmModal
        show={!!deleteTarget}
        title="Xóa danh mục"
        body={deleteTarget && <>Xóa danh mục <strong>{deleteTarget.name}</strong>?</>}
        confirmText="Xóa"
        loading={deleting}
        onConfirm={handleDelete}
        onHide={() => setDeleteTarget(null)}
      />
    </>
  );
}

export default ManageCategories;
