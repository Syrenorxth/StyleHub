import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { Loading } from '../components/common';
import { orderApi } from '../services/api';
import { PAYMENT_METHODS } from '../utils/constants';
import { formatCurrency, formatOrderCode } from '../utils/helpers';

function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    orderApi.getById(id).then(setOrder).catch(() => setOrder(false));
  }, [id]);

  if (order === null) return <Loading />;

  return (
    <Container className="py-5">
      <div className="success-card">
        <div className="success-icon">
          <i className="bi bi-check-lg"></i>
        </div>
        <h2>Đặt hàng thành công!</h2>
        <p className="text-muted">
          Cảm ơn bạn đã mua sắm tại StyleHub. Chúng tôi sẽ liên hệ xác nhận đơn hàng trong thời gian sớm nhất.
        </p>

        {order && (
          <div className="success-summary">
            <div>
              <span>Mã đơn hàng</span>
              <strong>{formatOrderCode(order.id)}</strong>
            </div>
            <div>
              <span>Tổng thanh toán</span>
              <strong>{formatCurrency(order.total)}</strong>
            </div>
            <div>
              <span>Thanh toán</span>
              <strong>{PAYMENT_METHODS[order.paymentMethod]}</strong>
            </div>
            <div>
              <span>Giao tới</span>
              <strong>{order.receiver.address}</strong>
            </div>
          </div>
        )}

        <div className="d-flex flex-wrap justify-content-center gap-2 mt-4">
          <Link to="/my-orders" className="btn btn-sh">
            Xem đơn hàng của tôi
          </Link>
          <Link to="/shop" className="btn btn-sh-outline">
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </Container>
  );
}

export default OrderSuccess;
