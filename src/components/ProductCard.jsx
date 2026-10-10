import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, getSalePrice } from '../utils/helpers';
import { COLOR_SWATCHES } from '../utils/constants';

export const FALLBACK_IMAGE = 'https://placehold.co/600x750/f1ede7/8a8178?text=StyleHub';

function ProductCard({ product }) {
  const wishlist = useWishlist();
  const notify = useToast();
  const liked = wishlist.has(product.id);
  const salePrice = getSalePrice(product);
  const soldOut = product.stock <= 0;

  const handleToggleWishlist = (e) => {
    e.preventDefault(); // không điều hướng sang trang chi tiết
    wishlist.toggle(product.id);
    notify(liked ? 'Đã bỏ khỏi danh sách yêu thích' : 'Đã thêm vào danh sách yêu thích', 'info');
  };

  return (
    <Link to={`/products/${product.id}`} className="product-card">
      <div className="product-thumb">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMAGE;
          }}
        />
        <div className="product-tags">
          {product.isNew && <span className="tag tag-new">Mới</span>}
          {product.discount > 0 && <span className="tag tag-sale">-{product.discount}%</span>}
          {soldOut && <span className="tag tag-out">Hết hàng</span>}
        </div>
        <button
          type="button"
          className={`wish-btn ${liked ? 'liked' : ''}`}
          onClick={handleToggleWishlist}
          aria-label={liked ? 'Bỏ yêu thích' : 'Yêu thích'}
        >
          <i className={`bi ${liked ? 'bi-heart-fill' : 'bi-heart'}`}></i>
        </button>
      </div>

      <div className="product-info">
        <div className="product-meta">
          <span>{product.category?.name || product.gender}</span>
          <span className="swatches">
            {product.colors.slice(0, 4).map((c) => (
              <span key={c} className="swatch-dot" style={{ background: COLOR_SWATCHES[c] || '#ccc' }} title={c} />
            ))}
          </span>
        </div>
        <h3 className="product-name">{product.name}</h3>
        <div className="product-price">
          <span className={product.discount > 0 ? 'price-sale' : ''}>{formatCurrency(salePrice)}</span>
          {product.discount > 0 && <del>{formatCurrency(product.price)}</del>}
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;
