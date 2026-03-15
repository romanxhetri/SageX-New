export interface Product {
  id: string;
  hubId: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  description?: string;
  isSecondHand?: boolean;
  seller: string;
  stock: number;
  featuredSize?: 'small' | 'medium' | 'large' | 'tall' | 'wide'; // For Bento Grid
  accentColor?: string; // Category specific color
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  likes: number;
  isVerified: boolean;
}

export interface ProductVariant {
  id: string;
  name: string; // e.g., "16GB RAM / 512GB SSD"
  priceModifier: number;
  stock: number;
}

export interface EnhancedProduct extends Product {
  longDescription: string;
  features: string[];
  specs: Record<string, string>;
  variants?: ProductVariant[];
  reviews_list: Review[];
  category: string;
  brand: string;
  estimatedDelivery: string;
  returnPolicy: string;
}

export interface CartItem extends EnhancedProduct {
  quantity: number;
  selectedVariantId?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  balance: number;
  tier: 'Citizen' | 'Explorer' | 'Commander';
  wishlist: string[];
  orders: any[];
}
