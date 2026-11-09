/**
 * pages/NotFound.jsx — Trang 404 khi người dùng vào đường dẫn không tồn tại; có nút quay về trang chủ.
 */
import React from 'react';
import { Container } from 'react-bootstrap';
import { EmptyState } from '../components/common';

function NotFound() {
  return (
    <Container className="py-5">
      <div className="not-found-code">404</div>
      <EmptyState
        icon="bi-signpost-split"
        title="Không tìm thấy trang"
        description="Trang bạn tìm có thể đã bị xóa hoặc đường dẫn không chính xác."
        actionText="Về trang chủ"
        actionTo="/"
      />
    </Container>
  );
}

export default NotFound;
