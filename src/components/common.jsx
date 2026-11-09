/**
 * components/common.jsx — Các component nhỏ dùng lại ở nhiều trang.
 *   - Loading       : vòng xoay + chữ "Đang tải...".
 *   - ErrorBox      : hộp báo lỗi kèm nút "Thử lại" (onRetry).
 *   - EmptyState    : giao diện khi danh sách rỗng (icon, tiêu đề, mô tả, nút hành động).
 *   - PageBanner    : tiêu đề trang + breadcrumb (đường dẫn Trang chủ > ...).
 *   - StatusBadge   : nhãn màu trạng thái đơn hàng (lấy từ ORDER_STATUS).
 *   - QuantityInput : ô chọn số lượng có nút -/+ , giới hạn min/max (tồn kho).
 *   - Pager         : phân trang.
 *   - ConfirmModal  : hộp thoại xác nhận (xóa, hủy đơn, khóa tài khoản...).
 */
// Các component nhỏ dùng lại ở nhiều trang
import React from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Modal, Pagination, Spinner } from 'react-bootstrap';
import { ORDER_STATUS } from '../utils/constants';

export function Loading({ text = 'Đang tải dữ liệu...' }) {
  return (
    <div className="loading-box">
      <Spinner animation="border" size="sm" />
      <span>{text}</span>
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="error-box">
      <i className="bi bi-wifi-off"></i>
      <p className="mb-2">{message}</p>
      {onRetry && (
        <Button size="sm" variant="outline-dark" onClick={onRetry}>
          <i className="bi bi-arrow-clockwise me-1"></i>Thử lại
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ icon = 'bi-inbox', title, description, actionText, actionTo }) {
  return (
    <div className="empty-state">
      <i className={`bi ${icon}`}></i>
      <h5>{title}</h5>
      {description && <p>{description}</p>}
      {actionText && (
        <Link to={actionTo} className="btn btn-sh">
          {actionText}
        </Link>
      )}
    </div>
  );
}

export function PageBanner({ title, subtitle, crumbs = [] }) {
  return (
    <section className="page-banner">
      <div className="container">
        <nav className="crumbs" aria-label="breadcrumb">
          <Link to="/">Trang chủ</Link>
          {crumbs.map((c) => (
            <React.Fragment key={c.label}>
              <i className="bi bi-chevron-right"></i>
              {c.to ? <Link to={c.to}>{c.label}</Link> : <span>{c.label}</span>}
            </React.Fragment>
          ))}
        </nav>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </section>
  );
}

export function StatusBadge({ status }) {
  const info = ORDER_STATUS[status] || { label: status, bg: 'light' };
  return (
    <Badge bg={info.bg} className="status-badge" text={info.bg === 'warning' || info.bg === 'info' ? 'dark' : undefined}>
      {info.label}
    </Badge>
  );
}

export function QuantityInput({ value, onChange, max, min = 1, size }) {
  return (
    <div className={`qty-input ${size === 'sm' ? 'qty-sm' : ''}`}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Giảm">
        <i className="bi bi-dash"></i>
      </button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!Number.isNaN(n)) onChange(Math.max(min, Math.min(n, max)));
        }}
        aria-label="Số lượng"
      />
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Tăng">
        <i className="bi bi-plus"></i>
      </button>
    </div>
  );
}

export function Pager({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <Pagination className="sh-pagination justify-content-center mt-4 mb-0">
      <Pagination.Prev disabled={page === 1} onClick={() => onChange(page - 1)} />
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <Pagination.Item key={p} active={p === page} onClick={() => onChange(p)}>
          {p}
        </Pagination.Item>
      ))}
      <Pagination.Next disabled={page === totalPages} onClick={() => onChange(page + 1)} />
    </Pagination>
  );
}

export function ConfirmModal({ show, title, body, confirmText = 'Xác nhận', variant = 'danger', loading, onConfirm, onHide }) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title as="h5">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{body}</Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={onHide} disabled={loading}>
          Hủy bỏ
        </Button>
        <Button variant={variant} onClick={onConfirm} disabled={loading}>
          {loading && <Spinner size="sm" className="me-2" />}
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
