import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Col, Form, InputGroup, Modal, Row, Table } from 'react-bootstrap';
import { ErrorBox, Loading, Pager, StatusBadge } from '../../components/common';
import { useToast } from '../../context/ToastContext';
import { adjustStock, getErrorMessage, orderApi } from '../../services/api';
import { ADMIN_PAGE_SIZE, ORDER_STATUS, PAYMENT_METHODS, STATUS_FLOW } from '../../utils/constants';
import { formatCurrency, formatDate, formatOrderCode, normalizeText } from '../../utils/helpers';

function ManageOrders() {
  const notify = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      setOrders(await orderApi.getAll());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const kw = normalizeText(keyword);
    return orders.filter(
      (o) =>
        (statusFilter === 'all' || o.status === statusFilter) &&
        (!kw || normalizeText(`${formatOrderCode(o.id)} ${o.receiver.fullName} ${o.receiver.phone}`).includes(kw))
    );
  }, [orders, statusFilter, keyword]);

  const totalPages = Math.ceil(filtered.length / ADMIN_PAGE_SIZE);
  const currentPage = Math.min(page, totalPages || 1);
  const pageItems = filtered.slice((currentPage - 1) * ADMIN_PAGE_SIZE, currentPage * ADMIN_PAGE_SIZE);

  const handleChangeStatus = async (order, nextStatus) => {
    if (nextStatus === 'cancelled' && !window.confirm(`Hủy đơn ${formatOrderCode(order.id)}? Hàng sẽ được hoàn lại kho.`)) {
      return;
    }
    setUpdatingId(order.id);
    try {
      // Khách có thể vừa tự hủy đơn → kiểm tra trạng thái mới nhất trước khi cập nhật
      const latest = await orderApi.getById(order.id);
      if (latest.status !== order.status) {
        notify(`Đơn ${formatOrderCode(order.id)} vừa được cập nhật ở nơi khác, đã tải lại dữ liệu.`, 'warning');
        setDetail(null);
        load();
        return;
      }
      const updated = await orderApi.updateStatus(order.id, nextStatus);
      if (nextStatus === 'cancelled') await adjustStock(order.items, +1);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
      if (detail?.id === order.id) setDetail(updated);
      notify(`${formatOrderCode(order.id)} → ${ORDER_STATUS[nextStatus].label}`);
    } catch (err) {
      notify(getErrorMessage(err), 'danger');
    } finally {
      setUpdatingId(null);
    }
  };

  const renderStatusActions = (order) =>
    STATUS_FLOW[order.status].map((next) => (
      <Button
        key={next}
        size="sm"
        variant={next === 'cancelled' ? 'outline-danger' : 'dark'}
        disabled={updatingId === order.id}
        onClick={() => handleChangeStatus(order, next)}
        className="me-1 mb-1"
      >
        {next === 'cancelled' ? 'Hủy' : ORDER_STATUS[next].label}
      </Button>
    ));

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={load} />;

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>Đơn hàng</h1>
          <p>Xác nhận, giao hàng và theo dõi đơn của khách</p>
        </div>
      </div>

      <div className="status-filter">
        {['all', ...Object.keys(ORDER_STATUS)].map((key) => (
          <button
            key={key}
            type="button"
            className={statusFilter === key ? 'active' : ''}
            onClick={() => {
              setStatusFilter(key);
              setPage(1);
            }}
          >
            {key === 'all' ? 'Tất cả' : ORDER_STATUS[key].label}
            <span>{key === 'all' ? orders.length : orders.filter((o) => o.status === key).length}</span>
          </button>
        ))}
      </div>

      <div className="admin-card">
        <div className="admin-filters">
          <InputGroup className="filter-search">
            <InputGroup.Text>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Tìm mã đơn, tên hoặc SĐT khách hàng..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(1);
              }}
            />
          </InputGroup>
        </div>

        <Table responsive hover className="admin-table align-middle mb-0">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Ngày đặt</th>
              <th className="text-center">SL</th>
              <th className="text-end">Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Cập nhật</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-muted py-4">
                  Không có đơn hàng phù hợp.
                </td>
              </tr>
            )}
            {pageItems.map((o) => (
              <tr key={o.id}>
                <td className="fw-semibold">{formatOrderCode(o.id)}</td>
                <td>
                  <div className="fw-medium">{o.receiver.fullName}</div>
                  <small className="text-muted">{o.receiver.phone}</small>
                </td>
                <td className="small">{formatDate(o.createdAt)}</td>
                <td className="text-center">{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                <td className="text-end fw-medium">{formatCurrency(o.total)}</td>
                <td>
                  <StatusBadge status={o.status} />
                </td>
                <td>
                  {STATUS_FLOW[o.status].length ? renderStatusActions(o) : <span className="text-muted small">—</span>}
                </td>
                <td className="text-end">
                  <Button size="sm" variant="outline-dark" onClick={() => setDetail(o)} title="Chi tiết">
                    <i className="bi bi-eye"></i>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Pager page={currentPage} totalPages={totalPages} onChange={setPage} />
      </div>

      {/* ── Chi tiết đơn ── */}
      <Modal show={!!detail} onHide={() => setDetail(null)} size="lg" centered>
        {detail && (
          <>
            <Modal.Header closeButton>
              <Modal.Title as="h5">
                Đơn hàng {formatOrderCode(detail.id)} <StatusBadge status={detail.status} />
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Row className="g-3 mb-3">
                <Col md={6}>
                  <div className="info-box">
                    <h6>Người nhận</h6>
                    <div>{detail.receiver.fullName}</div>
                    <div>{detail.receiver.phone}</div>
                    {detail.receiver.email && <div>{detail.receiver.email}</div>}
                    <div>{detail.receiver.address}</div>
                    {detail.receiver.note && <div className="text-muted fst-italic">Ghi chú: {detail.receiver.note}</div>}
                  </div>
                </Col>
                <Col md={6}>
                  <div className="info-box">
                    <h6>Thanh toán</h6>
                    <div>{PAYMENT_METHODS[detail.paymentMethod]}</div>
                    <div>Đặt lúc: {formatDate(detail.createdAt)}</div>
                    {detail.updatedAt && <div>Cập nhật: {formatDate(detail.updatedAt)}</div>}
                  </div>
                </Col>
              </Row>
              <Table size="sm" className="align-middle">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Phân loại</th>
                    <th className="text-center">SL</th>
                    <th className="text-end">Đơn giá</th>
                    <th className="text-end">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items.map((i, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <img src={i.image} alt={i.name} className="table-thumb table-thumb-sm" />
                          {i.name}
                        </div>
                      </td>
                      <td className="small">
                        {i.size} / {i.color}
                      </td>
                      <td className="text-center">{i.quantity}</td>
                      <td className="text-end">{formatCurrency(i.price)}</td>
                      <td className="text-end">{formatCurrency(i.price * i.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="ms-auto" style={{ maxWidth: 320 }}>
                <div className="summary-line">
                  <span>Tạm tính</span>
                  <span>{formatCurrency(detail.subtotal)}</span>
                </div>
                <div className="summary-line">
                  <span>Vận chuyển</span>
                  <span>{detail.shippingFee ? formatCurrency(detail.shippingFee) : 'Miễn phí'}</span>
                </div>
                {detail.discountAmount > 0 && (
                  <div className="summary-line text-success">
                    <span>Giảm giá ({detail.couponCode})</span>
                    <span>-{formatCurrency(detail.discountAmount)}</span>
                  </div>
                )}
                <div className="summary-line total">
                  <span>Tổng cộng</span>
                  <span>{formatCurrency(detail.total)}</span>
                </div>
              </div>
            </Modal.Body>
            {STATUS_FLOW[detail.status].length > 0 && (
              <Modal.Footer>
                <span className="me-auto small text-muted">Chuyển trạng thái:</span>
                {renderStatusActions(detail)}
              </Modal.Footer>
            )}
          </>
        )}
      </Modal>
    </>
  );
}

export default ManageOrders;
