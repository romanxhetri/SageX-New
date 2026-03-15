import React from 'react';

const EditorialHero: React.FC = () => {
  return (
    <section style={{
      padding: '80px 0 40px 0',
      display: 'flex',
      flexDirection: 'column',
      gap: '40px'
    }}>
      {/* Main Story Tile */}
      <div style={{
        position: 'relative',
        height: '600px',
        borderRadius: '40px',
        overflow: 'hidden',
        background: '#000',
        display: 'flex',
        alignItems: 'flex-end',
        padding: '60px',
        boxShadow: '0 40px 100px rgba(0,0,0,0.5)'
      }}>
        <img 
          src="https://picsum.photos/seed/editorial1/1920/1080" 
          alt="Featured Story" 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.6
          }}
          referrerPolicy="no-referrer"
        />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)',
          zIndex: 1
        }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '800px' }}>
          <span style={{ 
            fontSize: '0.8rem', 
            fontWeight: 800, 
            letterSpacing: '4px', 
            color: '#00f2ff', 
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: '16px'
          }}>
            SPRING / SUMMER 2026 COLLECTION
          </span>
          <h1 style={{
            fontSize: 'clamp(3rem, 8vw, 6rem)',
            fontWeight: 900,
            lineHeight: 0.85,
            margin: '0 0 24px 0',
            letterSpacing: '-4px',
            fontFamily: "'Playfair Display', serif"
          }}>
            NEURAL <br />
            <span style={{ color: 'transparent', WebkitTextStroke: '1px #fff' }}>FASHION</span>
          </h1>
          <p style={{
            fontSize: '1.2rem',
            color: 'rgba(255,255,255,0.6)',
            lineHeight: 1.6,
            marginBottom: '40px',
            maxWidth: '500px'
          }}>
            The first collection of bio-adaptive garments that respond to your neural state. Designed for the modern explorer.
          </p>
          <button style={{
            background: '#fff',
            color: '#000',
            border: 'none',
            padding: '18px 40px',
            borderRadius: '100px',
            fontSize: '1rem',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            EXPLORE THE LOOKBOOK
          </button>
        </div>
      </div>

      {/* Secondary Story Tiles */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px'
      }}>
        {[
          { title: 'Quantum Tech', subtitle: 'The Future of Speed', img: 'tech' },
          { title: 'Deep Space Living', subtitle: 'Luxury Real Estate', img: 'house' },
          { title: 'Neural Assets', subtitle: 'Digital Ownership', img: 'digital' }
        ].map((story, i) => (
          <div key={i} style={{
            position: 'relative',
            height: '300px',
            borderRadius: '32px',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'transform 0.3s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <img 
              src={`https://picsum.photos/seed/${story.img}/800/600`} 
              alt={story.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
              referrerPolicy="no-referrer"
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '32px'
            }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#00f2ff', letterSpacing: '2px', textTransform: 'uppercase' }}>
                {story.subtitle}
              </span>
              <h3 style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: 800 }}>{story.title}</h3>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default EditorialHero;
