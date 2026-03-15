import React, { useState } from 'react';
import { EnhancedProduct } from '../types';
import { useShop } from '../ShopContext';

interface EditorialProductCardProps {
  product: EnhancedProduct;
  onQuickView: (product: EnhancedProduct) => void;
}

const EditorialProductCard: React.FC<EditorialProductCardProps> = ({ product, onQuickView }) => {
  const { addToCart, toggleWishlist, wishlist } = useShop();
  const [isHovered, setIsHovered] = useState(false);

  const isWishlisted = wishlist.includes(product.id);
  
  // Bento Grid size mapping
  const gridStyles: React.CSSProperties = {
    gridColumn: product.featuredSize === 'wide' ? 'span 2' : product.featuredSize === 'large' ? 'span 2' : 'span 1',
    gridRow: product.featuredSize === 'tall' ? 'span 2' : product.featuredSize === 'large' ? 'span 2' : 'span 1',
    height: '100%',
    minHeight: product.featuredSize === 'tall' || product.featuredSize === 'large' ? '600px' : '400px'
  };

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onQuickView(product)}
      style={{
        ...gridStyles,
        position: 'relative',
        borderRadius: '32px',
        overflow: 'hidden',
        background: '#0a0a0f',
        cursor: 'pointer',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        border: '1px solid rgba(255,255,255,0.05)',
        transform: isHovered ? 'scale(0.98)' : 'scale(1)'
      }}
    >
      {/* Background Image */}
      <img 
        src={product.image} 
        alt={product.name} 
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'transform 1.2s cubic-bezier(0.2, 0, 0.2, 1)',
          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          opacity: isHovered ? 0.6 : 0.8
        }}
        referrerPolicy="no-referrer"
      />

      {/* Overlay Gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: isHovered 
          ? 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.2) 100%)'
          : 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)',
        transition: 'all 0.5s ease',
        zIndex: 1
      }} />

      {/* Content */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        padding: '32px',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <span style={{ 
              fontSize: '0.7rem', 
              fontWeight: 800, 
              color: product.accentColor || '#00f2ff', 
              letterSpacing: '2px',
              textTransform: 'uppercase'
            }}>
              {product.brand}
            </span>
            <h3 style={{ 
              margin: '4px 0 0 0', 
              fontSize: product.featuredSize === 'large' ? '2.5rem' : '1.4rem', 
              fontWeight: 800,
              lineHeight: 1.1,
              fontFamily: "'Playfair Display', serif"
            }}>
              {product.name}
            </h3>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              NPR {product.price.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Revealable Description */}
        <div style={{
          maxHeight: isHovered ? '100px' : '0',
          opacity: isHovered ? 1 : 0,
          overflow: 'hidden',
          transition: 'all 0.5s ease',
          fontSize: '0.9rem',
          color: 'rgba(255,255,255,0.6)',
          lineHeight: 1.5
        }}>
          {product.description}
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginTop: '16px',
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.5s cubic-bezier(0.2, 0, 0.2, 1)'
        }}>
          <button 
            onClick={(e) => { e.stopPropagation(); addToCart(product); }}
            style={{
              flex: 1,
              background: '#fff',
              color: '#000',
              border: 'none',
              padding: '12px',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            ADD TO BAG
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: isWishlisted ? '#ff4444' : 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              cursor: 'pointer'
            }}
          >
            {isWishlisted ? '❤️' : '🤍'}
          </button>
        </div>
      </div>

      {/* Badges */}
      <div style={{
        position: 'absolute',
        top: '24px',
        left: '24px',
        zIndex: 2
      }}>
        {product.isSecondHand && (
          <span style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white',
            fontSize: '0.65rem',
            fontWeight: 800,
            padding: '4px 12px',
            borderRadius: '100px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Pre-Owned Artifact
          </span>
        )}
      </div>
    </div>
  );
};

export default EditorialProductCard;
