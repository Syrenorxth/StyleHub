import React, { useEffect, useState } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import ProductCard from '../components/ProductCard';
import { EmptyState, ErrorBox, Loading, PageBanner } from '../components/common';
import { useWishlist } from '../context/WishlistContext';
import { getErrorMessage, productApi } from '../services/api';

function Wishlist() {
  const { ids } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Chỉ tải lại từ server một lần; khi bỏ thích thì lọc trên client
  useEffect(() => {
    productApi
      .getAll({ _expand: 'category' })
      .then(setProducts)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const liked = products.filter((p) => ids.includes(p.id));

  return (
    <>
      <PageBanner title="Sản phẩm yêu thích" crumbs={[{ label: 'Yêu thích' }]} />
      <Container className="py-4 py-lg-5">
        {loading && <Loading />}
        {error && <ErrorBox message={error} />}
        {!loading && !error && liked.length === 0 && (
          <EmptyState
            icon="bi-heart"
            title="Chưa có sản phẩm yêu thích"
            description="Nhấn biểu tượng trái tim trên sản phẩm để lưu lại và xem sau."
            actionText="Khám phá cửa hàng"
            actionTo="/shop"
          />
        )}
        <Row xs={2} md={3} lg={4} className="g-3 g-md-4">
          {liked.map((p) => (
            <Col key={p.id}>
              <ProductCard product={p} />
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
}

export default Wishlist;
