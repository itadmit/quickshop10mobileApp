import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import * as posApi from '@/lib/api/pos';
import type {
  CartItem,
  POSProduct,
  POSVariant,
  POSCustomer,
  AppliedCoupon,
} from '@/lib/api/pos';

export const posKeys = {
  all: ['pos'] as const,
  products: (search?: string, categoryId?: string) =>
    [...posKeys.all, 'products', search, categoryId] as const,
  variants: (productId: string) =>
    [...posKeys.all, 'variants', productId] as const,
  customerSearch: (search: string) =>
    [...posKeys.all, 'customerSearch', search] as const,
};

export function usePOSProducts(search?: string, categoryId?: string) {
  return useQuery({
    queryKey: posKeys.products(search, categoryId),
    queryFn: async () => {
      if (__DEV__) console.log('[POS] Fetching products...');
      try {
        const result = await posApi.getPOSProducts({ search, categoryId });
        if (__DEV__) console.log('[POS] Products fetched OK, count:', result?.products?.length);
        return result;
      } catch (err: unknown) {
        const error = err as Error & { status?: number };
        if (__DEV__) console.log('[POS] Products fetch ERROR:', error.message, 'status:', error.status);
        throw err;
      }
    },
    staleTime: 1000 * 60,
    enabled: true,
  });
}

export function usePOSVariants(productId: string | null) {
  return useQuery({
    queryKey: posKeys.variants(productId || ''),
    queryFn: () => posApi.getProductVariants(productId!),
    enabled: !!productId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreatePOSOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: posApi.createPOSOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: posKeys.all });
    },
  });
}

export function usePOSCustomerSearch(search: string) {
  return useQuery({
    queryKey: posKeys.customerSearch(search),
    queryFn: () => posApi.searchPOSCustomers(search),
    enabled: search.length >= 2,
    staleTime: 1000 * 30,
  });
}

export function useValidateCoupon() {
  return useMutation({
    mutationFn: ({
      code,
      cartTotal,
      email,
    }: {
      code: string;
      cartTotal: number;
      email?: string;
    }) => posApi.validateCouponCode(code, cartTotal, email),
  });
}

export function usePOSCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mode, setMode] = useState<'sale' | 'exchange'>('sale');
  const [customer, setCustomer] = useState<POSCustomer>({
    type: 'guest',
    name: '',
    email: '',
    phone: '',
  });
  const [shippingMethod, setShippingMethod] = useState<'pickup' | 'delivery'>(
    'pickup',
  );
  const [shippingAmount, setShippingAmount] = useState(0);
  const [appliedCoupons, setAppliedCoupons] = useState<AppliedCoupon[]>([]);
  const [notes, setNotes] = useState('');
  const [markAsPaid, setMarkAsPaid] = useState(false);

  const addProduct = useCallback(
    (product: POSProduct, variant?: POSVariant) => {
      setItems((prev) => {
        const existing = prev.findIndex((i) => {
          if (variant)
            return (
              i.productId === product.id &&
              i.variantId === variant.id &&
              i.type === 'product'
            );
          return (
            i.productId === product.id && !i.variantId && i.type === 'product'
          );
        });
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = {
            ...updated[existing],
            quantity: updated[existing].quantity + 1,
          };
          return updated;
        }
        return [
          ...prev,
          {
            type: 'product' as const,
            productId: product.id,
            variantId: variant?.id,
            name: variant
              ? `${product.name} - ${variant.title}`
              : product.name,
            price: variant?.price ?? product.price ?? 0,
            quantity: 1,
            imageUrl: variant?.imageUrl ?? product.imageUrl,
          },
        ];
      });
    },
    [],
  );

  const addReturnItem = useCallback(
    (product: POSProduct, variant?: POSVariant) => {
      const price = variant?.price ?? product.price ?? 0;
      const name = variant
        ? `${product.name} - ${variant.title}`
        : product.name;
      setItems((prev) => [
        ...prev,
        {
          type: 'return' as const,
          productId: product.id,
          variantId: variant?.id,
          name: `החזרה: ${name}`,
          price: -Math.abs(price),
          quantity: 1,
          imageUrl: variant?.imageUrl ?? product.imageUrl,
        },
      ]);
    },
    [],
  );

  const addManualItem = useCallback((name: string, price: number) => {
    setItems((prev) => [...prev, { type: 'manual', name, price, quantity: 1 }]);
  }, []);

  const updateQuantity = useCallback((index: number, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((_, i) => i !== index);
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity };
      return updated;
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addCoupon = useCallback((coupon: AppliedCoupon) => {
    setAppliedCoupons((prev) => {
      if (prev.find((c) => c.code === coupon.code)) return prev;
      return [...prev, coupon];
    });
  }, []);

  const removeCoupon = useCallback((code: string) => {
    setAppliedCoupons((prev) => prev.filter((c) => c.code !== code));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setCustomer({ type: 'guest', name: '', email: '', phone: '' });
    setShippingMethod('pickup');
    setShippingAmount(0);
    setAppliedCoupons([]);
    setNotes('');
    setMarkAsPaid(false);
    setMode('sale');
  }, []);

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.price * i.quantity, 0),
    [items],
  );

  const discountAmount = useMemo(() => {
    return appliedCoupons.reduce((sum, coupon) => {
      if (coupon.isGiftCard) return sum + coupon.value;
      if (coupon.type === 'percentage') return sum + subtotal * (coupon.value / 100);
      if (coupon.type === 'fixed_amount') return sum + coupon.value;
      return sum;
    }, 0);
  }, [appliedCoupons, subtotal]);

  const total = useMemo(
    () => subtotal - discountAmount + shippingAmount,
    [subtotal, discountAmount, shippingAmount],
  );

  const returnItems = useMemo(
    () => items.filter((i) => i.type === 'return'),
    [items],
  );
  const purchaseItems = useMemo(
    () => items.filter((i) => i.type !== 'return'),
    [items],
  );
  const returnTotal = useMemo(
    () => returnItems.reduce((s, i) => s + i.price * i.quantity, 0),
    [returnItems],
  );
  const purchaseTotal = useMemo(
    () => purchaseItems.reduce((s, i) => s + i.price * i.quantity, 0),
    [purchaseItems],
  );

  return {
    items,
    mode,
    customer,
    shippingMethod,
    shippingAmount,
    appliedCoupons,
    discountAmount,
    notes,
    markAsPaid,
    subtotal,
    total,
    returnTotal,
    purchaseTotal,
    addProduct,
    addReturnItem,
    addManualItem,
    updateQuantity,
    removeItem,
    addCoupon,
    removeCoupon,
    clearCart,
    setMode,
    setCustomer,
    setShippingMethod,
    setShippingAmount,
    setNotes,
    setMarkAsPaid,
  };
}
