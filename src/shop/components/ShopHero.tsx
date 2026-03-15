import React from 'react';

const ShopHero: React.FC = () => {
  return (
    <div style={{
      position: 'relative',
      height: '500px',
      width: '100%',
      overflow: 'hidden',
      borderRadius: '24px',
      marginBottom: '40px',
      background: '#000'
    }}>
      {/* Background Image with Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: 'url("https://picsum.photos/seed/galaxy/1920/1080")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.5,
        filter: 'blur(2px)'
      }} />
      
      {/* Gradient Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(to right, rgba(10, 10, 15, 0.95) 0%, rgba(10, 10, 15, 0.4) 50%, transparent 100%)',
        zIndex: 1
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 60px',
        maxWidth: '800px'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(0, 242, 255, 0.1)',
          border: '1px solid rgba(0, 242, 255, 0.3)',
          padding: '6px 16px',
          borderRadius: '20px',
          color: '#00f2ff',
          fontSize: '0.8rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '2px',
          marginBottom: '24px'
        }}>
          <span style={{ width: '8px', height: '8px', background: '#00f2ff', borderRadius: '50%', boxShadow: '0 0 10px #00f2ff' }} />
          Galactic Spring Sale Live
        </div>

        <h1 style={{
          fontSize: '4.5rem',
          fontWeight: 900,
          lineHeight: 0.9,
          margin: '0 0 24px 0',
          letterSpacing: '-2px',
          background: 'linear-gradient(to bottom, #fff 40%, rgba(255,255,255,0.5))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          UPGRADE YOUR <br />
          <span style={{ color: '#00f2ff', WebkitTextFillColor: '#00f2ff' }}>EXISTENCE.</span>
        </h1>

        <p style={{
          fontSize: '1.2rem',
          color: 'rgba(255, 255, 255, 0.6)',
          lineHeight: 1.6,
          margin: '0 0 40px 0',
          maxWidth: '500px'
        }}>
          Discover the next generation of interstellar technology, virtual fashion, and digital real estate. Powered by the SageX Neural Network.
        </p>

        <div style={{ display: 'flex', gap: '20px' }}>
          <button style={{
            background: '#00f2ff',
            color: 'black',
            border: 'none',
            padding: '16px 32px',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 0 30px rgba(0, 242, 255, 0.3)'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            EXPLORE HUBS
          </button>
          <button style={{
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '16px 32px',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s',
            backdropFilter: 'blur(10px)'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
          >
            VIEW AUCTIONS
          </button>
        </div>
      </div>

      {/* Stats Ticker */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(10px)',
        padding: '12px 0',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 3
      }}>
        <div style={{
          display: 'flex',
          gap: '60px',
          padding: '0 40px',
          fontSize: '0.8rem',
          color: 'rgba(255, 255, 255, 0.4)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          <span>🚀 1.2M+ Shipments Delivered</span>
          <span>💎 450K+ Active Traders</span>
          <span>⚡ 0.02s Avg Transaction Speed</span>
          <span>🌍 12 Galactic Hubs Connected</span>
        </div>
      </div>
    </div>
  );
};

export default ShopHero;
