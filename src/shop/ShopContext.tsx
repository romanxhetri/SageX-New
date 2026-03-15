import React, { createContext, useContext, useState, useEffect } from 'react';
import { EnhancedProduct, CartItem, UserProfile } from './types';

interface ShopContextType {
  cart: CartItem[];
  wishlist: string[];
  user: UserProfile | null;
  addToCart: (product: EnhancedProduct, variantId?: string) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateCartQuantity: (productId: string, quantity: number, variantId?: string) => void;
  toggleWishlist: (productId: string) => void;
  clearCart: () => void;
  login: (email: string) => void;
  logout: () => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Load from local storage
  useEffect(() => {
    const savedCart = localStorage.getItem('sagex_cart');
    const savedWishlist = localStorage.getItem('sagex_wishlist');
    const savedUser = localStorage.getItem('sagex_user');

    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('sagex_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('sagex_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('sagex_user', JSON.stringify(user));
  }, [user]);

  const addToCart = (product: EnhancedProduct, variantId?: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedVariantId === variantId);
      if (existing) {
        return prev.map(item => 
          (item.id === product.id && item.selectedVariantId === variantId) 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, selectedVariantId: variantId }];
    });
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    setCart(prev => prev.filter(item => !(item.id === productId && item.selectedVariantId === variantId)));
  };

  const updateCartQuantity = (productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }
    setCart(prev => prev.map(item => 
      (item.id === productId && item.selectedVariantId === variantId) 
        ? { ...item, quantity } 
        : item
    ));
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId]
    );
  };

  const clearCart = () => setCart([]);

  const login = (email: string) => {
    // Mock login
    setUser({
      id: 'user_' + Math.random().toString(36).substr(2, 9),
      name: email.split('@')[0],
      email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      balance: 500000,
      tier: 'Explorer',
      wishlist: [],
      orders: []
    });
  };

  const logout = () => setUser(null);

  return (
    <ShopContext.Provider value={{
      cart, wishlist, user,
      addToCart, removeFromCart, updateCartQuantity,
      toggleWishlist, clearCart, login, logout
    }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) throw new Error('useShop must be used within a ShopProvider');
  return context;
};
