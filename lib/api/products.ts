import { api } from './client';
import type {
  Product,
  ProductsListParams,
  ProductsListResponse,
  ProductVariant,
} from '@/types';

// ============ Products API ============
// Base: /api/mobile/products

export async function getProducts(params: ProductsListParams = {}): Promise<ProductsListResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.search) searchParams.set('search', params.search);
  if (params.categoryId) searchParams.set('categoryId', params.categoryId);
  if (params.status) searchParams.set('status', params.status);
  if (params.lowStock) searchParams.set('lowStock', 'true');
  if (params.outOfStock) searchParams.set('outOfStock', 'true');
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
  
  const query = searchParams.toString();
  return api.get(`/mobile/products${query ? `?${query}` : ''}`);
}

export async function getProduct(productId: string): Promise<{
  product: Product;
  images: Array<{
    id: string;
    url: string;
    alt: string | null;
    sortOrder: number;
    isPrimary: boolean;
  }>;
  options: Array<{
    id: string;
    name: string;
    sortOrder: number;
    values: Array<{
      id: string;
      value: string;
      sortOrder: number;
    }>;
  }>;
  variants: ProductVariant[];
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  categories: Array<{
    id: string;
    name: string;
  }>;
}> {
  return api.get(`/mobile/products/${productId}`);
}

// ============ Quick Updates (Mobile-optimized) ============
export async function updateInventory(
  productId: string,
  data: {
    inventory?: number;
    variants?: Array<{ id: string; inventory: number }>;
    adjustment?: {
      type: 'add' | 'subtract' | 'set';
      value: number;
      variantId?: string;
    };
  }
): Promise<{
  success: boolean;
  product: {
    id: string;
    inventory: number | null;
    variants: Array<{
      id: string;
      inventory: number | null;
    }>;
  };
}> {
  return api.patch(`/mobile/products/${productId}/inventory`, data);
}

export async function updatePrice(
  productId: string,
  data: {
    price?: number;
    comparePrice?: number | null;
    variantId?: string;
  }
): Promise<{
  success: boolean;
  product: {
    id: string;
    price: number | null;
    comparePrice: number | null;
  };
}> {
  return api.patch(`/mobile/products/${productId}`, data);
}

// ============ Barcode Scanner ============
export async function searchByBarcode(barcode: string): Promise<{
  found: boolean;
  product?: {
    id: string;
    name: string;
    price: number | null;
    inventory: number | null;
    imageUrl: string | null;
  };
  variant?: {
    id: string;
    title: string;
    price: number;
    inventory: number | null;
  };
}> {
  return api.get(`/mobile/products/barcode/${encodeURIComponent(barcode)}`);
}

// ============ Product Status ============
export async function toggleProductStatus(
  productId: string,
  isActive: boolean
): Promise<{ success: boolean; isActive: boolean }> {
  return api.patch(`/mobile/products/${productId}`, { isActive });
}

// ============ Categories ============
export async function getCategories(): Promise<
  Array<{
    id: string;
    name: string;
    slug: string;
    productsCount: number;
    parentId: string | null;
  }>
> {
  return api.get(`/mobile/categories`);
}
