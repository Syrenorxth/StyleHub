/**
 * pages/Profile.jsx — Trang tài khoản cá nhân.
 *   - Thẻ thông tin (avatar chữ cái đầu, vai trò) + 2 form.
 * Hàm:
 *   - onInfo / onPwd     : cập nhật giá trị 2 form khi gõ.
 *   - handleInfoSubmit(e): kiểm tra họ tên, email, SĐT rồi gọi updateProfile.
 *   - handlePwdSubmit(e) : kiểm tra mật khẩu mới (≥ 6 ký tự, khác mật khẩu cũ, nhập lại khớp) rồi gọi changePassword.
 */
import React, { useState } from 'react';
import { Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { PageBanner } from '../components/common';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { EMAIL_REGEX, formatDate, PHONE_REGEX } from '../utils/helpers';

function Profile() {
  const { user, updateProfile, changePassword } = useAuth();
  const notify = useToast();

  const [info, setInfo] = useState({
    fullName: user.fullName || '',
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || '',
  });
  const [infoErrors, setInfoErrors] = useState({});
  const [savingInfo, setSavingInfo] = useState(false);

  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [pwdErrors, setPwdErrors] = useState({});
  const [savingPwd, setSavingPwd] = useState(false);

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (info.fullName.trim().length < 2) errs.fullName = 'Họ tên phải có ít nhất 2 ký tự.';
    if (!EMAIL_REGEX.test(info.email.trim())) errs.email = 'Email không hợp lệ.';
    if (!PHONE_REGEX.test(info.phone.trim())) errs.phone = 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0.';
    setInfoErrors(errs);
    if (Object.keys(errs).length) return;

    setSavingInfo(true);
    try {
      await updateProfile({
        fullName: info.fullName.trim(),
        email: info.email.trim(),
        phone: info.phone.trim(),
        address: info.address.trim(),
      });
      notify('Đã cập nhật thông tin tài khoản');
    } catch (err) {
      notify(getErrorMessage(err), 'danger');
    } finally {
      setSavingInfo(false);
    }
  };

  const handlePwdSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwd.current) errs.current = 'Vui lòng nhập mật khẩu hiện tại.';
    if (pwd.next.length < 6) errs.next = 'Mật khẩu mới phải có ít nhất 6 ký tự.';
    else if (pwd.next === pwd.current) errs.next = 'Mật khẩu mới phải khác mật khẩu hiện tại.';
    if (pwd.confirm !== pwd.next) errs.confirm = 'Mật khẩu nhập lại không khớp.';
    setPwdErrors(errs);
    if (Object.keys(errs).length) return;

    setSavingPwd(true);
    try {
      await changePassword(pwd.current, pwd.next);
      setPwd({ current: '', next: '', confirm: '' });
      notify('Đổi mật khẩu thành công');
    } catch (err) {
      if (err.response || err.request) notify(getErrorMessage(err), 'danger');
      else setPwdErrors({ current: err.message });
    } finally {
      setSavingPwd(false);
    }
  };

  const onInfo = (e) => {
    setInfo((p) => ({ ...p, [e.target.name]: e.target.value }));
    setInfoErrors((p) => ({ ...p, [e.target.name]: '' }));
  };
  const onPwd = (e) => {
    setPwd((p) => ({ ...p, [e.target.name]: e.target.value }));
    setPwdErrors((p) => ({ ...p, [e.target.name]: '' }));
  };

  return (
    <>
      <PageBanner title="Tài khoản của tôi" crumbs={[{ label: 'Tài khoản' }]} />
      <Container className="py-4 py-lg-5">
        <Row className="g-4">
          <Col lg={4}>
            <div className="panel profile-card">
              <div className="profile-avatar">{user.fullName.charAt(0)}</div>
              <h5 className="mb-0">{user.fullName}</h5>
              <div className="text-muted">@{user.username}</div>
              <span className={`role-chip ${user.role}`}>{user.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}</span>
              {user.createdAt && <small className="text-muted d-block mt-3">Thành viên từ {formatDate(user.createdAt, false)}</small>}
            </div>
          </Col>

          <Col lg={8}>
            <div className="panel">
              <h5 className="panel-title">Thông tin cá nhân</h5>
              <Form noValidate onSubmit={handleInfoSubmit}>
                <Row className="g-3">
                  <Col sm={6}>
                    <Form.Group controlId="p-fullName">
                      <Form.Label>Họ và tên</Form.Label>
                      <Form.Control name="fullName" value={info.fullName} onChange={onInfo} isInvalid={!!infoErrors.fullName} />
                      <Form.Control.Feedback type="invalid">{infoErrors.fullName}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group controlId="p-phone">
                      <Form.Label>Số điện thoại</Form.Label>
                      <Form.Control name="phone" value={info.phone} onChange={onInfo} isInvalid={!!infoErrors.phone} />
                      <Form.Control.Feedback type="invalid">{infoErrors.phone}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col xs={12}>
                    <Form.Group controlId="p-email">
                      <Form.Label>Email</Form.Label>
                      <Form.Control type="email" name="email" value={info.email} onChange={onInfo} isInvalid={!!infoErrors.email} />
                      <Form.Control.Feedback type="invalid">{infoErrors.email}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col xs={12}>
                    <Form.Group controlId="p-address">
                      <Form.Label>Địa chỉ mặc định</Form.Label>
                      <Form.Control as="textarea" rows={2} name="address" value={info.address} onChange={onInfo} />
                    </Form.Group>
                  </Col>
                </Row>
                <button type="submit" className="btn btn-sh mt-3" disabled={savingInfo}>
                  {savingInfo && <Spinner size="sm" className="me-2" />}Lưu thay đổi
                </button>
              </Form>
            </div>

            <div className="panel mt-4">
              <h5 className="panel-title">Đổi mật khẩu</h5>
              <Form noValidate onSubmit={handlePwdSubmit}>
                <Row className="g-3">
                  {[
                    ['current', 'Mật khẩu hiện tại', 'current-password'],
                    ['next', 'Mật khẩu mới', 'new-password'],
                    ['confirm', 'Nhập lại mật khẩu mới', 'new-password'],
                  ].map(([name, label, auto]) => (
                    <Col md={4} key={name}>
                      <Form.Group controlId={`pwd-${name}`}>
                        <Form.Label>{label}</Form.Label>
                        <Form.Control
                          type="password"
                          name={name}
                          value={pwd[name]}
                          onChange={onPwd}
                          isInvalid={!!pwdErrors[name]}
                          autoComplete={auto}
                        />
                        <Form.Control.Feedback type="invalid">{pwdErrors[name]}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  ))}
                </Row>
                <button type="submit" className="btn btn-sh-outline mt-3" disabled={savingPwd}>
                  {savingPwd && <Spinner size="sm" className="me-2" />}Đổi mật khẩu
                </button>
              </Form>
            </div>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default Profile;
