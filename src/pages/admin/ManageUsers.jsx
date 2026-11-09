/**
 * pages/admin/ManageUsers.jsx — Quản lý tài khoản khách hàng.
 * Hàm:
 *   - load()               : lấy danh sách user và đơn hàng.
 *   - rows (useMemo)       : ghép mỗi tài khoản với số đơn và tổng chi tiêu (đơn đã giao);
 *                            tìm theo họ tên / username / email / SĐT.
 *   - handleToggleStatus() : khóa / mở khóa tài khoản (status active ↔ blocked) sau khi xác nhận.
 *                            Tài khoản bị khóa sẽ không đăng nhập được.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Form, InputGroup, Table } from 'react-bootstrap';
import { ConfirmModal, ErrorBox, Loading } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage, orderApi, userApi } from '../../services/api';
import { formatCurrency, formatDate, normalizeText } from '../../utils/helpers';

function ManageUsers() {
  const { user: currentUser } = useAuth();
  const notify = useToast();
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [target, setTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const [userData, orderData] = await Promise.all([userApi.getAll(), orderApi.getAll()]);
      setUsers(userData);
      setOrders(orderData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const kw = normalizeText(keyword);
    return users
      .filter((u) => !kw || normalizeText(`${u.fullName} ${u.username} ${u.email} ${u.phone}`).includes(kw))
      .map((u) => {
        const own = orders.filter((o) => o.userId === u.id);
        return {
          ...u,
          orderCount: own.length,
          spent: own.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.total, 0),
        };
      });
  }, [users, orders, keyword]);

  const handleToggleStatus = async () => {
    const nextStatus = target.status === 'blocked' ? 'active' : 'blocked';
    setSaving(true);
    try {
      await userApi.patch(target.id, { status: nextStatus });
      setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, status: nextStatus } : u)));
      notify(`${nextStatus === 'blocked' ? 'Đã khóa' : 'Đã mở khóa'} tài khoản @${target.username}`);
      setTarget(null);
    } catch (err) {
      notify(getErrorMessage(err), 'danger');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={load} />;

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>Khách hàng</h1>
          <p>{users.filter((u) => u.role === 'customer').length} tài khoản khách hàng</p>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-filters">
          <InputGroup className="filter-search">
            <InputGroup.Text>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control placeholder="Tìm theo tên, username, email, SĐT..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </InputGroup>
        </div>

        <Table responsive hover className="admin-table align-middle mb-0">
          <thead>
            <tr>
              <th>Tài khoản</th>
              <th>Liên hệ</th>
              <th>Vai trò</th>
              <th className="text-center">Đơn hàng</th>
              <th className="text-end">Đã chi tiêu</th>
              <th>Ngày tạo</th>
              <th>Trạng thái</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <div className="admin-avatar admin-avatar-sm">{u.fullName.charAt(0)}</div>
                    <div>
                      <div className="fw-medium">{u.fullName}</div>
                      <small className="text-muted">@{u.username}</small>
                    </div>
                  </div>
                </td>
                <td className="small">
                  <div>{u.email}</div>
                  <div className="text-muted">{u.phone}</div>
                </td>
                <td>
                  <Badge bg={u.role === 'admin' ? 'dark' : 'light'} text={u.role === 'admin' ? undefined : 'dark'}>
                    {u.role === 'admin' ? 'Quản trị' : 'Khách hàng'}
                  </Badge>
                </td>
                <td className="text-center">{u.orderCount}</td>
                <td className="text-end">{formatCurrency(u.spent)}</td>
                <td className="small">{u.createdAt ? formatDate(u.createdAt, false) : '—'}</td>
                <td>
                  {u.status === 'blocked' ? <Badge bg="danger">Đã khóa</Badge> : <Badge bg="success">Hoạt động</Badge>}
                </td>
                <td className="text-end">
                  {u.role !== 'admin' && u.id !== currentUser.id && (
                    <Button
                      size="sm"
                      variant={u.status === 'blocked' ? 'outline-success' : 'outline-danger'}
                      onClick={() => setTarget(u)}
                    >
                      {u.status === 'blocked' ? 'Mở khóa' : 'Khóa'}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <ConfirmModal
        show={!!target}
        title={target?.status === 'blocked' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
        body={
          target &&
          (target.status === 'blocked' ? (
            <>Cho phép <strong>@{target.username}</strong> đăng nhập và mua hàng trở lại?</>
          ) : (
            <>Tài khoản <strong>@{target.username}</strong> sẽ không thể đăng nhập cho tới khi được mở khóa.</>
          ))
        }
        variant={target?.status === 'blocked' ? 'success' : 'danger'}
        confirmText={target?.status === 'blocked' ? 'Mở khóa' : 'Khóa'}
        loading={saving}
        onConfirm={handleToggleStatus}
        onHide={() => setTarget(null)}
      />
    </>
  );
}

export default ManageUsers;
