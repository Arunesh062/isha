// Request and Response Contracts for Supabase Edge Function: ai-assistant

export interface ChatHistoryMessage {
  role: 'user' | 'model';
  content: string;
}

export interface AiChatRequest {
  mode: 'chat';
  message: string;
  history?: ChatHistoryMessage[];
  productId?: string;
}

export interface AiSearchRequest {
  mode: 'search';
  query: string;
  limit?: number;
}

export type AiAssistantRequest = AiChatRequest | AiSearchRequest;

export interface ReferencedProductSummary {
  id: string;
  name: string;
  price: number;
  mrp?: number;
  image: string;
  inStock: boolean;
  rating: number;
  category: string;
}

export interface AiChatResponse {
  mode: 'chat';
  answer: string;
  referencedProductIds: string[];
  referencedProducts: ReferencedProductSummary[];
  suggestedQuestions?: string[];
  error?: string;
}

export interface SearchQueryInterpretation {
  searchTerms: string[];
  category: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  characteristics: string[];
}

export interface CatalogProductResult {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  price: number;
  mrp: number;
  rating: number;
  reviewCount: number;
  image: string;
  inStock: boolean;
  stock: number;
  badge?: string;
  features?: string[];
}

export interface AiSearchResponse {
  mode: 'search';
  queryInterpretation: SearchQueryInterpretation;
  products: CatalogProductResult[];
  totalMatches: number;
  limit: number;
  error?: string;
}

export interface AiErrorResponse {
  error: string;
  code: string;
  details?: string;
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
