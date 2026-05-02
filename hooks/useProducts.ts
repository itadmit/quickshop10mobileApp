import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useAppStore } from '@/stores';
import * as productsApi from '@/lib/api/products';
import type { ProductsListParams, Product } from '@/types';

// ============ Query Keys ============
export const productsKeys = {
  all: ['products'] as const,
  lists: () => [...productsKeys.all, 'list'] as const,
  list: (params: ProductsListParams) => [...productsKeys.lists(), params] as const,
  details: () => [...productsKeys.all, 'detail'] as const,
  detail: (id: string) => [...productsKeys.details(), id] as const,
  barcode: (code: string) => [...productsKeys.all, 'barcode', code] as const,
  categories: () => [...productsKeys.all, 'categories'] as const,
};

// ============ Hooks ============
export function useProducts(params: ProductsListParams = {}) {
  const refreshKey = useAppStore((s) => s.productsRefreshKey);
  
  return useQuery({
    queryKey: [...productsKeys.list(params), refreshKey],
    queryFn: () => productsApi.getProducts(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useInfiniteProducts(params: Omit<ProductsListParams, 'page'> = {}) {
  const refreshKey = useAppStore((s) => s.productsRefreshKey);
  
  return useInfiniteQuery({
    queryKey: [...productsKeys.lists(), params, refreshKey],
    queryFn: ({ pageParam = 1 }) => productsApi.getProducts({ ...params, page: pageParam }),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 30, // 30 seconds - תיקון בעיית refresh
    refetchOnMount: true,
  });
}

export function useProduct(productId: string) {
  return useQuery({
    queryKey: productsKeys.detail(productId),
    queryFn: () => productsApi.getProduct(productId),
    enabled: !!productId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useBarcodeSearch(barcode: string) {
  return useQuery({
    queryKey: productsKeys.barcode(barcode),
    queryFn: () => productsApi.searchByBarcode(barcode),
    enabled: !!barcode && barcode.length >= 8,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useCategories() {
  return useQuery({
    queryKey: productsKeys.categories(),
    queryFn: productsApi.getCategories,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

// ============ Mutations ============
export function useUpdateInventory() {
  const queryClient = useQueryClient();
  const triggerRefresh = useAppStore((s) => s.triggerProductsRefresh);
  
  return useMutation({
    mutationFn: ({ productId, data }: {
      productId: string;
      data: Parameters<typeof productsApi.updateInventory>[1];
    }) => productsApi.updateInventory(productId, data),
    
    // Optimistic update
    onMutate: async ({ productId, data }) => {
      await queryClient.cancelQueries({ queryKey: productsKeys.detail(productId) });
      
      const previousProduct = queryClient.getQueryData(productsKeys.detail(productId));
      
      // Update cache
      if (data.inventory !== undefined) {
        queryClient.setQueryData(
          productsKeys.detail(productId), 
          (old: { product: Product } | undefined) => {
            if (!old) return old;
            return { ...old, product: { ...old.product, inventory: data.inventory } };
          }
        );
      }
      
      return { previousProduct };
    },
    
    onError: (_err, { productId }, context) => {
      if (context?.previousProduct) {
        queryClient.setQueryData(productsKeys.detail(productId), context.previousProduct);
      }
    },
    
    onSuccess: () => {
      triggerRefresh();
    },
  });
}

export function useUpdatePrice() {
  const queryClient = useQueryClient();
  const triggerRefresh = useAppStore((s) => s.triggerProductsRefresh);
  
  return useMutation({
    mutationFn: ({ productId, data }: {
      productId: string;
      data: Parameters<typeof productsApi.updatePrice>[1];
    }) => productsApi.updatePrice(productId, data),
    
    onMutate: async ({ productId, data }) => {
      await queryClient.cancelQueries({ queryKey: productsKeys.detail(productId) });
      
      const previousProduct = queryClient.getQueryData(productsKeys.detail(productId));
      
      queryClient.setQueryData(
        productsKeys.detail(productId),
        (old: { product: Product } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            product: {
              ...old.product,
              ...(data.price !== undefined && { price: data.price }),
              ...(data.comparePrice !== undefined && { comparePrice: data.comparePrice }),
            },
          };
        }
      );
      
      return { previousProduct };
    },
    
    onError: (_err, { productId }, context) => {
      if (context?.previousProduct) {
        queryClient.setQueryData(productsKeys.detail(productId), context.previousProduct);
      }
    },
    
    onSuccess: () => {
      triggerRefresh();
    },
  });
}

export function useToggleProductStatus() {
  const queryClient = useQueryClient();
  const triggerRefresh = useAppStore((s) => s.triggerProductsRefresh);
  
  return useMutation({
    mutationFn: ({ productId, isActive }: { productId: string; isActive: boolean }) =>
      productsApi.toggleProductStatus(productId, isActive),
    
    onMutate: async ({ productId, isActive }) => {
      await queryClient.cancelQueries({ queryKey: productsKeys.detail(productId) });
      
      const previousProduct = queryClient.getQueryData(productsKeys.detail(productId));
      
      queryClient.setQueryData(
        productsKeys.detail(productId),
        (old: { product: Product } | undefined) => {
          if (!old) return old;
          return { ...old, product: { ...old.product, isActive } };
        }
      );
      
      return { previousProduct };
    },
    
    onError: (_err, { productId }, context) => {
      if (context?.previousProduct) {
        queryClient.setQueryData(productsKeys.detail(productId), context.previousProduct);
      }
    },
    
    onSuccess: () => {
      triggerRefresh();
    },
  });
}

// ============ Create Product ============
export function useCreateProduct() {
  const queryClient = useQueryClient();
  const triggerRefresh = useAppStore((s) => s.triggerProductsRefresh);
  
  return useMutation({
    mutationFn: (data: productsApi.CreateProductData) => productsApi.createProduct(data),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsKeys.lists() });
      triggerRefresh();
    },
  });
}

// ============ Update Product (Full) ============
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const triggerRefresh = useAppStore((s) => s.triggerProductsRefresh);
  
  return useMutation({
    mutationFn: ({ productId, data }: {
      productId: string;
      data: Partial<productsApi.CreateProductData>;
    }) => productsApi.updateProduct(productId, data),
    
    onSuccess: (_data, { productId }) => {
      queryClient.invalidateQueries({ queryKey: productsKeys.detail(productId) });
      queryClient.invalidateQueries({ queryKey: productsKeys.lists() });
      triggerRefresh();
    },
  });
}

// ============ Delete Product ============
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const triggerRefresh = useAppStore((s) => s.triggerProductsRefresh);
  
  return useMutation({
    mutationFn: (productId: string) => productsApi.deleteProduct(productId),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsKeys.lists() });
      triggerRefresh();
    },
  });
}

// ============ Duplicate Product ============
export function useDuplicateProduct() {
  const queryClient = useQueryClient();
  const triggerRefresh = useAppStore((s) => s.triggerProductsRefresh);
  
  return useMutation({
    mutationFn: (productId: string) => productsApi.duplicateProduct(productId),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsKeys.lists() });
      triggerRefresh();
    },
  });
}

// ============ Upload Image ============
export function useUploadImage() {
  return useMutation({
    mutationFn: ({ uri, fileName, mimeType }: {
      uri: string;
      fileName: string;
      mimeType: string;
    }) => productsApi.uploadProductImage(uri, fileName, mimeType),
  });
}

// ============ Category Mutations ============
export function useCreateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: productsApi.CreateCategoryData) => productsApi.createCategory(data),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsKeys.categories() });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ categoryId, data }: {
      categoryId: string;
      data: Partial<productsApi.CreateCategoryData>;
    }) => productsApi.updateCategory(categoryId, data),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsKeys.categories() });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (categoryId: string) => productsApi.deleteCategory(categoryId),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsKeys.categories() });
    },
  });
}

