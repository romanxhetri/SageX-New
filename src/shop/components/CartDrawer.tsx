import React from 'react';
import { useShop } from '../ShopContext';

interface CartDrawerProps {
  onClose: () => void;
  onCheckout: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ onClose, onCheckout }) => {
  const { cart, removeFromCart, updateCartQuantity } = useShop();

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = subtotal > 50000 ? 0 : 1500;
  const total = subtotal + shipping;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(5px)',
      zIndex: 3000,
      display: 'flex',
      justifyContent: 'flex-end'
    }} onClick={onClose}>
      <div 
        style={{
          width: '100%',
          maxWidth: '450px',
          height: '100%',
          background: '#0a0a0f',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.3s ease-out'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '32px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>MY CART</h2>
          <button 
            onClick={onClose}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'white', 
              fontSize: '1.5rem', 
              cursor: 'pointer' 
            }}
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '100px', color: 'rgba(255,255,255,0.4)' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🛒</div>
              <h3>Your cart is empty</h3>
              <p>Looks like you haven't added any galactic treasures yet.</p>
              <button 
                onClick={onClose}
                style={{
                  marginTop: '20px',
                  background: '#00f2ff',
                  color: 'black',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                START SHOPPING
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div key={`${item.id}-${item.selectedVariantId}`} style={{ display: 'flex', gap: '16px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', background: '#050505', flexShrink: 0 }}>
                  <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>{item.name}</h4>
                    <button 
                      onClick={() => removeFromCart(item.id, item.selectedVariantId)}
                      style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>
                  {item.selectedVariantId && (
                    <div style={{ fontSize: '0.75rem', color: '#00f2ff' }}>
                      {item.variants?.find(v => v.id === item.selectedVariantId)?.name}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px 8px' }}>
                      <button 
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1, item.selectedVariantId)}
                        style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
                      >
                        -
                      </button>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{item.quantity}</span>
                      <button 
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1, item.selectedVariantId)}
                        style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
                      >
                        +
                      </button>
                    </div>
                    <div style={{ fontWeight: 800, color: '#00f2ff' }}>
                      NPR {(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div style={{ padding: '32px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.6)' }}>
                <span>Subtotal</span>
                <span>NPR {subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.6)' }}>
                <span>Shipping</span>
                <span>{shipping === 0 ? 'FREE' : `NPR ${shipping.toLocaleString()}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, color: 'white', marginTop: '8px' }}>
                <span>Total</span>
                <span style={{ color: '#00f2ff' }}>NPR {total.toLocaleString()}</span>
              </div>
            </div>
            <button 
              onClick={onCheckout}
              style={{
                width: '100%',
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
              PROCEED TO CHECKOUT
            </button>
          </div>
        )}
      </div>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default CartDrawer;
