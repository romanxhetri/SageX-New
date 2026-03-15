import React, { useState, useMemo } from 'react';
import { ShopProvider, useShop } from '../ShopContext';
import { EnhancedProduct } from '../types';
import ShopNavbar from './ShopNavbar';
import EditorialHero from './EditorialHero';
import EditorialProductCard from './EditorialProductCard';
import ProductDetails from './ProductDetails';
import CartDrawer from './CartDrawer';
import CheckoutModal from './CheckoutModal';

// Mock Data Enhancement for Bento Grid
const EDITORIAL_PRODUCTS: EnhancedProduct[] = [
  {
    id: 'p1',
    hubId: 'mobile',
    name: 'SageX Quantum Phone 15',
    brand: 'SageX Systems',
    price: 125000,
    originalPrice: 150000,
    image: 'https://picsum.photos/seed/phone1/1200/1600',
    rating: 4.9,
    reviews: 1240,
    description: 'The world\'s first neural-linked smartphone with quantum processing.',
    longDescription: 'Experience the future of communication with the SageX Quantum Phone 15. Featuring a liquid-crystal display that responds to your thoughts, and a battery that lasts for months on a single solar charge.',
    features: ['Neural Link 2.0', 'Quantum Processor', '12K Holographic Camera', 'Solar-Glass Body'],
    specs: { 'Display': '6.7" Liquid Crystal', 'CPU': 'Q1 Neural Chip', 'Storage': '2TB Quantum', 'Network': '6G Galactic' },
    category: 'mobile',
    stock: 50,
    seller: 'SageX Official',
    variants: [
      { id: 'v1', name: '1TB / Silver', priceModifier: 0, stock: 20 },
      { id: 'v2', name: '2TB / Obsidian', priceModifier: 25000, stock: 30 }
    ],
    reviews_list: [],
    estimatedDelivery: '2-3 Galactic Days',
    returnPolicy: '30-Day Interstellar Guarantee',
    featuredSize: 'tall',
    accentColor: '#00f2ff'
  },
  {
    id: 'p2',
    hubId: 'laptop',
    name: 'Nebula Pro Workstation',
    brand: 'Nebula Tech',
    price: 350000,
    image: 'https://picsum.photos/seed/laptop1/1600/1200',
    rating: 4.8,
    reviews: 850,
    description: 'Ultimate power for creators and galactic engineers.',
    longDescription: 'The Nebula Pro is designed for those who build worlds. With its dual-screen holographic interface and liquid-nitrogen cooling system, it handles the most demanding tasks with ease.',
    features: ['Dual Holographic Screens', 'Liquid Nitrogen Cooling', 'Titanium Chassis', 'Infinite Battery Life'],
    specs: { 'GPU': 'RTX 9000 Galactic', 'RAM': '128GB DDR6', 'Storage': '10TB SSD', 'Weight': '1.2kg' },
    category: 'laptop',
    stock: 15,
    seller: 'Nebula Authorized',
    reviews_list: [],
    estimatedDelivery: '5 Galactic Days',
    returnPolicy: '1-Year Warranty',
    featuredSize: 'wide',
    accentColor: '#ff4444'
  },
  {
    id: 'p3',
    hubId: 'fashion',
    name: 'Cyber-Silk Stealth Cloak',
    brand: 'Aura Fashion',
    price: 45000,
    originalPrice: 60000,
    image: 'https://picsum.photos/seed/fashion1/1200/1200',
    rating: 4.7,
    reviews: 2100,
    description: 'Adaptive camouflage fabric that reacts to your environment.',
    longDescription: 'Stay invisible or stand out. The Cyber-Silk Stealth Cloak uses millions of micro-LEDs woven into the fabric to mimic your surroundings or display vibrant patterns.',
    features: ['Active Camouflage', 'Micro-LED Integration', 'Self-Cleaning Fabric', 'Temperature Regulating'],
    specs: { 'Material': 'Cyber-Silk', 'Power': 'Bio-Kinetic', 'Washable': 'Yes (Sonic)', 'Sizes': 'S, M, L, XL' },
    category: 'fashion',
    stock: 100,
    seller: 'Aura Boutique',
    reviews_list: [],
    estimatedDelivery: '1 Galactic Day',
    returnPolicy: 'Free Returns',
    featuredSize: 'small',
    accentColor: '#fbbf24'
  },
  {
    id: 'p4',
    hubId: 'realstate',
    name: 'Mars Colony Penthouse',
    brand: 'SpaceX Living',
    price: 12000000,
    image: 'https://picsum.photos/seed/house1/1600/1600',
    rating: 5.0,
    reviews: 12,
    description: 'Luxury living with a view of the Valles Marineris.',
    longDescription: 'Own a piece of the red planet. This luxury penthouse offers 360-degree views of the Martian landscape, complete with a private oxygen garden and radiation shielding.',
    features: ['Oxygen Garden', 'Radiation Shielding', 'Earth-Link VR', 'Automated Butler'],
    specs: { 'Area': '500 sqm', 'Location': 'Marineris Heights', 'Gravity': '0.38g (Simulated 1g)', 'View': 'Canyon' },
    category: 'realstate',
    stock: 1,
    seller: 'Elon\'s Estates',
    reviews_list: [],
    estimatedDelivery: 'Instant Transfer',
    returnPolicy: 'No Returns',
    featuredSize: 'large',
    accentColor: '#00cc66'
  },
  {
    id: 'p5',
    hubId: 'mobile',
    name: 'Neural Link Earbuds',
    brand: 'SageX Systems',
    price: 25000,
    image: 'https://picsum.photos/seed/audio1/800/800',
    rating: 4.6,
    reviews: 4500,
    description: 'Direct-to-brain audio transmission with zero latency.',
    longDescription: 'Experience sound like never before. These earbuds bypass the eardrum and transmit audio directly to the auditory cortex for unparalleled clarity.',
    features: ['Direct-to-Brain Audio', 'Zero Latency', 'Bio-Kinetic Charging', 'Noise Cancellation'],
    specs: { 'Type': 'Neural Link', 'Battery': 'Infinite', 'Latency': '0ms', 'Range': '100m' },
    category: 'mobile',
    stock: 200,
    seller: 'SageX Official',
    reviews_list: [],
    estimatedDelivery: '1 Galactic Day',
    returnPolicy: '30-Day Returns',
    featuredSize: 'small',
    accentColor: '#00f2ff'
  }
];

const EditorialShopContent: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<EnhancedProduct | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    return EDITORIAL_PRODUCTS.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#050505', 
      color: 'white', 
      fontFamily: "'Inter', sans-serif",
      overflowX: 'hidden'
    }}>
      <ShopNavbar 
        onSearch={setSearchTerm}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenProfile={() => {}}
        onCategorySelect={setSelectedCategory}
      />

      <main style={{ padding: '0 40px 100px 40px', maxWidth: '1600px', margin: '0 auto' }}>
        {!selectedCategory && !searchTerm && <EditorialHero />}

        {/* Editorial Section Header */}
        <div style={{ 
          marginTop: '80px', 
          marginBottom: '40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end'
        }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#00f2ff', letterSpacing: '4px', textTransform: 'uppercase' }}>
              CURATED SELECTION
            </span>
            <h2 style={{ 
              margin: '8px 0 0 0', 
              fontSize: '3.5rem', 
              fontWeight: 900, 
              fontFamily: "'Playfair Display', serif",
              lineHeight: 1
            }}>
              {selectedCategory ? `${selectedCategory.toUpperCase()} HUB` : 'THE COLLECTION'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {['all', 'mobile', 'laptop', 'fashion', 'realstate'].map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat === 'all' ? null : cat)}
                style={{
                  background: (selectedCategory === cat || (cat === 'all' && !selectedCategory)) ? '#fff' : 'transparent',
                  color: (selectedCategory === cat || (cat === 'all' && !selectedCategory)) ? '#000' : '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '10px 24px',
                  borderRadius: '100px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  transition: 'all 0.3s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Bento Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
          gridAutoFlow: 'dense',
          gap: '32px' 
        }}>
          {filteredProducts.map(product => (
            <EditorialProductCard 
              key={product.id} 
              product={product} 
              onQuickView={setQuickViewProduct} 
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🛰️</div>
            <h2>No signals found</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>Try adjusting your search or filters.</p>
          </div>
        )}
      </main>

      {/* Modals */}
      {quickViewProduct && (
        <ProductDetails 
          product={quickViewProduct} 
          onClose={() => setQuickViewProduct(null)} 
        />
      )}

      {isCartOpen && (
        <CartDrawer 
          onClose={() => setIsCartOpen(false)} 
          onCheckout={() => {
            setIsCartOpen(false);
            setIsCheckoutOpen(true);
          }}
        />
      )}

      {isCheckoutOpen && (
        <CheckoutModal onClose={() => setIsCheckoutOpen(false)} />
      )}
    </div>
  );
};

const EditorialShop: React.FC = () => {
  return (
    <ShopProvider>
      <EditorialShopContent />
    </ShopProvider>
  );
};

export default EditorialShop;
