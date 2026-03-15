import React, { useState } from 'react';
import { EnhancedProduct } from '../types';
import { useShop } from '../ShopContext';

interface ProductDetailsProps {
  product: EnhancedProduct;
  onClose: () => void;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product, onClose }) => {
  const { addToCart, toggleWishlist, wishlist } = useShop();
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');

  const isWishlisted = wishlist.includes(product.id);
  const currentPrice = product.price + (product.variants?.find(v => v.id === selectedVariant)?.priceModifier || 0);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(15px)',
      zIndex: 2000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        height: '90vh',
        background: '#0a0a0f',
        borderRadius: '32px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 50px 100px rgba(0, 0, 0, 0.8), 0 0 50px rgba(0, 242, 255, 0.1)'
      }}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white',
            fontSize: '1.5rem',
            cursor: 'pointer',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
        >
          ✕
        </button>

        {/* Left: Image Gallery */}
        <div style={{
          width: '50%',
          height: '100%',
          background: '#050505',
          display: 'flex',
          flexDirection: 'column',
          padding: '40px',
          gap: '20px'
        }}>
          <div style={{
            flex: 1,
            borderRadius: '24px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <img 
              src={product.image} 
              alt={product.name} 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          </div>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{
                width: '80px',
                height: '80px',
                borderRadius: '12px',
                border: i === 1 ? '2px solid #00f2ff' : '1px solid rgba(255, 255, 255, 0.1)',
                overflow: 'hidden',
                cursor: 'pointer',
                opacity: i === 1 ? 1 : 0.5
              }}>
                <img src={product.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Info */}
        <div style={{
          width: '50%',
          height: '100%',
          padding: '60px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px'
        }}>
          {/* Header */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ 
                background: 'rgba(0, 242, 255, 0.1)', 
                color: '#00f2ff', 
                padding: '4px 12px', 
                borderRadius: '8px', 
                fontSize: '0.75rem', 
                fontWeight: 800 
              }}>
                {product.brand}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24' }}>
                <span>★</span>
                <span style={{ color: 'white', fontWeight: 700 }}>{product.rating}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>({product.reviews} reviews)</span>
              </div>
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, lineHeight: 1.1 }}>{product.name}</h1>
          </div>

          {/* Price & Variants */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#00f2ff' }}>
                NPR {currentPrice.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span style={{ fontSize: '1.2rem', color: 'rgba(255, 255, 255, 0.3)', textDecoration: 'line-through' }}>
                  {product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>

            {product.variants && product.variants.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>SELECT VARIANT</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {product.variants.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v.id)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '12px',
                        background: selectedVariant === v.id ? '#00f2ff' : 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid',
                        borderColor: selectedVariant === v.id ? '#00f2ff' : 'rgba(255, 255, 255, 0.1)',
                        color: selectedVariant === v.id ? 'black' : 'white',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div>
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '24px' }}>
              {['description', 'specs', 'reviews'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  style={{
                    padding: '12px 24px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === tab ? '2px solid #00f2ff' : 'none',
                    color: activeTab === tab ? 'white' : 'rgba(255,255,255,0.4)',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div style={{ minHeight: '200px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.6 }}>
              {activeTab === 'description' && (
                <div>
                  <p>{product.longDescription || product.description}</p>
                  <ul style={{ paddingLeft: '20px', marginTop: '16px' }}>
                    {product.features?.map((f, i) => <li key={i} style={{ marginBottom: '8px' }}>{f}</li>)}
                  </ul>
                </div>
              )}
              {activeTab === 'specs' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {Object.entries(product.specs || {}).map(([k, v]) => (
                    <div key={k} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#00f2ff', textTransform: 'uppercase' }}>{k}</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{v}</div>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'reviews' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {product.reviews_list?.map(r => (
                    <div key={r.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 700 }}>{r.userName} {r.isVerified && <span style={{ color: '#00cc66', fontSize: '0.7rem' }}>✓ Verified</span>}</div>
                        <div style={{ color: '#fbbf24' }}>{'★'.repeat(r.rating)}</div>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>{r.comment}</p>
                      <div style={{ marginTop: '12px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>{r.date}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '20px', marginTop: 'auto', position: 'sticky', bottom: 0, background: '#0a0a0f', padding: '20px 0' }}>
            <button 
              onClick={() => addToCart(product, selectedVariant)}
              style={{
                flex: 1,
                background: '#00f2ff',
                color: 'black',
                border: 'none',
                padding: '20px',
                borderRadius: '16px',
                fontSize: '1.1rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 10px 30px rgba(0, 242, 255, 0.2)'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              ADD TO CART
            </button>
            <button 
              onClick={() => toggleWishlist(product.id)}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: isWishlisted ? 'rgba(255, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid',
                borderColor: isWishlisted ? '#ff4444' : 'rgba(255, 255, 255, 0.1)',
                color: isWishlisted ? '#ff4444' : 'white',
                fontSize: '1.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isWishlisted ? '❤️' : '🤍'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
