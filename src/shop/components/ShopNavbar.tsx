import React, { useState } from 'react';
import { useShop } from '../ShopContext';

interface ShopNavbarProps {
  onSearch: (term: string) => void;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenProfile: () => void;
  onCategorySelect: (category: string | null) => void;
}

const ShopNavbar: React.FC<ShopNavbarProps> = ({ 
  onSearch, onOpenCart, onOpenWishlist, onOpenProfile, onCategorySelect 
}) => {
  const { cart, wishlist, user } = useShop();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 32px',
      background: 'rgba(10, 10, 15, 0.8)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(0, 242, 255, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      gap: '24px'
    }}>
      {/* Logo */}
      <div 
        onClick={() => onCategorySelect(null)}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          cursor: 'pointer',
          flexShrink: 0 
        }}
      >
        <div style={{ 
          width: '40px', 
          height: '40px', 
          background: 'linear-gradient(135deg, #00f2ff, #0072ff)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          boxShadow: '0 0 15px rgba(0, 242, 255, 0.3)'
        }}>
          S
        </div>
        <span style={{ 
          fontSize: '1.4rem', 
          fontWeight: 800, 
          letterSpacing: '1px',
          background: 'linear-gradient(to right, #fff, #00f2ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          SAGEX SHOP
        </span>
      </div>

      {/* Search Bar */}
      <form 
        onSubmit={handleSearch}
        style={{ 
          flex: 1, 
          maxWidth: '600px', 
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <input 
          type="text" 
          placeholder="Search for galactic tech, fashion, or assets..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 20px',
            paddingRight: '50px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            color: 'white',
            fontSize: '0.95rem',
            outline: 'none',
            transition: 'all 0.2s'
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = '#00f2ff'}
          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
        />
        <button 
          type="submit"
          style={{
            position: 'absolute',
            right: '12px',
            background: 'transparent',
            border: 'none',
            color: '#00f2ff',
            cursor: 'pointer',
            fontSize: '1.2rem'
          }}
        >
          🔍
        </button>
      </form>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
        {/* Wishlist */}
        <div 
          onClick={onOpenWishlist}
          style={{ position: 'relative', cursor: 'pointer', fontSize: '1.4rem' }}
          title="Wishlist"
        >
          ❤️
          {wishlist.length > 0 && (
            <span style={{
              position: 'absolute',
              top: '-5px',
              right: '-8px',
              background: '#ff4444',
              color: 'white',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              padding: '2px 6px',
              borderRadius: '10px',
              border: '2px solid #0a0a0f'
            }}>
              {wishlist.length}
            </span>
          )}
        </div>

        {/* Cart */}
        <div 
          onClick={onOpenCart}
          style={{ position: 'relative', cursor: 'pointer', fontSize: '1.4rem' }}
          title="Shopping Cart"
        >
          🛒
          {cart.length > 0 && (
            <span style={{
              position: 'absolute',
              top: '-5px',
              right: '-8px',
              background: '#00f2ff',
              color: 'black',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              padding: '2px 6px',
              borderRadius: '10px',
              border: '2px solid #0a0a0f'
            }}>
              {cart.reduce((acc, item) => acc + item.quantity, 0)}
            </span>
          )}
        </div>

        {/* User Profile */}
        <div 
          onClick={onOpenProfile}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            cursor: 'pointer',
            padding: '4px 12px',
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
        >
          {user ? (
            <>
              <img 
                src={user.avatar} 
                alt={user.name} 
                style={{ width: '28px', height: '28px', borderRadius: '50%' }} 
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{user.name}</span>
                <span style={{ fontSize: '0.65rem', color: '#00f2ff' }}>NPR {user.balance.toLocaleString()}</span>
              </div>
            </>
          ) : (
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Login</span>
          )}
        </div>
      </div>
    </nav>
  );
};

export default ShopNavbar;
