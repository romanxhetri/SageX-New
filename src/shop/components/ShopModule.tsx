import React, { useState, useMemo } from 'react';
import { ShopProvider, useShop } from '../ShopContext';
import { EnhancedProduct } from '../types';
import ShopNavbar from './ShopNavbar';
import ShopHero from './ShopHero';
import ProductCard from './ProductCard';
import ProductDetails from './ProductDetails';
import CartDrawer from './CartDrawer';
import CheckoutModal from './CheckoutModal';
import AIShoppingAssistant from './AIShoppingAssistant';

// Mock Data Enhancement
const ENHANCED_PRODUCTS: EnhancedProduct[] = [
  {
    id: 'p1',
    hubId: 'mobile',
    name: 'SageX Quantum Phone 15',
    brand: 'SageX Systems',
    price: 125000,
    originalPrice: 150000,
    image: 'https://picsum.photos/seed/phone1/800/800',
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
    reviews_list: [
      { id: 'r1', userId: 'u1', userName: 'Alex Chen', rating: 5, comment: 'Literally mind-blowing. The neural link is seamless.', date: '2024-03-01', likes: 45, isVerified: true },
      { id: 'r2', userId: 'u2', userName: 'Sarah J.', rating: 4, comment: 'Great phone, but the holographic camera takes some getting used to.', date: '2024-02-28', likes: 12, isVerified: true }
    ],
    estimatedDelivery: '2-3 Galactic Days',
    returnPolicy: '30-Day Interstellar Guarantee'
  },
  {
    id: 'p2',
    hubId: 'laptop',
    name: 'Nebula Pro Workstation',
    brand: 'Nebula Tech',
    price: 350000,
    image: 'https://picsum.photos/seed/laptop1/800/800',
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
    returnPolicy: '1-Year Warranty'
  },
  {
    id: 'p3',
    hubId: 'fashion',
    name: 'Cyber-Silk Stealth Cloak',
    brand: 'Aura Fashion',
    price: 45000,
    originalPrice: 60000,
    image: 'https://picsum.photos/seed/fashion1/800/800',
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
    returnPolicy: 'Free Returns'
  },
  {
    id: 'p4',
    hubId: 'realstate',
    name: 'Mars Colony Penthouse',
    brand: 'SpaceX Living',
    price: 12000000,
    image: 'https://picsum.photos/seed/house1/800/800',
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
    returnPolicy: 'No Returns'
  }
];

const ShopContent: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<EnhancedProduct | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    return ENHANCED_PRODUCTS.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div style={{ minHeight: '100vh', background: '#020205', color: 'white', fontFamily: "'Inter', sans-serif" }}>
      <ShopNavbar 
        onSearch={setSearchTerm}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenProfile={() => {}}
        onCategorySelect={setSelectedCategory}
      />

      <main style={{ padding: '40px 32px', maxWidth: '1400px', margin: '0 auto' }}>
        {!selectedCategory && !searchTerm && <ShopHero />}

        {/* Category Filter Bar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '12px' }}>
          <button 
            onClick={() => setSelectedCategory(null)}
            style={{
              padding: '10px 24px',
              borderRadius: '30px',
              background: !selectedCategory ? '#00f2ff' : 'rgba(255,255,255,0.05)',
              color: !selectedCategory ? 'black' : 'white',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            All Hubs
          </button>
          {['mobile', 'laptop', 'fashion', 'realstate'].map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '10px 24px',
                borderRadius: '30px',
                background: selectedCategory === cat ? '#00f2ff' : 'rgba(255,255,255,0.05)',
                color: selectedCategory === cat ? 'black' : 'white',
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                textTransform: 'capitalize'
              }}
            >
              {cat} Hub
            </button>
          ))}
        </div>

        {/* Results Header */}
        {(searchTerm || selectedCategory) && (
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
              {searchTerm ? `Search Results for "${searchTerm}"` : `${selectedCategory?.toUpperCase()} HUB`}
            </h2>
            <div style={{ color: 'rgba(255,255,255,0.4)' }}>{filteredProducts.length} items found</div>
          </div>
        )}

        {/* Product Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '24px' 
        }}>
          {filteredProducts.map(product => (
            <ProductCard 
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
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>Try adjusting your search or filters to find what you're looking for.</p>
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

      <AIShoppingAssistant />
    </div>
  );
};

const ShopModule: React.FC = () => {
  return (
    <ShopProvider>
      <ShopContent />
    </ShopProvider>
  );
};

export default ShopModule;
