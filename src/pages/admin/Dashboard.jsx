import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Col, ProgressBar, Row, Table } from 'react-bootstrap';
import { ErrorBox, Loading, StatusBadge } from '../../components/common';
import { getErrorMessage, orderApi, productApi, userApi } from '../../services/api';
import { LOW_STOCK_LIMIT, ORDER_STATUS } from '../../utils/constants';
import { formatCurrency, formatDate, formatOrderCode } from '../../utils/helpers';

function StatCard({ icon, label, value, hint, tone }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="stat-icon">
        <i className={`bi ${icon}`}></i>
      </div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {hint && <div className="stat-hint">{hint}</div>}
      </div>
    </div>
  );
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [products, orders, users] = await Promise.all([
        productApi.getAll(),
        orderApi.getAll(),
        userApi.getAll({ role: 'customer' }),
      ]);
      setData({ products, orders, users });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!data) return <Loading />;

  const { products, orders, users } = data;
  const delivered = orders.filter((o) => o.status === 'delivered');
  const revenue = delivered.reduce((s, o) => s + o.total, 0);
  const pending = orders.filter((o) => o.status === 'pending').length;
  const lowStock = products.filter((p) => p.stock <= LOW_STOCK_LIMIT).sort((a, b) => a.stock - b.stock);
  const bestSellers = [...products].sort((a, b) => b.sold - a.sold).slice(0, 5);
  const maxSold = bestSellers[0]?.sold || 1;

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>Tổng quan</h1>
          <p>Tình hình kinh doanh của cửa hàng StyleHub</p>
        </div>
      </div>

      <Row xs={1} sm={2} xl={4} className="g-3 mb-4">
        <Col>
          <StatCard icon="bi-cash-stack" tone="green" label="Doanh thu" value={formatCurrency(revenue)} hint={`${delivered.length} đơn đã giao`} />
        </Col>
        <Col>
          <StatCard icon="bi-receipt" tone="blue" label="Đơn hàng" value={orders.length} hint={`${pending} đơn chờ xác nhận`} />
        </Col>
        <Col>
          <StatCard icon="bi-bag" tone="amber" label="Sản phẩm" value={products.length} hint={`${lowStock.length} sản phẩm sắp hết`} />
        </Col>
        <Col>
          <StatCard icon="bi-people" tone="rose" label="Khách hàng" value={users.length} hint={`${users.filter((u) => u.status === 'blocked').length} tài khoản bị khóa`} />
        </Col>
      </Row>

      <Row className="g-3">
        <Col xl={8}>
          <div className="admin-card">
            <div className="admin-card-head">
              <h5>Đơn hàng gần đây</h5>
              <Link to="/admin/orders">Xem tất cả</Link>
            </div>
            <Table responsive hover className="admin-table mb-0">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Ngày đặt</th>
                  <th className="text-end">Tổng tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 6).map((o) => (
                  <tr key={o.id}>
                    <td className="fw-semibold">{formatOrderCode(o.id)}</td>
                    <td>{o.receiver.fullName}</td>
                    <td>{formatDate(o.createdAt)}</td>
                    <td className="text-end">{formatCurrency(o.total)}</td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Col>

        <Col xl={4}>
          <div className="admin-card h-100">
            <div className="admin-card-head">
              <h5>Đơn hàng theo trạng thái</h5>
            </div>
            {Object.entries(ORDER_STATUS).map(([key, info]) => {
              const count = orders.filter((o) => o.status === key).length;
              return (
                <div key={key} className="mb-3">
                  <div className="d-flex justify-content-between small mb-1">
                    <span>
                      <i className={`bi ${info.icon} me-1`}></i>
                      {info.label}
                    </span>
                    <strong>{count}</strong>
                  </div>
                  <ProgressBar now={orders.length ? (count / orders.length) * 100 : 0} variant={info.bg} style={{ height: 6 }} />
                </div>
              );
            })}
          </div>
        </Col>

        <Col lg={6}>
          <div className="admin-card">
            <div className="admin-card-head">
              <h5>Sản phẩm bán chạy</h5>
            </div>
            {bestSellers.map((p, idx) => (
              <div key={p.id} className="rank-row">
                <span className="rank-num">{idx + 1}</span>
                <img src={p.image} alt={p.name} />
                <div className="flex-grow-1">
                  <div className="fw-medium">{p.name}</div>
                  <ProgressBar now={(p.sold / maxSold) * 100} variant="dark" style={{ height: 4 }} className="mt-1" />
                </div>
                <span className="text-muted small">{p.sold} đã bán</span>
              </div>
            ))}
          </div>
        </Col>

        <Col lg={6}>
          <div className="admin-card">
            <div className="admin-card-head">
              <h5>Sắp hết hàng (≤ {LOW_STOCK_LIMIT})</h5>
              <Link to="/admin/products">Nhập thêm</Link>
            </div>
            {lowStock.length === 0 ? (
              <p className="text-muted mb-0">Tất cả sản phẩm đều còn đủ hàng.</p>
            ) : (
              lowStock.map((p) => (
                <div key={p.id} className="rank-row">
                  <img src={p.image} alt={p.name} />
                  <div className="flex-grow-1 fw-medium">{p.name}</div>
                  <span className={`stock-pill ${p.stock === 0 ? 'out' : 'low'}`}>Còn {p.stock}</span>
                </div>
              ))
            )}
          </div>
        </Col>
      </Row>
    </>
  );
}

export default Dashboard;
