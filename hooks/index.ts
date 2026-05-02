export { useAuth } from './useAuth';
export { useOrders, useInfiniteOrders, useOrder, useOrdersStats, useUpdateOrderStatus, useMarkOrderAsRead, useArchiveOrders, useRefundOrder, useCancelOrder, useFulfillOrder, useEditOrder, useAddOrderNote, ordersKeys } from './useOrders';
export { useProducts, useInfiniteProducts, useProduct, useBarcodeSearch, useCategories, useUpdateInventory, useUpdatePrice, useToggleProductStatus, useCreateProduct, useUpdateProduct, useDeleteProduct, useDuplicateProduct, useUploadImage, useCreateCategory, useUpdateCategory, useDeleteCategory, productsKeys } from './useProducts';
export { useCustomers, useInfiniteCustomers, useCustomer, useCustomersStats, useUpdateCustomer, useAddCustomerCredit, useAddCustomerNote, useCreateCustomer, useDeleteCustomer, customersKeys } from './useCustomers';
export { useDashboardSummary, useRealtimeStats as useDashboardRealtimeStats, useTopProducts as useDashboardTopProducts, dashboardKeys } from './useDashboard';

// Discounts
export { 
  useDiscounts, 
  useInfiniteDiscounts, 
  useDiscount, 
  useCreateDiscount, 
  useUpdateDiscount, 
  useDeleteDiscount, 
  useToggleDiscountStatus, 
  useCreateQuickCoupon,
  discountsKeys 
} from './useDiscounts';

// Webhooks
export { 
  useWebhooks, 
  useInfiniteWebhooks, 
  useWebhook, 
  useCreateWebhook, 
  useUpdateWebhook, 
  useDeleteWebhook, 
  useToggleWebhookStatus, 
  useTestWebhook, 
  useRegenerateWebhookSecret,
  webhooksKeys 
} from './useWebhooks';

// Analytics (Extended)
export { 
  useFullAnalytics, 
  useSalesReport, 
  useTopProducts, 
  useRealtimeStats,
  analyticsKeys 
} from './useAnalytics';

// POS
export {
  usePOSProducts,
  usePOSVariants,
  useCreatePOSOrder,
  usePOSCart,
  usePOSCustomerSearch,
  useValidateCoupon,
  posKeys,
} from './usePOS';

// Notification Settings
export {
  useNotificationSettings,
  useUpdateNotificationSettings,
  notificationSettingsKeys,
} from './useNotificationSettings';

// Returns / Exchanges
export {
  useReturnRequests,
  useReturnRequest,
  useProcessReturn,
  usePendingInventory,
  useActOnPendingItem,
  returnsKeys,
} from './useReturns';

