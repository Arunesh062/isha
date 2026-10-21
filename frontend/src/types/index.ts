// Domain Types for Isha Life Store

export interface Product {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  price: number;
  mrp: number;
  rating: number;
  reviewCount: number;
  image: string;
  images: string[];
  description: string;
  features: string[];
  inStock: boolean;
  badge?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  subcategories: { id: string; name: string }[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  status: string;
  total: number;
  created_at: string;
  customer_name: string;
  city: string;
}

export interface AdminOrder {
  id: string;
  status: string;
  total: number;
  created_at: string;
  customer_name: string;
  city: string;
}

export interface InventoryRow {
  product_id: string;
  stock: number;
  unit_price: number;
}

export interface Profile {
  user_id: string;
  full_name: string;
  phone: string;
  role: 'customer' | 'admin';
}

export interface KnowledgeEntry {
  id: string;
  topic: 'Shipping' | 'Payments' | 'Support' | 'Products' | 'Returns';
  question: string;
  answer: string;
  ownerApproved: boolean;
  sourceReference?: string;
}

export interface PolicySection {
  id: string;
  title: string;
  content: string;
  ownerApproved: boolean;
  sourceReference?: string;
}

export interface CategoryGuidance {
  id: string;
  name: string;
  summary: string;
  keyProducts: string[];
  wellnessBenefits: string[];
  shoppingTips: string[];
}

export type CatalogueSource = 'supabase-full' | 'supabase-live-prices' | 'static-fallback';

export * from './ai';

