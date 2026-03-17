import React, { useEffect, useRef, useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import * as THREE from "three";
// @ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// @ts-ignore
import { DragControls } from "three/examples/jsm/controls/DragControls";
// @ts-ignore
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
// @ts-ignore
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
// @ts-ignore
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { GoogleGenAI, Modality } from "@google/genai";
import { motion, AnimatePresence } from "framer-motion";
import Markdown from 'react-markdown';
import { createClient } from "@supabase/supabase-js";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { HUBS_DATA } from "./src/data";

// --- Supabase Config ---
const getEnv = (key: string) => (typeof process !== 'undefined' && process.env ? process.env[key] : '') || '';
const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL') || 'https://xyzcompany.supabase.co';
const SUPABASE_KEY = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || 'public-anon-key';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Types & Constants ---

type HubType = 'shop' | 'ai_tools' | 'fun_hub';
type NavMode = 'cinematic' | 'pilot' | 'directory';

function FPSCounter() {
    const [fps, setFps] = useState(0);
    useEffect(() => {
        let frameCount = 0;
        let lastTime = performance.now();
        let animationFrameId: number;

        const updateFPS = () => {
            frameCount++;
            const currentTime = performance.now();
            if (currentTime - lastTime >= 1000) {
                setFps(Math.round((frameCount * 1000) / (currentTime - lastTime)));
                frameCount = 0;
                lastTime = currentTime;
            }
            animationFrameId = requestAnimationFrame(updateFPS);
        };
        animationFrameId = requestAnimationFrame(updateFPS);
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    return (
        <div style={{ position: 'fixed', top: 10, left: 10, background: 'rgba(0,0,0,0.7)', color: '#00ffcc', padding: '4px 8px', borderRadius: 4, fontFamily: 'monospace', zIndex: 9999, border: '1px solid #00ffcc' }}>
            FPS: {fps}
        </div>
    );
}

type Review = {
  user: string;
  rating: number;
  comment: string;
  date: string;
};

type Product = {
  id: string;
  hubId: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  rating: number;
  reviews: number;
  description?: string;
  isSecondHand?: boolean;
  seller: string;
  brand?: string;
  stock: number;
  specs?: Record<string, string>;
  reviewList?: Review[];
  variations?: { name: string, options: string[] }[];
  qna?: { question: string, answer: string, date: string }[];
};

type Video = {
    id: string;
    title: string;
    description: string;
    embedUrl: string;
    thumbnail: string;
    duration: string;
    views: number;
};

type CartItem = Product & { quantity: number };

type Order = {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  status: 'Processing' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Returned';
  trackingSteps?: { status: string, date: string, completed: boolean }[];
  shippingAddress?: string;
  shippingMethod?: string;
  discount?: number;
};

type User = {
  id: string;
  name: string;
  email: string;
  balance: number;
  wishlist: string[]; 
  orders: Order[];
  isAdmin?: boolean;
};

type HubData = {
  id: string;
  name: string;
  type: HubType;
  radius: number;
  distance: number;
  speed: number;
  color: number;
  description: string;
  icon: string;
  hasRing?: boolean;
  geometryType?: 'sphere' | 'torus' | 'icosahedron';
  textureUrl?: string;
  normalUrl?: string;
  specularUrl?: string;
  cloudsUrl?: string;
  nightUrl?: string;
};

const INITIAL_PRODUCTS: Product[] = [
    { 
      id: "m1", hubId: "mobile", name: "iPhone 15 Pro Max (256GB)", price: 185000, originalPrice: 195000, rating: 4.9, reviews: 120, seller: "EvoStore", brand: "Apple", stock: 15, 
      image: "https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&w=300&q=80", 
      images: [
        "https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1695048132800-47b29a287232?auto=format&fit=crop&w=800&q=80"
      ],
      description: "Natural Titanium, A17 Pro Chip, the most powerful iPhone.",
      variations: [
        { name: "Color", options: ["Natural Titanium", "Blue Titanium", "Black Titanium"] },
        { name: "Storage", options: ["256GB", "512GB", "1TB"] }
      ],
      specs: { "Display": "6.7-inch Super Retina XDR", "Chip": "A17 Pro", "Camera": "48MP Main | 5x Telephoto" },
      reviewList: [
        { user: "Ram K.", rating: 5, comment: "Best phone ever. Battery life is amazing.", date: "2024-02-15" },
        { user: "Sita S.", rating: 4, comment: "Great camera, but a bit heavy.", date: "2024-01-20" }
      ],
      qna: [
        { question: "Does it come with a charger?", answer: "No, Apple does not include a charger in the box.", date: "2024-01-10" },
        { question: "Is this dual physical SIM?", answer: "No, it supports 1 Physical SIM + 1 eSIM.", date: "2024-02-05" }
      ]
    },
    { id: "m2", hubId: "mobile", name: "Samsung Galaxy S24 Ultra", price: 184999, rating: 4.8, reviews: 95, seller: "Samsung Nepal", brand: "Samsung", stock: 20, image: "https://images.unsplash.com/photo-1706606992982-b7e252a92771?auto=format&fit=crop&w=300&q=80", description: "Titanium Grey, Galaxy AI features, S-Pen included." },
    { id: "m3", hubId: "mobile", name: "Redmi Note 13 Pro+ 5G", price: 47999, rating: 4.6, reviews: 300, seller: "Daraz Mall", brand: "Xiaomi", stock: 50, image: "https://images.unsplash.com/photo-1707831839230-22c7d97793d2?auto=format&fit=crop&w=300&q=80", description: "200MP Camera, 120W HyperCharge, Curved Display." },
    { id: "m4", hubId: "mobile", name: "OnePlus 12 (16/512GB)", price: 139999, rating: 4.7, reviews: 45, seller: "Kratos Tech", stock: 10, image: "https://images.unsplash.com/photo-1678957949479-b1e876a38210?auto=format&fit=crop&w=300&q=80", description: "Snapdragon 8 Gen 3, Hasselblad Camera, 100W Charging." },
    { id: "m5", hubId: "mobile", name: "Poco X6 Pro", price: 46999, rating: 4.8, reviews: 210, seller: "Daraz Mall", stock: 40, image: "https://images.unsplash.com/photo-1623945939227-37599c277732?auto=format&fit=crop&w=300&q=80", description: "Best Gaming Phone under 50k, Dimensity 8300 Ultra." },
    { id: "m6", hubId: "mobile", name: "Honor X9b", price: 43990, rating: 4.5, reviews: 150, seller: "Honor Nepal", stock: 25, image: "https://images.unsplash.com/photo-1616348436168-de43ad0db179?auto=format&fit=crop&w=300&q=80", description: "Anti-Drop Display, 5800mAh Battery, Ultra Durable." },
    { id: "m7", hubId: "mobile", name: "Realme 12 Pro+", price: 50999, rating: 4.4, reviews: 80, seller: "Realme Store", stock: 30, image: "https://images.unsplash.com/photo-1621330386762-c3619939ce2a?auto=format&fit=crop&w=300&q=80", description: "Periscope Portrait Camera, Luxury Watch Design." },
    { id: "m8", hubId: "mobile", name: "Google Pixel 8a", price: 65000, rating: 4.6, reviews: 30, seller: "M.K. Tradeline", stock: 8, image: "https://images.unsplash.com/photo-1698226992770-0777264a747c?auto=format&fit=crop&w=300&q=80", description: "Google Tensor G3, Best AI Camera, 7 years updates." },
    { id: "m9", hubId: "mobile", name: "Vivo V30 5G", price: 60999, rating: 4.5, reviews: 60, seller: "Vivo Nepal", stock: 20, image: "https://images.unsplash.com/photo-1619623293838-34823299712a?auto=format&fit=crop&w=300&q=80", description: "Aura Light Portrait, Slimmest 5000mAh Phone." },
    { id: "m10", hubId: "mobile", name: "Benco S1 Pro", price: 19999, rating: 4.2, reviews: 500, seller: "Benco Mobile", stock: 100, image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&q=80", description: "Best budget phone, 256GB storage under 20k." },
    { id: "l1", hubId: "laptop", name: "Acer Nitro V 15 (2024)", price: 105000, originalPrice: 115000, rating: 4.7, reviews: 200, seller: "ITTI Computer", stock: 25, image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=300&q=80", description: "i5-13th Gen, RTX 4050 6GB, 144Hz, Best Budget Gaming Laptop." },
    { id: "l2", hubId: "laptop", name: "Lenovo LOQ 15", price: 112000, rating: 4.8, reviews: 150, seller: "Megatech", stock: 15, image: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=300&q=80", description: "Ryzen 7 7840HS, RTX 4060, The new budget king." },
    { id: "l3", hubId: "laptop", name: "MacBook Air M2 (13-inch)", price: 145000, rating: 4.9, reviews: 89, seller: "Oliz Store", stock: 10, image: "https://images.unsplash.com/photo-1655397509783-da72cb9ca7c3?auto=format&fit=crop&w=300&q=80", description: "Midnight Color, 8GB/256GB, Slimmest & Fastest for work." },
    { id: "l4", hubId: "laptop", name: "Asus TUF F15", price: 98000, rating: 4.6, reviews: 300, seller: "Nagmani", stock: 30, image: "https://images.unsplash.com/photo-1587613754760-cd9a285831b3?auto=format&fit=crop&w=300&q=80", description: "Military Grade Toughness, i5-11th Gen, RTX 2050." },
    { id: "l5", hubId: "laptop", name: "Dell XPS 13 Plus", price: 230000, rating: 4.7, reviews: 20, seller: "Generation Next", stock: 5, image: "https://images.unsplash.com/photo-1593642632823-8f78536788c6?auto=format&fit=crop&w=300&q=80", description: "Futuristic Design, OLED Touch, i7-13th Gen." },
    { id: "l6", hubId: "laptop", name: "HP Victus 15", price: 88000, rating: 4.5, reviews: 120, seller: "Bigbyte", stock: 40, image: "https://images.unsplash.com/photo-1589652717521-10c0d092dea9?auto=format&fit=crop&w=300&q=80", description: "Best Value Gaming, Ryzen 5 5600H, RX 6500M." },
    { id: "l7", hubId: "laptop", name: "Lenovo Legion Pro 5i", price: 215000, rating: 4.9, reviews: 60, seller: "Megatech", stock: 8, image: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=300&q=80", description: "i9-13900HX, RTX 4070, Ultimate Gaming Beast." },
    { id: "l8", hubId: "laptop", name: "Acer Swift Go 14", price: 92000, rating: 4.6, reviews: 45, seller: "Acer Nepal", stock: 20, image: "https://images.unsplash.com/photo-1544731612-de7f96afe55f?auto=format&fit=crop&w=300&q=80", description: "OLED Display, Ultra-lightweight, Intel Evo Certified." },
    { id: "s1", hubId: "secondhand", name: "Royal Enfield Classic 350", price: 350000, rating: 4.5, reviews: 5, seller: "Suresh Bikers", stock: 1, isSecondHand: true, image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=300&q=80", description: "2019 Model, Gunmetal Grey, Lot 85, Fresh Condition." },
    { id: "s2", hubId: "secondhand", name: "Hyundai Grand i10 (2016)", price: 1850000, rating: 4.2, reviews: 2, seller: "Kathmandu Recondition", stock: 1, isSecondHand: true, image: "https://images.unsplash.com/photo-1599321303867-047b4b3c02eb?auto=format&fit=crop&w=300&q=80", description: "Single Hand, Magna Variant, 45k km running." },
    { id: "s3", hubId: "secondhand", name: "iPhone 12 Pro (128GB)", price: 62000, rating: 4.0, reviews: 8, seller: "Mobile Hub Putalisadak", stock: 2, isSecondHand: true, image: "https://images.unsplash.com/photo-1606248897407-99f0976c5432?auto=format&fit=crop&w=300&q=80", description: "Battery Health 87%, Pacific Blue, Genuine Box." },
    { id: "s4", hubId: "secondhand", name: "Bajaj Pulsar 220F", price: 135000, rating: 4.1, reviews: 10, seller: "Ram Kumar", stock: 1, isSecondHand: true, image: "https://images.unsplash.com/photo-1595188602693-47cb2320b923?auto=format&fit=crop&w=300&q=80", description: "2018 Model, Urgent Sale, Tax Cleared." },
    { id: "s5", hubId: "secondhand", name: "Sony A7III Body Only", price: 140000, rating: 4.8, reviews: 3, seller: "Cameraman Hari", stock: 1, isSecondHand: true, image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=300&q=80", description: "Shutter Count 25k, Minor Scratches, Working Perfect." },
    { id: "s6", hubId: "secondhand", name: "PlayStation 4 Slim (1TB)", price: 22000, rating: 4.6, reviews: 12, seller: "Gamer Zone", stock: 3, isSecondHand: true, image: "https://images.unsplash.com/photo-1507457379470-08b800bebc67?auto=format&fit=crop&w=300&q=80", description: "Jailbroken 9.00, 1 Controller, 10 Games loaded." },
    { id: "s7", hubId: "secondhand", name: "Office Table & Chair", price: 8500, rating: 4.0, reviews: 1, seller: "Office Liquidation", stock: 5, isSecondHand: true, image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=300&q=80", description: "Wooden top table and revolving chair, slightly used." },
    { id: "f1", hubId: "fashion", name: "Goldstar Shoes 032", price: 1250, rating: 4.8, reviews: 1500, seller: "Goldstar Official", stock: 200, image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=300&q=80", description: "The Classic Nepali Sneaker. Durable and Comfortable." },
    { id: "f2", hubId: "fashion", name: "North Face Windcheater (Copy)", price: 1800, rating: 4.3, reviews: 200, seller: "Asan Bazar", stock: 50, image: "https://images.unsplash.com/photo-1605908502146-5c1a82f31a1f?auto=format&fit=crop&w=300&q=80", description: "Waterproof, warm fleece inside, best for bike riding." },
    { id: "f3", hubId: "fashion", name: "Dhaka Topi (Palpali)", price: 800, rating: 5.0, reviews: 50, seller: "Nepali Craft", stock: 100, image: "https://images.unsplash.com/photo-1585859608039-3c3a0734a34b?auto=format&fit=crop&w=300&q=80", description: "Authentic Palpali Dhaka Topi, pure cotton." },
    { id: "f4", hubId: "fashion", name: "Ladies Kurta Set", price: 2500, rating: 4.5, reviews: 80, seller: "Bhatbhateni", stock: 30, image: "https://images.unsplash.com/photo-1583391733958-d024443f0388?auto=format&fit=crop&w=300&q=80", description: "Cotton printed Kurta with Suruwal and Shawl." },
    { id: "f5", hubId: "fashion", name: "Men's Cargo Pants", price: 1500, rating: 4.2, reviews: 120, seller: "Urban Nepal", stock: 60, image: "https://images.unsplash.com/photo-1517438476312-10d79c077509?auto=format&fit=crop&w=300&q=80", description: "6 Pocket Cargo, Stretchable Fabric, Army Green." },
    { id: "f6", hubId: "fashion", name: "Lehenga for Wedding", price: 15000, rating: 4.9, reviews: 10, seller: "New Road Boutique", stock: 5, image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=300&q=80", description: "Heavy embroidery, Bridal Red, Velvet fabric." },
    { id: "f7", hubId: "fashion", name: "Caliber Shoes Men", price: 3200, rating: 4.6, reviews: 45, seller: "Caliber Shoes", stock: 25, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80", description: "Made in Nepal, Stylish Sports Running Shoe." },
    { id: "r1", hubId: "realstate", name: "Land for Sale in Imadol", price: 3500000, rating: 4.5, reviews: 0, seller: "Nepal Land", stock: 1, image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=300&q=80", description: "4 Aana, Near Krishna Mandir, 13ft road access. Price per Aana." },
    { id: "r2", hubId: "realstate", name: "House on Sale - Budhanilkantha", price: 35000000, rating: 5.0, reviews: 1, seller: "Ghar Bazaar", stock: 1, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=300&q=80", description: "2.5 Storey, 5 Aana, Modern Design, Peaceful VIP Area." },
    { id: "r3", hubId: "realstate", name: "Flat for Rent - New Baneshwor", price: 25000, rating: 4.2, reviews: 0, seller: "Room Finder", stock: 1, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=300&q=80", description: "2BHK, Ground Floor, Parking Available, For Family." },
    { id: "r4", hubId: "realstate", name: "Commercial Space - Putalisadak", price: 60000, rating: 4.0, reviews: 0, seller: "City Rentals", stock: 1, image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=300&q=80", description: "500 sqft, 2nd Floor, Prime Location for Consultancy/IT." },
    { id: "r5", hubId: "realstate", name: "Land in Pokhara (Lakeside)", price: 9000000, rating: 4.8, reviews: 2, seller: "Pokhara Real Estate", stock: 1, image: "https://images.unsplash.com/photo-1597040663442-17793e4e94a9?auto=format&fit=crop&w=300&q=80", description: "Commercial plot near Hotel Barahi, High ROI potential." },
    { id: "p1", hubId: "products", name: "Ultima Watch Magic", price: 3599, rating: 4.5, reviews: 500, seller: "Ultima Lifestyle", stock: 100, image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=300&q=80", description: "BT Calling, 1.83 Display, Nepali Brand." },
    { id: "p2", hubId: "products", name: "Boat Airdopes 141", price: 2999, rating: 4.4, reviews: 1000, seller: "TeleTalk", stock: 200, image: "https://images.unsplash.com/photo-1572569028738-411a56103324?auto=format&fit=crop&w=300&q=80", description: "42 Hours Playback, Beast Mode, ENx Technology." },
    { id: "p3", hubId: "products", name: "Anker Soundcore Life Q30", price: 10999, rating: 4.9, reviews: 150, seller: "Anker Nepal", stock: 20, image: "https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?auto=format&fit=crop&w=300&q=80", description: "Active Noise Cancellation, Hi-Res Audio, 40H Playtime." },
    { id: "p4", hubId: "products", name: "Redmi Watch 4", price: 14999, rating: 4.7, reviews: 60, seller: "Xiaomi Nepal", stock: 30, image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=300&q=80", description: "AMOLED Display, GPS, HyperOS, Aluminum Frame." },
    { id: "p5", hubId: "products", name: "Samsung T7 Portable SSD (1TB)", price: 16500, rating: 4.9, reviews: 40, seller: "Lion Tech", stock: 15, image: "https://images.unsplash.com/photo-1628557044797-f21a177c37ec?auto=format&fit=crop&w=300&q=80", description: "USB 3.2 Gen 2, Blazing Fast Transfer, Rugged." },
    { id: "p6", hubId: "products", name: "Logitech G402 Hyperion Fury", price: 4500, rating: 4.8, reviews: 200, seller: "Backseat Gaming", stock: 40, image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=300&q=80", description: "Fastest Gaming Mouse, 8 Programmable Buttons." },
    { id: "p7", hubId: "products", name: "Digicom Router UPS", price: 2500, rating: 4.6, reviews: 300, seller: "Digicom", stock: 80, image: "https://images.unsplash.com/photo-1544197150-b99a580bbcbf?auto=format&fit=crop&w=300&q=80", description: "Keep your WiFi on during load shedding. 4-5 hours backup." },
    { id: "p8", hubId: "products", name: "Dizo Trimmer Kit", price: 1999, rating: 4.3, reviews: 150, seller: "Dizo Nepal", stock: 60, image: "https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=300&q=80", description: "4-in-1 Grooming Kit, USB C Charging." },
    { id: "p9", hubId: "products", name: "Yasuda 2L Rice Cooker", price: 3200, rating: 4.5, reviews: 90, seller: "Yasuda", stock: 40, image: "https://images.unsplash.com/photo-1585059895524-72359e06138a?auto=format&fit=crop&w=300&q=80", description: "Double Pot, 2.2 Liters, Durable build." },
    { id: "p10", hubId: "products", name: "CG 43 inch 4K Smart TV", price: 42000, rating: 4.4, reviews: 30, seller: "CG Digital", stock: 10, image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=300&q=80", description: "Android 11, Voice Remote, Dolby Audio." }
];

const INITIAL_VIDEOS: Video[] = [
    { id: "v1", title: "Future of AI in Shopping", description: "How AI changes how we buy.", embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg", duration: "12:05", views: 15400 },
    { id: "v2", title: "Top 10 Gadgets 2024", description: "Must have tech for this year.", embedUrl: "https://www.youtube.com/embed/LXb3EKWsInQ", thumbnail: "https://img.youtube.com/vi/LXb3EKWsInQ/0.jpg", duration: "8:30", views: 8900 },
    { id: "v3", title: "Coding in VR", description: "Is this the future of work?", embedUrl: "https://www.youtube.com/embed/u1cuuB-G29s", thumbnail: "https://img.youtube.com/vi/u1cuuB-G29s/0.jpg", duration: "15:20", views: 22100 },
];

const AI_TOOLS = [
    "Image Generator", "Code Assistant", "Text Summarizer", "Voice Cloner", 
    "Video Editor", "Logo Creator", "SEO Optimizer", "Email Writer",
    "Data Analyst", "Music Composer", "Presentation Builder", "Legal Assistant",
    "Language Tutor", "Resume Builder", "Math Solver", "Travel Planner"
];

const AI_MODEL = "gemini-3-flash-preview";

// --- Components ---

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: string}> {
    state = { hasError: false, error: "" };
    constructor(props: {children: React.ReactNode}) {
        super(props);
    }
    static getDerivedStateFromError(error: any) {
        return { hasError: true, error: error.toString() };
    }
    render() {
        if (this.state.hasError) {
            return <div style={{ padding: 20, color: "red", textAlign: "center" }}>
                <h2>Something went wrong.</h2>
                <p>{this.state.error}</p>
                <button onClick={() => window.location.reload()} style={{padding:10}}>Reload</button>
            </div>;
        }
        return (this as any).props.children;
    }
}

function App() {
  const [navMode, setNavMode] = useState<NavMode>('cinematic');
  const [activeHub, setActiveHub] = useState<HubData | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAutopilot, setShowAutopilot] = useState(false);
  const [initialHubFilters, setInitialHubFilters] = useState<{sortBy?: string, searchTerm?: string}>({});
  const [graphicsQuality, setGraphicsQuality] = useState<'high' | 'low'>('high');
  
  // 3D Support Check
  const [is3DSupported, setIs3DSupported] = useState(true);

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [videos, setVideos] = useState<Video[]>(INITIAL_VIDEOS);

  // If 3D fails, default to directory mode
  useEffect(() => {
      if (!is3DSupported) setNavMode('directory');
  }, [is3DSupported]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));
  
  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };

  const handleLogin = (email: string, name: string) => {
    setUser({ id: Date.now().toString(), name, email, wishlist: [], orders: [], balance: 0 });
    setShowAuthModal(false);
  };

  const handlePlaceOrder = (order: Order) => {
    if (user) {
      setUser({ ...user, orders: [order, ...user.orders] });
    }
    setCart([]);
    setIsCheckoutOpen(false);
    alert("Order Placed Successfully! View in Profile.");
  };

  const toggleWishlist = (productId: string) => {
    if (!user) { setShowAuthModal(true); return; }
    const exists = user.wishlist.includes(productId);
    const newWishlist = exists ? user.wishlist.filter(id => id !== productId) : [...user.wishlist, productId];
    setUser({ ...user, wishlist: newWishlist });
  };

  const handleAutopilotCommand = (cmd: string) => {
      const text = cmd.toLowerCase();
      let targetHubId = null;
      let sortBy = "recommended";
      // ... logic same ...
      if (text.includes("laptop")) targetHubId = "laptop";
      else if (text.includes("mobile")) targetHubId = "mobile";
      else if (text.includes("fashion")) targetHubId = "fashion";
      else if (text.includes("used")) targetHubId = "secondhand";
      else if (text.includes("video")) targetHubId = "video";
      else if (text.includes("tools")) targetHubId = "tools";
      else if (text.includes("real")) targetHubId = "realstate";
      else if (text.includes("product")) targetHubId = "products";

      if (text.includes("cheap")) sortBy = "priceLow";
      else if (text.includes("expensive")) sortBy = "priceHigh";
      else if (text.includes("best")) sortBy = "rating";

      if (targetHubId) {
          const hub = HUBS_DATA.find(h => h.id === targetHubId);
          if (hub) {
              setInitialHubFilters({ sortBy });
              setActiveHub(hub);
              if (is3DSupported) setNavMode('cinematic');
              setShowAutopilot(false);
          }
      } else {
          alert("Autopilot could not identify a valid destination.");
      }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (showAdmin) {
      return <AdminDashboard onClose={() => setShowAdmin(false)} products={products} setProducts={setProducts} videos={videos} setVideos={setVideos} currentUser={user} />;
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#020205" }}>
      <FPSCounter />
      {/* 3D Scene - Only Render if Supported */}
      {is3DSupported ? (
          <SolarSystemScene 
            onHubSelect={(hub) => {
              setInitialHubFilters({}); 
              setActiveHub(hub);
              if(navMode !== 'directory') setNavMode('cinematic'); 
            }} 
            isPaused={!!activeHub || navMode === 'directory'}
            mode={navMode}
            onError={() => setIs3DSupported(false)}
            quality={graphicsQuality}
          />
      ) : (
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "linear-gradient(to bottom, #000000, #0a0a1a)", display: "flex", justifyContent: "center", alignItems: "center", color: "#666" }}>
              <div style={{textAlign: "center"}}>
                  <h2>3D Universe Disabled</h2>
                  <p>Running in Lite Mode for your device.</p>
              </div>
          </div>
      )}
      
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 10 }}>
        <Header 
          cartCount={cart.reduce((a, b) => a + b.quantity, 0)} 
          openCart={() => setIsCartOpen(true)}
          toggleChat={() => setIsChatOpen(!isChatOpen)}
          user={user}
          openAuth={() => setShowAuthModal(true)}
          openProfile={() => setShowProfile(true)}
          openAdmin={() => setShowAdmin(true)}
          toggleAutopilot={() => setShowAutopilot(!showAutopilot)}
          graphicsQuality={graphicsQuality}
          toggleGraphics={() => setGraphicsQuality(q => q === 'high' ? 'low' : 'high')}
        />
      </div>

      <NavBar currentMode={navMode} setMode={setNavMode} />

      {showAutopilot && <AutopilotBar onCommand={handleAutopilotCommand} onClose={() => setShowAutopilot(false)} />}

      {/* Directory is ALWAYS visible if 3D fails, or if explicitly selected */}
      {(navMode === 'directory' || !is3DSupported) && (
        <DirectoryOverlay 
          onSelect={(hub) => {
            setInitialHubFilters({});
            setActiveHub(hub);
            if (is3DSupported) setNavMode('cinematic'); 
          }}
        />
      )}

      {activeHub && (
        <HubOverlay 
          hub={activeHub} 
          products={products}
          videos={videos} 
          onClose={() => setActiveHub(null)}
          onProductClick={(p) => setSelectedProduct(p)}
          initialFilters={initialHubFilters}
          addToCart={addToCart}
          cartCount={cart.reduce((a, b) => a + b.quantity, 0)}
          openCart={() => setIsCartOpen(true)}
          toggleWishlist={toggleWishlist}
          wishlist={user?.wishlist || []}
        />
      )}

      {selectedProduct && (
        <ProductDetailsModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)}
          addToCart={addToCart}
          buyNow={(p) => { addToCart(p); setIsCheckoutOpen(true); setSelectedProduct(null); }}
          isWishlisted={(user && user.wishlist.includes(selectedProduct.id)) || false}
          toggleWishlist={() => toggleWishlist(selectedProduct.id)}
        />
      )}

      {isCheckoutOpen && <CheckoutModal cart={cart} total={cartTotal} onClose={() => setIsCheckoutOpen(false)} onPlaceOrder={handlePlaceOrder} user={user} />}
      {showProfile && user && <ProfileModal user={user} onClose={() => setShowProfile(false)} />}
      {showAuthModal && <AuthModal onLogin={handleLogin} onClose={() => setShowAuthModal(false)} />}
      {isCartOpen && <CartDrawer cart={cart} onClose={() => setIsCartOpen(false)} onRemove={removeFromCart} onUpdateQty={updateQuantity} total={cartTotal} onCheckout={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }} />}
      {isChatOpen && <ChatInterface activeHub={activeHub} onClose={() => setIsChatOpen(false)} />}
    </div>
  );
}

// ... (AutopilotBar, AdminDashboard, AdminUsers, AdminProducts, AdminVideos, AdminSupport, Header, HubOverlay, NavBar, DirectoryOverlay, ProductDetailsModal, CheckoutModal, AuthModal, ProfileModal, CartDrawer, ChatInterface remain identical to previous iteration, standard React components) ...

function AutopilotBar({ onCommand, onClose }: { onCommand: (cmd: string) => void, onClose: () => void }) {
    const [input, setInput] = useState("");
    return (
        <div style={{ position: "absolute", top: "80px", left: "50%", transform: "translateX(-50%)", width: "90%", maxWidth: "600px", zIndex: 100, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ background: "rgba(0, 20, 40, 0.9)", border: "1px solid #00f2ff", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 0 30px rgba(0, 242, 255, 0.3)" }}>
                <span style={{ fontSize: "1.5rem" }}>🤖</span>
                <div style={{ flex: 1 }}>
                    <div style={{ color: "#00f2ff", fontSize: "0.8rem", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Autopilot Command Console</div>
                    <input 
                        autoFocus
                        placeholder="Ex: 'Find me cheap laptop' or 'Go to video hub'" 
                        value={input} 
                        onChange={e => setInput(e.target.value)} 
                        onKeyDown={e => {
                            if(e.key === 'Enter' && input.trim()) onCommand(input);
                        }}
                        style={{ width: "100%", background: "transparent", border: "none", color: "white", fontSize: "1.1rem", outline: "none", fontFamily: "monospace" }} 
                    />
                </div>
                <button onClick={() => input.trim() && onCommand(input)} style={{ background: "#00f2ff", color: "black", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>ENGAGE</button>
                <button onClick={onClose} style={{ background: "transparent", color: "#666", border: "none", fontSize: "1.2rem", cursor: "pointer", padding: "0 8px" }}>×</button>
            </div>
        </div>
    );
}

function AdminDashboard({ onClose, products, setProducts, videos, setVideos, currentUser }: any) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [activeTab, setActiveTab] = useState('products');
    const [users, setUsers] = useState<User[]>([
        { id: "u1", name: "John Doe", email: "john@example.com", balance: 500, wishlist: [], orders: [] },
        { id: "u2", name: "Jane Smith", email: "jane@example.com", balance: 1200, wishlist: [], orders: [] },
        ...(currentUser ? [currentUser] : [])
    ]);

    const handleLogin = () => {
        if (password === "1234") setIsAuthenticated(true);
        else alert("Incorrect Password");
    };

    if (!isAuthenticated) {
        return (
            <div className="admin-dashboard" style={{ justifyContent: "center", alignItems: "center" }}>
                <div className="glass-panel gradient-border" style={{ padding: 40, borderRadius: 20, textAlign: "center", width: 350, maxWidth: '90%' }}>
                    <h2 style={{ marginBottom: 20, color: '#fff' }}>Admin Access</h2>
                    <input type="password" placeholder="Enter Password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: "100%", padding: 12, marginBottom: 20, borderRadius: 8, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "white", outline: 'none' }} />
                    <button onClick={handleLogin} className="admin-btn glow-button" style={{ width: "100%", padding: 12, fontSize: "1rem", background: '#00f2ff', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Login</button>
                    <button onClick={onClose} style={{ marginTop: 16, background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>Back to Site</button>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <div className="admin-header">
                <div style={{ fontWeight: "bold", fontSize: "1.2rem", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: "#00f2ff" }}>SageX</span> Admin Panel
                </div>
                <button onClick={onClose} className="admin-btn btn-danger">Exit</button>
            </div>
            <div className="admin-layout">
                <div className="admin-sidebar">
                    <div className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Users</div>
                    <div className={`admin-nav-item ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>Products</div>
                    <div className={`admin-nav-item ${activeTab === 'videos' ? 'active' : ''}`} onClick={() => setActiveTab('videos')}>Video Hub</div>
                    <div className={`admin-nav-item ${activeTab === 'support' ? 'active' : ''}`} onClick={() => setActiveTab('support')}>Support</div>
                </div>
                <div className="admin-content">
                    {activeTab === 'products' && <AdminProducts products={products} setProducts={setProducts} />}
                    {activeTab === 'users' && <AdminUsers users={users} setUsers={setUsers} />}
                    {activeTab === 'videos' && <AdminVideos videos={videos} setVideos={setVideos} />}
                    {activeTab === 'support' && <AdminSupport />}
                </div>
            </div>
        </div>
    );
}

function AdminUsers({ users, setUsers }: any) {
    const addFunds = (userId: string) => {
        // In a real app, we'd use a modal. For now, we'll keep it simple but styled.
        const amount = window.prompt("Enter amount to add (NPR):");
        if (amount && !isNaN(+amount)) {
            setUsers(users.map((u: User) => u.id === userId ? { ...u, balance: u.balance + (+amount) } : u));
        }
    };
    const deleteUser = (userId: string) => {
        if(window.confirm("Delete this user?")) setUsers(users.filter((u: User) => u.id !== userId));
    };

    return (
        <div className="smooth-transition">
            <h2 style={{ color: '#fff', marginBottom: '24px', fontSize: '1.8rem' }}>User Management</h2>
            <div className="table-responsive glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th style={{ background: 'rgba(255,255,255,0.05)', color: '#00f2ff' }}>Name</th>
                            <th style={{ background: 'rgba(255,255,255,0.05)', color: '#00f2ff' }}>Email</th>
                            <th style={{ background: 'rgba(255,255,255,0.05)', color: '#00f2ff' }}>Balance</th>
                            <th style={{ background: 'rgba(255,255,255,0.05)', color: '#00f2ff' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u: User) => (
                            <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ color: '#fff' }}>{u.name}</td>
                                <td style={{ color: 'rgba(255,255,255,0.6)' }}>{u.email}</td>
                                <td style={{ color: "#00ff88", fontWeight: "bold" }}>NPR {u.balance.toLocaleString()}</td>
                                <td style={{ display: "flex", gap: 12 }}>
                                    <button 
                                        className="admin-btn btn-primary" 
                                        onClick={() => addFunds(u.id)}
                                        style={{ background: 'rgba(0,242,255,0.1)', border: '1px solid #00f2ff', color: '#00f2ff', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        + Fund
                                    </button>
                                    <button 
                                        className="admin-btn btn-danger" 
                                        onClick={() => deleteUser(u.id)}
                                        style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid #ff4444', color: '#ff4444', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function AdminProducts({ products, setProducts }: any) {
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});

    const saveProduct = () => {
        if (currentProduct.id) {
            setProducts(products.map((p: Product) => p.id === currentProduct.id ? { ...p, ...currentProduct } : p));
        } else {
            const newProd = { ...currentProduct, id: Date.now().toString(), rating: 0, reviews: 0 } as Product;
            setProducts([...products, newProd]);
        }
        setIsEditing(false);
        setCurrentProduct({});
    };

    const deleteProduct = (id: string) => {
        if(window.confirm("Delete product?")) setProducts(products.filter((p: Product) => p.id !== id));
    };

    return (
        <div className="smooth-transition">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: '24px' }}>
                <h2 style={{ color: '#fff', margin: 0, fontSize: '1.8rem' }}>Product Management</h2>
                <button 
                    className="glow-button" 
                    onClick={() => { setCurrentProduct({ hubId: "mobile" }); setIsEditing(true); }}
                    style={{ background: '#00f2ff', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    + Add Product
                </button>
            </div>
            
            <div className="table-responsive glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th style={{ background: 'rgba(255,255,255,0.05)', color: '#00f2ff' }}>Image</th>
                            <th style={{ background: 'rgba(255,255,255,0.05)', color: '#00f2ff' }}>Name</th>
                            <th style={{ background: 'rgba(255,255,255,0.05)', color: '#00f2ff' }}>Price</th>
                            <th style={{ background: 'rgba(255,255,255,0.05)', color: '#00f2ff' }}>Hub</th>
                            <th style={{ background: 'rgba(255,255,255,0.05)', color: '#00f2ff' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((p: Product) => (
                            <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td><img src={p.image} style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", border: '1px solid rgba(255,255,255,0.1)' }} alt={p.name} /></td>
                                <td style={{ color: '#fff', fontWeight: '500' }}>{p.name}</td>
                                <td style={{ color: "#00ff88", fontWeight: "bold" }}>NPR {p.price.toLocaleString()}</td>
                                <td style={{ color: 'rgba(255,255,255,0.6)' }}><span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '0.85rem' }}>{p.hubId}</span></td>
                                <td style={{ display: "flex", gap: 12 }}>
                                    <button 
                                        className="admin-btn btn-primary" 
                                        onClick={() => { setCurrentProduct(p); setIsEditing(true); }}
                                        style={{ background: 'rgba(0,242,255,0.1)', border: '1px solid #00f2ff', color: '#00f2ff', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        className="admin-btn btn-danger" 
                                        onClick={() => deleteProduct(p.id)}
                                        style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid #ff4444', color: '#ff4444', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isEditing && (
                <div className="admin-form-overlay" style={{ backdropFilter: 'blur(10px)', background: 'rgba(0,0,0,0.7)' }}>
                    <div className="admin-form glass-panel-dark gradient-border" style={{ padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '500px' }}>
                        <h3 style={{ color: '#00f2ff', marginTop: 0, marginBottom: '24px', fontSize: '1.5rem' }}>{currentProduct.id ? "Edit Product" : "Add New Product"}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group">
                                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Product Name</label>
                                <input 
                                    className="form-input" 
                                    placeholder="Product Name" 
                                    value={currentProduct.name || ""} 
                                    onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })} 
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Price (NPR)</label>
                                <input 
                                    className="form-input" 
                                    type="number" 
                                    placeholder="Price" 
                                    value={currentProduct.price || ""} 
                                    onChange={e => setCurrentProduct({ ...currentProduct, price: +e.target.value })} 
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Image URL</label>
                                <input 
                                    className="form-input" 
                                    placeholder="Image URL" 
                                    value={currentProduct.image || ""} 
                                    onChange={e => setCurrentProduct({ ...currentProduct, image: e.target.value })} 
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Hub Category</label>
                                <select 
                                    className="form-input" 
                                    value={currentProduct.hubId || "mobile"} 
                                    onChange={e => setCurrentProduct({ ...currentProduct, hubId: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                                >
                                    {HUBS_DATA.filter(h => h.type === 'shop').map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Description</label>
                                <textarea 
                                    className="form-input" 
                                    placeholder="Description" 
                                    rows={4}
                                    value={currentProduct.description || ""} 
                                    onChange={e => setCurrentProduct({ ...currentProduct, description: e.target.value })} 
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', minHeight: '100px' }}
                                />
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 16, marginTop: '32px' }}>
                            <button 
                                onClick={() => setIsEditing(false)} 
                                style={{ flex: 1, padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={saveProduct} 
                                className="glow-button"
                                style={{ flex: 2, padding: '14px', borderRadius: '10px', background: '#00f2ff', border: 'none', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Save Product
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function AdminVideos({ videos, setVideos }: any) {
    const [isEditing, setIsEditing] = useState(false);
    const [currentVideo, setCurrentVideo] = useState<Partial<Video>>({});

    const saveVideo = () => {
        if (currentVideo.id) {
            setVideos(videos.map((v: Video) => v.id === currentVideo.id ? { ...v, ...currentVideo } : v));
        } else {
            setVideos([...videos, { ...currentVideo, id: Date.now().toString(), views: 0 } as Video]);
        }
        setIsEditing(false);
        setCurrentVideo({});
    };

    return (
        <div className="smooth-transition">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: '24px' }}>
                <h2 style={{ color: '#fff', margin: 0, fontSize: '1.8rem' }}>Video Management</h2>
                <button 
                    className="glow-button" 
                    onClick={() => { setCurrentVideo({}); setIsEditing(true); }}
                    style={{ background: '#00f2ff', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    + Add Video
                </button>
            </div>
            
            <div className="table-responsive glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th style={{ background: 'rgba(255,255,255,0.05)', color: '#00f2ff' }}>Title</th>
                            <th style={{ background: 'rgba(255,255,255,0.05)', color: '#00f2ff' }}>Views</th>
                            <th style={{ background: 'rgba(255,255,255,0.05)', color: '#00f2ff' }}>Duration</th>
                            <th style={{ background: 'rgba(255,255,255,0.05)', color: '#00f2ff' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {videos.map((v: Video) => (
                            <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ color: '#fff', fontWeight: '500' }}>{v.title}</td>
                                <td style={{ color: 'rgba(255,255,255,0.6)' }}>{v.views.toLocaleString()}</td>
                                <td style={{ color: 'rgba(255,255,255,0.6)' }}>{v.duration}</td>
                                <td style={{ display: "flex", gap: 12 }}>
                                    <button 
                                        className="admin-btn btn-primary" 
                                        onClick={() => { setCurrentVideo(v); setIsEditing(true); }}
                                        style={{ background: 'rgba(0,242,255,0.1)', border: '1px solid #00f2ff', color: '#00f2ff', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        className="admin-btn btn-danger" 
                                        onClick={() => { if(window.confirm("Delete video?")) setVideos(videos.filter((vi: Video) => vi.id !== v.id)) }}
                                        style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid #ff4444', color: '#ff4444', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isEditing && (
                <div className="admin-form-overlay" style={{ backdropFilter: 'blur(10px)', background: 'rgba(0,0,0,0.7)' }}>
                    <div className="admin-form glass-panel-dark gradient-border" style={{ padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '500px' }}>
                        <h3 style={{ color: '#00f2ff', marginTop: 0, marginBottom: '24px', fontSize: '1.5rem' }}>{currentVideo.id ? "Edit Video" : "Add New Video"}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group">
                                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Video Title</label>
                                <input 
                                    className="form-input" 
                                    placeholder="Video Title" 
                                    value={currentVideo.title || ""} 
                                    onChange={e => setCurrentVideo({ ...currentVideo, title: e.target.value })} 
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Description</label>
                                <textarea 
                                    className="form-input" 
                                    placeholder="Description" 
                                    value={currentVideo.description || ""} 
                                    onChange={e => setCurrentVideo({ ...currentVideo, description: e.target.value })} 
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', minHeight: '80px' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Embed URL</label>
                                <input 
                                    className="form-input" 
                                    placeholder="Embed URL" 
                                    value={currentVideo.embedUrl || ""} 
                                    onChange={e => setCurrentVideo({ ...currentVideo, embedUrl: e.target.value })} 
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Thumbnail URL</label>
                                <input 
                                    className="form-input" 
                                    placeholder="Thumbnail URL" 
                                    value={currentVideo.thumbnail || ""} 
                                    onChange={e => setCurrentVideo({ ...currentVideo, thumbnail: e.target.value })} 
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Duration (e.g. 10:00)</label>
                                <input 
                                    className="form-input" 
                                    placeholder="Duration" 
                                    value={currentVideo.duration || ""} 
                                    onChange={e => setCurrentVideo({ ...currentVideo, duration: e.target.value })} 
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                                />
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 16, marginTop: '32px' }}>
                            <button 
                                onClick={() => setIsEditing(false)} 
                                style={{ flex: 1, padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={saveVideo} 
                                className="glow-button"
                                style={{ flex: 2, padding: '14px', borderRadius: '10px', background: '#00f2ff', border: 'none', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Save Video
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function AdminSupport() {
    return (
        <div className="smooth-transition">
            <h2 style={{ color: '#fff', marginBottom: '24px', fontSize: '1.8rem' }}>Customer Support</h2>
            <div className="glass-panel gradient-border" style={{ padding: '60px 20px', borderRadius: '24px', textAlign: "center", background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ fontSize: "4rem", marginBottom: 24, filter: 'drop-shadow(0 0 10px #00f2ff)' }}>🎧</div>
                <h3 style={{ color: '#fff', marginBottom: '12px' }}>Support Center</h3>
                <p style={{ color: "rgba(255,255,255,0.5)", maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>
                    No active tickets at the moment. Our real-time AI support system is standing by to assist users.
                </p>
                <button className="glow-button" style={{ marginTop: '32px', padding: '12px 32px', background: 'rgba(0,242,255,0.1)', border: '1px solid #00f2ff', color: '#00f2ff', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                    View Support Logs
                </button>
            </div>
        </div>
    );
}

function Header({ cartCount, openCart, toggleChat, user, openAuth, openProfile, openAdmin, toggleAutopilot, graphicsQuality, toggleGraphics }: any) {
  return (
    <div className="responsive-header">
      <div className="header-left">
        <h1 style={{ background: "linear-gradient(to right, #00f2ff, #0099ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          SageX AI Universe
        </h1>
        <p>The Future of Commerce</p>
      </div>
      <div className="header-right">
        <button className="header-sm-btn" onClick={toggleGraphics} style={{ background: graphicsQuality === 'low' ? "rgba(255, 0, 0, 0.15)" : "rgba(0, 255, 0, 0.15)", border: `1px solid ${graphicsQuality === 'low' ? '#ff4444' : '#00ff00'}`, color: graphicsQuality === 'low' ? '#ff4444' : '#00ff00', fontWeight: 700 }}>{graphicsQuality === 'high' ? 'HIGH GFX' : 'LOW GFX'}</button>
        <button className="header-sm-btn" onClick={toggleAutopilot} style={{ background: "rgba(0, 242, 255, 0.15)", border: "1px solid #00f2ff", color: "#00f2ff", fontWeight: 700, boxShadow: "0 0 10px rgba(0, 242, 255, 0.2)" }}>🤖 AUTOPILOT</button>
        <button className="header-sm-btn" onClick={toggleChat} style={{ background: "linear-gradient(135deg, #00f2ff 0%, #0066ff 100%)", border: "none", color: "white", fontWeight: 700, boxShadow: "0 0 10px rgba(0, 102, 255, 0.4)" }}>Ask AI</button>
        <button className="header-sm-btn" onClick={openCart} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", gap: "6px", backdropFilter: "blur(10px)" }}>
          <span>🛒</span><span style={{ fontWeight: "bold" }}>({cartCount})</span>
        </button>
        {user ? (
          <button className="header-sm-btn" onClick={openProfile} style={{ background: "rgba(255,165,0,0.2)", border: "1px solid orange", color: "orange", fontWeight: "bold" }}>👤 {(user && user.name.split(' ')[0]) || "User"}</button>
        ) : (
          <button className="header-sm-btn" onClick={openAuth} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.5)", color: "white" }}>Login</button>
        )}
        <button className="header-sm-btn" onClick={openAdmin} style={{ background: "rgba(255,0,0,0.1)", border: "1px solid #ff4444", color: "#ff4444" }}>Admin</button>
      </div>
    </div>
  );
}

interface Website {
    name: string;
    url: string;
    icon: string;
    color: string;
    description: string;
}

const POPULAR_WEBSITES: Website[] = [
    { name: "Google", url: "https://www.google.com", icon: "🔍", color: "#4285F4", description: "Search the world's information." },
    { name: "YouTube", url: "https://www.youtube.com", icon: "📺", color: "#FF0000", description: "Watch and share videos." },
    { name: "GitHub", url: "https://www.github.com", icon: "🐙", color: "#333", description: "Where the world builds software." },
    { name: "Wikipedia", url: "https://www.wikipedia.org", icon: "📖", color: "#666", description: "The free encyclopedia." },
    { name: "Reddit", url: "https://www.reddit.com", icon: "🤖", color: "#FF4500", description: "The front page of the internet." },
    { name: "Amazon", url: "https://www.amazon.com", icon: "📦", color: "#FF9900", description: "Shop for everything." },
    { name: "Twitter", url: "https://www.twitter.com", icon: "🐦", color: "#1DA1F2", description: "What's happening in the world." },
    { name: "LinkedIn", url: "https://www.linkedin.com", icon: "💼", color: "#0077B5", description: "Professional networking." },
    { name: "Stack Overflow", url: "https://stackoverflow.com", icon: "💻", color: "#F48024", description: "For developers, by developers." },
    { name: "Medium", url: "https://medium.com", icon: "✍️", color: "#000", description: "Read and write stories." },
    { name: "Netflix", url: "https://www.netflix.com", icon: "🎬", color: "#E50914", description: "Watch TV shows and movies." },
    { name: "Spotify", url: "https://www.spotify.com", icon: "🎵", color: "#1DB954", description: "Music for everyone." },
];

interface TabData {
    id: string;
    url: string;
    inputUrl: string;
    history: string[];
    historyIndex: number;
    title: string;
    isLoading: boolean;
    isHome?: boolean;
}

function BrowserHome({ onNavigate }: { onNavigate: (url: string) => void }) {
    return (
        <div style={{ flex: 1, background: '#1c1d1f', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', overflowY: 'auto' }}>
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', marginBottom: '60px' }}
            >
                <h1 style={{ fontSize: '3.5rem', margin: 0, background: 'linear-gradient(45deg, #00f2ff, #fbc2eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800, letterSpacing: '-2px' }}>
                    SageX Browser
                </h1>
                <p style={{ color: '#9aa0a6', fontSize: '1.1rem', marginTop: '10px' }}>Explore the universe of information</p>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px', width: '100%', maxWidth: '1200px' }}>
                {POPULAR_WEBSITES.map((site, i) => (
                    <motion.div
                        key={site.url}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        onClick={() => onNavigate(site.url)}
                        className="glass-panel"
                        style={{ 
                            padding: '24px', 
                            borderRadius: '20px', 
                            cursor: 'pointer', 
                            border: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            background: 'rgba(255,255,255,0.02)',
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        <div style={{ 
                            width: '64px', 
                            height: '64px', 
                            borderRadius: '16px', 
                            background: `${site.color}22`, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: '2rem',
                            marginBottom: '16px',
                            border: `1px solid ${site.color}44`
                        }}>
                            {site.icon}
                        </div>
                        <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '1.1rem' }}>{site.name}</h3>
                        <p style={{ margin: 0, color: '#9aa0a6', fontSize: '0.8rem', lineHeight: '1.4' }}>{site.description}</p>
                    </motion.div>
                ))}
            </div>

            <div style={{ marginTop: '80px', color: '#5f6368', fontSize: '0.9rem', display: 'flex', gap: '24px' }}>
                <span>Privacy First</span>
                <span>•</span>
                <span>Ad-Free Experience</span>
                <span>•</span>
                <span>AI Powered</span>
            </div>
        </div>
    );
}

function WebBrowser({ initialUrl = "", onClose }: any) {
    const [tabs, setTabs] = useState<TabData[]>([{
        id: Date.now().toString(),
        url: initialUrl,
        inputUrl: initialUrl,
        history: [initialUrl],
        historyIndex: 0,
        title: initialUrl ? 'New Tab' : 'Home',
        isLoading: initialUrl ? true : false,
        isHome: initialUrl ? false : true
    }]);
    const [activeTabId, setActiveTabId] = useState(tabs[0].id);
    const [bookmarks, setBookmarks] = useState([
        { title: 'Wikipedia', url: 'https://en.wikipedia.org' },
        { title: 'Poki', url: 'https://poki.com' },
        { title: 'Aniwatch', url: 'https://aniwatch.to' },
        { title: 'GitHub', url: 'https://github.com' }
    ]);
    const [summary, setSummary] = useState<{ loading: boolean, text: string | null, show: boolean }>({ loading: false, text: null, show: false });
    
    // Extensions State
    const [showExtensions, setShowExtensions] = useState(false);
    const [activeExtensions, setActiveExtensions] = useState<string[]>(['adblock']);
    const [showNotes, setShowNotes] = useState(false);
    const [notes, setNotes] = useState<string>("");

    // Assistant State
    const [showAssistant, setShowAssistant] = useState(false);
    const [assistantMessages, setAssistantMessages] = useState<{role: string, text: string}[]>([
        { role: 'assistant', text: 'Hi! I am your browser assistant. I can see you are browsing. How can I help?' }
    ]);
    const [assistantInput, setAssistantInput] = useState("");
    const [isAssistantTyping, setIsAssistantTyping] = useState(false);

    const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

    useEffect(() => {
        // Extract domain for title on load
        tabs.forEach(tab => {
            if (tab.title === 'New Tab' && tab.url !== 'about:blank') {
                try {
                    const domain = new URL(tab.url).hostname.replace('www.', '');
                    updateTab(tab.id, { title: domain });
                } catch(e) {}
            }
        });
    }, [tabs]);

    const updateTab = (id: string, updates: Partial<TabData>) => {
        setTabs(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const navigateTo = (newUrl: string, tabId = activeTabId) => {
        let finalUrl = newUrl.trim();
        if (!finalUrl) return;

        if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
            if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
                finalUrl = 'https://' + finalUrl;
            } else {
                finalUrl = `https://www.google.com/search?q=${encodeURIComponent(finalUrl)}`;
            }
        }
        
        const tab = tabs.find(t => t.id === tabId)!;
        const newHistory = tab.history.slice(0, tab.historyIndex + 1);
        newHistory.push(finalUrl);
        
        let domain = finalUrl;
        try { domain = new URL(finalUrl).hostname.replace('www.', ''); } catch(e){}

        updateTab(tabId, {
            url: finalUrl,
            inputUrl: finalUrl,
            history: newHistory,
            historyIndex: newHistory.length - 1,
            isLoading: true,
            title: domain,
            isHome: false
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') navigateTo(activeTab.inputUrl);
    };

    const goBack = () => {
        if (activeTab.historyIndex > 0) {
            const newIdx = activeTab.historyIndex - 1;
            const prevUrl = activeTab.history[newIdx];
            updateTab(activeTabId, { historyIndex: newIdx, url: prevUrl, inputUrl: prevUrl, isLoading: true });
        }
    };

    const goForward = () => {
        if (activeTab.historyIndex < activeTab.history.length - 1) {
            const newIdx = activeTab.historyIndex + 1;
            const nextUrl = activeTab.history[newIdx];
            updateTab(activeTabId, { historyIndex: newIdx, url: nextUrl, inputUrl: nextUrl, isLoading: true });
        }
    };

    const refresh = () => {
        updateTab(activeTabId, { isLoading: true });
        const currentUrl = activeTab.url;
        updateTab(activeTabId, { url: 'about:blank' });
        setTimeout(() => updateTab(activeTabId, { url: currentUrl }), 50);
    };

    const addNewTab = () => {
        const newTab: TabData = {
            id: Date.now().toString(),
            url: '',
            inputUrl: '',
            history: [''],
            historyIndex: 0,
            title: 'Home',
            isLoading: false,
            isHome: true
        };
        setTabs([...tabs, newTab]);
        setActiveTabId(newTab.id);
    };

    const closeTab = (e: any, id: string) => {
        e.stopPropagation();
        if (tabs.length === 1) {
            if (onClose) onClose();
            return;
        }
        const newTabs = tabs.filter(t => t.id !== id);
        setTabs(newTabs);
        if (activeTabId === id) setActiveTabId(newTabs[newTabs.length - 1].id);
    };

    const toggleBookmark = () => {
        const exists = bookmarks.find(b => b.url === activeTab.url);
        if (exists) {
            setBookmarks(bookmarks.filter(b => b.url !== activeTab.url));
        } else {
            setBookmarks([...bookmarks, { title: activeTab.title, url: activeTab.url }]);
        }
    };

    const summarizePage = async () => {
        setSummary({ loading: true, text: null, show: true });
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Summarize the content of this website: ${activeTab.url}. Provide a concise 3-bullet point summary.`
            });
            setSummary({ loading: false, text: response.text || "Could not generate summary.", show: true });
        } catch (e) {
            setSummary({ loading: false, text: "Error generating summary. Please try again.", show: true });
        }
    };

    const toggleExtension = (ext: string) => {
        if (activeExtensions.includes(ext)) {
            setActiveExtensions(activeExtensions.filter(e => e !== ext));
        } else {
            setActiveExtensions([...activeExtensions, ext]);
        }
    };

    const handleAssistantSubmit = async () => {
        if (!assistantInput.trim()) return;
        const newMsgs = [...assistantMessages, { role: 'user', text: assistantInput }];
        setAssistantMessages(newMsgs);
        setAssistantInput("");
        setIsAssistantTyping(true);
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            const prompt = `You are a helpful browser assistant built into a futuristic e-commerce universe. 
            The user is currently viewing this URL: ${activeTab.url}. 
            User says: "${assistantInput}". 
            Respond concisely and helpfully based on the context of the URL and their request.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt
            });
            
            setAssistantMessages([...newMsgs, { role: 'assistant', text: response.text || "I couldn't process that." }]);
        } catch (e) {
            setAssistantMessages([...newMsgs, { role: 'assistant', text: "Error connecting to AI core." }]);
        }
        setIsAssistantTyping(false);
    };

    const containerStyle: React.CSSProperties = onClose ? {
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99999,
        display: 'flex', flexDirection: 'column'
    } : {
        display: 'flex', flexDirection: 'column', width: '100%', height: '100%', minHeight: '70vh', borderRadius: '16px', overflow: 'hidden'
    };

    return (
        <div style={containerStyle} className={onClose ? "glass-panel-dark" : "glass-panel gradient-border"}>
            {/* Tabs Bar */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', padding: '8px 8px 0 8px', gap: '4px', overflowX: 'auto', scrollbarWidth: 'none', backdropFilter: 'blur(10px)' }}>
                {tabs.map(tab => (
                    <div key={tab.id} onClick={() => setActiveTabId(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: activeTabId === tab.id ? '#323639' : '#282b2d', padding: '8px 16px', borderRadius: '8px 8px 0 0', color: '#e8eaed', fontSize: '0.85rem', cursor: 'pointer', minWidth: '120px', maxWidth: '200px', borderRight: '1px solid #1c1d1f' }}>
                        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tab.title}</span>
                        <span onClick={(e) => closeTab(e, tab.id)} style={{ padding: '2px 6px', borderRadius: '50%', fontSize: '0.7rem' }}>✕</span>
                    </div>
                ))}
                <button onClick={addNewTab} style={{ background: 'transparent', border: 'none', color: '#e8eaed', fontSize: '1.2rem', cursor: 'pointer', padding: '0 12px' }}>+</button>
                <div style={{ flex: 1 }} />
                {onClose && (
                    <button onClick={onClose} style={{ background: '#ff4444', border: 'none', color: 'white', cursor: 'pointer', padding: '4px 12px', borderRadius: '4px', marginBottom: '4px', fontWeight: 'bold' }}>✕</button>
                )}
            </div>

            {/* Nav Bar */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', flexWrap: 'wrap', backdropFilter: 'blur(10px)' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={goBack} disabled={activeTab.historyIndex === 0} style={{ background: 'transparent', border: 'none', color: activeTab.historyIndex === 0 ? '#5f6368' : '#e8eaed', cursor: activeTab.historyIndex === 0 ? 'default' : 'pointer', fontSize: '1.2rem', padding: '4px', borderRadius: '50%' }} title="Back">⟵</button>
                    <button onClick={goForward} disabled={activeTab.historyIndex === activeTab.history.length - 1} style={{ background: 'transparent', border: 'none', color: activeTab.historyIndex === activeTab.history.length - 1 ? '#5f6368' : '#e8eaed', cursor: activeTab.historyIndex === activeTab.history.length - 1 ? 'default' : 'pointer', fontSize: '1.2rem', padding: '4px', borderRadius: '50%' }} title="Forward">⟶</button>
                    <button onClick={refresh} style={{ background: 'transparent', border: 'none', color: '#e8eaed', cursor: 'pointer', fontSize: '1.2rem', padding: '4px', borderRadius: '50%' }} title="Reload">↻</button>
                </div>
                
                <div style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: '20px', padding: '4px 16px', border: '1px solid rgba(255,255,255,0.1)', minWidth: '150px' }}>
                    <span style={{ color: activeExtensions.includes('adblock') ? '#34a853' : '#9aa0a6', marginRight: '8px', cursor: 'pointer', fontSize: '1.1rem' }} onClick={() => toggleExtension('adblock')} title={activeExtensions.includes('adblock') ? "Smart AdBlock Active" : "AdBlock Disabled"}>🛡️</span>
                    <input 
                        type="text" 
                        value={activeTab.inputUrl} 
                        onChange={(e) => updateTab(activeTabId, { inputUrl: e.target.value })}
                        onKeyDown={handleKeyDown}
                        style={{ flex: 1, background: 'transparent', border: 'none', color: '#e8eaed', fontSize: '0.95rem', outline: 'none', fontFamily: 'sans-serif', width: '100%' }}
                    />
                    <span onClick={toggleBookmark} style={{ cursor: 'pointer', color: bookmarks.find(b => b.url === activeTab.url) ? '#fbbc04' : '#9aa0a6', fontSize: '1.1rem' }} title="Bookmark this page">⭐</span>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
                    <button onClick={() => setShowExtensions(!showExtensions)} style={{ background: 'transparent', border: 'none', color: '#e8eaed', cursor: 'pointer', fontSize: '1.2rem' }} title="Extensions">🧩</button>
                    {showExtensions && (
                        <div className="glass-panel gradient-border" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', borderRadius: '12px', padding: '8px', zIndex: 100, width: '250px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                            <h4 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '0.9rem', padding: '4px 8px' }}>Extensions</h4>
                            
                            <div onClick={() => toggleExtension('adblock')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', cursor: 'pointer', borderRadius: '4px', background: activeExtensions.includes('adblock') ? 'rgba(52,168,83,0.2)' : 'transparent' }} onMouseOver={e => e.currentTarget.style.background = activeExtensions.includes('adblock') ? 'rgba(52,168,83,0.3)' : 'rgba(255,255,255,0.05)'} onMouseOut={e => e.currentTarget.style.background = activeExtensions.includes('adblock') ? 'rgba(52,168,83,0.2)' : 'transparent'}>
                                <span>🛡️</span>
                                <span style={{ color: '#e8eaed', flex: 1, fontSize: '0.85rem' }}>Smart AdBlocker</span>
                                <input type="checkbox" checked={activeExtensions.includes('adblock')} readOnly style={{ accentColor: '#34a853' }} />
                            </div>
                            
                            <div onClick={() => toggleExtension('darkmode')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', cursor: 'pointer', borderRadius: '4px', background: activeExtensions.includes('darkmode') ? 'rgba(0,242,255,0.2)' : 'transparent' }} onMouseOver={e => e.currentTarget.style.background = activeExtensions.includes('darkmode') ? 'rgba(0,242,255,0.3)' : 'rgba(255,255,255,0.05)'} onMouseOut={e => e.currentTarget.style.background = activeExtensions.includes('darkmode') ? 'rgba(0,242,255,0.2)' : 'transparent'}>
                                <span>🌙</span>
                                <span style={{ color: '#e8eaed', flex: 1, fontSize: '0.85rem' }}>Dark Reader</span>
                                <input type="checkbox" checked={activeExtensions.includes('darkmode')} readOnly style={{ accentColor: '#00f2ff' }} />
                            </div>

                            <div onClick={() => { setShowNotes(!showNotes); setShowExtensions(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', cursor: 'pointer', borderRadius: '4px' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                <span>📝</span>
                                <span style={{ color: '#e8eaed', flex: 1, fontSize: '0.85rem' }}>Web Clipper / Notes</span>
                            </div>

                            <div onClick={() => { summarizePage(); setShowExtensions(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', cursor: 'pointer', borderRadius: '4px' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                <span>✨</span>
                                <span style={{ color: '#e8eaed', flex: 1, fontSize: '0.85rem' }}>AI Summarizer</span>
                            </div>
                        </div>
                    )}
                    <button onClick={() => setShowAssistant(!showAssistant)} style={{ background: showAssistant ? 'rgba(0,242,255,0.2)' : 'transparent', border: 'none', color: '#e8eaed', cursor: 'pointer', fontSize: '1.2rem', borderRadius: '50%', padding: '4px' }} title="AI Browser Assistant">🤖</button>
                </div>
            </div>

            {/* Bookmarks Bar */}
            {bookmarks.length > 0 && (
                <div style={{ display: 'flex', padding: '6px 16px', background: 'rgba(255,255,255,0.02)', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.85rem', color: '#e8eaed', overflowX: 'auto', whiteSpace: 'nowrap', scrollbarWidth: 'none', backdropFilter: 'blur(5px)' }}>
                    {bookmarks.map((b, i) => (
                        <div key={i} onClick={() => navigateTo(b.url)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>🔖 {b.title}</div>
                    ))}
                </div>
            )}

            {/* Browser Content Area */}
            <div style={{ flex: 1, display: 'flex', position: 'relative', background: '#fff', overflow: 'hidden' }}>
                
                {/* Main Iframe */}
                <div style={{ flex: 1, position: 'relative' }}>
                    {activeTab.isLoading && (
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: '#8ab4f8', animation: 'loading 1s infinite linear', zIndex: 10 }}>
                            <style>{`@keyframes loading { 0% { width: 0%; left: 0; } 50% { width: 50%; left: 25%; } 100% { width: 100%; left: 100%; } }`}</style>
                        </div>
                    )}

                    {summary.show && (
                        <div className="glass-panel gradient-border" style={{ position: 'absolute', top: 20, right: 20, width: '350px', borderRadius: '12px', padding: '16px', zIndex: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', color: '#e8eaed', maxHeight: '80%', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h3 style={{ margin: 0, fontSize: '1rem', color: '#fbc2eb', display: 'flex', alignItems: 'center', gap: '8px' }}>✨ AI Summary</h3>
                                <button onClick={() => setSummary({ ...summary, show: false })} style={{ background: 'none', border: 'none', color: '#9aa0a6', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                            </div>
                            {summary.loading ? (
                                <div style={{ color: '#8ab4f8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '16px', height: '16px', border: '2px solid #8ab4f8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                    Analyzing page content...
                                </div>
                            ) : (
                                <div className="markdown-body" style={{ fontSize: '0.9rem', color: '#ccc', lineHeight: '1.5' }}><Markdown>{summary.text}</Markdown></div>
                            )}
                        </div>
                    )}

                    {tabs.map(tab => (
                        <React.Fragment key={tab.id}>
                            {tab.isHome ? (
                                <div style={{ display: activeTabId === tab.id ? 'flex' : 'none', width: '100%', height: '100%' }}>
                                    <BrowserHome onNavigate={navigateTo} />
                                </div>
                            ) : (
                                <iframe 
                                    key={tab.id}
                                    src={`/api/proxy?url=${encodeURIComponent(tab.url)}${activeExtensions.includes('adblock') ? '&adblock=true' : ''}${activeExtensions.includes('darkmode') ? '&dark=true' : ''}`}
                                    onLoad={() => updateTab(tab.id, { isLoading: false })}
                                    style={{ width: '100%', height: '100%', border: 'none', display: activeTabId === tab.id ? 'block' : 'none' }} 
                                    title={`Browser Content ${tab.id}`}
                                    sandbox="allow-same-origin allow-scripts allow-forms"
                                />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Web Clipper / Notes Sidebar */}
                {showNotes && (
                    <div className="glass-panel-dark" style={{ width: '300px', borderLeft: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: '#e8eaed', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>📝 Web Clipper</h3>
                            <button onClick={() => setShowNotes(false)} style={{ background: 'none', border: 'none', color: '#9aa0a6', cursor: 'pointer' }}>✕</button>
                        </div>
                        <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <p style={{ color: '#9aa0a6', fontSize: '0.8rem', marginTop: 0 }}>Notes for: {activeTab.title}</p>
                            <textarea 
                                value={notes} 
                                onChange={e => setNotes(e.target.value)} 
                                placeholder="Type your notes here..." 
                                style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: '#e8eaed', resize: 'none', outline: 'none', fontFamily: 'sans-serif' }}
                            />
                        </div>
                    </div>
                )}

                {/* AI Assistant Sidebar */}
                {showAssistant && (
                    <div className="glass-panel-dark" style={{ width: '350px', borderLeft: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(90deg, rgba(0,242,255,0.1), transparent)' }}>
                            <h3 style={{ margin: 0, color: '#00f2ff', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>🤖 Browser Assistant</h3>
                            <button onClick={() => setShowAssistant(false)} style={{ background: 'none', border: 'none', color: '#9aa0a6', cursor: 'pointer' }}>✕</button>
                        </div>
                        
                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {assistantMessages.map((msg, i) => (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                    <div style={{ background: msg.role === 'user' ? 'rgba(0,242,255,0.8)' : 'rgba(255,255,255,0.1)', color: msg.role === 'user' ? '#000' : '#e8eaed', padding: '10px 14px', borderRadius: '12px', maxWidth: '85%', fontSize: '0.9rem', lineHeight: '1.4', backdropFilter: 'blur(10px)' }}>
                                        {msg.role === 'assistant' ? <div className="markdown-body" style={{ color: 'inherit', fontSize: 'inherit' }}><Markdown>{msg.text}</Markdown></div> : msg.text}
                                    </div>
                                </div>
                            ))}
                            {isAssistantTyping && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '10px 14px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', width: 'fit-content', backdropFilter: 'blur(10px)' }}>
                                    <div style={{ width: 6, height: 6, background: '#9aa0a6', borderRadius: '50%', animation: 'bounce 1s infinite' }} />
                                    <div style={{ width: 6, height: 6, background: '#9aa0a6', borderRadius: '50%', animation: 'bounce 1s infinite 0.2s' }} />
                                    <div style={{ width: 6, height: 6, background: '#9aa0a6', borderRadius: '50%', animation: 'bounce 1s infinite 0.4s' }} />
                                    <style>{`@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }`}</style>
                                </div>
                            )}
                        </div>

                        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input 
                                    type="text" 
                                    value={assistantInput} 
                                    onChange={e => setAssistantInput(e.target.value)} 
                                    onKeyDown={e => e.key === 'Enter' && handleAssistantSubmit()}
                                    placeholder="Ask about this page..." 
                                    style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '8px 16px', color: '#e8eaed', outline: 'none' }}
                                />
                                <button onClick={handleAssistantSubmit} disabled={isAssistantTyping || !assistantInput.trim()} style={{ background: '#00f2ff', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (isAssistantTyping || !assistantInput.trim()) ? 'not-allowed' : 'pointer', opacity: (isAssistantTyping || !assistantInput.trim()) ? 0.5 : 1 }}>
                                    ➤
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Fun Hub Components ---
function FunHubDashboard() {
    const [activeUrl, setActiveUrl] = useState<string | null>(null);

    const tools = [
        { id: 'aniwatch', title: 'Aniwatch', desc: 'Watch Anime Online', url: 'https://aniwatch.to', icon: '🍿' },
        { id: 'poki', title: 'Mini Games', desc: 'Play free online games', url: 'https://poki.com', icon: '🕹️' },
        { id: 'youtube', title: 'YouTube', desc: 'Watch Videos', url: 'https://www.youtube.com', icon: '▶️' },
        { id: 'twitch', title: 'Twitch', desc: 'Live Streaming', url: 'https://www.twitch.tv', icon: '🎮' },
        { id: 'wikipedia', title: 'Wikipedia', desc: 'Free Encyclopedia', url: 'https://en.wikipedia.org/wiki/Special:Random', icon: '📚' },
        { id: 'spotify', title: 'Spotify', desc: 'Web Player', url: 'https://open.spotify.com', icon: '🎵' },
        { id: 'reddit', title: 'Reddit', desc: 'Dive into anything', url: 'https://www.reddit.com', icon: '🤖' },
        { id: 'github', title: 'GitHub', desc: 'Where the world builds software', url: 'https://github.com', icon: '🐙' }
    ];

    if (activeUrl) {
        return <WebBrowser initialUrl={activeUrl} onClose={() => setActiveUrl(null)} />;
    }

    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 20 }}>
            {tools.map(t => (
                <div key={t.id} className="glass-panel gradient-border smooth-transition" style={{ padding: 24, borderRadius: 16, textAlign: "center", cursor: "pointer" }} onClick={() => setActiveUrl(t.url)} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div style={{ fontSize: "3rem", marginBottom: 16 }}>{t.icon}</div>
                    <h3 style={{ margin: "0 0 8px 0", color: '#fff' }}>{t.title}</h3>
                    <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>{t.desc}</p>
                </div>
            ))}
        </div>
    );
}

// --- AI Tools Components ---
function ImageGenerator({ onBack }: any) {
    const [prompt, setPrompt] = useState("");
    const [image, setImage] = useState("");
    const [loading, setLoading] = useState(false);

    const generate = async () => {
        if(!prompt) return;
        setLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: prompt,
            });
            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    setImage(`data:image/png;base64,${part.inlineData.data}`);
                    break;
                }
            }
        } catch (e) {
            console.error(e);
            alert("Failed to generate image.");
        }
        setLoading(false);
    };

    return (
        <div className="glass-panel gradient-border smooth-transition" style={{ padding: 32, borderRadius: 24, background: 'rgba(0,0,0,0.3)' }}>
            <button onClick={onBack} style={{ background: 'transparent', color: '#00f2ff', border: 'none', cursor: 'pointer', marginBottom: 24, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>← Back to Tools</button>
            <h2 style={{ color: '#fff', marginTop: 0, fontSize: '2rem', marginBottom: '8px' }}>🖼️ AI Image Studio</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: 32 }}>Generate high-quality product visuals and artistic concepts using Gemini 2.5 Flash.</p>
            
            <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
                <input 
                    value={prompt} 
                    onChange={e => setPrompt(e.target.value)} 
                    placeholder="Describe an image (e.g., A futuristic glowing sneaker)..." 
                    style={{ flex: 1, padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none' }} 
                />
                <button 
                    onClick={generate} 
                    disabled={loading} 
                    className="glow-button"
                    style={{ padding: '0 32px', background: '#00f2ff', color: '#000', border: 'none', borderRadius: 12, fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem' }}
                >
                    {loading ? 'Generating...' : 'Generate'}
                </button>
            </div>
            
            {image && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', background: 'rgba(0,0,0,0.4)', padding: 24, borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <img src={image} alt="Generated" style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 12, boxShadow: '0 20px 50px rgba(0,242,255,0.2)' }} />
                </motion.div>
            )}
        </div>
    );
}

function VisionAnalyzer({ onBack }: any) {
    const [image, setImage] = useState<string | null>(null);
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);

    const handleUpload = (e: any) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const analyze = async () => {
        if(!image) return;
        setLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            const base64Data = image.split(',')[1];
            const mimeType = image.split(';')[0].split(':')[1];
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: {
                    parts: [
                        { inlineData: { data: base64Data, mimeType } },
                        { text: "Analyze this image in the context of e-commerce. What product is this? What are its key features? Estimate a price range." }
                    ]
                }
            });
            setResult(response.text || "No result");
        } catch (e) {
            console.error(e);
            window.alert("Failed to analyze.");
        }
        setLoading(false);
    };

    return (
        <div className="glass-panel gradient-border smooth-transition" style={{ padding: 32, borderRadius: 24, background: 'rgba(0,0,0,0.3)' }}>
            <button onClick={onBack} style={{ background: 'transparent', color: '#00f2ff', border: 'none', cursor: 'pointer', marginBottom: 24, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>← Back to Tools</button>
            <h2 style={{ color: '#fff', marginTop: 0, fontSize: '2rem', marginBottom: '8px' }}>👁️ Product Vision Analyzer</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: 32 }}>Upload a product image to get deep AI insights, feature analysis, and price estimates.</p>
            
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 300px' }}>
                    <div style={{ border: '2px dashed rgba(255,255,255,0.1)', padding: 40, borderRadius: 20, textAlign: 'center', marginBottom: 24, background: 'rgba(255,255,255,0.02)', transition: 'all 0.3s' }}>
                        <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} id="vision-upload" />
                        <label htmlFor="vision-upload" className="glow-button" style={{ background: 'rgba(255,255,255,0.1)', padding: '12px 24px', borderRadius: 10, color: '#fff', cursor: 'pointer', display: 'inline-block', fontWeight: 'bold' }}>Choose Image</label>
                        {image && <motion.img initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} src={image} alt="Preview" style={{ marginTop: 24, maxWidth: '100%', maxHeight: 250, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }} />}
                    </div>
                    <button 
                        onClick={analyze} 
                        disabled={!image || loading} 
                        className="glow-button"
                        style={{ width: '100%', padding: 16, background: (!image || loading) ? 'rgba(255,255,255,0.05)' : '#00f2ff', color: (!image || loading) ? 'rgba(255,255,255,0.3)' : '#000', border: 'none', borderRadius: 12, fontWeight: 'bold', cursor: (!image || loading) ? 'not-allowed' : 'pointer', fontSize: '1.1rem' }}
                    >
                        {loading ? 'Analyzing...' : 'Analyze Product'}
                    </button>
                </div>
                <div className="glass-panel-dark" style={{ flex: '1 1 300px', padding: 32, borderRadius: 20, minHeight: 300 }}>
                    <h3 style={{ color: '#00f2ff', marginTop: 0, marginBottom: 20, fontSize: '1.3rem' }}>Analysis Result</h3>
                    {result ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="markdown-body" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', lineHeight: '1.7' }}>
                            <Markdown>{result}</Markdown>
                        </motion.div>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
                            Upload an image and click analyze to see details here.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function TTSGenerator({ onBack }: any) {
    const [text, setText] = useState("");
    const [audioUrl, setAudioUrl] = useState("");
    const [loading, setLoading] = useState(false);

    const generate = async () => {
        if(!text) return;
        setLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: text }] }],
                config: {
                    responseModalities: ["AUDIO"],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                    }
                }
            });
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                setAudioUrl(`data:audio/wav;base64,${base64Audio}`);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to generate audio.");
        }
        setLoading(false);
    };

    return (
        <div className="glass-panel gradient-border smooth-transition" style={{ padding: 32, borderRadius: 24, background: 'rgba(0,0,0,0.3)' }}>
            <button onClick={onBack} style={{ background: 'transparent', color: '#00f2ff', border: 'none', cursor: 'pointer', marginBottom: 24, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>← Back to Tools</button>
            <h2 style={{ color: '#fff', marginTop: 0, fontSize: '2rem', marginBottom: '8px' }}>🎙️ AI Voice Studio</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: 32 }}>Convert any text into high-quality, natural-sounding speech using Gemini TTS.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <textarea 
                    value={text} 
                    onChange={e => setText(e.target.value)} 
                    placeholder="Type your message here to convert to speech..." 
                    style={{ width: '100%', padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none', minHeight: '150px', fontSize: '1.1rem', lineHeight: '1.6' }} 
                />
                <button 
                    onClick={generate} 
                    disabled={loading || !text} 
                    className="glow-button"
                    style={{ padding: '16px 32px', background: '#00f2ff', color: '#000', border: 'none', borderRadius: 12, fontWeight: 'bold', cursor: (loading || !text) ? 'not-allowed' : 'pointer', fontSize: '1.1rem' }}
                >
                    {loading ? 'Synthesizing...' : 'Generate Speech'}
                </button>
            </div>
            
            {audioUrl && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 32, padding: 24, borderRadius: 20, background: 'rgba(0,242,255,0.05)', border: '1px solid rgba(0,242,255,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                    <div style={{ color: '#00f2ff', fontWeight: 'bold', fontSize: '1.1rem' }}>Audio Generated Successfully!</div>
                    <audio controls src={audioUrl} style={{ width: '100%', maxWidth: '400px' }} />
                </motion.div>
            )}
        </div>
    );
}

function GiftMatchmaker({ products, onBack }: any) {
    const [prompt, setPrompt] = useState("");
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);

    const findGift = async () => {
        if(!prompt) return;
        setLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            const catalog = products.map((p: any) => ({ name: p.name, price: p.price, desc: p.description })).slice(0, 20);
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `You are a gift matchmaker. Based on this user request: "${prompt}", recommend 2-3 products from our catalog. Catalog: ${JSON.stringify(catalog)}. Format nicely in Markdown.`,
            });
            setResult(response.text || "No result");
        } catch (e) {
            console.error(e);
            window.alert("Failed to find gifts.");
        }
        setLoading(false);
    };

    return (
        <div className="glass-panel gradient-border smooth-transition" style={{ padding: 32, borderRadius: 24, background: 'rgba(0,0,0,0.3)' }}>
            <button onClick={onBack} style={{ background: 'transparent', color: '#00f2ff', border: 'none', cursor: 'pointer', marginBottom: 24, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>← Back to Tools</button>
            <h2 style={{ color: '#fff', marginTop: 0, fontSize: '2rem', marginBottom: '8px' }}>🎁 AI Gift Matchmaker</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: 32 }}>Find the perfect gift from our catalog using personalized AI recommendations.</p>
            
            <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
                <input 
                    value={prompt} 
                    onChange={e => setPrompt(e.target.value)} 
                    placeholder="E.g., A gift for a 25yo gamer under NPR 100,000..." 
                    style={{ flex: 1, padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none' }} 
                />
                <button 
                    onClick={findGift} 
                    disabled={loading || !prompt} 
                    className="glow-button"
                    style={{ padding: '0 32px', background: '#00f2ff', color: '#000', border: 'none', borderRadius: 12, fontWeight: 'bold', cursor: (loading || !prompt) ? 'not-allowed' : 'pointer', fontSize: '1rem' }}
                >
                    {loading ? 'Searching...' : 'Find Gift'}
                </button>
            </div>
            
            {result && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel-dark" style={{ padding: 32, borderRadius: 20, color: '#e8eaed', lineHeight: '1.8' }}>
                    <div className="markdown-body" style={{ color: 'inherit', fontSize: '1.05rem' }}><Markdown>{result}</Markdown></div>
                </motion.div>
            )}
        </div>
    );
}

function VideoStudio({ onBack }: any) {
    const [prompt, setPrompt] = useState("");
    const [videoUri, setVideoUri] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");

    const generate = async () => {
        if(!prompt) return;
        setLoading(true);
        setStatus("Initializing video generation...");
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            let operation = await ai.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt: prompt,
                config: {
                    numberOfVideos: 1,
                    resolution: '720p',
                    aspectRatio: '16:9'
                }
            });
            
            while (!operation.done) {
                setStatus("Rendering video... This may take a few minutes.");
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await ai.operations.getVideosOperation({operation: operation});
            }
            
            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink) {
                setStatus("Downloading video...");
                const response = await fetch(downloadLink, {
                    method: 'GET',
                    headers: { 'x-goog-api-key': process.env.API_KEY || '' },
                });
                const blob = await response.blob();
                setVideoUri(URL.createObjectURL(blob));
                setStatus("Video generated successfully!");
            } else {
                setStatus("Failed to retrieve video.");
            }
        } catch (e) {
            console.error(e);
            setStatus("Error generating video. Make sure billing is enabled.");
        }
        setLoading(false);
    };

    return (
        <div className="glass-panel gradient-border smooth-transition" style={{ padding: 32, borderRadius: 24, background: 'rgba(0,0,0,0.3)' }}>
            <button onClick={onBack} style={{ background: 'transparent', color: '#00f2ff', border: 'none', cursor: 'pointer', marginBottom: 24, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>← Back to Tools</button>
            <h2 style={{ color: '#fff', marginTop: 0, fontSize: '2rem', marginBottom: '8px' }}>🎥 AI Video Studio</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: 32 }}>Create cinematic masterpieces with Veo 3.1. (Requires Billing Enabled API Key)</p>
            
            <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                <input 
                    value={prompt} 
                    onChange={e => setPrompt(e.target.value)} 
                    placeholder="A cinematic drone shot of a neon city on Mars..." 
                    style={{ flex: 1, padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none' }} 
                />
                <button 
                    onClick={generate} 
                    disabled={loading} 
                    className="glow-button"
                    style={{ padding: '0 32px', background: '#00f2ff', color: '#000', border: 'none', borderRadius: 12, fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem' }}
                >
                    {loading ? 'Generating...' : 'Generate'}
                </button>
            </div>
            
            {status && <div style={{ color: '#00f2ff', marginBottom: 24, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f2ff' }} />
                {status}
            </div>}
            
            {videoUri && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', background: 'rgba(0,0,0,0.4)', padding: 24, borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <video controls src={videoUri} style={{ maxWidth: '100%', borderRadius: 12, boxShadow: '0 20px 50px rgba(0,242,255,0.2)' }} />
                </motion.div>
            )}
        </div>
    );
}

function WebResearcher({ onBack }: any) {
    const [query, setQuery] = useState("");
    const [result, setResult] = useState("");
    const [sources, setSources] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const search = async () => {
        if(!query) return;
        setLoading(true);
        setResult("");
        setSources([]);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            const response = await ai.models.generateContent({
                model: 'gemini-3.1-pro-preview',
                contents: query,
                config: {
                    tools: [{ googleSearch: {} }]
                }
            });
            setResult(response.text || "No results found.");
            
            const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (chunks) {
                const extractedSources = chunks.map((c: any) => c.web).filter(Boolean);
                setSources(extractedSources);
            }
        } catch (e) {
            console.error(e);
            setResult("Failed to research.");
        }
        setLoading(false);
    };

    return (
        <div className="glass-panel gradient-border smooth-transition" style={{ padding: 32, borderRadius: 24, background: 'rgba(0,0,0,0.3)' }}>
            <button onClick={onBack} style={{ background: 'transparent', color: '#00f2ff', border: 'none', cursor: 'pointer', marginBottom: 24, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>← Back to Tools</button>
            <h2 style={{ color: '#fff', marginTop: 0, fontSize: '2rem', marginBottom: '8px' }}>🌐 Live Web Researcher</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: 32 }}>Real-time deep research across the entire web using Gemini 3.1 Pro.</p>
            
            <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
                <input 
                    value={query} 
                    onChange={e => setQuery(e.target.value)} 
                    placeholder="Research a current event or market trend..." 
                    style={{ flex: 1, padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none' }} 
                />
                <button 
                    onClick={search} 
                    disabled={loading} 
                    className="glow-button"
                    style={{ padding: '0 32px', background: '#00f2ff', color: '#000', border: 'none', borderRadius: 12, fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem' }}
                >
                    {loading ? 'Researching...' : 'Search'}
                </button>
            </div>
            
            {result && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel-dark" style={{ padding: 32, borderRadius: 20, color: '#e8eaed', lineHeight: '1.8' }}>
                    <div className="markdown-body" style={{ color: 'inherit', fontSize: '1.05rem' }}><Markdown>{result}</Markdown></div>
                    {sources.length > 0 && (
                        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <h4 style={{ color: '#00f2ff', margin: '0 0 16px 0', fontSize: '1.1rem' }}>Verified Sources:</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {sources.map((s, i) => (
                                    <a key={i} href={s.uri} target="_blank" rel="noreferrer" style={{ color: '#8ab4f8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
                                        <span style={{ color: 'rgba(255,255,255,0.3)' }}>[{i+1}]</span> {s.title}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}

function TravelPlanner({ onBack }: any) {
    const [query, setQuery] = useState("");
    const [result, setResult] = useState("");
    const [places, setPlaces] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const plan = async () => {
        if(!query) return;
        setLoading(true);
        setResult("");
        setPlaces([]);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: query,
                config: {
                    tools: [{ googleMaps: {} }]
                }
            });
            setResult(response.text || "No results found.");
            
            const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (chunks) {
                const extractedPlaces = chunks.map((c: any) => c.maps).filter(Boolean);
                setPlaces(extractedPlaces);
            }
        } catch (e) {
            console.error(e);
            setResult("Failed to plan travel.");
        }
        setLoading(false);
    };

    return (
        <div className="glass-panel gradient-border smooth-transition" style={{ padding: 32, borderRadius: 24, background: 'rgba(0,0,0,0.3)' }}>
            <button onClick={onBack} style={{ background: 'transparent', color: '#00f2ff', border: 'none', cursor: 'pointer', marginBottom: 24, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>← Back to Tools</button>
            <h2 style={{ color: '#fff', marginTop: 0, fontSize: '2rem', marginBottom: '8px' }}>🗺️ Smart Travel Planner</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: 32 }}>Plan your next adventure with real-time location data and expert AI itineraries.</p>
            
            <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
                <input 
                    value={query} 
                    onChange={e => setQuery(e.target.value)} 
                    placeholder="Plan a 3-day itinerary in Tokyo..." 
                    style={{ flex: 1, padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none' }} 
                />
                <button 
                    onClick={plan} 
                    disabled={loading} 
                    className="glow-button"
                    style={{ padding: '0 32px', background: '#00f2ff', color: '#000', border: 'none', borderRadius: 12, fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem' }}
                >
                    {loading ? 'Planning...' : 'Plan Trip'}
                </button>
            </div>
            
            {result && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel-dark" style={{ padding: 32, borderRadius: 20, color: '#e8eaed', lineHeight: '1.8' }}>
                    <div className="markdown-body" style={{ color: 'inherit', fontSize: '1.05rem' }}><Markdown>{result}</Markdown></div>
                    {places.length > 0 && (
                        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <h4 style={{ color: '#00f2ff', margin: '0 0 16px 0', fontSize: '1.1rem' }}>Explore on Maps:</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                                {places.map((p, i) => (
                                    <a key={i} href={p.uri} target="_blank" rel="noreferrer" className="glass-panel smooth-transition" style={{ padding: '10px 20px', borderRadius: 10, color: '#8ab4f8', textDecoration: 'none', fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        📍 {p.title || p.uri}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}

function WebAppBuilder({ onBack }: any) {
    const [prompt, setPrompt] = useState("");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);

    const buildApp = async () => {
        if(!prompt) return;
        setLoading(true);
        setCode("");
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            const response = await ai.models.generateContent({
                model: 'gemini-3.1-pro-preview',
                contents: `Write a single HTML file containing HTML, CSS, and JS to build the following: ${prompt}. Return ONLY the raw HTML code without markdown formatting or backticks.`,
            });
            let rawCode = response.text || "";
            rawCode = rawCode.replace(/^```html/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
            setCode(rawCode);
        } catch (e) {
            console.error(e);
            alert("Failed to build app.");
        }
        setLoading(false);
    };

    return (
        <div className="glass-panel gradient-border smooth-transition" style={{ padding: 32, borderRadius: 24, background: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', height: '80vh' }}>
            <button onClick={onBack} style={{ background: 'transparent', color: '#00f2ff', border: 'none', cursor: 'pointer', marginBottom: 24, fontSize: '1rem', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px' }}>← Back to Tools</button>
            <h2 style={{ color: '#fff', marginTop: 0, fontSize: '2rem', marginBottom: '8px' }}>💻 Instant Web App Builder</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: 32 }}>Describe any web application and watch Gemini 3.1 Pro build it instantly.</p>
            
            <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
                <input 
                    value={prompt} 
                    onChange={e => setPrompt(e.target.value)} 
                    placeholder="Build a working calculator with a neon pink theme..." 
                    style={{ flex: 1, padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none' }} 
                />
                <button 
                    onClick={buildApp} 
                    disabled={loading} 
                    className="glow-button"
                    style={{ padding: '0 32px', background: '#00f2ff', color: '#000', border: 'none', borderRadius: 12, fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem' }}
                >
                    {loading ? 'Building...' : 'Build App'}
                </button>
            </div>
            
            <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                {code ? (
                    <iframe srcDoc={code} style={{ width: '100%', height: '100%', border: 'none' }} title="Generated App" sandbox="allow-scripts allow-same-origin" />
                ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: 40 }}>
                        {loading ? 'Assembling components and writing logic...' : 'Describe an app and click build to see the result here.'}
                    </div>
                )}
            </div>
        </div>
    );
}

function ImageEditor({ onBack }: any) {
    const [image, setImage] = useState<string | null>(null);
    const [mimeType, setMimeType] = useState<string>("");
    const [prompt, setPrompt] = useState("");
    const [resultImage, setResultImage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleUpload = (e: any) => {
        const file = e.target.files[0];
        if (file) {
            setMimeType(file.type);
            const reader = new FileReader();
            reader.onloadend = () => setImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const editImage = async () => {
        if(!image || !prompt) return;
        setLoading(true);
        setResultImage("");
        try {
            const base64Data = image.split(',')[1];
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [
                        { inlineData: { data: base64Data, mimeType: mimeType } },
                        { text: prompt }
                    ]
                }
            });
            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    setResultImage(`data:image/png;base64,${part.inlineData.data}`);
                    break;
                }
            }
        } catch (e) {
            console.error(e);
            alert("Failed to edit image.");
        }
        setLoading(false);
    };

    return (
        <div style={{ background: '#111', padding: 30, borderRadius: 16, border: '1px solid #333' }}>
            <button onClick={onBack} style={{ background: 'transparent', color: '#00f2ff', border: 'none', cursor: 'pointer', marginBottom: 20, fontSize: '1rem' }}>← Back to Tools</button>
            <h2 style={{ color: '#fff', marginTop: 0 }}>🪄 AI Image Editor</h2>
            
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 300px' }}>
                    <div style={{ background: '#222', border: '2px dashed #444', borderRadius: 12, padding: 40, textAlign: 'center', marginBottom: 20, position: 'relative' }}>
                        {image ? (
                            <img src={image} alt="Original" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8 }} />
                        ) : (
                            <div style={{ color: '#888' }}>
                                <div style={{ fontSize: '3rem', marginBottom: 10 }}>📸</div>
                                <div>Upload an image to edit</div>
                            </div>
                        )}
                        <input type="file" accept="image/*" onChange={handleUpload} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                    </div>
                    
                    <div style={{ display: 'flex', gap: 12 }}>
                        <input value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="e.g., Change the background to a snowy mountain..." style={{ flex: 1, padding: 14, borderRadius: 8, background: '#222', border: '1px solid #444', color: '#fff' }} />
                        <button onClick={editImage} disabled={loading || !image || !prompt} style={{ padding: '0 24px', background: '#00f2ff', color: '#000', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: (loading || !image || !prompt) ? 'not-allowed' : 'pointer' }}>{loading ? 'Editing...' : 'Edit Image'}</button>
                    </div>
                </div>
                
                {resultImage && (
                    <div style={{ flex: '1 1 300px', textAlign: 'center', background: '#0a0a0a', padding: 20, borderRadius: 12 }}>
                        <h4 style={{ color: '#00f2ff', marginTop: 0 }}>Result</h4>
                        <img src={resultImage} alt="Edited" style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8, boxShadow: '0 10px 30px rgba(0,242,255,0.2)' }} />
                    </div>
                )}
            </div>
        </div>
    );
}

function AudioDubber({ onBack }: any) {
    const [text, setText] = useState("");
    const [language, setLanguage] = useState("Spanish");
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const dub = async () => {
        if(!text) return;
        setLoading(true);
        setAudioUrl(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            const prompt = `Translate the following text to ${language} and read it naturally: "${text}"`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-preview-tts',
                contents: [{ parts: [{ text: prompt }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Kore' }
                        }
                    }
                }
            });
            
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                const audioBlob = await fetch(`data:audio/wav;base64,${base64Audio}`).then(r => r.blob());
                setAudioUrl(URL.createObjectURL(audioBlob));
            }
        } catch (e) {
            console.error(e);
            alert("Failed to generate dubbed audio.");
        }
        setLoading(false);
    };

    return (
        <div className="glass-panel gradient-border smooth-transition" style={{ padding: 32, borderRadius: 24, background: 'rgba(0,0,0,0.3)' }}>
            <button onClick={onBack} style={{ background: 'transparent', color: '#00f2ff', border: 'none', cursor: 'pointer', marginBottom: 24, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>← Back to Tools</button>
            <h2 style={{ color: '#fff', marginTop: 0, fontSize: '2rem', marginBottom: '8px' }}>🗣️ Multilingual Audio Dubber</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: 32 }}>Translate and dub your text into multiple languages with realistic AI voices.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 32 }}>
                <textarea 
                    value={text} 
                    onChange={e => setText(e.target.value)} 
                    placeholder="Enter text in English to translate and dub..." 
                    style={{ width: '100%', height: 150, padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', resize: 'none', outline: 'none', fontSize: '1rem', lineHeight: '1.6' }} 
                />
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <select 
                        value={language} 
                        onChange={e => setLanguage(e.target.value)} 
                        style={{ padding: '0 20px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', flex: 1, outline: 'none', cursor: 'pointer', height: '56px' }}
                    >
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="Japanese">Japanese</option>
                        <option value="German">German</option>
                        <option value="Italian">Italian</option>
                        <option value="Hindi">Hindi</option>
                    </select>
                    <button 
                        onClick={dub} 
                        disabled={loading || !text} 
                        className="glow-button"
                        style={{ padding: '0 40px', background: '#00f2ff', color: '#000', border: 'none', borderRadius: 12, fontWeight: 'bold', cursor: (loading || !text) ? 'not-allowed' : 'pointer', height: '56px', fontSize: '1rem' }}
                    >
                        {loading ? 'Dubbing...' : 'Translate & Dub'}
                    </button>
                </div>
            </div>
            
            {audioUrl && (
                <div className="glass-panel-dark" style={{ padding: 32, borderRadius: 20, textAlign: 'center' }}>
                    <h4 style={{ color: '#00f2ff', margin: '0 0 20px 0', fontSize: '1.1rem' }}>Dubbed Audio ({language})</h4>
                    <audio controls src={audioUrl} style={{ width: '100%', borderRadius: '12px' }} />
                </div>
            )}
        </div>
    );
}

function LiveAudioAssistant({ onBack }: any) {
    const [isConnected, setIsConnected] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [status, setStatus] = useState("Disconnected");
    const sessionRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const connect = async () => {
        try {
            setStatus("Connecting...");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            
            const sessionPromise = ai.live.connect({
                model: "gemini-2.5-flash-native-audio-preview-09-2025",
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
                    },
                    systemInstruction: "You are a futuristic AI assistant in a 3D e-commerce universe. Be concise, friendly, and helpful.",
                },
                callbacks: {
                    onopen: async () => {
                        setIsConnected(true);
                        setStatus("Connected. Listening...");
                        
                        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                        const source = audioContextRef.current!.createMediaStreamSource(streamRef.current);
                        processorRef.current = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        
                        processorRef.current.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            const pcm16 = new Int16Array(inputData.length);
                            for (let i = 0; i < inputData.length; i++) {
                                let s = Math.max(-1, Math.min(1, inputData[i]));
                                pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                            }
                            
                            const buffer = new ArrayBuffer(pcm16.length * 2);
                            const view = new DataView(buffer);
                            for (let i = 0; i < pcm16.length; i++) {
                                view.setInt16(i * 2, pcm16[i], true);
                            }
                            
                            let binary = '';
                            const bytes = new Uint8Array(buffer);
                            for (let i = 0; i < bytes.byteLength; i++) {
                                binary += String.fromCharCode(bytes[i]);
                            }
                            const base64Data = btoa(binary);
                            
                            sessionPromise.then((session: any) => {
                                session.sendRealtimeInput({
                                    media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                                });
                            });
                        };
                        
                        source.connect(processorRef.current);
                        processorRef.current.connect(audioContextRef.current!.destination);
                    },
                    onmessage: async (message: any) => {
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio) {
                            setIsSpeaking(true);
                            const binaryString = atob(base64Audio);
                            const len = binaryString.length;
                            const bytes = new Uint8Array(len);
                            for (let i = 0; i < len; i++) {
                                bytes[i] = binaryString.charCodeAt(i);
                            }
                            
                            const int16Array = new Int16Array(bytes.buffer);
                            const float32Array = new Float32Array(int16Array.length);
                            for (let i = 0; i < int16Array.length; i++) {
                                float32Array[i] = int16Array[i] / 32768.0;
                            }
                            
                            const audioBuffer = audioContextRef.current!.createBuffer(1, float32Array.length, 24000);
                            audioBuffer.getChannelData(0).set(float32Array);
                            
                            const source = audioContextRef.current!.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(audioContextRef.current!.destination);
                            source.onended = () => setIsSpeaking(false);
                            source.start();
                        }
                    },
                    onclose: () => disconnect(),
                    onerror: (e: any) => {
                        console.error(e);
                        setStatus("Error occurred.");
                        disconnect();
                    }
                }
            });
            sessionRef.current = sessionPromise;
        } catch (e) {
            console.error(e);
            setStatus("Failed to connect.");
        }
    };

    const disconnect = () => {
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (sessionRef.current) {
            sessionRef.current.then((s: any) => s.close());
            sessionRef.current = null;
        }
        setIsConnected(false);
        setIsSpeaking(false);
        setStatus("Disconnected");
    };

    useEffect(() => {
        return () => disconnect();
    }, []);

    return (
        <div className="glass-panel gradient-border smooth-transition" style={{ padding: 32, borderRadius: 24, background: 'rgba(0,0,0,0.3)', textAlign: 'center' }}>
            <button onClick={onBack} style={{ background: 'transparent', color: '#00f2ff', border: 'none', cursor: 'pointer', marginBottom: 24, fontSize: '1rem', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px' }}>← Back to Tools</button>
            <h2 style={{ color: '#fff', marginTop: 0, fontSize: '2rem', marginBottom: '8px' }}>🎙️ Live Voice Assistant</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: 40 }}>Talk to the AI in real-time with ultra-low latency.</p>
            
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 250, marginBottom: 40 }}>
                <motion.div 
                    animate={{ 
                        scale: isSpeaking ? [1, 1.1, 1] : 1,
                        boxShadow: isConnected ? `0 0 ${isSpeaking ? '60px' : '30px'} ${isSpeaking ? '#00f2ff' : '#34a853'}` : '0 0 0px rgba(0,0,0,0)'
                    }}
                    transition={{ repeat: isSpeaking ? Infinity : 0, duration: 1.5 }}
                    style={{ 
                        width: 180, height: 180, borderRadius: '50%', 
                        background: isConnected ? (isSpeaking ? '#00f2ff' : '#34a853') : 'rgba(255,255,255,0.05)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        transition: 'all 0.3s ease', cursor: 'pointer',
                        border: '2px solid rgba(255,255,255,0.1)'
                    }} 
                    onClick={isConnected ? disconnect : connect}
                >
                    <span style={{ fontSize: '5rem' }}>{isConnected ? (isSpeaking ? '🔊' : '👂') : '🎤'}</span>
                </motion.div>
            </div>
            
            <div style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 'bold', marginBottom: 24, letterSpacing: '0.05em' }}>{status}</div>
            <button 
                onClick={isConnected ? disconnect : connect} 
                className={isConnected ? "" : "glow-button"}
                style={{ 
                    padding: '16px 48px', 
                    background: isConnected ? 'rgba(255,68,68,0.2)' : '#00f2ff', 
                    color: isConnected ? '#ff4444' : '#000', 
                    border: isConnected ? '1px solid #ff4444' : 'none', 
                    borderRadius: 30, 
                    fontWeight: 'bold', 
                    cursor: 'pointer', 
                    fontSize: '1.1rem',
                    transition: 'all 0.3s ease'
                }}
            >
                {isConnected ? 'End Call' : 'Start Call'}
            </button>
        </div>
    );
}

function VirtualTryOn({ products, onBack }: any) {
    const [userImage, setUserImage] = useState<string | null>(null);
    const [mimeType, setMimeType] = useState<string>("");
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [resultImage, setResultImage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleUpload = (e: any) => {
        const file = e.target.files[0];
        if (file) {
            setMimeType(file.type);
            const reader = new FileReader();
            reader.onloadend = () => setUserImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const tryOn = async () => {
        if(!userImage || !selectedProduct) return;
        setLoading(true);
        setResultImage("");
        try {
            const base64Data = userImage.split(',')[1];
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            const prompt = `Realistically edit this image so the person is wearing the following clothing item: ${selectedProduct.name}. The clothing is described as: ${selectedProduct.description}. Ensure lighting, shadows, and body proportions match perfectly.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [
                        { inlineData: { data: base64Data, mimeType: mimeType } },
                        { text: prompt }
                    ]
                }
            });
            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    setResultImage(`data:image/png;base64,${part.inlineData.data}`);
                    break;
                }
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    return (
        <div className="glass-panel gradient-border smooth-transition" style={{ padding: 32, borderRadius: 24, background: 'rgba(0,0,0,0.3)' }}>
            <button onClick={onBack} style={{ background: 'transparent', color: '#00f2ff', border: 'none', cursor: 'pointer', marginBottom: 24, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>← Back to Tools</button>
            <h2 style={{ color: '#fff', marginTop: 0, fontSize: '2rem', marginBottom: '8px' }}>👗 Smart Virtual Try-On</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: 32 }}>Upload your photo and see how any clothing item looks on you instantly.</p>
            
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 350px' }}>
                    <div className="glass-panel-dark smooth-transition" style={{ border: '2px dashed rgba(255,255,255,0.1)', borderRadius: 20, padding: 40, textAlign: 'center', marginBottom: 24, position: 'relative', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {userImage ? (
                            <img src={userImage} alt="User" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 12 }} />
                        ) : (
                            <div style={{ color: 'rgba(255,255,255,0.3)' }}>
                                <div style={{ fontSize: '4rem', marginBottom: 16 }}>👤</div>
                                <div style={{ fontSize: '1.1rem' }}>Drop photo here or click to upload</div>
                            </div>
                        )}
                        <input type="file" accept="image/*" onChange={handleUpload} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                    </div>
                    
                    <select 
                        value={selectedProduct?.id || ""} 
                        onChange={e => setSelectedProduct(products.find((p: any) => p.id === e.target.value))}
                        style={{ width: '100%', padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', marginBottom: 16, outline: 'none', cursor: 'pointer' }}
                    >
                        <option value="">Select a clothing item to try on...</option>
                        {products.filter((p: any) => p.category === 'fashion').map((p: any) => (
                            <option key={p.id} value={p.id}>{p.name} - ${p.price}</option>
                        ))}
                    </select>

                    <button 
                        onClick={tryOn} 
                        disabled={loading || !userImage || !selectedProduct} 
                        className="glow-button"
                        style={{ width: '100%', padding: '16px', background: '#00f2ff', color: '#000', border: 'none', borderRadius: 12, fontWeight: 'bold', cursor: (loading || !userImage || !selectedProduct) ? 'not-allowed' : 'pointer', fontSize: '1rem' }}
                    >
                        {loading ? 'Fitting...' : 'Virtual Try-On'}
                    </button>
                </div>
                
                {resultImage && (
                    <div className="glass-panel-dark" style={{ flex: '1 1 350px', textAlign: 'center', padding: 32, borderRadius: 20 }}>
                        <h4 style={{ color: '#00f2ff', marginTop: 0, marginBottom: 24, fontSize: '1.2rem' }}>Fitting Result</h4>
                        <motion.img 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            src={resultImage} 
                            alt="Try-On Result" 
                            style={{ maxWidth: '100%', maxHeight: 450, borderRadius: 16, boxShadow: '0 20px 50px rgba(0,242,255,0.15)' }} 
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

function DataAnalyst({ onBack }: any) {
    const [rawData, setRawData] = useState("");
    const [chartData, setChartData] = useState<any[]>([]);
    const [analysis, setAnalysis] = useState("");
    const [loading, setLoading] = useState(false);

    const analyze = async () => {
        if(!rawData) return;
        setLoading(true);
        setChartData([]);
        setAnalysis("");
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            const prompt = `Analyze the following raw data. 
            1. Provide a brief 2-sentence summary of the trends.
            2. Convert the data into a valid JSON array of objects suitable for a Recharts BarChart. Each object should have a 'name' (string) and a 'value' (number).
            Return ONLY the JSON array inside a \`\`\`json block, and the summary text outside it.
            
            Data:
            ${rawData}`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-3.1-pro-preview',
                contents: prompt
            });
            
            const text = response.text || "";
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                setChartData(JSON.parse(jsonMatch[1]));
                setAnalysis(text.replace(jsonMatch[0], '').trim());
            } else {
                setAnalysis(text);
            }
        } catch (e) {
            console.error(e);
            setAnalysis("Failed to analyze data.");
        }
        setLoading(false);
    };

    return (
        <div className="glass-panel gradient-border smooth-transition" style={{ padding: 32, borderRadius: 24, background: 'rgba(0,0,0,0.3)' }}>
            <button onClick={onBack} style={{ background: 'transparent', color: '#00f2ff', border: 'none', cursor: 'pointer', marginBottom: 24, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>← Back to Tools</button>
            <h2 style={{ color: '#fff', marginTop: 0, fontSize: '2rem', marginBottom: '8px' }}>📊 AI Data Analyst</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: 32 }}>Transform raw data into actionable insights and beautiful visualizations.</p>
            
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <textarea 
                        value={rawData} 
                        onChange={e => setRawData(e.target.value)} 
                        placeholder="Paste raw data, CSV, or sales numbers here..." 
                        style={{ width: '100%', height: 250, padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', resize: 'none', fontFamily: 'monospace', outline: 'none', fontSize: '0.9rem', lineHeight: '1.6' }} 
                    />
                    <button 
                        onClick={analyze} 
                        disabled={loading || !rawData} 
                        className="glow-button"
                        style={{ padding: '16px', background: '#00f2ff', color: '#000', border: 'none', borderRadius: 12, fontWeight: 'bold', cursor: (loading || !rawData) ? 'not-allowed' : 'pointer', fontSize: '1rem' }}
                    >
                        {loading ? 'Analyzing...' : 'Analyze & Chart'}
                    </button>
                </div>
                
                {(chartData.length > 0 || analysis) && (
                    <div className="glass-panel-dark" style={{ flex: '1 1 450px', padding: 32, borderRadius: 20 }}>
                        {analysis && <div className="markdown-body" style={{ color: '#e8eaed', marginBottom: 32 }}><Markdown>{analysis}</Markdown></div>}
                        {chartData.length > 0 && (
                            <div style={{ width: '100%', height: 350 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip 
                                            contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, backdropFilter: 'blur(10px)' }}
                                            itemStyle={{ color: '#00f2ff' }}
                                        />
                                        <Bar dataKey="value" fill="#00f2ff" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function AISongwriter({ onBack }: any) {
    const [topic, setTopic] = useState("");
    const [genre, setGenre] = useState("Pop");
    const [lyrics, setLyrics] = useState("");
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const generate = async () => {
        if(!topic) return;
        setLoading(true);
        setLyrics("");
        setAudioUrl(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            
            // Generate Lyrics
            const lyricsResponse = await ai.models.generateContent({
                model: 'gemini-3.1-pro-preview',
                contents: `Write a short, catchy 2-verse song about ${topic} in the style of ${genre}. Do not include stage directions like [Verse 1], just the raw lyrics. Make it rhyme well.`,
            });
            const generatedLyrics = lyricsResponse.text || "";
            setLyrics(generatedLyrics);

            // Generate Audio (Spoken Word/Rap style)
            const audioResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-preview-tts',
                contents: [{ parts: [{ text: `Read this like a rhythmic poem or rap: ${generatedLyrics}` }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
                    }
                }
            });
            
            const base64Audio = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                const audioBlob = await fetch(`data:audio/wav;base64,${base64Audio}`).then(r => r.blob());
                setAudioUrl(URL.createObjectURL(audioBlob));
            }
        } catch (e) {
            console.error(e);
            alert("Failed to generate song.");
        }
        setLoading(false);
    };

    return (
        <div className="glass-panel gradient-border smooth-transition" style={{ padding: 32, borderRadius: 24, background: 'rgba(0,0,0,0.3)' }}>
            <button onClick={onBack} style={{ background: 'transparent', color: '#00f2ff', border: 'none', cursor: 'pointer', marginBottom: 24, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>← Back to Tools</button>
            <h2 style={{ color: '#fff', marginTop: 0, fontSize: '2rem', marginBottom: '8px' }}>🎵 AI Songwriter & Rapper</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: 32 }}>Generate lyrics and high-quality vocal performances in any genre.</p>
            
            <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
                <input 
                    value={topic} 
                    onChange={e => setTopic(e.target.value)} 
                    placeholder="What should the song be about? (e.g., coding late at night)" 
                    style={{ flex: 1, minWidth: '300px', padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none' }} 
                />
                <select 
                    value={genre} 
                    onChange={e => setGenre(e.target.value)} 
                    style={{ padding: '0 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none', cursor: 'pointer' }}
                >
                    <option value="Rap">Rap</option>
                    <option value="Pop">Pop</option>
                    <option value="Country">Country</option>
                    <option value="Rock">Rock</option>
                </select>
                <button 
                    onClick={generate} 
                    disabled={loading || !topic} 
                    className="glow-button"
                    style={{ padding: '0 32px', background: '#00f2ff', color: '#000', border: 'none', borderRadius: 12, fontWeight: 'bold', cursor: (loading || !topic) ? 'not-allowed' : 'pointer', height: '56px' }}
                >
                    {loading ? 'Writing...' : 'Generate Song'}
                </button>
            </div>
            
            {(lyrics || audioUrl) && (
                <div className="glass-panel-dark" style={{ padding: 32, borderRadius: 20, textAlign: 'center' }}>
                    {audioUrl && (
                        <div style={{ marginBottom: 32 }}>
                            <h4 style={{ color: '#00f2ff', margin: '0 0 16px 0', fontSize: '1.1rem' }}>AI Vocal Performance</h4>
                            <audio controls src={audioUrl} style={{ width: '100%', borderRadius: '12px' }} />
                        </div>
                    )}
                    {lyrics && (
                        <div style={{ whiteSpace: 'pre-wrap', color: '#e8eaed', fontStyle: 'italic', fontSize: '1.2rem', lineHeight: '1.8', maxWidth: '800px', margin: '0 auto' }}>
                            "{lyrics}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function CodeReviewer({ onBack }: any) {
    const [code, setCode] = useState("");
    const [review, setReview] = useState("");
    const [loading, setLoading] = useState(false);

    const analyze = async () => {
        if(!code) return;
        setLoading(true);
        setReview("");
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            const response = await ai.models.generateContent({
                model: 'gemini-3.1-pro-preview',
                contents: `Act as a Senior Principal Software Engineer. Review the following code for bugs, security vulnerabilities, and performance issues. Be concise and provide actionable fixes.\n\nCode:\n${code}`,
            });
            setReview(response.text || "No review generated.");
        } catch (e) {
            console.error(e);
            setReview("Failed to review code.");
        }
        setLoading(false);
    };

    return (
        <div className="glass-panel gradient-border smooth-transition" style={{ padding: 32, borderRadius: 24, background: 'rgba(0,0,0,0.3)' }}>
            <button onClick={onBack} style={{ background: 'transparent', color: '#00f2ff', border: 'none', cursor: 'pointer', marginBottom: 24, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>← Back to Tools</button>
            <h2 style={{ color: '#fff', marginTop: 0, fontSize: '2rem', marginBottom: '8px' }}>💻 AI Code Reviewer</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: 32 }}>Senior-level code auditing for security, performance, and best practices.</p>
            
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <textarea 
                        value={code} 
                        onChange={e => setCode(e.target.value)} 
                        placeholder="Paste your JavaScript, Python, React, or any code here..." 
                        style={{ width: '100%', height: 400, padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#00f2ff', resize: 'none', fontFamily: 'monospace', outline: 'none', fontSize: '0.9rem', lineHeight: '1.6' }} 
                    />
                    <button 
                        onClick={analyze} 
                        disabled={loading || !code} 
                        className="glow-button"
                        style={{ padding: '16px', background: '#00f2ff', color: '#000', border: 'none', borderRadius: 12, fontWeight: 'bold', cursor: (loading || !code) ? 'not-allowed' : 'pointer', fontSize: '1rem' }}
                    >
                        {loading ? 'Analyzing...' : 'Review Code'}
                    </button>
                </div>
                
                {review && (
                    <div className="glass-panel-dark" style={{ flex: '1 1 400px', padding: 32, borderRadius: 20, color: '#e8eaed', maxHeight: 500, overflowY: 'auto' }}>
                        <div className="markdown-body" style={{ color: 'inherit' }}><Markdown>{review}</Markdown></div>
                    </div>
                )}
            </div>
        </div>
    );
}

function ResumeTailor({ onBack }: any) {
    const [resume, setResume] = useState("");
    const [jobDesc, setJobDesc] = useState("");
    const [tailoredResume, setTailoredResume] = useState("");
    const [loading, setLoading] = useState(false);

    const tailor = async () => {
        if(!resume || !jobDesc) return;
        setLoading(true);
        setTailoredResume("");
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            const response = await ai.models.generateContent({
                model: 'gemini-3.1-pro-preview',
                contents: `Act as an expert career coach. Rewrite the provided resume to perfectly match the provided job description. Highlight relevant skills and use strong action verbs. Format the output cleanly in Markdown.\n\nJob Description:\n${jobDesc}\n\nOriginal Resume:\n${resume}`,
            });
            setTailoredResume(response.text || "Failed to tailor resume.");
        } catch (e) {
            console.error(e);
            setTailoredResume("Error tailoring resume.");
        }
        setLoading(false);
    };

    return (
        <div className="glass-panel gradient-border smooth-transition" style={{ padding: 32, borderRadius: 24, background: 'rgba(0,0,0,0.3)' }}>
            <button onClick={onBack} style={{ background: 'transparent', color: '#00f2ff', border: 'none', cursor: 'pointer', marginBottom: 24, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>← Back to Tools</button>
            <h2 style={{ color: '#fff', marginTop: 0, fontSize: '2rem', marginBottom: '8px' }}>📄 AI Resume Tailor</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: 32 }}>Optimize your resume for any job description using advanced AI analysis.</p>
            
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <textarea 
                        value={resume} 
                        onChange={e => setResume(e.target.value)} 
                        placeholder="Paste your current resume here..." 
                        style={{ width: '100%', height: 200, padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', resize: 'none', outline: 'none' }} 
                    />
                    <textarea 
                        value={jobDesc} 
                        onChange={e => setJobDesc(e.target.value)} 
                        placeholder="Paste the Job Description here..." 
                        style={{ width: '100%', height: 200, padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', resize: 'none', outline: 'none' }} 
                    />
                    <button 
                        onClick={tailor} 
                        disabled={loading || !resume || !jobDesc} 
                        className="glow-button"
                        style={{ padding: '16px', background: '#00f2ff', color: '#000', border: 'none', borderRadius: 12, fontWeight: 'bold', cursor: (loading || !resume || !jobDesc) ? 'not-allowed' : 'pointer', fontSize: '1rem' }}
                    >
                        {loading ? 'Tailoring...' : 'Tailor Resume'}
                    </button>
                </div>
                
                {tailoredResume && (
                    <div className="glass-panel-dark" style={{ flex: '1 1 400px', padding: 32, borderRadius: 20, color: '#e8eaed', maxHeight: 600, overflowY: 'auto' }}>
                        <div className="markdown-body" style={{ color: 'inherit' }}><Markdown>{tailoredResume}</Markdown></div>
                    </div>
                )}
            </div>
        </div>
    );
}

function InteriorDesigner({ onBack }: any) {
    const [image, setImage] = useState<string | null>(null);
    const [mimeType, setMimeType] = useState<string>("");
    const [style, setStyle] = useState("Cyberpunk");
    const [resultImage, setResultImage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleUpload = (e: any) => {
        const file = e.target.files[0];
        if (file) {
            setMimeType(file.type);
            const reader = new FileReader();
            reader.onloadend = () => setImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const design = async () => {
        if(!image) return;
        setLoading(true);
        setResultImage("");
        try {
            const base64Data = image.split(',')[1];
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            const prompt = `Redesign this room interior in a highly detailed ${style} style. Keep the basic structure of the room but change the furniture, lighting, and decor to match the ${style} aesthetic perfectly.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [
                        { inlineData: { data: base64Data, mimeType: mimeType } },
                        { text: prompt }
                    ]
                }
            });
            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    setResultImage(`data:image/png;base64,${part.inlineData.data}`);
                    break;
                }
            }
        } catch (e) {
            console.error(e);
            alert("Failed to redesign room.");
        }
        setLoading(false);
    };

    return (
        <div className="glass-panel gradient-border smooth-transition" style={{ padding: 32, borderRadius: 24, background: 'rgba(0,0,0,0.3)' }}>
            <button onClick={onBack} style={{ background: 'transparent', color: '#00f2ff', border: 'none', cursor: 'pointer', marginBottom: 24, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>← Back to Tools</button>
            <h2 style={{ color: '#fff', marginTop: 0, fontSize: '2rem', marginBottom: '8px' }}>👁️ AI Interior Designer</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: 32 }}>Upload a photo of your space and let AI reimagine it in any style.</p>
            
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 350px' }}>
                    <div className="glass-panel-dark smooth-transition" style={{ border: '2px dashed rgba(255,255,255,0.1)', borderRadius: 20, padding: 40, textAlign: 'center', marginBottom: 24, position: 'relative', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {image ? (
                            <img src={image} alt="Original Room" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 12 }} />
                        ) : (
                            <div style={{ color: 'rgba(255,255,255,0.3)' }}>
                                <div style={{ fontSize: '4rem', marginBottom: 16 }}>🛋️</div>
                                <div style={{ fontSize: '1.1rem' }}>Drop photo here or click to upload</div>
                            </div>
                        )}
                        <input type="file" accept="image/*" onChange={handleUpload} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                    </div>
                    
                    <div style={{ display: 'flex', gap: 16 }}>
                        <select 
                            value={style} 
                            onChange={e => setStyle(e.target.value)} 
                            style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', flex: 1, outline: 'none', cursor: 'pointer' }}
                        >
                            <option value="Cyberpunk">Cyberpunk</option>
                            <option value="Minimalist">Minimalist</option>
                            <option value="Mid-Century Modern">Mid-Century Modern</option>
                            <option value="Gothic">Gothic</option>
                            <option value="Bohemian">Bohemian</option>
                            <option value="Industrial">Industrial</option>
                        </select>
                        <button 
                            onClick={design} 
                            disabled={loading || !image} 
                            className="glow-button"
                            style={{ padding: '0 32px', background: '#00f2ff', color: '#000', border: 'none', borderRadius: 12, fontWeight: 'bold', cursor: (loading || !image) ? 'not-allowed' : 'pointer' }}
                        >
                            {loading ? 'Designing...' : 'Redesign Room'}
                        </button>
                    </div>
                </div>
                
                {resultImage && (
                    <div className="glass-panel-dark" style={{ flex: '1 1 350px', textAlign: 'center', padding: 32, borderRadius: 20 }}>
                        <h4 style={{ color: '#00f2ff', marginTop: 0, marginBottom: 24, fontSize: '1.2rem' }}>{style} Design Concept</h4>
                        <motion.img 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            src={resultImage} 
                            alt="Redesigned Room" 
                            style={{ maxWidth: '100%', maxHeight: 450, borderRadius: 16, boxShadow: '0 20px 50px rgba(0,242,255,0.15)' }} 
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

function SocialMediaManager({ onBack }: any) {
    const [brand, setBrand] = useState("");
    const [campaign, setCampaign] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);

    const generate = async () => {
        if(!brand || !campaign) return;
        setLoading(true);
        setContent("");
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            const response = await ai.models.generateContent({
                model: 'gemini-3.1-pro-preview',
                contents: `Act as an expert Social Media Manager for the brand: "${brand}". Generate a 3-day content calendar for the campaign: "${campaign}". Provide exactly one post for Twitter (short, punchy, hashtags), one for LinkedIn (professional, story-driven), and one for Instagram (visual description, engaging caption) for each day. Format as a clean Markdown table or list.`,
            });
            setContent(response.text || "Failed to generate content.");
        } catch (e) {
            console.error(e);
            setContent("Error generating content.");
        }
        setLoading(false);
    };

    return (
        <div className="glass-panel gradient-border smooth-transition" style={{ padding: 32, borderRadius: 24, background: 'rgba(0,0,0,0.3)' }}>
            <button onClick={onBack} style={{ background: 'transparent', color: '#00f2ff', border: 'none', cursor: 'pointer', marginBottom: 24, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>← Back to Tools</button>
            <h2 style={{ color: '#fff', marginTop: 0, fontSize: '2rem', marginBottom: '8px' }}>🤖 AI Social Media Manager</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: 32 }}>Generate high-engagement content calendars for all your social platforms.</p>
            
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <input 
                        value={brand} 
                        onChange={e => setBrand(e.target.value)} 
                        placeholder="Brand Name or Niche (e.g., Eco-friendly Coffee)" 
                        style={{ width: '100%', padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none' }} 
                    />
                    <textarea 
                        value={campaign} 
                        onChange={e => setCampaign(e.target.value)} 
                        placeholder="What is the campaign about? (e.g., Launching a new summer blend)" 
                        style={{ width: '100%', height: 150, padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', resize: 'none', outline: 'none' }} 
                    />
                    <button 
                        onClick={generate} 
                        disabled={loading || !brand || !campaign} 
                        className="glow-button"
                        style={{ padding: '16px', background: '#00f2ff', color: '#000', border: 'none', borderRadius: 12, fontWeight: 'bold', cursor: (loading || !brand || !campaign) ? 'not-allowed' : 'pointer', fontSize: '1rem' }}
                    >
                        {loading ? 'Generating...' : 'Generate Content Calendar'}
                    </button>
                </div>
                
                {content && (
                    <div className="glass-panel-dark" style={{ flex: '1 1 450px', padding: 32, borderRadius: 20, color: '#e8eaed', maxHeight: 500, overflowY: 'auto' }}>
                        <div className="markdown-body" style={{ color: 'inherit' }}><Markdown>{content}</Markdown></div>
                    </div>
                )}
            </div>
        </div>
    );
}

function AIToolsDashboard({ products }: any) {
    const [activeTool, setActiveTool] = useState<string | null>(null);

    if (activeTool === 'image') return <ImageGenerator onBack={() => setActiveTool(null)} />;
    if (activeTool === 'vision') return <VisionAnalyzer onBack={() => setActiveTool(null)} />;
    if (activeTool === 'tts') return <TTSGenerator onBack={() => setActiveTool(null)} />;
    if (activeTool === 'matchmaker') return <GiftMatchmaker products={products} onBack={() => setActiveTool(null)} />;
    if (activeTool === 'video') return <VideoStudio onBack={() => setActiveTool(null)} />;
    if (activeTool === 'research') return <WebResearcher onBack={() => setActiveTool(null)} />;
    if (activeTool === 'travel') return <TravelPlanner onBack={() => setActiveTool(null)} />;
    if (activeTool === 'builder') return <WebAppBuilder onBack={() => setActiveTool(null)} />;
    if (activeTool === 'editor') return <ImageEditor onBack={() => setActiveTool(null)} />;
    if (activeTool === 'dubber') return <AudioDubber onBack={() => setActiveTool(null)} />;
    if (activeTool === 'live') return <LiveAudioAssistant onBack={() => setActiveTool(null)} />;
    if (activeTool === 'tryon') return <VirtualTryOn products={products} onBack={() => setActiveTool(null)} />;
    if (activeTool === 'analyst') return <DataAnalyst onBack={() => setActiveTool(null)} />;
    if (activeTool === 'songwriter') return <AISongwriter onBack={() => setActiveTool(null)} />;
    if (activeTool === 'codereviewer') return <CodeReviewer onBack={() => setActiveTool(null)} />;
    if (activeTool === 'resumetailor') return <ResumeTailor onBack={() => setActiveTool(null)} />;
    if (activeTool === 'interiordesigner') return <InteriorDesigner onBack={() => setActiveTool(null)} />;
    if (activeTool === 'socialmedia') return <SocialMediaManager onBack={() => setActiveTool(null)} />;

    const tools = [
        { id: 'songwriter', icon: '🎵', title: 'AI Songwriter', desc: 'Generate lyrics and spoken-word audio tracks.' },
        { id: 'codereviewer', icon: '💻', title: 'AI Code Reviewer', desc: 'Audit code for bugs, security, and performance.' },
        { id: 'resumetailor', icon: '📄', title: 'AI Resume Tailor', desc: 'Rewrite your resume to match a job description.' },
        { id: 'interiordesigner', icon: '🛋️', title: 'AI Interior Designer', desc: 'Upload a room photo to redesign its style.' },
        { id: 'socialmedia', icon: '🤖', title: 'AI Social Media', desc: 'Generate a multi-platform content calendar.' },
        { id: 'live', icon: '🎙️', title: 'Live Voice Assistant', desc: 'Real-time voice conversation with ultra-low latency.' },
        { id: 'tryon', icon: '👗', title: 'Virtual Try-On', desc: 'Upload a photo to try on clothes from the shop.' },
        { id: 'analyst', icon: '📊', title: 'AI Data Analyst', desc: 'Analyze raw data and generate beautiful charts.' },
        { id: 'video', icon: '🎥', title: 'AI Video Studio', desc: 'Generate high-quality videos from text prompts.' },
        { id: 'research', icon: '🌐', title: 'Live Web Researcher', desc: 'Research current events with live Google Search.' },
        { id: 'travel', icon: '🗺️', title: 'Smart Travel Planner', desc: 'Plan itineraries with real Google Maps data.' },
        { id: 'builder', icon: '💻', title: 'Instant App Builder', desc: 'Generate and run mini web apps instantly.' },
        { id: 'editor', icon: '🪄', title: 'AI Image Editor', desc: 'Upload an image and edit it with text prompts.' },
        { id: 'dubber', icon: '🗣️', title: 'Multilingual Dubber', desc: 'Translate and generate native speech audio.' },
        { id: 'image', icon: '🎨', title: 'AI Image Studio', desc: 'Generate product concepts or art from text.' },
        { id: 'vision', icon: '👁️', title: 'Product Vision', desc: 'Upload an image to identify products and estimate prices.' },
        { id: 'tts', icon: '🎙️', title: 'Voice Generator', desc: 'Convert text to ultra-realistic speech for product videos.' },
        { id: 'matchmaker', icon: '🎁', title: 'Gift Matchmaker', desc: 'Let AI find the perfect gift from our catalog.' }
    ];

    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 20 }}>
            {tools.map(t => (
                <div key={t.id} className="glass-panel gradient-border smooth-transition" style={{ padding: 24, borderRadius: 16, textAlign: "center", cursor: "pointer" }} onClick={() => setActiveTool(t.id)} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div style={{ fontSize: "3rem", marginBottom: 16 }}>{t.icon}</div>
                    <h3 style={{ margin: "0 0 8px 0", color: '#fff' }}>{t.title}</h3>
                    <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>{t.desc}</p>
                </div>
            ))}
        </div>
    );
}

function StandardHubLayout({ hub, onClose, onProductClick, products, videos, initialFilters = {}, addToCart, cartCount, openCart, toggleWishlist, wishlist }: any) {
  const [searchTerm, setSearchTerm] = useState(initialFilters.searchTerm || "");
  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState(initialFilters.sortBy || "recommended");
  const [category, setCategory] = useState<string | null>(null);
  const [condition, setCondition] = useState<'all' | 'new' | 'used'>('all');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const SHOP_CATEGORIES = [
    { id: "mobile", name: "Mobile Hub", icon: "📱", description: "Latest Smartphones & Accessories", color: "#4aa3ff" },
    { id: "laptop", name: "Laptop Hub", icon: "💻", description: "High-Performance Computing", color: "#c0c0c0" },
    { id: "secondhand", name: "2nd Hand Market", icon: "♻️", description: "Buy, Sell, Exchange Pre-loved Items", color: "#ff8844" },
    { id: "products", name: "Product Hub", icon: "🎧", description: "Tech Gadgets & Essentials", color: "#00ffcc" },
    { id: "fashion", name: "Fashion Hub", icon: "👗", description: "Virtual Try-On & Trends", color: "#ff66aa" },
    { id: "realstate", name: "Real Estate", icon: "🏢", description: "Property & Business Assets", color: "#22aa55" },
  ];
  
  useEffect(() => {
      setCurrentPage(1);
  }, [searchTerm, priceRange, minRating, sortBy, category, hub.id, selectedBrands]);

  const hubProducts = hub.type === 'shop' ? products : products.filter((p: Product) => p.hubId === hub.id);

  // Extract unique brands for the current category
  const availableBrands = Array.from(new Set(hubProducts.filter((p: any) => category === null || p.hubId === category).map((p: any) => p.brand).filter(Boolean)));

  const filteredProducts = hubProducts
    .filter((p: any) => category === null || p.hubId === category)
    .filter((p: any) => condition === 'all' || (condition === 'used' ? p.isSecondHand : !p.isSecondHand))
    .filter((p: any) => selectedBrands.length === 0 || (p.brand && selectedBrands.includes(p.brand)))
    .filter((p: any) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((p: any) => p.price >= priceRange[0] && p.price <= priceRange[1])
    .filter((p: any) => p.rating >= minRating)
    .sort((a: any, b: any) => {
        if (sortBy === "priceLow") return a.price - b.price;
        if (sortBy === "priceHigh") return b.price - a.price;
        if (sortBy === "rating") return b.rating - a.rating;
        return 0;
    });

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const displayedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const hasFlashSale = hub.type === 'shop' && Math.random() > 0.3;

  return (
    <div className="hub-overlay-container">
      <div className="hub-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: "2rem" }}>{hub.icon}</span>
          <div><h2 style={{ margin: 0, fontWeight: 800, color: "white", fontSize: "1.5rem" }}>{hub.name}</h2><div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>{hub.description}</div></div>
        </div>
        <button onClick={onClose} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>Close</button>
      </div>
      <div className="hub-layout">
        {hub.type === 'shop' && category !== null && (
           <div className="hub-sidebar">
              <button onClick={() => setCategory(null)} style={{ width: "100%", padding: "10px", marginBottom: "20px", borderRadius: 8, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", cursor: "pointer", fontWeight: "bold" }}>
                  ← Back to Categories
              </button>
              <div className="filter-group"><div className="filter-title">Search</div><input type="text" placeholder="Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: 8, background: "rgba(255,255,255,0.1)", border: "none", color: "white" }} /></div>
              <div className="filter-group"><div className="filter-title">Price Range</div><div style={{ display: "flex", gap: 8 }}><input type="number" value={priceRange[0]} onChange={e => setPriceRange([+e.target.value, priceRange[1]])} style={{ width: "50%", padding: 8, borderRadius: 8, background: "rgba(255,255,255,0.1)", border: "none", color: "white" }} /><input type="number" value={priceRange[1]} onChange={e => setPriceRange([priceRange[0], +e.target.value])} style={{ width: "50%", padding: 8, borderRadius: 8, background: "rgba(255,255,255,0.1)", border: "none", color: "white" }} /></div></div>
              
              {availableBrands.length > 0 && (
                  <div className="filter-group">
                      <div className="filter-title">Brands</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '150px', overflowY: 'auto' }}>
                          {availableBrands.map((brand: any) => (
                              <label key={brand} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'rgba(255,255,255,0.8)' }}>
                                  <input type="checkbox" checked={selectedBrands.includes(brand)} onChange={(e) => {
                                      if (e.target.checked) setSelectedBrands([...selectedBrands, brand]);
                                      else setSelectedBrands(selectedBrands.filter(b => b !== brand));
                                  }} style={{ accentColor: '#00f2ff' }} />
                                  {brand}
                              </label>
                          ))}
                      </div>
                  </div>
              )}

              <div className="filter-group"><div className="filter-title">Rating</div><div style={{display: 'flex', flexDirection: 'column', gap: 4}}>{[5, 4, 3, 2, 1].map(r => (<div key={r} onClick={() => setMinRating(r)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: minRating === r ? "orange" : "rgba(255,255,255,0.6)", padding: "4px 0" }}><span style={{ whiteSpace: 'nowrap' }}>{"★".repeat(r)}{"☆".repeat(5-r)}</span><span style={{ fontSize: "0.8rem" }}>& Up</span></div>))}</div></div>
           </div>
        )}
        <div className="hub-main" style={{ width: category === null && hub.type === 'shop' ? '100%' : undefined }}>
            {hasFlashSale && category !== null && (<div style={{ background: "linear-gradient(90deg, #ff4444, #ff8844)", padding: 20, borderRadius: 12, marginBottom: 24, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16, boxShadow: "0 4px 20px rgba(255,68,68,0.3)" }}><div><h3 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>⚡ FLASH SALE</h3><p style={{ margin: 0 }}>Up to 60% off ending in 02:14:59</p></div><button style={{ background: "white", color: "#ff4444", border: "none", padding: "10px 24px", borderRadius: 20, fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap" }}>Shop Now</button></div>)}
            
            {hub.type === 'ai_tools' && (
                <AIToolsDashboard products={products} />
            )}

            {hub.type === 'fun_hub' && (
                <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
                    <FunHubDashboard />
                </div>
            )}

            {hub.type === 'shop' && category === null && (
                <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
                    {/* Featured / AI Section */}
                    <div style={{ background: "rgba(0,242,255,0.05)", padding: 32, borderRadius: 24, border: "1px solid rgba(0,242,255,0.1)", position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", top: -20, right: -20, width: 150, height: 150, background: "radial-gradient(circle, rgba(0,242,255,0.2) 0%, transparent 70%)", filter: "blur(20px)" }} />
                        <div style={{ position: "relative", zIndex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                                <span style={{ background: "linear-gradient(135deg, #00f2ff, #0072ff)", padding: "4px 12px", borderRadius: 20, fontSize: "0.7rem", fontWeight: "bold", color: "black" }}>AI POWERED</span>
                                <h2 style={{ margin: 0, fontSize: "1.8rem", fontWeight: 800 }}>SageX Recommendations</h2>
                            </div>
                            <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 24, maxWidth: 600 }}>Our neural network has analyzed your preferences and the current galactic trends to curate these exclusive picks just for you.</p>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                                {products.slice(0, 4).map(p => (
                                    <div key={p.id} onClick={() => onProductClick(p)} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 12, cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)", transition: "all 0.2s ease" }} onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"} onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}>
                                        <img src={p.image} style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 12, marginBottom: 12 }} />
                                        <h4 style={{ margin: "0 0 4px 0", fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</h4>
                                        <div style={{ color: "#00f2ff", fontWeight: "bold" }}>NPR {p.price.toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 20 }}>
                        {SHOP_CATEGORIES.map(cat => (
                            <div key={cat.id} onClick={() => setCategory(cat.id)} style={{ background: "rgba(255,255,255,0.05)", padding: 24, borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", textAlign: "center", cursor: "pointer", backdropFilter: "blur(10px)", transition: "all 0.2s ease", position: "relative" }} onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"} onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}>
                                <div style={{ fontSize: "3rem", marginBottom: 16 }}>{cat.icon}</div>
                                <h3 style={{ margin: "0 0 8px 0", color: cat.color }}>{cat.name}</h3>
                                <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>{cat.description}</p>
                                <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: 10, fontSize: "0.6rem", color: "rgba(255,255,255,0.4)" }}>
                                    {products.filter(p => p.hubId === cat.id).length} ITEMS
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {hub.type === 'shop' && category !== null && (
                <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, alignItems: "center" }}><div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>{filteredProducts.length} items found</div><select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ background: "rgba(0,0,0,0.5)", color: "white", border: "1px solid rgba(255,255,255,0.2)", padding: "6px 12px", borderRadius: 8, outline: "none", cursor: "pointer" }}><option value="recommended">Recommended</option><option value="priceLow">Price: Low to High</option><option value="priceHigh">Price: High to Low</option><option value="rating">Best Rated</option></select></div>
                
                <div className="product-grid">
                    {displayedProducts.map((product: Product) => (
                        <div key={product.id} className="product-card" style={{ position: "relative" }}>
                            <div className="product-card-img-wrapper" onClick={() => onProductClick(product)}>
                                <img src={product.image} alt={product.name} />
                                {product.isSecondHand && <span style={{ position: "absolute", top: 8, right: 8, background: "#ff8844", color: "black", padding: "2px 8px", borderRadius: 4, fontSize: "0.7rem", fontWeight: "bold" }}>USED</span>}
                                {product.originalPrice && (<span style={{ position: "absolute", top: 8, left: 8, background: "#ff4444", color: "white", padding: "2px 6px", borderRadius: 4, fontSize: "0.7rem", fontWeight: "bold" }}>-{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%</span>)}
                                
                                <div className="product-quick-actions" style={{ position: "absolute", bottom: 8, left: 8, right: 8, display: "flex", gap: 8, opacity: 0, transition: "opacity 0.2s ease" }}>
                                    <button onClick={(e) => { e.stopPropagation(); addToCart(product); }} style={{ flex: 1, background: "#00f2ff", color: "black", border: "none", padding: "8px", borderRadius: 8, fontSize: "0.8rem", fontWeight: "bold", cursor: "pointer" }}>Add to Cart</button>
                                    <button onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }} style={{ background: "rgba(0,0,0,0.6)", color: wishlist.includes(product.id) ? "#ff4444" : "white", border: "none", width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                        {wishlist.includes(product.id) ? "❤️" : "🤍"}
                                    </button>
                                </div>
                            </div>
                            <div className="product-card-content" onClick={() => onProductClick(product)}>
                                <div>
                                    <h3 style={{ margin: "0 0 4px 0", fontSize: "1rem", fontWeight: 600, lineHeight: "1.3", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.name}</h3>
                                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#888", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: "1.4" }}>
                                        {product.description || "Premium quality product with advanced features."}
                                    </p>
                                </div>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.8rem", color: "#fbbf24", marginBottom: 4 }}>
                                        <span>{"★".repeat(Math.round(product.rating))}</span> <span style={{color: "#666"}}>({product.reviews})</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                                        <span style={{ color: "#00f2ff", fontSize: "1.1rem", fontWeight: 700 }}>NPR {product.price.toLocaleString()}</span>
                                        {product.originalPrice && <span style={{ textDecoration: "line-through", color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>{product.originalPrice.toLocaleString()}</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredProducts.length > ITEMS_PER_PAGE && (
                    <div className="pagination-container">
                        <button className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</button>
                        <span className="pagination-info">Page {currentPage} of {totalPages}</span>
                        <button className="pagination-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
                    </div>
                )}
                </>
            )}

            {hub.type === 'video' && (
                <div className="product-grid">
                    {videos.map((video: Video) => (
                        <div key={video.id} className="product-card" style={{ cursor: "default" }}>
                            <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", background: "#000" }}>
                                <iframe style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} src={video.embedUrl} title={video.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                            </div>
                            <div style={{ padding: 16 }}>
                                <h3 style={{ margin: "0 0 8px 0", fontSize: "1rem" }}>{video.title}</h3>
                                <p style={{ fontSize: "0.85rem", color: "#aaa", margin: 0 }}>{video.description}</p>
                                <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#666" }}>
                                    <span>⏱ {video.duration}</span>
                                    <span>👁 {video.views.toLocaleString()} views</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {hub.type === 'tools' && (
                <div className="product-grid">{AI_TOOLS.map((tool, i) => (<div key={i} className="product-card" style={{ padding: 24, alignItems: "center", justifyContent: "center", gap: 16 }}><div style={{ width: 48, height: 48, background: "rgba(0,242,255,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>⚡</div><div style={{ textAlign: "center", fontWeight: 600 }}>{tool}</div></div>))}</div>
            )}
        </div>
      </div>
    </div>
  );
}

function HubOverlay({ hub, onClose, onProductClick, products, videos, initialFilters = {}, addToCart, cartCount, openCart, toggleWishlist, wishlist }: any) {
  return (
    <StandardHubLayout 
        key={`standard-hub-${hub.id}`}
        hub={hub} 
        onClose={onClose} 
        onProductClick={onProductClick} 
        products={products} 
        videos={videos} 
        initialFilters={initialFilters} 
        addToCart={addToCart} 
        cartCount={cartCount} 
        openCart={openCart} 
        toggleWishlist={toggleWishlist} 
        wishlist={wishlist} 
    />
  );
}

function NavBar({ currentMode, setMode }: any) {
    return (
        <div className="nav-bar">
            <button className={`nav-item ${currentMode === 'pilot' ? 'active' : ''}`} onClick={() => setMode('pilot')}>🚀 Pilot</button>
            <button className={`nav-item ${currentMode === 'cinematic' ? 'active' : ''}`} onClick={() => setMode('cinematic')}>🎥 Cinematic</button>
            <button className={`nav-item ${currentMode === 'directory' ? 'active' : ''}`} onClick={() => setMode('directory')}>📂 Directory</button>
        </div>
    );
}

function DirectoryOverlay({ onSelect }: any) {
    return (
        <div className="directory-overlay">
            {HUBS_DATA.map(hub => (
                <div key={hub.id} className="directory-card" onClick={() => onSelect(hub)}>
                    <div className="directory-icon">{hub.icon}</div>
                    <h3>{hub.name}</h3>
                    <p>{hub.description}</p>
                    <div className="directory-btn">ENTER HUB →</div>
                </div>
            ))}
        </div>
    );
}

function ProductDetailsModal({ product, onClose, addToCart, buyNow, isWishlisted, toggleWishlist }: any) {
    const [mainImage, setMainImage] = useState(product.image);
    const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
    const [activeTab, setActiveTab] = useState('details'); // details, reviews, qna

    const allImages = [product.image, ...(product.images || [])];

    const handleVariationSelect = (name: string, option: string) => {
        setSelectedVariations(prev => ({ ...prev, [name]: option }));
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-panel-dark gradient-border" style={{ width: '90%', maxWidth: '1200px', maxHeight: '90vh', borderRadius: '24px', display: 'flex', overflow: 'hidden', position: 'relative' }}>
                <button 
                    onClick={onClose} 
                    style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.1)", border: "none", color: "white", width: 40, height: 40, borderRadius: "50%", cursor: "pointer", zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', transition: 'all 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                >
                    ×
                </button>
                
                {/* Left: Image Gallery */}
                <div style={{ flex: '1 1 50%', padding: '40px', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
                    <div className="glass-panel" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '20px', padding: '30px', background: 'rgba(255,255,255,0.02)' }}>
                        <motion.img 
                            key={mainImage}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            src={mainImage} 
                            style={{ maxWidth: "100%", maxHeight: "500px", objectFit: 'contain', borderRadius: 12 }} 
                            alt={product.name} 
                        />
                    </div>
                    {allImages.length > 1 && (
                        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'none' }}>
                            {allImages.map((img, idx) => (
                                <img 
                                    key={idx} 
                                    src={img} 
                                    onClick={() => setMainImage(img)} 
                                    style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '12px', cursor: 'pointer', border: mainImage === img ? '2px solid #00f2ff' : '2px solid transparent', opacity: mainImage === img ? 1 : 0.5, transition: 'all 0.3s', background: 'rgba(255,255,255,0.05)' }} 
                                    alt={`Thumb ${idx}`} 
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Product Info */}
                <div style={{ flex: '1 1 50%', padding: '48px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: '24px' }}>
                        <div>
                            {product.brand && <div style={{ color: '#00f2ff', fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>{product.brand}</div>}
                            <h1 style={{ margin: 0, fontSize: "2.5rem", lineHeight: 1.1, fontWeight: 800, letterSpacing: '-1px' }}>{product.name}</h1>
                        </div>
                        <button 
                            onClick={toggleWishlist} 
                            className="glass-panel"
                            style={{ border: "none", width: '50px', height: '50px', borderRadius: '50%', fontSize: "1.4rem", cursor: "pointer", color: isWishlisted ? "#ff4444" : "rgba(255,255,255,0.4)", display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', background: isWishlisted ? 'rgba(255,68,68,0.1)' : 'rgba(255,255,255,0.05)' }}
                        >
                            {isWishlisted ? '♥' : '♡'}
                        </button>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
                        <div style={{ display: 'flex', color: "#ffcc00", fontSize: '1.2rem' }}>
                            {"★".repeat(Math.round(product.rating))}{"☆".repeat(5 - Math.round(product.rating))}
                        </div>
                        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "1rem" }}>{product.rating} ({product.reviews} Reviews)</span>
                        <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
                        <span style={{ color: "#00ff88", fontSize: "1rem", fontWeight: 'bold' }}>1.2k+ Sold</span>
                    </div>

                    <div style={{ marginBottom: 32, display: 'flex', alignItems: 'baseline', gap: '20px' }}>
                        <span style={{ color: "#00f2ff", fontSize: "3rem", fontWeight: 800, letterSpacing: '-1px' }}>NPR {product.price.toLocaleString()}</span>
                        {product.originalPrice && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ textDecoration: "line-through", color: "rgba(255,255,255,0.3)", fontSize: "1.4rem" }}>NPR {product.originalPrice.toLocaleString()}</span>
                                <span style={{ background: 'rgba(255,68,68,0.15)', color: '#ff4444', padding: '6px 12px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                    -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Variations */}
                    {product.variations && product.variations.map((v: any, idx: number) => (
                        <div key={idx} style={{ marginBottom: '28px' }}>
                            <div style={{ marginBottom: '12px', fontWeight: 'bold', color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {v.name}: <span style={{ color: '#fff' }}>{selectedVariations[v.name] || 'Select'}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                {v.options.map((opt: string) => (
                                    <button 
                                        key={opt} 
                                        onClick={() => handleVariationSelect(v.name, opt)} 
                                        style={{ padding: '10px 20px', background: selectedVariations[v.name] === opt ? '#00f2ff' : 'rgba(255,255,255,0.05)', color: selectedVariations[v.name] === opt ? '#000' : '#fff', border: selectedVariations[v.name] === opt ? '1px solid #00f2ff' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s', fontSize: '0.95rem' }}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div className="glass-panel" style={{ marginBottom: 40, padding: "24px", borderRadius: 20, background: "rgba(255,255,255,0.02)", border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div style={{ fontSize: "1rem", color: "rgba(255,255,255,0.5)" }}>Sold by <span style={{ color: "white", fontWeight: "bold" }}>{product.seller}</span></div>
                            <button style={{ background: 'rgba(0,242,255,0.1)', border: '1px solid rgba(0,242,255,0.3)', color: '#00f2ff', padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}>Visit Store</button>
                        </div>
                        <div style={{ display: 'flex', gap: '24px', fontSize: "0.9rem", color: "rgba(255,255,255,0.4)", borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>🚀 Fast Delivery</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>🛡️ 7 Days Return</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>✅ Warranty</div>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 20, marginBottom: 48, marginTop: 'auto' }}>
                        <button 
                            onClick={() => buyNow(product)} 
                            className="glow-button"
                            style={{ flex: 1, padding: "20px", background: "linear-gradient(90deg, #00f2ff, #0066ff)", border: "none", color: "white", fontSize: '1.2rem', fontWeight: "bold", borderRadius: 16, cursor: "pointer" }}
                        >
                            Buy Now
                        </button>
                        <button 
                            onClick={() => addToCart(product)} 
                            style={{ flex: 1, padding: "20px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: '1.2rem', fontWeight: "bold", borderRadius: 16, cursor: "pointer", transition: 'all 0.3s' }}
                            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = '#00f2ff'; e.currentTarget.style.color = '#00f2ff'; }}
                            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                        >
                            Add to Cart
                        </button>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '32px' }}>
                        {['details', 'reviews', 'qna'].map(tab => (
                            <div 
                                key={tab} 
                                onClick={() => setActiveTab(tab)} 
                                style={{ paddingBottom: '16px', cursor: 'pointer', textTransform: 'uppercase', fontWeight: 'bold', fontSize: '0.9rem', letterSpacing: '1px', color: activeTab === tab ? '#00f2ff' : 'rgba(255,255,255,0.4)', borderBottom: activeTab === tab ? '3px solid #00f2ff' : '3px solid transparent', transition: 'all 0.3s' }}
                            >
                                {tab === 'qna' ? 'Q&A' : tab}
                            </div>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', fontSize: '1.05rem' }}>
                        {activeTab === 'details' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <p style={{ marginBottom: '24px' }}>{product.description || "Experience top-tier performance and quality with this premium product. Designed for durability and efficiency."}</p>
                                {product.specs && (
                                    <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)' }}>
                                        <h4 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.2rem' }}>Technical Specifications</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                                            {Object.entries(product.specs).map(([k, v]) => (
                                                <React.Fragment key={k}>
                                                    <div style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', fontSize: '0.9rem' }}>{k}</div>
                                                    <div style={{ color: '#fff', fontSize: '0.95rem' }}>{v as string}</div>
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                        {activeTab === 'reviews' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                {product.reviewList ? product.reviewList.map((r: any, i: number) => (
                                    <div key={i} className="glass-panel" style={{ marginBottom: '20px', padding: '24px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '1.1rem' }}>{r.user}</span>
                                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>{r.date}</span>
                                        </div>
                                        <div style={{ color: '#ffcc00', fontSize: '1rem', marginBottom: '12px' }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)' }}>{r.comment}</p>
                                    </div>
                                )) : <p style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>No reviews yet.</p>}
                            </motion.div>
                        )}
                        {activeTab === 'qna' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                {product.qna ? product.qna.map((q: any, i: number) => (
                                    <div key={i} className="glass-panel" style={{ marginBottom: '20px', padding: '24px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)' }}>
                                        <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '12px', fontSize: '1.05rem' }}>
                                            <span style={{ color: '#00f2ff', marginRight: '12px', fontWeight: '900' }}>Q:</span>{q.question}
                                        </div>
                                        <div style={{ color: 'rgba(255,255,255,0.7)', paddingLeft: '28px' }}>
                                            <span style={{ color: '#ff6600', marginRight: '12px', fontWeight: '900' }}>A:</span>{q.answer}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.2)', marginTop: '16px', textAlign: 'right' }}>{q.date}</div>
                                    </div>
                                )) : <p style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>No questions asked yet.</p>}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function CheckoutModal({ cart, total, onClose, onPlaceOrder, user }: any) {
    const [step, setStep] = useState(1);
    const [address, setAddress] = useState({ name: (user && user.name) || "", phone: "", city: "", area: "" });
    const [payment, setPayment] = useState("cod");
    const [shippingMethod, setShippingMethod] = useState("standard");
    const [coupon, setCoupon] = useState("");
    const [discount, setDiscount] = useState(0);

    const shippingCost = shippingMethod === "express" ? 250 : 100;
    const finalTotal = total + shippingCost - discount;

    const applyCoupon = () => {
        if (coupon.toUpperCase() === "SAVE10") {
            setDiscount(total * 0.1);
            // alert("Coupon applied! 10% off.");
        } else {
            // alert("Invalid coupon code.");
        }
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-panel-dark gradient-border" style={{ padding: '40px', borderRadius: '24px', width: '90%', maxWidth: '550px', position: 'relative' }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 30 }}>
                    <h2 style={{ margin: 0, color: '#fff', fontSize: '1.8rem' }}>Checkout</h2>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "2rem", cursor: "pointer", transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>×</button>
                </div>
                
                {/* Progress Bar */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
                    {[1, 2, 3].map(s => (
                        <div key={s} style={{ flex: 1, height: '6px', background: step >= s ? '#00f2ff' : 'rgba(255,255,255,0.1)', borderRadius: '3px', transition: 'all 0.3s' }} />
                    ))}
                </div>

                {step === 1 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <h3 style={{ color: "#00f2ff", marginBottom: '20px', fontSize: '1.2rem' }}>1. Shipping Address</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <input 
                                placeholder="Full Name" 
                                value={address.name} 
                                onChange={e => setAddress({...address, name: e.target.value})} 
                                style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", width: "100%", outline: 'none' }} 
                            />
                            <input 
                                placeholder="Phone Number" 
                                value={address.phone} 
                                onChange={e => setAddress({...address, phone: e.target.value})} 
                                style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", width: "100%", outline: 'none' }} 
                            />
                            <div style={{ display: "flex", gap: 16 }}>
                                <input 
                                    placeholder="City" 
                                    value={address.city} 
                                    onChange={e => setAddress({...address, city: e.target.value})} 
                                    style={{ flex: 1, padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", width: "100%", outline: 'none' }} 
                                />
                                <input 
                                    placeholder="Area / Street" 
                                    value={address.area} 
                                    onChange={e => setAddress({...address, area: e.target.value})} 
                                    style={{ flex: 1, padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", width: "100%", outline: 'none' }} 
                                />
                            </div>
                        </div>
                        <button 
                            onClick={() => setStep(2)} 
                            className="glow-button"
                            style={{ width: "100%", marginTop: 32, padding: 16, background: "#00f2ff", color: '#000', border: "none", borderRadius: 10, fontWeight: "bold", cursor: "pointer", fontSize: '1.1rem' }}
                        >
                            Continue to Shipping
                        </button>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <h3 style={{ color: "#00f2ff", marginBottom: '20px', fontSize: '1.2rem' }}>2. Shipping Method</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div 
                                onClick={() => setShippingMethod('standard')} 
                                style={{ padding: 20, borderRadius: 12, background: shippingMethod === 'standard' ? "rgba(0,242,255,0.1)" : "rgba(255,255,255,0.05)", border: shippingMethod === 'standard' ? "1px solid #00f2ff" : "1px solid rgba(255,255,255,0.1)", cursor: "pointer", display: 'flex', justifyContent: 'space-between', transition: 'all 0.2s' }}
                            >
                                <div><div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1.1rem' }}>Standard Delivery</div><div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>2-3 Business Days</div></div>
                                <div style={{ fontWeight: 'bold', color: '#00f2ff', fontSize: '1.1rem' }}>NPR 100</div>
                            </div>
                            <div 
                                onClick={() => setShippingMethod('express')} 
                                style={{ padding: 20, borderRadius: 12, background: shippingMethod === 'express' ? "rgba(0,242,255,0.1)" : "rgba(255,255,255,0.05)", border: shippingMethod === 'express' ? "1px solid #00f2ff" : "1px solid rgba(255,255,255,0.1)", cursor: "pointer", display: 'flex', justifyContent: 'space-between', transition: 'all 0.2s' }}
                            >
                                <div><div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1.1rem' }}>Express Delivery</div><div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>Same Day Delivery</div></div>
                                <div style={{ fontWeight: 'bold', color: '#00f2ff', fontSize: '1.1rem' }}>NPR 250</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', marginTop: 32 }}>
                            <button onClick={() => setStep(1)} style={{ flex: 1, padding: 16, background: "rgba(255,255,255,0.1)", color: '#fff', border: "none", borderRadius: 10, fontWeight: "bold", cursor: "pointer" }}>Back</button>
                            <button onClick={() => setStep(3)} className="glow-button" style={{ flex: 2, padding: 16, background: "#00f2ff", color: '#000', border: "none", borderRadius: 10, fontWeight: "bold", cursor: "pointer", fontSize: '1.1rem' }}>Continue to Payment</button>
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <h3 style={{ color: "#00f2ff", marginBottom: '20px', fontSize: '1.2rem' }}>3. Payment & Review</h3>
                        
                        <div style={{ display: "grid", gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '24px' }}>
                            {['cod', 'esewa', 'khalti', 'card'].map(m => (
                                <div 
                                    key={m} 
                                    onClick={() => setPayment(m)} 
                                    style={{ padding: 14, borderRadius: 10, background: payment === m ? "rgba(0,242,255,0.1)" : "rgba(255,255,255,0.05)", border: payment === m ? "1px solid #00f2ff" : "1px solid rgba(255,255,255,0.1)", cursor: "pointer", textTransform: "uppercase", fontWeight: "bold", display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s', fontSize: '0.9rem' }}
                                >
                                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #00f2ff', background: payment === m ? '#00f2ff' : 'transparent', transition: 'all 0.2s' }} />
                                    {m === 'cod' ? "COD" : m}
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                            <input 
                                placeholder="Coupon Code" 
                                value={coupon} 
                                onChange={e => setCoupon(e.target.value)} 
                                style={{ flex: 1, padding: '12px 16px', borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", outline: 'none' }} 
                            />
                            <button onClick={applyCoupon} style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>Apply</button>
                        </div>

                        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", background: 'rgba(0,0,0,0.2)' }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, color: 'rgba(255,255,255,0.5)' }}><span>Subtotal</span><span>NPR {total.toLocaleString()}</span></div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, color: 'rgba(255,255,255,0.5)' }}><span>Delivery Fee</span><span>NPR {shippingCost}</span></div>
                            {discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, color: '#00ff88' }}><span>Discount</span><span>- NPR {discount.toLocaleString()}</span></div>}
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: "1.4rem", fontWeight: "bold", color: "#00f2ff" }}><span>Total</span><span>NPR {finalTotal.toLocaleString()}</span></div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', marginTop: 32 }}>
                            <button onClick={() => setStep(2)} style={{ flex: 1, padding: 16, background: "rgba(255,255,255,0.1)", color: '#fff', border: "none", borderRadius: 10, fontWeight: "bold", cursor: "pointer" }}>Back</button>
                            <button 
                                onClick={() => onPlaceOrder({ 
                                    id: Date.now().toString(), 
                                    date: new Date().toLocaleDateString(), 
                                    items: cart, 
                                    total: finalTotal, 
                                    status: "Processing",
                                    shippingAddress: `${address.name}, ${address.area}, ${address.city}`,
                                    shippingMethod: shippingMethod,
                                    discount: discount,
                                    trackingSteps: [{ status: 'Order Placed', date: new Date().toLocaleDateString(), completed: true }, { status: 'Processing', date: '', completed: false }, { status: 'Shipped', date: '', completed: false }, { status: 'Delivered', date: '', completed: false }]
                                })} 
                                className="glow-button"
                                style={{ flex: 2, padding: 16, background: "linear-gradient(90deg, #00f2ff, #0066ff)", border: "none", borderRadius: 10, fontWeight: "bold", color: "white", cursor: "pointer", fontSize: '1.1rem' }}
                            >
                                Place Order
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

function AuthModal({ onLogin, onClose }: any) {
  const [isRegister, setIsRegister] = useState(false); 
  const [name, setName] = useState(""); 
  const [email, setEmail] = useState("");
  
  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div className="glass-panel gradient-border" style={{ width: '90%', maxWidth: 400, padding: '40px', borderRadius: '24px', position: 'relative' }}>
        <h2 style={{ textAlign: "center", marginBottom: 30, color: "white", fontSize: '2rem' }}>
          {isRegister ? "Create Account" : "Welcome Back"}
        </h2>
        
        {isRegister && (
          <input 
            placeholder="Full Name" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            style={{ width: "100%", padding: 14, marginBottom: 16, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", boxSizing: "border-box", outline: 'none' }} 
          />
        )}
        
        <input 
          placeholder="Email Address" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          style={{ width: "100%", padding: 14, marginBottom: 16, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", boxSizing: "border-box", outline: 'none' }} 
        />
        
        <input 
          type="password" 
          placeholder="Password" 
          style={{ width: "100%", padding: 14, marginBottom: 24, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", boxSizing: "border-box", outline: 'none' }} 
        />
        
        <button 
          onClick={() => onLogin(email, name || "User")} 
          className="glow-button"
          style={{ width: "100%", padding: 16, background: "#00f2ff", border: "none", borderRadius: 10, fontWeight: "bold", cursor: "pointer", marginBottom: 20, color: 'black', fontSize: '1.1rem' }}
        >
          {isRegister ? "Sign Up" : "Login"}
        </button>
        
        <div 
          style={{ textAlign: "center", fontSize: "0.95rem", color: "rgba(255,255,255,0.5)", cursor: "pointer", transition: 'color 0.2s' }} 
          onClick={() => setIsRegister(!isRegister)}
          onMouseOver={e => e.currentTarget.style.color = '#00f2ff'}
          onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
        >
          {isRegister ? "Already have an account? Login" : "New to SageX? Register"}
        </div>
        
        <button 
          onClick={onClose} 
          style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "1.8rem", cursor: "pointer", transition: 'color 0.2s' }}
          onMouseOver={e => e.currentTarget.style.color = '#fff'}
          onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
        >
          ×
        </button>
      </div>
    </div>
  );
}

function ProfileModal({ user, onClose }: any) {
  const [tab, setTab] = useState('orders');
  return (
    <div className="modal-overlay" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="profile-container">
        
        {/* Sidebar */}
        <div className="profile-sidebar">
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ width: 80, height: 80, background: "linear-gradient(135deg, #00f2ff, #0066ff)", borderRadius: "50%", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", boxShadow: '0 4px 15px rgba(0,242,255,0.3)' }}>👤</div>
            <div style={{ fontWeight: "bold", fontSize: '1.2rem', color: '#fff' }}>{user.name}</div>
            <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", marginTop: '4px' }}>{user.email}</div>
            <div style={{ marginTop: 16, padding: '8px', background: 'rgba(0,204,102,0.1)', borderRadius: '8px', color: "#00cc66", fontWeight: "bold", fontSize: '0.9rem' }}>Balance: NPR {user.balance.toLocaleString()}</div>
          </div>
          
          <div onClick={() => setTab('orders')} style={{ padding: '14px 16px', cursor: "pointer", background: tab === 'orders' ? "rgba(0,242,255,0.1)" : "transparent", color: tab === 'orders' ? '#00f2ff' : '#fff', borderRadius: 8, marginBottom: 8, fontWeight: tab === 'orders' ? 'bold' : 'normal', transition: 'all 0.2s', border: tab === 'orders' ? '1px solid rgba(0,242,255,0.3)' : '1px solid transparent' }}>📦 My Orders</div>
          <div onClick={() => setTab('wishlist')} style={{ padding: '14px 16px', cursor: "pointer", background: tab === 'wishlist' ? "rgba(0,242,255,0.1)" : "transparent", color: tab === 'wishlist' ? '#00f2ff' : '#fff', borderRadius: 8, fontWeight: tab === 'wishlist' ? 'bold' : 'normal', transition: 'all 0.2s', border: tab === 'wishlist' ? '1px solid rgba(0,242,255,0.3)' : '1px solid transparent' }}>♥ Wishlist</div>
          
          <button onClick={onClose} style={{ marginTop: 'auto', width: "100%", padding: 14, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)", color: "white", borderRadius: 8, cursor: "pointer", transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>Close</button>
        </div>

        {/* Body */}
        <div className="profile-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 20, marginBottom: 30 }}>
            <h2 style={{ margin: 0, color: '#fff', fontSize: '1.8rem' }}>{tab === 'orders' ? "Order History" : "My Wishlist"}</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "1.8rem", cursor: "pointer", transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>×</button>
          </div>

          {tab === 'orders' && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {user.orders.length === 0 && <div style={{ color: "rgba(255,255,255,0.4)", textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>No orders yet. Start shopping!</div>}
              {user.orders.map((order: Order) => (
                <div key={order.id} className="glass-panel" style={{ padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'center', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
                    <div>
                      <div style={{ color: "#00f2ff", fontWeight: "bold", fontSize: '1.1rem', marginBottom: '4px' }}>Order #{order.id}</div>
                      <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>Placed on {order.date}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ display: 'inline-block', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', background: order.status === 'Delivered' ? 'rgba(0,255,0,0.1)' : 'rgba(255,165,0,0.1)', color: order.status === 'Delivered' ? "#0f0" : "orange" }}>{order.status}</span>
                      <div style={{ fontWeight: "bold", marginTop: 8, color: '#fff' }}>Total: NPR {order.total.toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Tracking Steps */}
                  {order.trackingSteps && order.trackingSteps.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', position: 'relative', padding: '0 20px' }}>
                      <div style={{ position: 'absolute', top: '12px', left: '40px', right: '40px', height: '2px', background: 'rgba(255,255,255,0.1)', zIndex: 1 }} />
                      {order.trackingSteps.map((step, idx) => (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, width: '80px' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: step.completed ? '#00f2ff' : 'rgba(255,255,255,0.05)', border: step.completed ? 'none' : '2px solid rgba(255,255,255,0.1)', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {step.completed && <span style={{ color: '#000', fontSize: '0.8rem' }}>✓</span>}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: step.completed ? '#fff' : 'rgba(255,255,255,0.4)', textAlign: 'center', fontWeight: step.completed ? 'bold' : 'normal' }}>{step.status}</div>
                          {step.date && <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{step.date}</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
                    {order.items.map(item => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px', minWidth: '200px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <img src={item.image} style={{ width: 60, height: 60, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} alt={item.name} />
                        <div>
                          <div style={{ fontSize: '0.9rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{item.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#888' }}>Qty: {item.quantity}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {order.status === 'Delivered' && (
                    <div style={{ marginTop: '16px', textAlign: 'right' }}>
                      <button style={{ background: 'transparent', border: '1px solid #ff4444', color: '#ff4444', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>Request Return</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'wishlist' && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20 }}>
              {user.wishlist.length === 0 && <div style={{ color: "#666", gridColumn: '1 / -1', textAlign: 'center', padding: '40px', background: '#1a1a1a', borderRadius: '12px' }}>Wishlist is empty.</div>}
              {user.wishlist.map((pid: string) => {
                // We would normally fetch the product details here. For now, just a placeholder.
                return <div key={pid} style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid #222' }}>Product ID: {pid}</div>;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CartDrawer({ cart, onClose, onRemove, onUpdateQty, total, onCheckout }: any) {
    return (
        <div className="glass-panel-dark" style={{ position: "fixed", top: 0, right: 0, width: "100%", maxWidth: "400px", height: "100%", zIndex: 1000, padding: "20px", display: "flex", flexDirection: "column", boxShadow: "-10px 0 40px rgba(0,0,0,0.5)", borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "15px" }}>
                <h2 style={{ margin: 0, color: "white", fontSize: '1.5rem' }}>Your Cart ({cart.length})</h2>
                <button onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", fontSize: "1.8rem", cursor: "pointer", transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}>×</button>
            </div>
            
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "15px", paddingRight: '5px' }}>
                {cart.length === 0 ? (
                    <div style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: "100px", fontSize: '1.1rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🛒</div>
                        Your cart is empty.
                    </div>
                ) : (
                    cart.map((item: any) => (
                        <div key={item.id} className="glass-panel" style={{ display: "flex", gap: "15px", padding: "12px", borderRadius: "12px", border: '1px solid rgba(255,255,255,0.05)' }}>
                            <img src={item.image} alt={item.name} style={{ width: "70px", height: "70px", objectFit: "cover", borderRadius: "8px", border: '1px solid rgba(255,255,255,0.1)' }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: "bold", fontSize: "0.95rem", color: "white", marginBottom: '4px' }}>{item.name}</div>
                                <div style={{ color: "#00f2ff", fontSize: "0.9rem", fontWeight: 'bold' }}>NPR {item.price.toLocaleString()}</div>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "10px" }}>
                                    <button onClick={() => onUpdateQty(item.id, -1)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", width: "28px", height: "28px", borderRadius: "6px", cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                                    <span style={{ color: "white", fontSize: "1rem", fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                                    <button onClick={() => onUpdateQty(item.id, 1)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", width: "28px", height: "28px", borderRadius: "6px", cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                </div>
                            </div>
                            <button onClick={() => onRemove(item.id)} style={{ alignSelf: "flex-start", background: "transparent", border: "none", color: "rgba(255,68,68,0.6)", cursor: "pointer", fontSize: "1.4rem", transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#ff4444'} onMouseOut={e => e.currentTarget.style.color = 'rgba(255,68,68,0.6)'}>×</button>
                        </div>
                    ))
                )}
            </div>
            
            <div style={{ marginTop: "auto", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", color: "white", fontWeight: "bold", fontSize: "1.3rem" }}>
                    <span>Total:</span>
                    <span style={{ color: "#00f2ff", textShadow: '0 0 10px rgba(0,242,255,0.3)' }}>NPR {total.toLocaleString()}</span>
                </div>
                <button 
                    onClick={onCheckout} 
                    disabled={cart.length === 0} 
                    className={cart.length > 0 ? "glow-button" : ""}
                    style={{ 
                        width: "100%", 
                        padding: "16px", 
                        background: cart.length === 0 ? "rgba(255,255,255,0.05)" : "#00f2ff", 
                        color: cart.length === 0 ? "rgba(255,255,255,0.2)" : "black", 
                        border: "none", 
                        borderRadius: "12px", 
                        fontWeight: "bold", 
                        fontSize: '1.1rem',
                        cursor: cart.length === 0 ? "not-allowed" : "pointer",
                        transition: 'all 0.3s'
                    }}
                >
                    Checkout Now
                </button>
            </div>
        </div>
    );
}

function ChatInterface({ activeHub, onClose }: { activeHub: HubData | null, onClose: () => void }) {
    const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
        { role: 'model', text: activeHub ? `Welcome to the ${activeHub.name}! I'm SageX, your AI assistant. How can I help you with ${activeHub.description}?` : "Hello! I'm SageX, your personal shopping assistant. Ask me anything about our products or services!" }
    ]); 
    const [input, setInput] = useState(""); 
    const [isLoading, setIsLoading] = useState(false); 
    const scrollRef = useRef<HTMLDivElement>(null); 
    const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY || '' }), []); 
    
    useEffect(() => { 
        if (scrollRef.current) { 
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight; 
        } 
    }, [messages]); 
    
    const sendMessage = async () => { 
        if (!input.trim() || isLoading) return; 
        const userMsg = input; 
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]); 
        setInput(""); 
        setIsLoading(true); 
        try { 
            let systemInstruction = "You are SageX, an advanced AI shopping assistant for a futuristic e-commerce platform. Be helpful, concise, and futuristic in tone."; 
            const chat = ai.chats.create({ 
                model: AI_MODEL, 
                config: { systemInstruction }, 
                history: messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })), 
            }); 
            const result = await chat.sendMessage({ message: userMsg }); 
            const responseText = result.text; 
            setMessages(prev => [...prev, { role: 'model', text: responseText || "I'm having trouble connecting right now." }]); 
        } catch (error) { 
            console.error("AI Error:", error); 
            setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error processing your request." }]); 
        } finally { 
            setIsLoading(false); 
        } 
    };

    return (
        <div className="chat-interface glass-panel-dark gradient-border" style={{ position: "absolute", bottom: "20px", right: "20px", width: "380px", maxWidth: "90vw", height: "550px", maxHeight: "70vh", display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 100, boxShadow: "0 20px 50px rgba(0,0,0,0.6)", borderRadius: '20px' }}>
            <div style={{ padding: "15px 20px", background: "linear-gradient(90deg, rgba(0,242,255,0.2), rgba(0,153,255,0.2))", display: "flex", justifyContent: "space-between", alignItems: "center", color: "white", borderBottom: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                <div style={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: "10px", fontSize: '1.1rem' }}>
                    <span style={{ fontSize: '1.4rem' }}>✨</span> SageX AI Assistant
                </div>
                <button onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", fontSize: "1.5rem", cursor: "pointer", transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}>×</button>
            </div>
            
            <div ref={scrollRef} style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "15px" }}>
                {messages.map((msg, idx) => (
                    <div key={idx} style={{ 
                        alignSelf: msg.role === 'user' ? "flex-end" : "flex-start", 
                        maxWidth: "85%", 
                        padding: "12px 16px", 
                        borderRadius: "16px", 
                        background: msg.role === 'user' ? "rgba(0,153,255,0.8)" : "rgba(255,255,255,0.08)", 
                        color: "white", 
                        fontSize: "0.95rem", 
                        lineHeight: '1.5',
                        borderBottomRightRadius: msg.role === 'user' ? "4px" : "16px", 
                        borderBottomLeftRadius: msg.role === 'model' ? "4px" : "16px",
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                        backdropFilter: 'blur(5px)',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        {msg.text}
                    </div>
                ))} 
                {isLoading && (
                    <div style={{ alignSelf: "flex-start", padding: "10px", color: "rgba(0,242,255,0.6)", fontSize: "0.85rem", display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="typing-indicator">
                            <span></span><span></span><span></span>
                        </div>
                        SageX is thinking...
                    </div>
                )}
            </div>
            
            <div style={{ padding: "15px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: "10px", background: "rgba(0,0,0,0.2)" }}>
                <input 
                    value={input} 
                    onChange={e => setInput(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && sendMessage()} 
                    placeholder="Ask anything..." 
                    style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "25px", padding: "12px 20px", color: "white", outline: "none", fontSize: '0.95rem' }} 
                />
                <button 
                    onClick={sendMessage} 
                    disabled={isLoading || !input.trim()} 
                    className="glow-button"
                    style={{ 
                        background: input.trim() ? "#00f2ff" : "rgba(255,255,255,0.05)", 
                        color: input.trim() ? "black" : "rgba(255,255,255,0.2)", 
                        border: "none", 
                        width: "45px", 
                        height: "45px", 
                        borderRadius: "50%", 
                        cursor: (isLoading || !input.trim()) ? "not-allowed" : "pointer", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        fontWeight: "bold",
                        fontSize: '1.2rem',
                        transition: 'all 0.3s'
                    }}
                >
                    ➤
                </button>
            </div>
        </div>
    );
}

// --- OPTIMIZED PARTICLE SYSTEM ---
class ParticleSystem {
    mesh: THREE.InstancedMesh;
    velocities: Float32Array;
    lives: Float32Array;
    maxLives: Float32Array;
    initialScales: Float32Array;
    dummy: THREE.Object3D;
    count: number;
    cursor: number;

    constructor(scene: THREE.Scene, count: number, isUltraLow: boolean) {
        this.count = count;
        this.cursor = 0;
        
        // Use simple geometry for performance
        const geometry = new THREE.IcosahedronGeometry(0.3, 0);
        const createParticleTexture = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 32; canvas.height = 32;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;
            
            const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
            grad.addColorStop(0, 'rgba(255,255,255,1)');
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 32, 32);
            
            const texture = new THREE.CanvasTexture(canvas);
            return texture;
        };

        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            map: createParticleTexture(),
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.mesh = new THREE.InstancedMesh(geometry, material, count);
        this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        
        // Initialize arrays
        this.velocities = new Float32Array(count * 3);
        this.lives = new Float32Array(count);
        this.maxLives = new Float32Array(count);
        this.initialScales = new Float32Array(count);
        
        this.dummy = new THREE.Object3D();

        // Initialize all to 0 scale (hidden)
        for (let i = 0; i < count; i++) {
            this.dummy.position.set(0, 0, 0);
            this.dummy.scale.set(0, 0, 0);
            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(i, this.dummy.matrix);
            this.lives[i] = 0;
        }
        
        scene.add(this.mesh);
    }

    spawn(position: THREE.Vector3, velocity: THREE.Vector3, color: THREE.Color | number, life: number, size: number) {
        const i = this.cursor;
        
        this.dummy.position.copy(position);
        this.dummy.scale.set(size, size, size);
        this.dummy.updateMatrix();
        this.mesh.setMatrixAt(i, this.dummy.matrix);
        this.mesh.setColorAt(i, new THREE.Color(color));
        
        this.velocities[i * 3] = velocity.x;
        this.velocities[i * 3 + 1] = velocity.y;
        this.velocities[i * 3 + 2] = velocity.z;
        
        this.lives[i] = life;
        this.maxLives[i] = life;
        this.initialScales[i] = size;
        
        this.mesh.instanceMatrix.needsUpdate = true;
        if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
        
        this.cursor = (this.cursor + 1) % this.count;
    }

    update(delta: number) {
        let needsUpdate = false;
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const scale = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();

        for (let i = 0; i < this.count; i++) {
            if (this.lives[i] > 0) {
                this.lives[i] -= delta;
                
                if (this.lives[i] <= 0) {
                    // Hide
                    this.dummy.scale.set(0, 0, 0);
                    this.dummy.updateMatrix();
                    this.mesh.setMatrixAt(i, this.dummy.matrix);
                    needsUpdate = true;
                    continue;
                }

                // Move
                this.mesh.getMatrixAt(i, matrix);
                matrix.decompose(position, quaternion, scale);
                
                position.x += this.velocities[i * 3] * delta;
                position.y += this.velocities[i * 3 + 1] * delta;
                position.z += this.velocities[i * 3 + 2] * delta;
                
                // Scale down as life fades
                const lifeRatio = this.lives[i] / this.maxLives[i];
                const currentScale = this.initialScales[i] * lifeRatio;
                
                this.dummy.position.copy(position);
                this.dummy.scale.set(currentScale, currentScale, currentScale);
                this.dummy.updateMatrix();
                
                this.mesh.setMatrixAt(i, this.dummy.matrix);
                needsUpdate = true;
            }
        }
        
        if (needsUpdate) {
            this.mesh.instanceMatrix.needsUpdate = true;
        }
    }

    dispose() {
        if (this.mesh.geometry) this.mesh.geometry.dispose();
        if (this.mesh.material instanceof THREE.Material) this.mesh.material.dispose();
        // If we created instanceColor manually, we might want to dispose it? 
        // BufferAttributes don't have dispose(), but we should remove the mesh from scene.
        if (this.mesh.parent) this.mesh.parent.remove(this.mesh);
    }
}

function Joystick({ zone, onMove }: { zone: 'left' | 'right', onMove: (x:number, y:number) => void }) {
    const ref = useRef<HTMLDivElement>(null); const knobRef = useRef<HTMLDivElement>(null); const touchId = useRef<number | null>(null);
    const handleStart = (e: React.TouchEvent) => { 
        e.preventDefault(); 
        e.stopPropagation(); 
        if (touchId.current !== null) return; 
        const touch = e.changedTouches[0]; 
        touchId.current = touch.identifier; 
        update(touch); 
    };
    const handleMove = (e: React.TouchEvent) => { 
        e.preventDefault(); 
        e.stopPropagation();
        if (touchId.current === null) return; 
        const touch = Array.from(e.changedTouches).find((t: React.Touch) => t.identifier === touchId.current); 
        if (touch) update(touch); 
    };
    const handleEnd = (e: React.TouchEvent) => { 
        e.preventDefault();
        e.stopPropagation();
        const touch = Array.from(e.changedTouches).find((t: React.Touch) => t.identifier === touchId.current); 
        if (touch) { 
            touchId.current = null; 
            if (knobRef.current) knobRef.current.style.transform = `translate(-50%, -50%) translate(0px, 0px)`; 
            onMove(0, 0); 
        } 
    };
    const update = (touch: React.Touch) => { if (!ref.current || !knobRef.current) return; const rect = ref.current.getBoundingClientRect(); const centerX = rect.left + rect.width / 2; const centerY = rect.top + rect.height / 2; let dx = touch.clientX - centerX; let dy = touch.clientY - centerY; const distance = Math.sqrt(dx*dx + dy*dy); const maxDist = rect.width / 2; if (distance > maxDist) { const angle = Math.atan2(dy, dx); dx = Math.cos(angle) * maxDist; dy = Math.sin(angle) * maxDist; } knobRef.current.style.transform = `translate(-50%, -50%) translate(${dx}px, ${dy}px)`; onMove(dx / maxDist, dy / maxDist); };
    return <div className="joystick-zone" style={{ left: zone === 'left' ? '40px' : 'auto', right: zone === 'right' ? '40px' : 'auto' }} ref={ref} onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}><div className="joystick-base"></div><div className="joystick-knob" ref={knobRef}></div></div>;
}

// --- Three.js Logic ---

function SolarSystemScene({ onHubSelect, isPaused, mode, onError, quality }: { onHubSelect: (h: HubData) => void, isPaused: boolean, mode: NavMode, onError: () => void, quality: 'high' | 'low' }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const simState = useRef({ isPaused, mode });
  
  // Warp State tracking
  const warpRef = useRef({
      active: false,
      target: new THREE.Vector3(),
      startTime: 0,
      duration: 1.5,
      startPos: new THREE.Vector3(),
      startLookAt: new THREE.Vector3(),
      hub: null as HubData | null
  });

  const hubsRef = useRef<{ 
      mesh: THREE.Mesh, 
      data: HubData, 
      angle: number, 
      labelDiv?: HTMLDivElement
  }[]>([]);
  
  const shipsRef = useRef<{ mesh: THREE.Group, type: 'ufo' | 'ship', id: string }[]>([]);
  const sunRef = useRef<THREE.Mesh | null>(null);

  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const moveState = useRef({ 
      forward: false, backward: false, left: false, right: false, up: false, down: false, 
      rotX: 0, rotY: 0,
      joyVector: new THREE.Vector2(0, 0),
      fireRequested: false,
      isAIControlled: true
  });
  const [isLocked, setIsLocked] = useState(false);
  const [currentTarget, setCurrentTarget] = useState<string | null>(null);
  const [targetHealth, setTargetHealth] = useState(1);
  const targetRef = useRef<any>(null);
  const [showJoysticks, setShowJoysticks] = useState(false);

  useEffect(() => { simState.current = { isPaused, mode }; }, [isPaused, mode]);

  // Detect mobile/touch for joystick rendering
  useEffect(() => {
    const checkTouch = () => {
        if (window.matchMedia("(pointer: coarse)").matches || 'ontouchstart' in window) {
            setShowJoysticks(true);
        }
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
        switch(e.code) { case 'KeyW': moveState.current.forward = true; break; case 'KeyS': moveState.current.backward = true; break; case 'KeyA': moveState.current.left = true; break; case 'KeyD': moveState.current.right = true; break; case 'Space': moveState.current.up = true; break; case 'ShiftLeft': moveState.current.down = true; break; }
    };
    const onKeyUp = (e: KeyboardEvent) => {
        switch(e.code) { case 'KeyW': moveState.current.forward = false; break; case 'KeyS': moveState.current.backward = false; break; case 'KeyA': moveState.current.left = false; break; case 'KeyD': moveState.current.right = false; break; case 'Space': moveState.current.up = false; break; case 'ShiftLeft': moveState.current.down = false; break; }
    };
    document.addEventListener('keydown', onKeyDown); document.addEventListener('keyup', onKeyUp);
    return () => { document.removeEventListener('keydown', onKeyDown); document.removeEventListener('keyup', onKeyUp); };
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    
    const isUltraLow = quality === 'low';
    let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer;
    let composer: any;
    let orbitControls: any;
    let dragControls: any;
    let animationId: number;
    let core: THREE.Mesh;
    let starMesh: THREE.Points;
    let warpMesh: THREE.LineSegments;
    let warpGeo: THREE.BufferGeometry;
    let warpMat: THREE.LineBasicMaterial;
    let particleSystem: ParticleSystem;

    try {
        // --- SAFE INITIALIZATION BLOCK ---
        
        scene = new THREE.Scene(); 
        scene.background = new THREE.Color(0x020205); 
        scene.fog = new THREE.FogExp2(0x020205, 0.001); 
        
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000); 
        cameraRef.current = camera;
        camera.rotation.order = 'YXZ';
        
        // Position camera Logic
        const aspect = window.innerWidth / window.innerHeight;
        const baseDistance = 180;
        const distance = aspect < 1 ? baseDistance / (aspect * 0.8) : baseDistance;
        camera.position.set(0, distance * 0.6, distance);
        
        // --- RENDERER SAFETY ---
        try {
            renderer = new THREE.WebGLRenderer({ 
                antialias: false, 
                alpha: false, 
                powerPreference: "high-performance",
                failIfMajorPerformanceCaveat: false,
                depth: true,
                stencil: false
            }); 
        } catch (e) {
            console.error("WebGL Renderer failed to initialize", e);
            onError(); // TRIGGER FALLBACK TO DIRECTORY MODE
            return;
        }

        renderer.setSize(window.innerWidth, window.innerHeight); 
        // Force ultra-low resolution (0.5x) for 1GB RAM devices to maintain performance
        renderer.setPixelRatio(isUltraLow ? 0.5 : Math.min(window.devicePixelRatio, 1.5)); 
        renderer.shadowMap.enabled = !isUltraLow;
        if (!isUltraLow) {
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        renderer.domElement.style.display = 'block';
        mountRef.current.appendChild(renderer.domElement);
        
        // --- POST-PROCESSING (BLOOM) ---
        // Completely disable post-processing on ultra-low end to save VRAM and fill rate
        if (!isUltraLow) {
            const renderScene = new RenderPass(scene, camera);
            const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
            bloomPass.threshold = 0.2;
            bloomPass.strength = 1.2;
            bloomPass.radius = 0.5;
            
            composer = new EffectComposer(renderer);
            composer.addPass(renderScene);
            composer.addPass(bloomPass);
        }
        
        const labelContainer = document.createElement('div'); 
        labelContainer.style.position = 'absolute'; labelContainer.style.top = '0'; labelContainer.style.left = '0'; 
        labelContainer.style.width = '100%'; labelContainer.style.height = '100%'; 
        labelContainer.style.pointerEvents = 'none'; labelContainer.style.overflow = 'hidden'; 
        mountRef.current.appendChild(labelContainer);
        
        orbitControls = new OrbitControls(camera, renderer.domElement); 
        orbitControls.enableDamping = true; orbitControls.dampingFactor = 0.05;
        orbitControls.autoRotate = true; orbitControls.autoRotateSpeed = 0.5; 
        controlsRef.current = orbitControls;
        
        // LIGHTING
        const ambientLight = new THREE.AmbientLight(0x404040, isUltraLow ? 1.5 : 0.5); // Higher ambient for ultra-low since no shadows
        scene.add(ambientLight);
        
        const coreLight = new THREE.PointLight(0xffaa00, isUltraLow ? 2 : 5, 800); 
        coreLight.castShadow = !isUltraLow;
        if (!isUltraLow) {
            coreLight.shadow.mapSize.width = 2048;
            coreLight.shadow.mapSize.height = 2048;
            coreLight.shadow.bias = -0.001;
        }
        scene.add(coreLight);
        
        // --- OBJECTS ---
        const segs = isUltraLow ? 12 : 64; 
        const coreGeo = isUltraLow ? new THREE.IcosahedronGeometry(10, 1) : new THREE.SphereGeometry(10, segs, segs); 
        const coreMat = new THREE.MeshBasicMaterial({ 
            color: isUltraLow ? 0xffcc00 : new THREE.Color(2, 1.5, 0.5) 
        });
        core = new THREE.Mesh(coreGeo, coreMat); 
        
        // Fake Glow for Ultra Low End
        if (isUltraLow) {
            const canvas = document.createElement('canvas');
            canvas.width = 64; canvas.height = 64;
            const ctx = canvas.getContext('2d')!;
            const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.2, 'rgba(255, 200, 100, 0.8)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 64, 64);
            const glowTex = new THREE.CanvasTexture(canvas);
            const glowMat = new THREE.SpriteMaterial({ map: glowTex, color: 0xffaa00, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
            const glowSprite = new THREE.Sprite(glowMat);
            glowSprite.scale.set(40, 40, 1);
            core.add(glowSprite);
        } else {
            const sunGlowGeo = new THREE.SphereGeometry(12, 64, 64);
            const sunGlowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 0.8, 0.2), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending });
            const sunGlow = new THREE.Mesh(sunGlowGeo, sunGlowMat);
            core.add(sunGlow);
        }
        
        scene.add(core);

        // Store Sun Ref
        sunRef.current = core;

        // PARTICLE SYSTEM INIT
        particleSystem = new ParticleSystem(scene, isUltraLow ? 100 : 1500, isUltraLow);

        const starsGeo = new THREE.BufferGeometry(); 
        const starsCnt = 10; // Reduced star count to 10 only
        const posArray = new Float32Array(starsCnt * 3); 
        const colorArray = new Float32Array(starsCnt * 3);
        for(let i=0; i<starsCnt*3; i+=3) { 
            posArray[i] = (Math.random() - 0.5) * 250; 
            posArray[i+1] = (Math.random() - 0.5) * 250;
            posArray[i+2] = (Math.random() - 0.5) * 250;
            
            // Add slight color variation to stars
            const starType = Math.random();
            let r=1, g=1, b=1;
            if (starType > 0.9) { r=0.8; g=0.8; b=1; } // Blueish
            else if (starType > 0.8) { r=1; g=0.8; b=0.8; } // Reddish
            else if (starType > 0.7) { r=1; g=1; b=0.8; } // Yellowish
            
            colorArray[i] = r; colorArray[i+1] = g; colorArray[i+2] = b;
        } 
        starsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3)); 
        starsGeo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
        const starsMat = new THREE.PointsMaterial({ size: 1.5, vertexColors: true, sizeAttenuation: false, transparent: true, opacity: 0.8 }); 
        starMesh = new THREE.Points(starsGeo, starsMat); 
        scene.add(starMesh);

        // --- WARP SPEED EFFECT ---
        const warpLinesCnt = isUltraLow ? 50 : 1000;
        warpGeo = new THREE.BufferGeometry();
        const warpPosArray = new Float32Array(warpLinesCnt * 6);
        for(let i=0; i<warpLinesCnt*6; i+=6) {
            const x = (Math.random() - 0.5) * 400;
            const y = (Math.random() - 0.5) * 400;
            const z = -Math.random() * 1000;
            warpPosArray[i] = x;
            warpPosArray[i+1] = y;
            warpPosArray[i+2] = z;
            warpPosArray[i+3] = x;
            warpPosArray[i+4] = y;
            warpPosArray[i+5] = z - (Math.random() * 50 + 50); // Length of streak
        }
        warpGeo.setAttribute('position', new THREE.BufferAttribute(warpPosArray, 3));
        warpMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
        warpMesh = new THREE.LineSegments(warpGeo, warpMat);
        camera.add(warpMesh);
        scene.add(camera); // Add camera to scene so children are rendered

        const createPlanetTexture = (baseColor: number) => {
            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;

            ctx.fillStyle = '#' + baseColor.toString(16).padStart(6, '0');
            ctx.fillRect(0, 0, 1024, 512);

            for (let i = 0; i < 8000; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
                ctx.beginPath();
                ctx.arc(Math.random() * 1024, Math.random() * 512, Math.random() * 12, 0, Math.PI * 2);
                ctx.fill();
            }

            for (let y = 0; y < 512; y += Math.random() * 20 + 10) {
                ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.15})`;
                ctx.fillRect(0, y, 1024, Math.random() * 30);
                
                ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.1})`;
                ctx.fillRect(0, y + 10, 1024, Math.random() * 20);
            }

            const texture = new THREE.CanvasTexture(canvas);
            texture.colorSpace = THREE.SRGBColorSpace;
            return texture;
        };

        const textureLoader = new THREE.TextureLoader();

        const createRingTexture = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 1;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;

            ctx.clearRect(0, 0, 256, 1);
            
            const drawBand = (uStart: number, uEnd: number, color: string) => {
                const xStart = Math.floor(uStart * 256);
                const width = Math.ceil((uEnd - uStart) * 256);
                ctx.fillStyle = color;
                ctx.fillRect(xStart, 0, width, 1);
            };

            // Saturn-like bands
            drawBand(0.0, 0.1, 'rgba(180, 160, 130, 0.1)'); // Inner faint
            drawBand(0.1, 0.4, 'rgba(210, 190, 150, 0.8)'); // B ring
            drawBand(0.4, 0.45, 'rgba(0, 0, 0, 0.0)');      // Cassini Division
            drawBand(0.45, 0.7, 'rgba(190, 170, 130, 0.7)'); // A ring
            drawBand(0.7, 0.75, 'rgba(0, 0, 0, 0.0)');      // Encke Gap
            drawBand(0.75, 0.9, 'rgba(170, 150, 120, 0.5)'); // Outer A ring
            drawBand(0.9, 1.0, 'rgba(120, 110, 90, 0.2)');   // F ring

            // Add fine noise
            for(let i=0; i<256; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)';
                ctx.fillRect(i, 0, 1, 1);
            }

            const texture = new THREE.CanvasTexture(canvas);
            texture.colorSpace = THREE.SRGBColorSpace;
            return texture;
        };
        const ringTexture = createRingTexture();

        const createAtmosphereGlow = (radius: number, color: number) => {
            const group = new THREE.Group();
            
            // Custom Shader for Outer Atmosphere Glow
            const atmosphereGeo = new THREE.SphereGeometry(radius * 1.25, 64, 64);
            const atmosphereMat = new THREE.ShaderMaterial({
                vertexShader: `
                    varying vec3 vNormal;
                    void main() {
                        vNormal = normalize(normalMatrix * normal);
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    varying vec3 vNormal;
                    void main() {
                        // Calculate fresnel effect for outer glow
                        float intensity = pow(0.55 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
                        vec3 glowColor = vec3(${((color >> 16) & 255) / 255}, ${((color >> 8) & 255) / 255}, ${(color & 255) / 255});
                        // Darker, richer color with higher intensity
                        gl_FragColor = vec4(glowColor * 0.4, intensity * 3.5);
                    }
                `,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                transparent: true,
                depthWrite: false
            });
            const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
            group.add(atmosphere);

            // Custom Shader for Inner Edge Glow
            const innerGlowGeo = new THREE.SphereGeometry(radius * 1.01, 64, 64);
            const innerGlowMat = new THREE.ShaderMaterial({
                vertexShader: `
                    varying vec3 vNormal;
                    void main() {
                        vNormal = normalize(normalMatrix * normal);
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    varying vec3 vNormal;
                    void main() {
                        // Calculate fresnel effect for inner edge glow
                        float intensity = pow(1.0 - dot(vNormal, vec3(0, 0, 1.0)), 3.0);
                        vec3 glowColor = vec3(${((color >> 16) & 255) / 255}, ${((color >> 8) & 255) / 255}, ${(color & 255) / 255});
                        // Subtle, dark inner glow
                        gl_FragColor = vec4(glowColor * 0.3, intensity * 1.5);
                    }
                `,
                blending: THREE.AdditiveBlending,
                side: THREE.FrontSide,
                transparent: true,
                depthWrite: false
            });
            const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
            group.add(innerGlow);
            
            return group;
        };

        hubsRef.current = [];
        HUBS_DATA.forEach((h) => {
            let geo;
            if (h.geometryType === 'torus') geo = isUltraLow ? new THREE.TorusGeometry(h.radius, h.radius * 0.4, 8, 12) : new THREE.TorusGeometry(h.radius, h.radius * 0.4, 32, 64);
            else if (h.geometryType === 'icosahedron') geo = new THREE.IcosahedronGeometry(h.radius, isUltraLow ? 0 : 1);
            else geo = isUltraLow ? new THREE.IcosahedronGeometry(h.radius, 1) : new THREE.SphereGeometry(h.radius, 64, 64);

            // Load textures if available, otherwise fallback to procedural
            // For ultra-low end, do not generate canvas textures to save memory
            let mapTex = (!isUltraLow && h.textureUrl) ? textureLoader.load(h.textureUrl) : (!isUltraLow ? createPlanetTexture(h.color) : null);
            if (mapTex) mapTex.colorSpace = THREE.SRGBColorSpace;
            
            let normalTex = (!isUltraLow && h.normalUrl) ? textureLoader.load(h.normalUrl) : null;
            let specularTex = (!isUltraLow && h.specularUrl) ? textureLoader.load(h.specularUrl) : null;

            // Use MeshPhysicalMaterial for realistic planets
            const mat = isUltraLow ? new THREE.MeshLambertMaterial({
                color: h.color,
                wireframe: h.geometryType === 'icosahedron'
            }) : new THREE.MeshPhysicalMaterial({ 
                color: h.textureUrl ? 0xffffff : h.color, // Base color is white if using real texture
                map: mapTex,
                normalMap: normalTex,
                roughnessMap: specularTex, // Use specular as roughness approximation
                roughness: h.specularUrl ? 1.0 : 0.7, // Let roughness map control it
                metalness: 0.1,
                clearcoat: 0.1,
                clearcoatRoughness: 0.8,
                wireframe: h.geometryType === 'icosahedron' 
            }); 
            const mesh = new THREE.Mesh(geo, mat);
            mesh.castShadow = !isUltraLow;
            mesh.receiveShadow = !isUltraLow;
            
            // Add Cloud Layer if URL exists
            if (!isUltraLow && h.cloudsUrl) {
                const cloudGeo = new THREE.SphereGeometry(h.radius * 1.01, 64, 64);
                const cloudTex = textureLoader.load(h.cloudsUrl);
                cloudTex.colorSpace = THREE.SRGBColorSpace;
                const cloudMat = new THREE.MeshLambertMaterial({
                    map: cloudTex,
                    transparent: true,
                    opacity: 0.8,
                    blending: THREE.AdditiveBlending,
                    side: THREE.DoubleSide,
                    depthWrite: false
                });
                const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
                cloudMesh.userData = { isCloud: true, rotationSpeed: 0.002 };
                mesh.add(cloudMesh);
            }

            // Add Night Lights Layer
            if (!isUltraLow && h.nightUrl) {
                const nightTex = textureLoader.load(h.nightUrl);
                nightTex.colorSpace = THREE.SRGBColorSpace;
                const nightGeo = new THREE.SphereGeometry(h.radius * 1.002, 64, 64);
                const nightMat = new THREE.ShaderMaterial({
                    uniforms: {
                        nightTexture: { value: nightTex }
                    },
                    vertexShader: `
                        varying vec2 vUv;
                        varying vec3 vNormal;
                        varying vec3 vWorldPosition;
                        void main() {
                            vUv = uv;
                            vNormal = normalize(mat3(modelMatrix) * normal);
                            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                            vWorldPosition = worldPosition.xyz;
                            gl_Position = projectionMatrix * viewMatrix * worldPosition;
                        }
                    `,
                    fragmentShader: `
                        uniform sampler2D nightTexture;
                        varying vec2 vUv;
                        varying vec3 vNormal;
                        varying vec3 vWorldPosition;
                        void main() {
                            vec4 nightColor = texture2D(nightTexture, vUv);
                            // Sun is at origin (0,0,0). Direction to sun is -vWorldPosition
                            vec3 sunDir = normalize(-vWorldPosition);
                            float lightIntensity = dot(normalize(vNormal), sunDir);
                            
                            // Smooth transition at the terminator line
                            float nightIntensity = smoothstep(0.1, -0.2, lightIntensity);
                            
                            // Boost the brightness of the lights slightly
                            gl_FragColor = vec4(nightColor.rgb * nightIntensity * 1.5, nightIntensity);
                        }
                    `,
                    transparent: true,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                });
                const nightMesh = new THREE.Mesh(nightGeo, nightMat);
                mesh.add(nightMesh);
            }

            // Add Atmosphere Glow (Fresnel Approximation)
            if (!isUltraLow && h.geometryType === 'sphere') {
                const atmosphereGlow = createAtmosphereGlow(h.radius, h.color);
                mesh.add(atmosphereGlow);
            }
            
            if (h.hasRing) { 
                const innerRadius = h.radius * 1.4;
                const outerRadius = h.radius * 2.6;
                const ringGeo = new THREE.RingGeometry(innerRadius, outerRadius, isUltraLow ? 16 : 128); 
                
                // Fix UVs to be radial (u = radius, v = angle)
                const pos = ringGeo.attributes.position;
                const uvs = ringGeo.attributes.uv;
                for (let i = 0; i < pos.count; i++) {
                    const x = pos.getX(i);
                    const y = pos.getY(i);
                    const radius = Math.sqrt(x*x + y*y);
                    const u = (radius - innerRadius) / (outerRadius - innerRadius);
                    uvs.setXY(i, u, 0); // v doesn't matter for a 1D texture
                }
                
                const ringMat = isUltraLow ? new THREE.MeshBasicMaterial({
                    map: ringTexture,
                    color: 0xffffff,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.9,
                    alphaTest: 0.01
                }) : new THREE.MeshPhysicalMaterial({ 
                    map: ringTexture,
                    color: 0xffffff,
                    side: THREE.DoubleSide, 
                    transparent: true, 
                    opacity: 0.9, 
                    roughness: 0.8, 
                    metalness: 0.1,
                    alphaMap: ringTexture,
                    alphaTest: 0.01
                }); 
                const ring = new THREE.Mesh(ringGeo, ringMat); 
                ring.rotation.x = -Math.PI / 2; 
                ring.rotation.y = Math.PI / 12; 
                ring.receiveShadow = !isUltraLow;
                ring.castShadow = !isUltraLow;
                mesh.add(ring);
            }
            
            if (h.geometryType === 'icosahedron') {
                const innerGeo = new THREE.IcosahedronGeometry(h.radius * 0.6, 0);
                const innerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
                const inner = new THREE.Mesh(innerGeo, innerMat);
                mesh.add(inner);
            }

            scene.add(mesh);
            
            const orbitGeo = new THREE.RingGeometry(h.distance - 0.15, h.distance + 0.15, 32); 
            const orbitMat = new THREE.MeshBasicMaterial({ color: h.color, side: THREE.DoubleSide, transparent: true, opacity: 0.15 }); 
            const orbitLine = new THREE.Mesh(orbitGeo, orbitMat); 
            orbitLine.rotation.x = -Math.PI / 2; 
            scene.add(orbitLine);
            
            const label = document.createElement('div'); label.className = 'planet-label'; label.innerHTML = `<span style="font-size:1.2em; margin-right:4px;">${h.icon}</span> ${h.name}`; 
            
            label.onclick = () => {
                if (warpRef.current.active) return;
                warpRef.current.active = true;
                warpRef.current.startTime = clock.getElapsedTime();
                warpRef.current.startPos.copy(camera.position);
                const planetPos = new THREE.Vector3().copy(mesh.position);
                const direction = new THREE.Vector3().subVectors(camera.position, planetPos).normalize();
                warpRef.current.target.copy(planetPos).add(direction.multiplyScalar(10));
                warpRef.current.hub = h;
                controlsRef.current.enabled = false;
            };
            labelContainer.appendChild(label);
            hubsRef.current.push({ mesh, data: h, angle: Math.random() * Math.PI * 2, labelDiv: label });
        });
        // --- END OBJECTS ---

        // --- SHIPS & COMBAT ---
        const createUFO = (color: number) => {
            const ufoGroup = new THREE.Group();
            ufoGroup.userData = { isDragging: false, type: 'ufo' };
            
            // 1. Dark, Reflective Hull
            const ufoBodyGeo = isUltraLow ? new THREE.CylinderGeometry(3.5, 1.5, 1.2, 8) : new THREE.CylinderGeometry(3.5, 1.5, 1.2, 32);
            const ufoMat = isUltraLow ? new THREE.MeshLambertMaterial({ color: 0xdddddd }) : new THREE.MeshPhysicalMaterial({ 
                color: 0xdddddd, 
                emissive: 0x444444,
                metalness: 0.6, 
                roughness: 0.2, 
                clearcoat: 1.0, 
                clearcoatRoughness: 0.1 
            });
            const ufoBody = new THREE.Mesh(ufoBodyGeo, ufoMat);
            ufoGroup.add(ufoBody);
            
            // 2. Glass Dome
            const ufoDomeGeo = isUltraLow ? new THREE.ConeGeometry(2, 2, 8) : new THREE.SphereGeometry(2, 32, 16, 0, Math.PI*2, 0, Math.PI/2);
            const ufoDomeMat = isUltraLow ? new THREE.MeshBasicMaterial({ color: 0x88ccff, wireframe: true }) : new THREE.MeshPhysicalMaterial({ 
                color: 0xffffff, 
                transmission: 0.95, 
                opacity: 1, 
                transparent: true, 
                roughness: 0.05, 
                metalness: 0.1,
                ior: 1.5,
                thickness: 0.5
            });
            const ufoDome = new THREE.Mesh(ufoDomeGeo, ufoDomeMat);
            ufoDome.position.y = 0.5;
            ufoGroup.add(ufoDome);
            
            // 3. Spinning Outer Ring with Glowing Nodes
            const ringGroup = new THREE.Group();
            const ufoRingGeo = isUltraLow ? new THREE.TorusGeometry(4, 0.15, 3, 8) : new THREE.TorusGeometry(4, 0.15, 16, 64);
            const ufoRingMat = isUltraLow ? new THREE.MeshBasicMaterial({ color: 0x333333 }) : new THREE.MeshStandardMaterial({ 
                color: 0x333333, 
                metalness: 0.9, 
                roughness: 0.4 
            });
            const ufoRing = new THREE.Mesh(ufoRingGeo, ufoRingMat);
            ringGroup.add(ufoRing);

            // Add glowing nodes to the ring
            if (!isUltraLow) {
                const nodeGeo = new THREE.SphereGeometry(0.3, 16, 16);
                const nodeMat = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    emissive: color,
                    emissiveIntensity: 2.0,
                    toneMapped: false
                });
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    const node = new THREE.Mesh(nodeGeo, nodeMat);
                    node.position.set(Math.cos(angle) * 4, 0, Math.sin(angle) * 4);
                    ringGroup.add(node);
                }
            }
            ufoGroup.add(ringGroup); // This is children[2], which gets rotated in the animation loop
            
            // 4. Glowing Core inside the dome
            const coreGeo = isUltraLow ? new THREE.BoxGeometry(1, 1, 1) : new THREE.CylinderGeometry(0.5, 1.0, 1.0, 16);
            const coreMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: color,
                emissiveIntensity: isUltraLow ? 1.0 : 3.0,
                toneMapped: !isUltraLow
            });
            const core = new THREE.Mesh(coreGeo, coreMat);
            core.position.y = 1.0;
            ufoGroup.add(core);

            // 5. Dynamic Lighting
            if (!isUltraLow) {
                const ufoLight = new THREE.PointLight(color, 5, 40);
                ufoLight.position.y = 1.0;
                ufoGroup.add(ufoLight);
            }
            
            return ufoGroup;
        };

        const createShip = (color: number) => {
            const shipGroup = new THREE.Group();
            shipGroup.userData = { isDragging: false, type: 'ship' };
            
            // 1. Pure White, Reflective Hull
            const shipMat = isUltraLow ? new THREE.MeshLambertMaterial({ color: 0xffffff }) : new THREE.MeshPhysicalMaterial({ 
                color: 0xffffff, 
                emissive: 0xaaaaaa, // Increased to make it look whiter
                emissiveIntensity: 0.2,
                metalness: 0.3, 
                roughness: 0.2, 
                clearcoat: 1.0,
                clearcoatRoughness: 0.05
            });

            // Glowing accent material
            const accentMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: color,
                emissiveIntensity: isUltraLow ? 1.5 : 3.0,
                toneMapped: !isUltraLow
            });

            // Red UFO-like glow material
            const redGlowMat = new THREE.MeshStandardMaterial({
                color: 0xff0000,
                emissive: 0xff0000,
                emissiveIntensity: isUltraLow ? 2.0 : 5.0,
                toneMapped: !isUltraLow
            });

            // Add pulse animation logic to userData
            shipGroup.userData = {
                ...shipGroup.userData,
                pulsePhase: Math.random() * Math.PI * 2,
                update: (time: number) => {
                    if (isUltraLow) return;
                    const pulse = (Math.sin(time * 3 + shipGroup.userData.pulsePhase) + 1) * 0.5;
                    redGlowMat.emissiveIntensity = 3.0 + pulse * 4.0;
                    shipMat.emissiveIntensity = 0.2 + pulse * 0.1;
                }
            };
            
            const shipBodyGeo = isUltraLow ? new THREE.BoxGeometry(2, 2, 6) : new THREE.CapsuleGeometry(1.2, 6, 16, 16);
            const shipBody = new THREE.Mesh(shipBodyGeo, shipMat);
            shipBody.rotation.x = -Math.PI / 2; 
            shipGroup.add(shipBody);
            
            const wingGeo = isUltraLow ? new THREE.ConeGeometry(4, 8, 3) : new THREE.ConeGeometry(4, 8, 3);
            const wing = new THREE.Mesh(wingGeo, shipMat);
            wing.rotation.x = -Math.PI / 2;
            wing.rotation.z = Math.PI / 2;
            wing.scale.set(1, 1, 0.1);
            wing.position.set(0, 0, 1);
            shipGroup.add(wing);

            // Wing Accents (Glowing strips)
            if (!isUltraLow) {
                const wingAccentGeo = new THREE.BoxGeometry(7.5, 0.2, 0.2);
                const wingAccent = new THREE.Mesh(wingAccentGeo, accentMat);
                wingAccent.position.set(0, 0, 1.5);
                shipGroup.add(wingAccent);

                // Red Glowing Wing Tips (UFO style)
                const lightGeo = new THREE.SphereGeometry(0.4, 16, 16);
                const lightLeft = new THREE.Mesh(lightGeo, redGlowMat);
                lightLeft.position.set(4, 0, 1);
                shipGroup.add(lightLeft);

                const lightRight = new THREE.Mesh(lightGeo, redGlowMat);
                lightRight.position.set(-4, 0, 1);
                shipGroup.add(lightRight);

                // Small red lights along the edge
                for (let i = -3; i <= 3; i += 1.5) {
                    if (i === 0) continue;
                    const smallLight = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), redGlowMat);
                    smallLight.position.set(i, 0, 0.5);
                    shipGroup.add(smallLight);
                }
            }

            const tailGeo = new THREE.ConeGeometry(2, 3, 3);
            const tail = new THREE.Mesh(tailGeo, shipMat);
            tail.rotation.x = -Math.PI / 2;
            tail.scale.set(0.1, 1, 1);
            tail.position.set(0, 1.5, 3);
            shipGroup.add(tail);
            
            const cockpitGeo = isUltraLow ? new THREE.BoxGeometry(1, 1, 2) : new THREE.CapsuleGeometry(0.7, 2, 16, 16);
            const cockpitMat = isUltraLow ? new THREE.MeshBasicMaterial({ color: 0x111111 }) : new THREE.MeshPhysicalMaterial({ 
                color: 0x000000, 
                metalness: 0.9, 
                roughness: 0.05, 
                clearcoat: 1.0,
                transmission: 0.8,
                ior: 1.5
            });
            const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
            cockpit.rotation.x = -Math.PI / 2;
            cockpit.position.set(0, 0.8, -1);
            shipGroup.add(cockpit);
            
            const engineGeo = isUltraLow ? new THREE.BoxGeometry(1, 1, 1.5) : new THREE.CylinderGeometry(0.5, 0.7, 1.5, 16);
            const engineMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.5 });
            
            // Engine Cores (Glowing)
            const engineCoreGeo = isUltraLow ? new THREE.BoxGeometry(0.8, 0.8, 1.6) : new THREE.CylinderGeometry(0.4, 0.4, 1.6, 16);
            
            const engine1 = new THREE.Mesh(engineGeo, engineMat);
            engine1.rotation.x = Math.PI / 2;
            engine1.position.set(-1, 0, 3.5);
            const core1 = new THREE.Mesh(engineCoreGeo, accentMat);
            core1.rotation.x = Math.PI / 2;
            core1.position.set(-1, 0, 3.5);
            shipGroup.add(engine1);
            shipGroup.add(core1);

            const engine2 = engine1.clone();
            engine2.position.set(1, 0, 3.5);
            const core2 = new THREE.Mesh(engineCoreGeo, accentMat);
            core2.rotation.x = Math.PI / 2;
            core2.position.set(1, 0, 3.5);
            shipGroup.add(engine2);
            shipGroup.add(core2);
            
            if (!isUltraLow) {
                const shipLight = new THREE.PointLight(color, 4, 30);
                shipLight.position.set(0, 0, 4);
                shipGroup.add(shipLight);
            }
            
            return shipGroup;
        };

        const ufo1 = createUFO(0x00ffcc);
        ufo1.position.set(0, 100, 0);
        scene.add(ufo1);
        shipsRef.current.push({ mesh: ufo1, type: 'ufo', id: 'ufo1' });

        const ufo2 = isUltraLow ? null : createUFO(0xff00cc);
        if (ufo2) {
            ufo2.position.set(20, 100, 20);
            scene.add(ufo2);
            shipsRef.current.push({ mesh: ufo2, type: 'ufo', id: 'ufo2' });
        }

        const ship1 = createShip(0xff4400);
        ship1.position.set(0, -100, 0);
        scene.add(ship1);
        shipsRef.current.push({ mesh: ship1, type: 'ship', id: 'ship1' });

        const ship2 = isUltraLow ? null : createShip(0x0044ff);
        if (ship2) {
            ship2.position.set(-20, -100, -20);
            scene.add(ship2);
            shipsRef.current.push({ mesh: ship2, type: 'ship', id: 'ship2' });
        }

        const draggables = [ufo1, ship1];
        if (ufo2) draggables.push(ufo2);
        if (ship2) draggables.push(ship2);
        
        dragControls = new DragControls(draggables, camera, renderer.domElement);
        dragControls.transformGroup = true;
        dragControls.addEventListener('dragstart', function (event: any) {
            if (orbitControls) orbitControls.enabled = false;
            event.object.userData.isDragging = true;
        });
        dragControls.addEventListener('dragend', function (event: any) {
            if (orbitControls) orbitControls.enabled = true;
            event.object.userData.isDragging = false;
        });

        const createPersonality = () => ({
            reactionTime: 0.2 + Math.random() * 0.5,
            aimJitter: 0.05 + Math.random() * 0.15,
            aggression: 0.5 + Math.random() * 1.5,
            preferredDist: 80 + Math.random() * 60
        });

        var combatState = {
            ufos: [
                { mesh: ufo1, velocity: new THREE.Vector3(0, 0, 30), lastFire: 0, health: 15, maxHealth: 15, isDead: false, respawnTimer: 0, color: 0x00ffcc, type: 'ufo', faction: 'ufo', state: 'attacking', personality: createPersonality(), maneuverTimer: 0, isRolling: false },
                ...(ufo2 ? [{ mesh: ufo2, velocity: new THREE.Vector3(0, 0, 30), lastFire: 0, health: 15, maxHealth: 15, isDead: false, respawnTimer: 0, color: 0xff00cc, type: 'ufo', faction: 'ufo', state: 'attacking', personality: createPersonality(), maneuverTimer: 0, isRolling: false }] : [])
            ],
            ships: [
                { mesh: ship1, velocity: new THREE.Vector3(0, 0, -30), lastFire: 0, health: 15, maxHealth: 15, isDead: false, respawnTimer: 0, color: 0xff4400, type: 'ship', faction: 'ship', state: 'attacking', personality: createPersonality(), maneuverTimer: 0, isRolling: false },
                ...(ship2 ? [{ mesh: ship2, velocity: new THREE.Vector3(0, 0, -30), lastFire: 0, health: 15, maxHealth: 15, isDead: false, respawnTimer: 0, color: 0x0044ff, type: 'ship', faction: 'ship', state: 'attacking', personality: createPersonality(), maneuverTimer: 0, isRolling: false }] : [])
            ],
            projectiles: [] as { mesh: THREE.Object3D, velocity: THREE.Vector3, life: number, type: string, shooter: any, color: number }[],
            lasers: [] as { line: THREE.Line, life: number }[],
            particles: particleSystem,
            capturedPlanets: new Set<string>()
        };

        // Initial Spawning Positions (Top/Bottom Orbit)
        combatState.ufos.forEach((u, i) => u.mesh.position.set((i-0.5)*100, 100, (Math.random()-0.5)*100));
        combatState.ships.forEach((s, i) => s.mesh.position.set((i-0.5)*100, -100, (Math.random()-0.5)*100));
        // --- END SHIPS & COMBAT ---

    } catch(err) {
        console.error("Critical Scene Setup Error:", err);
        onError();
        return;
    }
    
    // --- EVENT LISTENERS ---
    const raycaster = new THREE.Raycaster(); const mouse = new THREE.Vector2();
    const onClick = (e: MouseEvent) => { 
        if (simState.current.mode === 'pilot') { 
            if (document.pointerLockElement !== document.body) document.body.requestPointerLock(); 
            return; 
        } 
        if ((e.target as HTMLElement).closest('.planet-label')) return; 
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1; 
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1; 
        raycaster.setFromCamera(mouse, camera); 
        const intersects = raycaster.intersectObjects(hubsRef.current.map(o => o.mesh)); 
        if (intersects.length > 0) { 
            const hit = hubsRef.current.find(h => h.mesh === intersects[0].object); 
            if (hit && !warpRef.current.active) {
                warpRef.current.active = true;
                warpRef.current.startTime = clock.getElapsedTime();
                warpRef.current.startPos.copy(camera.position);
                const planetPos = new THREE.Vector3().copy(hit.mesh.position);
                const direction = new THREE.Vector3().subVectors(camera.position, planetPos).normalize();
                warpRef.current.target.copy(planetPos).add(direction.multiplyScalar(10));
                warpRef.current.hub = hit.data;
                controlsRef.current.enabled = false;
            } 
        } 
    };
    renderer.domElement.addEventListener('click', onClick);
    
    const onMouseMove = (event: MouseEvent) => {
        if (document.pointerLockElement === document.body) {
            if (simState.current.mode === 'pilot') {
                moveState.current.rotY = -event.movementX * 0.005;
                moveState.current.rotX = -event.movementY * 0.005;
            } else {
                camera.rotation.y -= event.movementX * 0.002;
                camera.rotation.x -= event.movementY * 0.002;
                camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
            }
        }
    };
    const onPointerLockChange = () => setIsLocked(document.pointerLockElement === document.body);
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onPointerLockChange);

    (window as any).joystickMove = (dx: number, dy: number) => { 
        moveState.current.joyVector.set(dx, dy);
        moveState.current.left = dx < -0.3; moveState.current.right = dx > 0.3; 
        moveState.current.forward = dy < -0.3; moveState.current.backward = dy > 0.3; 
    };
    (window as any).joystickLook = (dx: number, dy: number) => { moveState.current.rotY = -dx * 0.03; moveState.current.rotX = -dy * 0.03; };
    
    // --- VIEWER MODE LOGIC MOVED ---


    const tempV = new THREE.Vector3(); const clock = new THREE.Clock();
    let width = window.innerWidth; let height = window.innerHeight; let frame = 0;

    const animate = () => {
        animationId = requestAnimationFrame(animate); 
        const { isPaused, mode } = simState.current;
        
        if (isPaused) return;

        frame++;
        const delta = clock.getDelta(); 
        const elapsedTime = clock.getElapsedTime();
        
        if (warpRef.current.active) {
            const t = (elapsedTime - warpRef.current.startTime) / warpRef.current.duration;
            const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; 
            if (t < 1.0) {
                camera.position.lerpVectors(warpRef.current.startPos, warpRef.current.target, easeT);
                if (warpRef.current.hub) {
                   const targetHub = hubsRef.current.find(h => h.data.id === warpRef.current.hub!.id);
                   if (targetHub) camera.lookAt(targetHub.mesh.position);
                   else camera.lookAt(new THREE.Vector3());
                } else {
                   camera.lookAt(new THREE.Vector3());
                }
                const warpIntensity = Math.sin(t * Math.PI); 
                camera.fov = 45 + (warpIntensity * 60); // INCREASED FOV FOR WARP
                camera.updateProjectionMatrix();
                
                // Animate warp lines
                if (warpMat && warpGeo) {
                    warpMat.opacity = warpIntensity * 0.8;
                    const positions = warpGeo.attributes.position.array as Float32Array;
                    for(let i=0; i<positions.length; i+=6) {
                        positions[i+2] += 40; // move towards camera
                        positions[i+5] += 40;
                        if (positions[i+2] > 50) { // reset if passed camera
                            positions[i+2] = -1000;
                            positions[i+5] = -1000 - (Math.random() * 100 + 50);
                        }
                    }
                    warpGeo.attributes.position.needsUpdate = true;
                }
            } else {
                warpRef.current.active = false;
                camera.fov = 45;
                camera.updateProjectionMatrix();
                if (warpMat) warpMat.opacity = 0;
                if (warpRef.current.hub) onHubSelect(warpRef.current.hub);
                controlsRef.current.enabled = true;
            }
        } else {
            if (warpMat && warpMat.opacity > 0) warpMat.opacity = 0;
        }
        
        if (mode === 'cinematic' && orbitControls && !warpRef.current.active) { 
            if (moveState.current.rotX !== 0 || moveState.current.rotY !== 0) {
                 orbitControls.autoRotate = false;
                 const dist = camera.position.distanceTo(orbitControls.target);
                 const theta = orbitControls.getAzimuthalAngle() - moveState.current.rotY * 0.05;
                 const phi = Math.max(orbitControls.minPolarAngle, Math.min(orbitControls.maxPolarAngle, orbitControls.getPolarAngle() - moveState.current.rotX * 0.05));
                 camera.position.setFromSphericalCoords(dist, phi, theta).add(orbitControls.target);
            } else {
                 orbitControls.autoRotate = true;
            }
            orbitControls.enabled = true; orbitControls.update(); 
        }
        else if (mode === 'pilot' && !warpRef.current.active) {
             if (orbitControls) orbitControls.enabled = false;
             // Camera and ship movement handled in combat update
        } 
        else if (mode === 'directory' && orbitControls) { 
            orbitControls.autoRotate = true; orbitControls.autoRotateSpeed = 0.2; orbitControls.update(); 
        }
        
        if (!isPaused && !warpRef.current.active) { 
            hubsRef.current.forEach(h => { 
                h.angle += h.data.speed * 0.5; 
                h.mesh.position.x = Math.cos(h.angle) * h.data.distance;
                h.mesh.position.z = Math.sin(h.angle) * h.data.distance;
                h.mesh.position.y = 0; 
                h.mesh.rotation.y += 0.005;
                if(h.data.geometryType === 'torus' || h.data.geometryType === 'icosahedron') h.mesh.rotation.x += 0.005;

                // Captured Planet Visuals
                if (typeof combatState !== 'undefined' && combatState.capturedPlanets.has(h.data.id)) {
                    h.mesh.scale.setScalar(1.1 + Math.sin(elapsedTime * 5) * 0.05);
                    if (frame % 10 === 0) {
                        combatState.particles.spawn(h.mesh.position, new THREE.Vector3(0, 5, 0), 0x00ffcc, 0.3, 0.4);
                    }
                }
            });
            if(core) core.rotation.y += 0.002; 
            if(starMesh) starMesh.rotation.y -= 0.0001; 
        }

        // Label Positioning (Throttled)
        if (frame % 3 === 0 && !warpRef.current.active) {
            hubsRef.current.forEach(h => { 
                if (h.labelDiv && h.mesh) { 
                    h.mesh.getWorldPosition(tempV); 
                    tempV.project(camera); 
                    if (tempV.z < 1 && tempV.z > -1) { 
                        const x = (tempV.x * .5 + .5) * width; 
                        const y = (tempV.y * -.5 + .5) * height; 
                        h.labelDiv.style.display = 'block'; 
                        h.labelDiv.style.transform = `translate3d(${x.toFixed(1)}px, ${(y - 40).toFixed(1)}px, 0)`;
                    } else { 
                        h.labelDiv.style.display = 'none'; 
                    } 
                } 
            });
        } else if (warpRef.current.active) {
             hubsRef.current.forEach(h => { if(h.labelDiv) h.labelDiv.style.display = 'none'; });
        }
        
        // --- COMBAT & SHIP UPDATE ---
        if (!isPaused && typeof combatState !== 'undefined') {
            const { ufos, ships, projectiles, lasers, particles } = combatState;
            
            const createImpactSparks = (position: THREE.Vector3, color: number) => {
                const sparkCount = isUltraLow ? 8 : 15;
                for (let i = 0; i < sparkCount; i++) {
                    const velocity = new THREE.Vector3(
                        (Math.random() - 0.5) * 40,
                        (Math.random() - 0.5) * 40,
                        (Math.random() - 0.5) * 40
                    );
                    particles.spawn(position, velocity, color, 0.3, 0.2);
                }
            };

            const fireWeapon = (shooter: any, target: any, type: string) => {
                if (shooter.isDead || target.isDead) return;

                const startPos = new THREE.Vector3().copy(shooter.mesh.position);
                const targetPos = new THREE.Vector3().copy(target.mesh.position);
                
                // Add inaccuracy based on weapon
                const inaccuracy = type === 'laser' ? 5 : (type === 'machinegun' ? 15 : 10);
                targetPos.x += (Math.random() - 0.5) * inaccuracy;
                targetPos.y += (Math.random() - 0.5) * inaccuracy;
                targetPos.z += (Math.random() - 0.5) * inaccuracy;
                
                const dir = new THREE.Vector3().subVectors(targetPos, startPos).normalize();

                if (type === 'laser') {
                    // Muzzle flash
                    particles.spawn(startPos, new THREE.Vector3(0,0,0), shooter.color, 0.1, isUltraLow ? 1.0 : 1.5);

                    // Laser Projectile (Core + Glow)
                    const laserGroup = new THREE.Group();
                    
                    const coreGeo = new THREE.CylinderGeometry(0.2, 0.2, isUltraLow ? 10 : 15, isUltraLow ? 3 : 8);
                    coreGeo.rotateX(Math.PI / 2);
                    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
                    const core = new THREE.Mesh(coreGeo, coreMat);
                    laserGroup.add(core);

                    if (!isUltraLow) {
                        const glowGeo = new THREE.CylinderGeometry(0.6, 0.6, 15, 8);
                        glowGeo.rotateX(Math.PI / 2);
                        const glowMat = new THREE.MeshBasicMaterial({ color: shooter.color, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
                        const glow = new THREE.Mesh(glowGeo, glowMat);
                        laserGroup.add(glow);
                    }

                    laserGroup.position.copy(startPos);
                    laserGroup.lookAt(targetPos);
                    scene.add(laserGroup);
                    
                    projectiles.push({ mesh: laserGroup, velocity: dir.multiplyScalar(400), life: 2, type: 'laser', shooter, color: shooter.color });
                } else if (type === 'rocket') {
                    // Muzzle flash
                    particles.spawn(startPos, new THREE.Vector3(0,0,0), 0xffaa00, 0.15, isUltraLow ? 1.5 : 2);

                    const rocketGroup = new THREE.Group();
                    
                    const bodyGeo = new THREE.CylinderGeometry(0.4, 0.4, isUltraLow ? 2 : 3, isUltraLow ? 4 : 8);
                    bodyGeo.rotateX(Math.PI / 2);
                    const bodyMat = isUltraLow ? new THREE.MeshBasicMaterial({ color: 0x555555 }) : new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8, roughness: 0.2 });
                    const body = new THREE.Mesh(bodyGeo, bodyMat);
                    rocketGroup.add(body);

                    const noseGeo = new THREE.ConeGeometry(0.4, isUltraLow ? 0.7 : 1, isUltraLow ? 4 : 8);
                    noseGeo.rotateX(Math.PI / 2);
                    const noseMat = isUltraLow ? new THREE.MeshBasicMaterial({ color: shooter.color }) : new THREE.MeshStandardMaterial({ color: shooter.color, metalness: 0.8, roughness: 0.2 });
                    const nose = new THREE.Mesh(noseGeo, noseMat);
                    nose.position.z = isUltraLow ? 1.2 : 2;
                    rocketGroup.add(nose);

                    rocketGroup.position.copy(startPos);
                    rocketGroup.lookAt(targetPos);
                    scene.add(rocketGroup);
                    
                    projectiles.push({ mesh: rocketGroup, velocity: dir.multiplyScalar(150), life: 4, type: 'rocket', shooter, color: 0xffaa00 });
                } else if (type === 'machinegun') {
                    // Tracer round
                    const tracerGeo = new THREE.CapsuleGeometry(0.2, isUltraLow ? 2 : 4, isUltraLow ? 2 : 4, isUltraLow ? 4 : 8);
                    tracerGeo.rotateX(Math.PI / 2);
                    const tracerMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
                    const tracer = new THREE.Mesh(tracerGeo, tracerMat);
                    
                    tracer.position.copy(startPos);
                    tracer.lookAt(targetPos);
                    scene.add(tracer);
                    
                    projectiles.push({ mesh: tracer, velocity: dir.multiplyScalar(300), life: 2, type: 'machinegun', shooter, color: 0xffaa00 });
                }
            };

            const handleEntity = (entity: any, enemies: any[], allies: any[], speed: number, delta: number, avoidDist: number, isPiloted: boolean) => {
                if (entity.isDead) {
                    entity.respawnTimer -= delta;
                    if (entity.respawnTimer <= 0) {
                        entity.isDead = false;
                        entity.health = entity.maxHealth;
                        entity.mesh.visible = true;
                        entity.state = 'attacking';
                        // Respawn at faction base (Top/Bottom Orbit)
                        if (entity.faction === 'ufo') {
                            entity.mesh.position.set((Math.random() - 0.5) * 100, 100, (Math.random() - 0.5) * 100);
                        } else {
                            entity.mesh.position.set((Math.random() - 0.5) * 100, -100, (Math.random() - 0.5) * 100);
                        }
                        entity.velocity.set(0,0,0);
                    }
                    return;
                }

                if (entity.mesh.userData.isDragging) return;

                // Engine Trails
                const trailSpawnRate = isUltraLow ? 0.7 : 0.4;
                if (Math.random() > trailSpawnRate) {
                    const backOffset = new THREE.Vector3(0, 0, entity.type === 'ship' ? 4 : 1.5).applyQuaternion(entity.mesh.quaternion);
                    const pos = new THREE.Vector3().copy(entity.mesh.position).add(backOffset);
                    particles.spawn(pos, new THREE.Vector3(0,0,0), entity.color, 0.4, 0.6);
                }

                // AI Logic: Targeting
                let target = null;
                let minDist = Infinity;

                // Wingman Logic: Check if any ally needs help (being chased)
                let helpTarget = null;
                if (!isPiloted) {
                    for (const ally of allies) {
                        if (ally !== entity && !ally.isDead && ally.state === 'retreating') {
                            let closestEnemyToAlly = null;
                            let minAllyDist = Infinity;
                            for (const enemy of enemies) {
                                if (!enemy.isDead) {
                                    const d = ally.mesh.position.distanceTo(enemy.mesh.position);
                                    if (d < minAllyDist) {
                                        minAllyDist = d;
                                        closestEnemyToAlly = enemy;
                                    }
                                }
                            }
                            if (closestEnemyToAlly && minAllyDist < 60) {
                                helpTarget = closestEnemyToAlly;
                                break; 
                            }
                        }
                    }
                }

                if (helpTarget) {
                    target = helpTarget;
                    minDist = entity.mesh.position.distanceTo(target.mesh.position);
                    entity.state = 'chasing'; // Force chasing state to help ally
                } else {
                    for (const enemy of enemies) {
                        if (!enemy.isDead) {
                            const dist = entity.mesh.position.distanceTo(enemy.mesh.position);
                            if (dist < minDist) {
                                minDist = dist;
                                target = enemy;
                            }
                        }
                    }
                }

                // AI Logic: Dodge Incoming Fire
                projectiles.forEach(p => {
                    if (p.shooter.faction !== entity.faction) {
                        const distToProj = entity.mesh.position.distanceTo(p.mesh.position);
                        if (distToProj < 20) {
                            const dodgeDir = new THREE.Vector3().subVectors(entity.mesh.position, p.mesh.position).normalize();
                            entity.velocity.add(dodgeDir.multiplyScalar(speed * 2 * delta));
                        }
                    }
                });

                // AI Logic: Avoidance (Don't get too near enemies)
                enemies.forEach(enemy => {
                    if (!enemy.isDead) {
                        const distToEnemy = entity.mesh.position.distanceTo(enemy.mesh.position);
                        if (distToEnemy < avoidDist) {
                            const avoidDir = new THREE.Vector3().subVectors(entity.mesh.position, enemy.mesh.position).normalize();
                            entity.velocity.add(avoidDir.multiplyScalar(speed * 3 * delta));
                        }
                    }
                });

                // AI Logic: State Management
                if (entity.health < entity.maxHealth * 0.3) {
                    entity.state = 'retreating';
                } else if (target && target.state === 'retreating' && minDist < 100) {
                    entity.state = 'chasing';
                } else if (entity.faction === 'ufo' && Math.random() < 0.01 && entity.state !== 'capturing') {
                    entity.state = 'capturing';
                } else if (!target) {
                    entity.state = 'patrolling';
                } else {
                    entity.state = 'attacking';
                }

                // Planet Gravity Interaction
                hubsRef.current.forEach(h => {
                    const distToPlanet = entity.mesh.position.distanceTo(h.mesh.position);
                    if (distToPlanet < 25) {
                        const gravityPull = new THREE.Vector3().subVectors(h.mesh.position, entity.mesh.position).normalize().multiplyScalar(5 * delta);
                        entity.velocity.add(gravityPull);
                    }
                });

                if (isPiloted) {
                    if (target) {
                        setCurrentTarget(target.type === 'ufo' ? 'UFO Unit' : 'Enemy Ship');
                        targetRef.current = target;
                        setTargetHealth(target.health / target.maxHealth);
                    } else {
                        setCurrentTarget(null);
                        targetRef.current = null;
                    }

                    if (!moveState.current.isAIControlled) {
                        // Manual Control
                        const accel = 120 * delta;
                        const joy = moveState.current.joyVector;
                        if (moveState.current.forward || joy.y < -0.1) entity.velocity.add(new THREE.Vector3(0,0,-accel).applyQuaternion(entity.mesh.quaternion));
                        if (moveState.current.backward || joy.y > 0.1) entity.velocity.add(new THREE.Vector3(0,0,accel).applyQuaternion(entity.mesh.quaternion));
                        entity.mesh.rotateY(moveState.current.rotY);
                        entity.mesh.rotateX(moveState.current.rotX);
                        
                        // Banking (G-Force simulation)
                        const targetBank = -moveState.current.rotY * 2.5;
                        entity.mesh.rotation.z = THREE.MathUtils.lerp(entity.mesh.rotation.z, targetBank, 5 * delta);
                        
                        moveState.current.rotX *= 0.85; moveState.current.rotY *= 0.85;
                        entity.velocity.multiplyScalar(0.99); // Reduced damping for more inertia
                        
                        if (moveState.current.fireRequested && elapsedTime - entity.lastFire > 0.2 && target) {
                            fireWeapon(entity, target, 'laser');
                            fireWeapon(entity, target, 'machinegun');
                            fireWeapon(entity, target, 'rocket');
                            entity.lastFire = elapsedTime;
                            moveState.current.fireRequested = false;
                        }
                    } else if (target) {
                        // AI Autopilot for Player
                        const dist = entity.mesh.position.distanceTo(target.mesh.position);
                        const predicted = target.mesh.position.clone().add(target.velocity.clone().multiplyScalar(dist / 300));
                        const desired = new THREE.Vector3().subVectors(predicted, entity.mesh.position).normalize().multiplyScalar(speed);
                        const steer = new THREE.Vector3().subVectors(desired, entity.velocity).clampLength(0, speed * 5 * delta);
                        entity.velocity.add(steer);
                        
                        const lookMatrix = new THREE.Matrix4().lookAt(entity.mesh.position, entity.mesh.position.clone().add(entity.velocity), new THREE.Vector3(0,1,0));
                        entity.mesh.quaternion.slerp(new THREE.Quaternion().setFromRotationMatrix(lookMatrix), 5 * delta);

                        if (moveState.current.fireRequested && elapsedTime - entity.lastFire > 0.2) {
                            fireWeapon(entity, target, 'laser');
                            fireWeapon(entity, target, 'machinegun');
                            fireWeapon(entity, target, 'rocket');
                            entity.lastFire = elapsedTime;
                            moveState.current.fireRequested = false;
                        }
                    }
                } else {
                    // Non-piloted AI
                    let targetPos = target ? target.mesh.position.clone() : new THREE.Vector3(0,0,0);
                    
                    if (entity.state === 'retreating') {
                        // Planet Shielding: Run behind nearest planet relative to target
                        let nearestPlanet = hubsRef.current[0];
                        let pDist = Infinity;
                        hubsRef.current.forEach(h => {
                            const d = entity.mesh.position.distanceTo(h.mesh.position);
                            if (d < pDist) { pDist = d; nearestPlanet = h; }
                        });

                        if (target) {
                            const dirFromEnemyToPlanet = new THREE.Vector3().subVectors(nearestPlanet.mesh.position, target.mesh.position).normalize();
                            targetPos.copy(nearestPlanet.mesh.position).add(dirFromEnemyToPlanet.multiplyScalar(nearestPlanet.data.radius + 15));
                        } else {
                            targetPos.copy(nearestPlanet.mesh.position);
                        }
                    } else if (entity.state === 'capturing' && entity.faction === 'ufo') {
                        // Target nearest planet
                        let nearestPlanet = hubsRef.current[0];
                        let pDist = Infinity;
                        hubsRef.current.forEach(h => {
                            const d = entity.mesh.position.distanceTo(h.mesh.position);
                            if (d < pDist) { pDist = d; nearestPlanet = h; }
                        });
                        targetPos.copy(nearestPlanet.mesh.position);
                        
                        // If close to planet, "shoot" at it
                        if (pDist < 30) {
                            if (elapsedTime - entity.lastFire > 2.0) {
                                fireWeapon(entity, { mesh: nearestPlanet.mesh, isDead: false }, 'laser');
                                entity.lastFire = elapsedTime;
                            }
                            // Capture progress
                            if (!combatState.capturedPlanets.has(nearestPlanet.data.id)) {
                                particles.spawn(nearestPlanet.mesh.position, new THREE.Vector3((Math.random()-0.5)*10, 10, (Math.random()-0.5)*10), 0x00ffcc, 0.5, 0.5);
                                if (Math.random() < 0.01) combatState.capturedPlanets.add(nearestPlanet.data.id);
                            }
                        }
                    } else if (entity.state === 'patrolling') {
                        // Patrol near the orbital plane (Y=0)
                        targetPos.set((Math.random()-0.5)*120, (Math.random()-0.5)*10, (Math.random()-0.5)*120);
                    }

                    const dist = entity.mesh.position.distanceTo(targetPos);
                    const desired = new THREE.Vector3().subVectors(targetPos, entity.mesh.position).normalize().multiplyScalar(speed);
                    
                    // Maintain distance for long range combat - Use personality preference
                    const prefDist = entity.personality?.preferredDist || 110;
                    if (entity.state === 'attacking' && dist < prefDist) {
                        desired.negate().multiplyScalar(0.8);
                    }

                    const steer = new THREE.Vector3().subVectors(desired, entity.velocity).clampLength(0, speed * 3 * delta);
                    entity.velocity.add(steer);
                    
                    if (entity.velocity.lengthSq() > 0.1) {
                        const lookMatrix = new THREE.Matrix4().lookAt(entity.mesh.position, entity.mesh.position.clone().add(entity.velocity), new THREE.Vector3(0,1,0));
                        const targetQuat = new THREE.Quaternion().setFromRotationMatrix(lookMatrix);
                        
                        // AI Banking & Maneuvers
                        const sideVel = new THREE.Vector3(1,0,0).applyQuaternion(entity.mesh.quaternion).dot(entity.velocity);
                        let bankAngle = -sideVel * 0.05;
                        
                        // Barrel Roll Logic
                        entity.maneuverTimer -= delta;
                        if (entity.maneuverTimer <= 0) {
                            if (Math.random() < 0.05) { // 5% chance to start a roll
                                entity.isRolling = true;
                                entity.maneuverTimer = 1.0; // 1 second roll
                            } else {
                                entity.isRolling = false;
                                entity.maneuverTimer = 2.0 + Math.random() * 5.0; // Wait before next possible roll
                            }
                        }

                        if (entity.isRolling) {
                            const rollProgress = 1.0 - (entity.maneuverTimer / 1.0);
                            bankAngle += rollProgress * Math.PI * 2;
                        }

                        const bankQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1), bankAngle);
                        targetQuat.multiply(bankQuat);
                        
                        entity.mesh.quaternion.slerp(targetQuat, 4 * delta);
                    }

                    // Firing Logic - Increased range to 200, with Aim Jitter
                    if (target && entity.state !== 'retreating' && dist < 200 && elapsedTime - entity.lastFire > 1.0 + Math.random()) {
                        const forward = new THREE.Vector3(0,0,-1).applyQuaternion(entity.mesh.quaternion);
                        const jitter = entity.personality?.aimJitter || 0.1;
                        const jitterVec = new THREE.Vector3((Math.random()-0.5)*jitter, (Math.random()-0.5)*jitter, (Math.random()-0.5)*jitter);
                        const toTarget = new THREE.Vector3().subVectors(target.mesh.position, entity.mesh.position).add(jitterVec).normalize();
                        
                        if (forward.dot(toTarget) > 0.7) {
                            const weapons = ['laser', 'machinegun', 'rocket'];
                            fireWeapon(entity, target, weapons[Math.floor(Math.random()*3)]);
                            entity.lastFire = elapsedTime;
                        }
                    }
                }

                // Boundary Check: Last planet orbit is at ~90, so we set boundary at 110
                const distFromCenter = entity.mesh.position.length();
                if (distFromCenter > 110) {
                    const pull = new THREE.Vector3().copy(entity.mesh.position).normalize().multiplyScalar(-speed * 15 * delta);
                    entity.velocity.add(pull);
                    
                    // Hard stop at extreme boundary
                    if (distFromCenter > 130) {
                        entity.mesh.position.normalize().multiplyScalar(130);
                        entity.velocity.multiplyScalar(0.5);
                    }
                }

                // Orbital Plane Gravity: Pull entities toward Y=0 once they leave spawn
                if (Math.abs(entity.mesh.position.y) > 5) {
                    const pullY = -entity.mesh.position.y * speed * 0.5 * delta;
                    entity.velocity.y += pullY * 0.1;
                }
                
                entity.velocity.clampLength(0, speed * 1.5);
                entity.mesh.position.addScaledVector(entity.velocity, delta);
            };

            ufos.forEach(ufo => {
                if (!ufo.isDead) {
                    ufo.mesh.children[2].rotation.x += 2 * delta;
                    ufo.mesh.children[2].rotation.y += 3 * delta;
                }
                handleEntity(ufo, ships, ufos, 45, delta, 80, false);
            });

            ships.forEach((ship, index) => {
                // Pulse animation
                if (ship.mesh.userData.update) {
                    ship.mesh.userData.update(clock.getElapsedTime());
                }

                const isPiloted = mode === 'pilot' && index === 0;
                handleEntity(ship, ufos, ships, 55, delta, 80, isPiloted);

                if (isPiloted && !warpRef.current.active && !ship.isDead) {
                    const idealOffset = new THREE.Vector3(0, 4, 15);
                    idealOffset.applyQuaternion(ship.mesh.quaternion);
                    idealOffset.add(ship.mesh.position);
                    
                    const idealLookAt = new THREE.Vector3(0, 0, -20);
                    idealLookAt.applyQuaternion(ship.mesh.quaternion);
                    idealLookAt.add(ship.mesh.position);
                    
                    camera.position.lerp(idealOffset, 5 * delta);
                    camera.lookAt(idealLookAt);
                }
            });

            for (let i = projectiles.length - 1; i >= 0; i--) {
                const p = projectiles[i] as any;
                p.mesh.position.addScaledVector(p.velocity, delta);
                p.life -= delta;
                
                // Rocket smoke trail
                const smokeSpawnRate = isUltraLow ? 0.8 : 0.5;
                if (p.type === 'rocket' && Math.random() > smokeSpawnRate) {
                    const pos = new THREE.Vector3().copy(p.mesh.position);
                    pos.x += (Math.random() - 0.5) * 0.5;
                    pos.y += (Math.random() - 0.5) * 0.5;
                    pos.z += (Math.random() - 0.5) * 0.5;
                    particles.spawn(pos, new THREE.Vector3(0,0,0), 0x888888, 0.4, 0.6);
                }
                
                let hitTarget = false;

                const checkHit = (entities: any[]) => {
                    for (const entity of entities) {
                        if (!entity.isDead && p.shooter !== entity && p.mesh.position.distanceTo(entity.mesh.position) < 8) {
                            hitTarget = true;
                            entity.health -= p.type === 'rocket' ? 3 : 1;
                            createImpactSparks(p.mesh.position, p.color);
                            
                            if (entity.health <= 0) { 
                                entity.isDead = true; 
                                entity.mesh.visible = false; 
                                entity.respawnTimer = 5; 
                                // Death explosion
                                createImpactSparks(entity.mesh.position, 0xffaa00);
                                createImpactSparks(entity.mesh.position, 0xff4400);
                            }
                        }
                    }
                };

                checkHit(ufos);
                checkHit(ships);
                
                if (p.life <= 0 || hitTarget) {
                    scene.remove(p.mesh);
                    projectiles.splice(i, 1);
                }
            }

            for (let i = lasers.length - 1; i >= 0; i--) {
                const l = lasers[i];
                l.life -= delta;
                if (l.line.material instanceof THREE.Material) {
                    l.line.material.opacity = l.life / 0.15;
                }
                if (l.life <= 0) {
                    scene.remove(l.line);
                    lasers.splice(i, 1);
                }
            }

            // Update Particle System
            particles.update(delta);
        }
        // --- END COMBAT & SHIP UPDATE ---
        
        // Rotate clouds
        hubsRef.current.forEach(hub => {
            hub.mesh.children.forEach((child: any) => {
                if (child.userData && child.userData.isCloud) {
                    child.rotation.y += child.userData.rotationSpeed;
                }
            });
        });

        if (composer) {
            composer.render();
        } else {
            renderer.render(scene, camera);
        }
    };
    animate();
    
    const handleResize = () => { 
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight; 
        camera.updateProjectionMatrix(); 
        renderer.setSize(window.innerWidth, window.innerHeight);
        if (composer) composer.setSize(window.innerWidth, window.innerHeight);
        width = window.innerWidth;
        height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    
    return () => { 
        cancelAnimationFrame(animationId); 
        window.removeEventListener('resize', handleResize); 
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('pointerlockchange', onPointerLockChange);
        if (mountRef.current && renderer) mountRef.current.innerHTML = ''; 
        if (orbitControls) orbitControls.dispose(); 
        if (dragControls) dragControls.dispose();
        if (renderer) renderer.dispose();
        if (particleSystem) particleSystem.dispose();
        delete (window as any).joystickMove; delete (window as any).joystickLook; 
    };
  }, [quality]);

  // --- VIEWER MODE LOGIC MOVED HERE ---
  
  const shouldShowJoysticks = showJoysticks && mode === 'pilot';

  return (
      <>
        <div ref={mountRef} style={{ width: "100%", height: "100%", cursor: mode === 'pilot' ? "none" : "crosshair" }} />
        {mode === 'pilot' && (
            <div className="pilot-hud" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                {/* Crosshair */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '40px', height: '40px', border: '2px solid rgba(0, 242, 255, 0.3)', borderRadius: '50%' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '-10px', width: '10px', height: '2px', background: 'rgba(0, 242, 255, 0.5)' }}></div>
                    <div style={{ position: 'absolute', top: '50%', right: '-10px', width: '10px', height: '2px', background: 'rgba(0, 242, 255, 0.5)' }}></div>
                    <div style={{ position: 'absolute', top: '-10px', left: '50%', width: '2px', height: '10px', background: 'rgba(0, 242, 255, 0.5)', transform: 'translateX(-50%)' }}></div>
                    <div style={{ position: 'absolute', bottom: '-10px', left: '50%', width: '2px', height: '10px', background: 'rgba(0, 242, 255, 0.5)', transform: 'translateX(-50%)' }}></div>
                </div>

                {/* Target Info */}
                <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
                    <div style={{ color: currentTarget ? '#ff4444' : '#00f2ff', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 'bold', textShadow: '0 0 10px currentColor' }}>
                        {currentTarget ? `TARGET LOCKED: ${currentTarget}` : 'SCANNING...'}
                    </div>
                    {currentTarget && (
                        <div style={{ marginTop: '8px', width: '120px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', margin: '8px auto' }}>
                            <div style={{ width: `${targetHealth * 100}%`, height: '100%', background: '#ff4444', boxShadow: '0 0 10px #ff4444', transition: 'width 0.3s ease' }}></div>
                        </div>
                    )}
                </div>

                {/* Side Controls */}
                <div style={{ position: 'absolute', bottom: '40px', left: '40px', pointerEvents: 'auto' }}>
                    <button 
                        onClick={() => { moveState.current.isAIControlled = !moveState.current.isAIControlled; }} 
                        className="glass-panel glow-button"
                        style={{ padding: '10px 16px', borderRadius: '10px', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', background: moveState.current.isAIControlled ? 'rgba(0, 242, 255, 0.2)' : 'rgba(0,0,0,0.5)' }}
                    >
                        AI: {moveState.current.isAIControlled ? 'AUTO' : 'MANUAL'}
                    </button>
                </div>

                <div style={{ position: 'absolute', bottom: '40px', right: '40px', pointerEvents: 'auto' }}>
                    <button 
                        onMouseDown={() => { moveState.current.fireRequested = true; }}
                        onTouchStart={() => { moveState.current.fireRequested = true; }}
                        className="glow-button"
                        style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'radial-gradient(circle, #ff4444, #990000)', border: '4px solid rgba(255,255,255,0.2)', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 0 30px rgba(255, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase' }}
                    >
                        FIRE
                    </button>
                </div>
            </div>
        )}
        {shouldShowJoysticks && (
            <>
                <Joystick zone="left" onMove={(x,y) => (window as any).joystickMove && (window as any).joystickMove(x,y)} />
                <Joystick zone="right" onMove={(x,y) => (window as any).joystickLook && (window as any).joystickLook(x,y)} />
            </>
        )}
      </>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<ErrorBoundary><App /></ErrorBoundary>);