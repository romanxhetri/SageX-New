import React, { useState } from 'react';
import { EnhancedProduct } from '../types';
import { useShop } from '../ShopContext';

interface ProductCardProps {
  product: EnhancedProduct;
  onQuickView: (product: EnhancedProduct) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
  const { addToCart, toggleWishlist, wishlist } = useShop();
  const [isHovered, setIsHovered] = useState(false);

  const isWishlisted = wishlist.includes(product.id);
  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '20px',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 242, 255, 0.1)' : 'none',
        borderColor: isHovered ? 'rgba(0, 242, 255, 0.3)' : 'rgba(255, 255, 255, 0.05)'
      }}
    >
      {/* Image Wrapper */}
      <div style={{
        position: 'relative',
        height: '240px',
        width: '100%',
        overflow: 'hidden',
        background: '#050505'
      }}>
        <img 
          src={product.image} 
          alt={product.name} 
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease',
            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
            opacity: isHovered ? 0.8 : 1
          }}
        />

        {/* Badges */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 2
        }}>
          {discount > 0 && (
            <span style={{
              background: '#ff4444',
              color: 'white',
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: '8px',
              boxShadow: '0 4px 10px rgba(255, 68, 68, 0.3)'
            }}>
              -{discount}%
            </span>
          )}
          {product.isSecondHand && (
            <span style={{
              background: '#ff8844',
              color: 'black',
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: '8px',
              boxShadow: '0 4px 10px rgba(255, 136, 68, 0.3)'
            }}>
              USED
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            background: isWishlisted ? 'rgba(255, 68, 68, 0.2)' : 'rgba(0, 0, 0, 0.5)',
            border: '1px solid',
            borderColor: isWishlisted ? '#ff4444' : 'rgba(255, 255, 255, 0.1)',
            color: isWishlisted ? '#ff4444' : 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            backdropFilter: 'blur(10px)',
            zIndex: 2
          }}
        >
          {isWishlisted ? '❤️' : '🤍'}
        </button>

        {/* Quick Actions Overlay */}
        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          width: '100%',
          padding: '20px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
          display: 'flex',
          gap: '10px',
          transform: isHovered ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 3
        }}>
          <button 
            onClick={(e) => { e.stopPropagation(); addToCart(product); }}
            style={{
              flex: 1,
              background: '#00f2ff',
              color: 'black',
              border: 'none',
              padding: '10px',
              borderRadius: '10px',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            ADD TO CART
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onQuickView(product); }}
            style={{
              width: '40px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)'
            }}
          >
            👁️
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.7rem', color: '#00f2ff', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
              {product.brand}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#fbbf24' }}>
              <span>★</span>
              <span style={{ color: 'white', fontWeight: 600 }}>{product.rating}</span>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>({product.reviews})</span>
            </div>
          </div>
          <h3 style={{ 
            margin: 0, 
            fontSize: '1.1rem', 
            fontWeight: 700, 
            color: 'white',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {product.name}
          </h3>
        </div>

        <p style={{ 
          margin: 0, 
          fontSize: '0.85rem', 
          color: 'rgba(255, 255, 255, 0.5)',
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {product.description}
        </p>

        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#00f2ff' }}>
            NPR {product.price.toLocaleString()}
          </span>
          {product.originalPrice && (
            <span style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.3)', textDecoration: 'line-through' }}>
              {product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
