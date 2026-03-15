import React, { useState } from 'react';
import { useShop } from '../ShopContext';

interface CheckoutModalProps {
  onClose: () => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ onClose }) => {
  const { cart, clearCart, user } = useShop();
  const [step, setStep] = useState<'shipping' | 'payment' | 'success'>('shipping');
  const [address, setAddress] = useState({ name: '', street: '', city: '', planet: 'Earth' });

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal + (subtotal > 50000 ? 0 : 1500);

  const handlePlaceOrder = () => {
    setStep('success');
    // In a real app, we'd send this to the server
    setTimeout(() => {
      clearCart();
    }, 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(20px)',
      zIndex: 4000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '600px',
        background: '#0a0a0f',
        borderRadius: '32px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '40px',
        position: 'relative',
        boxShadow: '0 50px 100px rgba(0, 0, 0, 0.8)'
      }}>
        {step !== 'success' && (
          <button 
            onClick={onClose}
            style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        )}

        {step === 'shipping' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>SHIPPING DETAILS</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', margin: '8px 0 0 0' }}>Where should we send your galactic cargo?</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input 
                type="text" 
                placeholder="Full Name" 
                value={address.name}
                onChange={e => setAddress({...address, name: e.target.value})}
                style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', outline: 'none' }}
              />
              <input 
                type="text" 
                placeholder="Street Address" 
                value={address.street}
                onChange={e => setAddress({...address, street: e.target.value})}
                style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: '16px' }}>
                <input 
                  type="text" 
                  placeholder="City" 
                  value={address.city}
                  onChange={e => setAddress({...address, city: e.target.value})}
                  style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', outline: 'none' }}
                />
                <select 
                  value={address.planet}
                  onChange={e => setAddress({...address, planet: e.target.value})}
                  style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', outline: 'none' }}
                >
                  <option value="Earth">Earth</option>
                  <option value="Mars">Mars</option>
                  <option value="Europa">Europa</option>
                  <option value="Titan">Titan</option>
                </select>
              </div>
            </div>

            <button 
              onClick={() => setStep('payment')}
              disabled={!address.name || !address.street}
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
                opacity: (!address.name || !address.street) ? 0.5 : 1
              }}
            >
              CONTINUE TO PAYMENT
            </button>
          </div>
        )}

        {step === 'payment' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>PAYMENT METHOD</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', margin: '8px 0 0 0' }}>Secure transaction via SageX Neural Link.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ 
                padding: '24px', 
                background: 'rgba(0, 242, 255, 0.1)', 
                border: '2px solid #00f2ff', 
                borderRadius: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>SageX Wallet</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Balance: NPR {user?.balance.toLocaleString() || '0'}</div>
                </div>
                <div style={{ fontSize: '1.5rem' }}>⚡</div>
              </div>
              
              <div style={{ 
                padding: '24px', 
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                borderRadius: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                opacity: 0.5,
                cursor: 'not-allowed'
              }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Galactic Credit Card</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Coming Soon</div>
                </div>
                <div style={{ fontSize: '1.5rem' }}>💳</div>
              </div>
            </div>

            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Order Total</span>
                <span style={{ fontWeight: 800, color: '#00f2ff' }}>NPR {total.toLocaleString()}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>By clicking "Place Order", you agree to our Interstellar Terms of Service.</div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button 
                onClick={() => setStep('shipping')}
                style={{ flex: 1, padding: '20px', borderRadius: '16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 700, cursor: 'pointer' }}
              >
                BACK
              </button>
              <button 
                onClick={handlePlaceOrder}
                style={{ flex: 2, padding: '20px', borderRadius: '16px', background: '#00f2ff', color: 'black', border: 'none', fontWeight: 800, cursor: 'pointer' }}
              >
                PLACE ORDER
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '24px', padding: '40px 0' }}>
            <div style={{ fontSize: '5rem', animation: 'bounce 1s infinite' }}>🛸</div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>ORDER PLACED!</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '400px', margin: '0 auto' }}>
              Your cargo is being prepared for warp-speed delivery to <strong>{address.city}, {address.planet}</strong>.
            </p>
            <div style={{ padding: '20px', background: 'rgba(0, 242, 255, 0.1)', borderRadius: '16px', border: '1px solid rgba(0, 242, 255, 0.2)' }}>
              <div style={{ fontSize: '0.8rem', color: '#00f2ff', textTransform: 'uppercase', letterSpacing: '1px' }}>Tracking Number</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>SGX-{Math.floor(Math.random() * 1000000)}</div>
            </div>
            <button 
              onClick={onClose}
              style={{
                marginTop: '20px',
                background: '#00f2ff',
                color: 'black',
                border: 'none',
                padding: '16px 32px',
                borderRadius: '12px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              CONTINUE EXPLORING
            </button>
          </div>
        )}
      </div>
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
};

export default CheckoutModal;
