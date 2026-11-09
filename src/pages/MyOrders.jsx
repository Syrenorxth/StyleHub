/**
 * pages/MyOrders.jsx — Trang "Đơn hàng của tôi" (khách hàng).
 *   - TABS: lọc đơn theo trạng thái (Tất cả, Chờ xác nhận, Đã xác nhận, Đang giao, Đã giao, Đã hủy).
 * Hàm:
 *   - loadOrders()   : lấy các đơn của user đang đăng nhập (mới nhất trước).
 *   - countOf(key)   : đếm số đơn của mỗi tab.
 *   - handleCancel() : hủy đơn — kiểm tra lại trên server đơn vẫn đang "pending" thì mới cho hủy,
 *                      đổi trạng thái sang "cancelled" và hoàn lại tồn kho (adjustStock +1).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { ConfirmModal, EmptyState, ErrorBox, Loading, PageBanner, StatusBadge } from '../components/common';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { adjustStock, getErrorMessage, orderApi } from '../services/api';
import { ORDER_STATUS, PAYMENT_METHODS } from '../utils/constants';
import { formatCurrency, formatDate, formatOrderCode } from '../utils/helpers';

const TABS = [{ key: 'all', label: 'Tất cả' }, ...Object.entries(ORDER_STATUS).map(([key, v]) => ({ key, label: v.label }))];

function MyOrders() {
  const { user } = useAuth();
  const notify = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setOrders(await orderApi.getAll({ userId: user.id }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      // Kiểm tra lại trạng thái mới nhất: admin có thể đã xác nhận đơn
      const latest = await orderApi.getById(cancelTarget.id);
      if (latest.status !== 'pending') {
        notify('Đơn hàng đã được cửa hàng xử lý, không thể hủy nữa.', 'warning');
      } else {
        await orderApi.updateStatus(cancelTarget.id, 'cancelled');
        await adjustStock(cancelTarget.items, +1);
        notify(`Đã hủy đơn ${formatOrderCode(cancelTarget.id)}`);
      }
      setCancelTarget(null);
      loadOrders();
    } catch (err) {
      notify(getErrorMessage(err), 'danger');
    } finally {
      setCancelling(false);
    }
  };

  const visible = tab === 'all' ? orders : orders.filter((o) => o.status === tab);
  const countOf = (key) => (key === 'all' ? orders.length : orders.filter((o) => o.status === key).length);

  return (
    <>
      <PageBanner title="Đơn hàng của tôi" crumbs={[{ label: 'Đơn hàng của tôi' }]} />
      <Container className="py-4 py-lg-5">
        <div className="order-tabs">
          {TABS.map((t) => (
            <button key={t.key} type="button" className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
              {t.label} <span>{countOf(t.key)}</span>
            </button>
          ))}
        </div>

        {loading && <Loading />}
        {error && <ErrorBox message={error} onRetry={loadOrders} />}

        {!loading && !error && visible.length === 0 && (
          <EmptyState
            icon="bi-receipt"
            title="Chưa có đơn hàng nào"
            description={tab === 'all' ? 'Hãy chọn cho mình vài món đồ ưng ý nhé!' : 'Không có đơn hàng ở trạng thái này.'}
            actionText="Mua sắm ngay"
            actionTo="/shop"
          />
        )}

        {!loading &&
          visible.map((order) => (
            <article key={order.id} className="order-card">
              <header>
                <div>
                  <strong>{formatOrderCode(order.id)}</strong>
                  <span className="text-muted ms-2 small">{formatDate(order.createdAt)}</span>
                </div>
                <StatusBadge status={order.status} />
              </header>

              <div className="order-items">
                {order.items.map((item, idx) => (
                  <div className="order-item" key={idx}>
                    <Link to={`/products/${item.productId}`}>
                      <img src={item.image} alt={item.name} />
                    </Link>
                    <div className="flex-grow-1">
                      <Link to={`/products/${item.productId}`} className="fw-medium text-reset text-decoration-none">
                        {item.name}
                      </Link>
                      <div className="small text-muted">
                        Size {item.size} · {item.color} · x{item.quantity}
                      </div>
                    </div>
                    <div>{formatCurrency(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>

              <footer>
                <div className="small text-muted">
                  <div>
                    <i className="bi bi-geo-alt me-1"></i>
                    {order.receiver.fullName} · {order.receiver.phone} · {order.receiver.address}
                  </div>
                  <div>
                    <i className="bi bi-wallet2 me-1"></i>
                    {PAYMENT_METHODS[order.paymentMethod]}
                    {order.couponCode && ` · Mã ${order.couponCode} (-${formatCurrency(order.discountAmount)})`}
                  </div>
                </div>
                <div className="text-end">
                  <div className="small text-muted">Thành tiền</div>
                  <div className="order-total">{formatCurrency(order.total)}</div>
                  {order.status === 'pending' && (
                    <button type="button" className="btn btn-outline-danger btn-sm mt-2" onClick={() => setCancelTarget(order)}>
                      Hủy đơn hàng
                    </button>
                  )}
                </div>
              </footer>
            </article>
          ))}
      </Container>

      <ConfirmModal
        show={!!cancelTarget}
        title="Hủy đơn hàng"
        body={
          cancelTarget && (
            <>
              Bạn chắc chắn muốn hủy đơn <strong>{formatOrderCode(cancelTarget.id)}</strong> trị giá{' '}
              <strong>{formatCurrency(cancelTarget.total)}</strong>?
            </>
          )
        }
        confirmText="Hủy đơn"
        loading={cancelling}
        onConfirm={handleCancel}
        onHide={() => setCancelTarget(null)}
      />
    </>
  );
}

export default MyOrders;
