import { createContext, useContext, type ReactNode } from 'react';
import type { Product, Category } from '@/data/products';
import { useProducts, type UseProductsResult } from '@/hooks/useProducts';

const CatalogueContext = createContext<UseProductsResult | undefined>(undefined);

export function CatalogueProvider({ children }: { children: ReactNode }) {
  const catalogue = useProducts();

  return (
    <CatalogueContext.Provider value={catalogue}>
      {children}
    </CatalogueContext.Provider>
  );
}

export function useCatalogue(): UseProductsResult {
  const ctx = useContext(CatalogueContext);
  if (!ctx) throw new Error('useCatalogue must be used within CatalogueProvider');
  return ctx;
}

/** Find a product by ID from the catalogue */
export function useProduct(id: string): Product | undefined {
  const { products } = useCatalogue();
  return products.find((p) => p.id === id);
}

/** Get categories from the catalogue */
export function useCatalogueCategories(): Category[] {
  const { categories } = useCatalogue();
  return categories;
}
