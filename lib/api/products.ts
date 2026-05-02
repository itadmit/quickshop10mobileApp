import { api } from './client';
import { getAuthToken, getStoreId } from '@/lib/utils/storage';
import type {
  Product,
  ProductsListParams,
  ProductsListResponse,
  ProductVariant,
} from '@/types';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://quickshop.co.il/api';

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

// ============ Create Product ============
export interface CreateProductData {
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  price?: number | null;
  comparePrice?: number | null;
  cost?: number | null;
  sku?: string | null;
  barcode?: string | null;
  weight?: number | null;
  inventory?: number | null;
  trackInventory?: boolean;
  allowBackorder?: boolean;
  categoryIds?: string[];
  categoryId?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  hiddenFromCatalog?: boolean;
  hasVariants?: boolean;
  images?: Array<{
    url: string;
    alt?: string;
    isPrimary?: boolean;
    mediaType?: string;
    thumbnailUrl?: string;
  }>;
  downloadImages?: boolean;
  variants?: Array<{
    id?: string;
    title: string;
    sku?: string;
    barcode?: string;
    price: number | string;
    comparePrice?: number | string | null;
    cost?: number | string | null;
    inventory?: number;
    weight?: string | null;
    option1?: string;
    option2?: string;
    option3?: string;
    isActive?: boolean;
  }>;
  options?: Array<{
    name: string;
    displayType?: string;
    values: Array<string | { value: string; metadata?: Record<string, unknown> }>;
  }>;
  seoTitle?: string;
  seoDescription?: string;
  metadata?: Record<string, unknown>;
}

export async function createProduct(
  data: CreateProductData
): Promise<{
  success: boolean;
  data: Product;
}> {
  return api.post(`/mobile/products`, data);
}

// ============ Update Product (Full) ============
export async function updateProduct(
  productId: string,
  data: Partial<CreateProductData>
): Promise<{
  success: boolean;
  data: Product;
}> {
  return api.patch(`/mobile/products/${productId}`, data);
}

// ============ Delete Product ============
export async function deleteProduct(
  productId: string
): Promise<{ success: boolean }> {
  return api.delete(`/mobile/products/${productId}`);
}

// ============ Duplicate Product ============
export async function duplicateProduct(
  productId: string
): Promise<{
  success: boolean;
  data: Product;
}> {
  return api.post(`/mobile/products/${productId}/duplicate`);
}

// ============ Image Upload ============
export async function uploadProductImage(
  imageUri: string,
  fileName: string,
  mimeType: string
): Promise<{ url: string }> {
  const token = await getAuthToken();
  const storeId = await getStoreId();

  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);
  formData.append('folder', 'products');
  if (storeId) formData.append('storeId', storeId);

  const res = await fetch(`${API_BASE}/mobile/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Store-Id': storeId || '',
      'X-Platform': 'mobile',
    },
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'שגיאה בהעלאת תמונה');
  }

  return res.json();
}

// ============ Categories ============
export async function getCategories(): Promise<{
  success: boolean;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    description: string | null;
    imageUrl: string | null;
    sortOrder: number;
    isActive: boolean;
  }>;
}> {
  return api.get(`/mobile/categories`);
}

// ============ Category CRUD ============
export interface CreateCategoryData {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
  imageUrl?: string;
  sortOrder?: number;
}

export async function createCategory(
  data: CreateCategoryData
): Promise<{
  success: boolean;
  data: {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
  };
}> {
  return api.post(`/mobile/categories`, data);
}

export async function updateCategory(
  categoryId: string,
  data: Partial<CreateCategoryData>
): Promise<{
  success: boolean;
  data: {
    id: string;
    name: string;
    slug: string;
  };
}> {
  return api.patch(`/mobile/categories/${categoryId}`, data);
}

export async function deleteCategory(
  categoryId: string
): Promise<{ success: boolean }> {
  return api.delete(`/mobile/categories/${categoryId}`);
}
