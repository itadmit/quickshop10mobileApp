import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  ScrollView,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
  Image,
  Animated,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView } from 'expo-camera';
import {
  usePOSProducts,
  usePOSVariants,
  useCreatePOSOrder,
  usePOSCart,
  usePOSCustomerSearch,
  useValidateCoupon,
} from '@/hooks';
import { Text, SearchBar, FilterTabs, designTokens, fonts } from '@/components/ui';
import { formatCurrency } from '@/lib/utils/format';
import { hapticLight, hapticSuccess, hapticWarning } from '@/lib/utils/haptics';
import { showToast } from '@/lib/utils/toast';
import type { POSProduct, POSVariant, POSSearchCustomer } from '@/lib/api/pos';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const GRID_PADDING = designTokens.spacing[4];
const GRID_GAP = designTokens.spacing[2];
const MIN_TILE_WIDTH = 105;
const MONO_FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

function calcColumns(screenWidth: number) {
  const available = screenWidth - GRID_PADDING * 2;
  return Math.max(3, Math.floor((available + GRID_GAP) / (MIN_TILE_WIDTH + GRID_GAP)));
}

function BottomSheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setShow(false));
    }
  }, [visible, fadeAnim, slideAnim]);

  if (!show && !visible) return null;

  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(0,0,0,0.4)', opacity: fadeAnim },
          ]}
        >
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
        </Animated.View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalSheetWrap}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.modalSheet,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.modalHandle} />
            {children}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export default function POSScreen() {
  const [gridWidth, setGridWidth] = useState(Dimensions.get('window').width - GRID_PADDING * 2);
  const gridColumns = calcColumns(gridWidth + GRID_PADDING * 2);
  const tileWidth = Math.floor((gridWidth - GRID_GAP * (gridColumns - 1)) / gridColumns);

  useEffect(() => {
    console.log('[POS Grid] gridWidth:', gridWidth, 'columns:', gridColumns, 'tileWidth:', tileWidth, 'screenWidth:', Dimensions.get('window').width);
  }, [gridWidth, gridColumns, tileWidth]);

  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    undefined,
  );
  const [variantModalProduct, setVariantModalProduct] =
    useState<POSProduct | null>(null);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [manualItemModal, setManualItemModal] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const scanCooldown = useRef(false);

  // Partial payment state
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [partialPaymentAmount, setPartialPaymentAmount] = useState('');

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const validateCoupon = useValidateCoupon();

  // Customer search state
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [debouncedCustomerSearch, setDebouncedCustomerSearch] = useState('');
  const { data: customerSearchData, isLoading: customerSearchLoading } =
    usePOSCustomerSearch(debouncedCustomerSearch);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedCustomerSearch(customerSearchQuery),
      300,
    );
    return () => clearTimeout(timer);
  }, [customerSearchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
  } = usePOSProducts(debouncedSearch || undefined, selectedCategory);

  useEffect(() => {
    if (productsError) {
      console.log('[POS Screen] Error object:', JSON.stringify(productsError, null, 2));
      console.log('[POS Screen] Error message:', (productsError as Error)?.message);
    }
    if (productsData) {
      console.log('[POS Screen] Data loaded, products:', productsData.products?.length, 'categories:', productsData.categories?.length);
    }
  }, [productsError, productsData]);
  const { data: variantsData, isLoading: variantsLoading } = usePOSVariants(
    variantModalProduct?.id || null,
  );
  const createOrder = useCreatePOSOrder();

  const cart = usePOSCart();

  const isProductOutOfStock = useCallback((product: POSProduct) => {
    const tracks = product.trackInventory !== false;
    return tracks && product.inventory !== null && product.inventory <= 0;
  }, []);

  const isVariantOutOfStock = useCallback((variant: POSVariant) => {
    return variant.inventory !== null && variant.inventory <= 0;
  }, []);

  const handleProductPress = useCallback(
    (product: POSProduct) => {
      if (product.hasVariants) {
        setVariantModalProduct(product);
      } else if (cart.mode === 'exchange') {
        cart.addReturnItem(product);
        hapticLight();
      } else {
        if (isProductOutOfStock(product)) {
          hapticWarning();
          showToast('המוצר אזל מהמלאי', 'error');
          return;
        }
        cart.addProduct(product);
        hapticLight();
      }
    },
    [cart, isProductOutOfStock],
  );

  const handleVariantSelect = useCallback(
    (variant: POSVariant) => {
      if (variantModalProduct) {
        if (cart.mode === 'exchange') {
          cart.addReturnItem(variantModalProduct, variant);
        } else {
          if (isVariantOutOfStock(variant)) {
            hapticWarning();
            showToast('הוריאציה אזלה מהמלאי', 'error');
            return;
          }
          cart.addProduct(variantModalProduct, variant);
        }
        hapticLight();
        setVariantModalProduct(null);
      }
    },
    [cart, variantModalProduct, isVariantOutOfStock],
  );

  const handleBarcodeScan = useCallback(({ data }: { data: string }) => {
    if (scanCooldown.current) return;
    scanCooldown.current = true;
    hapticSuccess();
    setSearchQuery(data);
    setScannerOpen(false);
    setTimeout(() => {
      scanCooldown.current = false;
    }, 1500);
  }, []);

  const handleAddManualItem = useCallback(() => {
    const price = parseFloat(manualPrice);
    if (!manualName.trim() || isNaN(price) || price <= 0) {
      Alert.alert('שגיאה', 'יש למלא שם ומחיר');
      return;
    }
    cart.addManualItem(manualName.trim(), price);
    hapticLight();
    setManualItemModal(false);
    setManualName('');
    setManualPrice('');
  }, [cart, manualName, manualPrice]);

  const handleApplyCoupon = useCallback(() => {
    if (!couponInput.trim()) return;
    validateCoupon.mutate(
      {
        code: couponInput.trim(),
        cartTotal: cart.subtotal,
        email: cart.customer.email || undefined,
      },
      {
        onSuccess: (data) => {
          if (data.success && data.coupon) {
            cart.addCoupon(data.coupon);
            setCouponInput('');
            hapticSuccess();
            showToast('קופון הופעל בהצלחה', 'success');
          } else {
            hapticWarning();
            showToast(data.error || 'קוד קופון לא תקין', 'error');
          }
        },
        onError: (err: any) => {
          hapticWarning();
          showToast(err?.message || 'שגיאה בבדיקת הקופון', 'error');
        },
      },
    );
  }, [couponInput, cart, validateCoupon]);

  const handleSelectCustomer = useCallback(
    (c: POSSearchCustomer) => {
      const address = c.defaultAddress as {
        street?: string;
        city?: string;
        postalCode?: string;
      } | null;
      cart.setCustomer({
        type: 'existing',
        customerId: c.id,
        name: c.name || c.email,
        email: c.email,
        phone: c.phone || '',
        address: address
          ? {
              street: address.street || '',
              city: address.city || '',
              zipCode: address.postalCode,
            }
          : undefined,
      });
      setCustomerModalOpen(false);
      setCustomerSearchQuery('');
      hapticLight();
    },
    [cart],
  );

  const doCheckout = useCallback(async (overrides?: { markAsPaid?: boolean; notes?: string; discountAmount?: number; total?: number; partialPaymentAmount?: number }) => {
    try {
      const result = await createOrder.mutateAsync({
        items: cart.items,
        customer: cart.customer,
        shippingMethod: cart.shippingMethod,
        shippingAmount: cart.shippingAmount,
        discountCode:
          cart.appliedCoupons.length > 0
            ? cart.appliedCoupons.map((c) => c.code).join(',')
            : undefined,
        discountAmount: overrides?.discountAmount ?? cart.discountAmount,
        notes: overrides?.notes ?? (cart.notes || undefined),
        subtotal: cart.subtotal,
        total: overrides?.total ?? cart.total,
        markAsPaid: overrides?.markAsPaid ?? cart.markAsPaid,
        isExchange: cart.mode === 'exchange',
        partialPaymentAmount: overrides?.partialPaymentAmount,
      });

      if (result.paymentUrl) {
        hapticSuccess();
        showToast(`הזמנה #${result.orderNumber} נוצרה - מעבר לתשלום`, 'success');
        cart.clearCart();
        setIsPartialPayment(false);
        setPartialPaymentAmount('');
        Linking.openURL(result.paymentUrl);
        return;
      }

      hapticSuccess();
      if (result.error) {
        showToast(`הזמנה #${result.orderNumber} נוצרה. ${result.error}`, 'success');
      } else {
        showToast(`הזמנה #${result.orderNumber} נוצרה בהצלחה`, 'success');
      }
      cart.clearCart();
      setIsPartialPayment(false);
      setPartialPaymentAmount('');
    } catch (error: any) {
      hapticWarning();
      showToast(error?.message || 'שגיאה ביצירת ההזמנה', 'error');
    }
  }, [cart, createOrder]);

  const handleCheckout = useCallback(async () => {
    if (cart.items.length === 0) {
      Alert.alert('העגלה ריקה', 'הוסף מוצרים לפני יצירת הזמנה');
      return;
    }
    if (!cart.customer.name || !cart.customer.email || !cart.customer.phone) {
      Alert.alert('פרטי לקוח חסרים', 'יש למלא שם, אימייל וטלפון');
      setCustomerModalOpen(true);
      return;
    }

    if (isPartialPayment) {
      const partial = parseFloat(partialPaymentAmount);
      if (!partial || partial <= 0) {
        Alert.alert('שגיאה', 'הזן סכום תשלום חלקי');
        return;
      }
      if (partial >= cart.total) {
        Alert.alert('שגיאה', 'לסכום מלא השתמש ב"סמן כשולם"');
        return;
      }
      doCheckout({ partialPaymentAmount: partial });
      return;
    }

    if (cart.mode === 'exchange' && cart.total < 0) {
      const creditAmount = formatCurrency(Math.abs(cart.total));
      Alert.alert(
        'זיכוי ללקוח',
        `ללקוח מגיע זיכוי של ${creditAmount}.\nהאם ליצור את ההזמנה ולרשום זיכוי?`,
        [
          { text: 'ביטול', style: 'cancel' },
          {
            text: 'המשך ללא זיכוי',
            onPress: () => {
              const absCredit = Math.abs(cart.total);
              doCheckout({
                notes: `${cart.notes ? cart.notes + '\n' : ''}זיכוי ללקוח: ${creditAmount} (לא בוצע החזר)`,
                discountAmount: cart.discountAmount + absCredit,
                total: 0,
                markAsPaid: true,
              });
            },
          },
          {
            text: `רשום זיכוי ${creditAmount}`,
            style: 'default',
            onPress: () => doCheckout({ markAsPaid: true }),
          },
        ],
      );
      return;
    }

    doCheckout();
  }, [cart, doCheckout, isPartialPayment, partialPaymentAmount]);

  const products = (productsData?.products || []).filter((p) => !isProductOutOfStock(p));
  const categories = productsData?.categories || [];

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Mode Toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[
                styles.modeBtn,
                cart.mode === 'sale' && styles.modeBtnActive,
              ]}
              onPress={() => cart.setMode('sale')}
            >
              <Ionicons
                name="cart-outline"
                size={16}
                color={
                  cart.mode === 'sale'
                    ? '#FFFFFF'
                    : designTokens.colors.ink[600]
                }
              />
              <Text
                style={[
                  styles.modeBtnText,
                  cart.mode === 'sale' && styles.modeBtnTextActive,
                ]}
              >
                מכירה
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeBtn,
                cart.mode === 'exchange' && styles.modeBtnExchange,
              ]}
              onPress={() => cart.setMode('exchange')}
            >
              <Ionicons
                name="swap-horizontal-outline"
                size={16}
                color={
                  cart.mode === 'exchange'
                    ? '#FFFFFF'
                    : designTokens.colors.ink[600]
                }
              />
              <Text
                style={[
                  styles.modeBtnText,
                  cart.mode === 'exchange' && styles.modeBtnTextActive,
                ]}
              >
                החלפה / החזרה
              </Text>
            </TouchableOpacity>
          </View>

          {/* Product Search */}
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="חיפוש מוצר או סריקת ברקוד..."
            actions={
              <>
                <TouchableOpacity
                  style={styles.barcodeBtn}
                  onPress={() => setScannerOpen(true)}
                >
                  <Ionicons
                    name="barcode-outline"
                    size={22}
                    color={designTokens.colors.brand[500]}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.manualBtn}
                  onPress={() => setManualItemModal(true)}
                >
                  <Ionicons name="create-outline" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </>
            }
          />

          {/* Category Filter */}
          {categories.length > 0 && (
            <FilterTabs
              tabs={[
                { key: '__all__', label: 'הכל' },
                ...categories.map((cat) => ({ key: cat.id, label: cat.name })),
              ]}
              activeTab={selectedCategory || '__all__'}
              onTabPress={(key) =>
                setSelectedCategory(key === '__all__' ? undefined : key)
              }
            />
          )}

          {/* Error State */}
          {productsError && (
            <View style={styles.errorBanner}>
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={designTokens.colors.semantic.danger.DEFAULT}
              />
              <Text style={styles.errorBannerText}>
                {(productsError as Error)?.message || 'שגיאה בטעינת מוצרים'}
              </Text>
            </View>
          )}

          {/* Product Grid */}
          <View style={styles.productsGrid}>
            {productsLoading ? (
              <ActivityIndicator
                size="small"
                color={designTokens.colors.brand[500]}
                style={{ padding: designTokens.spacing[4] }}
              />
            ) : products.length === 0 && !productsError ? (
              <View style={styles.emptyProducts}>
                <Ionicons
                  name="cube-outline"
                  size={32}
                  color={designTokens.colors.ink[400]}
                />
                <Text style={styles.emptyText}>
                  {debouncedSearch ? 'לא נמצאו מוצרים' : 'אין מוצרים'}
                </Text>
              </View>
            ) : (
              <View
                style={styles.gridWrap}
                onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}
              >
                {products.slice(0, 30).map((product) => {
                  const outOfStock = isProductOutOfStock(product);
                  const tracks = product.trackInventory !== false;
                  const lowStock = tracks && product.inventory !== null && product.inventory > 0 && product.inventory <= 5;
                  const disabled = outOfStock && cart.mode !== 'exchange';

                  return (
                    <TouchableOpacity
                      key={product.id}
                      style={[
                        styles.productTile,
                        { width: tileWidth },
                        cart.mode === 'exchange' && styles.productTileExchange,
                        disabled && styles.productTileDisabled,
                      ]}
                      onPress={() => handleProductPress(product)}
                      activeOpacity={disabled ? 1 : 0.7}
                      disabled={disabled}
                    >
                      <View>
                        {product.imageUrl ? (
                          <Image
                            source={{ uri: product.imageUrl }}
                            style={styles.productImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View
                            style={[
                              styles.productImage,
                              styles.productImagePlaceholder,
                            ]}
                          >
                            <Ionicons
                              name="image-outline"
                              size={24}
                              color={designTokens.colors.ink[400]}
                            />
                          </View>
                        )}
                        {outOfStock && cart.mode !== 'exchange' && (
                          <View style={styles.outOfStockOverlay}>
                            <View style={styles.outOfStockBadge}>
                              <Text style={styles.outOfStockBadgeText}>אזל מהמלאי</Text>
                            </View>
                          </View>
                        )}
                      </View>
                      <Text style={styles.productTileName} numberOfLines={2}>
                        {product.name}
                      </Text>
                      <Text style={styles.productTilePrice}>
                        {product.price ? formatCurrency(product.price) : '—'}
                      </Text>
                      {tracks && product.inventory !== null && (
                        <Text style={[
                          styles.stockLabel,
                          outOfStock && styles.stockLabelOut,
                          lowStock && styles.stockLabelLow,
                          !outOfStock && !lowStock && styles.stockLabelOk,
                        ]}>
                          {outOfStock ? 'אזל' : lowStock ? `נותרו ${product.inventory}` : `במלאי: ${product.inventory}`}
                        </Text>
                      )}
                      {product.hasVariants && (
                        <View style={styles.variantBadge}>
                          <Text style={styles.variantBadgeText}>וריאציות</Text>
                        </View>
                      )}
                      {cart.mode === 'exchange' && (
                        <View style={styles.returnBadge}>
                          <Ionicons name="return-down-back" size={10} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Cart */}
          {cart.items.length > 0 && (
            <View style={styles.cartSection}>
              <View style={styles.cartHeader}>
                <TouchableOpacity
                  onPress={() => {
                    cart.clearCart();
                    setIsPartialPayment(false);
                    setPartialPaymentAmount('');
                    hapticWarning();
                  }}
                  style={styles.cartClearBtn}
                >
                  <Text style={styles.cartClearText}>נקה</Text>
                </TouchableOpacity>
                <Text style={styles.cartTitle}>
                  <Ionicons name="cart-outline" size={16} /> עגלה (
                  {cart.items.length})
                </Text>
              </View>
              {cart.items.map((item, index) => {
                const isReturn = item.type === 'return';
                return (
                  <View
                    key={`${item.productId || 'manual'}-${item.variantId || index}`}
                    style={[styles.cartItem, isReturn && styles.cartItemReturn]}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        cart.removeItem(index);
                        hapticLight();
                      }}
                      style={styles.cartDeleteBtn}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color={designTokens.colors.semantic.danger.DEFAULT}
                      />
                    </TouchableOpacity>
                    <Text
                      style={[
                        styles.cartItemTotal,
                        isReturn && styles.cartItemReturnText,
                      ]}
                    >
                      {formatCurrency(item.price * item.quantity)}
                    </Text>
                    <View style={styles.qtyControls}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => {
                          cart.updateQuantity(index, item.quantity + 1);
                          hapticLight();
                        }}
                      >
                        <Ionicons
                          name="add"
                          size={16}
                          color={designTokens.colors.brand[500]}
                        />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => {
                          cart.updateQuantity(index, item.quantity - 1);
                          hapticLight();
                        }}
                      >
                        <Ionicons
                          name="remove"
                          size={16}
                          color={designTokens.colors.brand[500]}
                        />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.cartItemInfo}>
                      <Text style={styles.cartItemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.cartItemPrice}>
                        {formatCurrency(item.price)}
                      </Text>
                    </View>
                    {isReturn && (
                      <View style={styles.returnTag}>
                        <Text style={styles.returnTagText}>החזרה</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Customer */}
          <TouchableOpacity
            style={styles.customerSection}
            onPress={() => setCustomerModalOpen(true)}
          >
            <Ionicons
              name="chevron-back"
              size={16}
              color={designTokens.colors.ink[400]}
            />
            <View style={styles.customerInfo}>
              {cart.customer.name ? (
                <>
                  <Text style={styles.customerName}>
                    {cart.customer.name}
                  </Text>
                  <Text style={styles.customerDetail}>
                    {cart.customer.email} • {cart.customer.phone}
                  </Text>
                </>
              ) : (
                <Text style={styles.customerPlaceholder}>
                  בחר לקוח או הזן פרטים
                </Text>
              )}
            </View>
            <View style={styles.customerIcon}>
              <Ionicons
                name="person-outline"
                size={20}
                color={designTokens.colors.brand[500]}
              />
            </View>
          </TouchableOpacity>

          {/* Order Options */}
          <View style={styles.optionsSection}>
            {/* Shipping Method */}
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>אופן מסירה</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    cart.shippingMethod === 'pickup' && styles.toggleBtnActive,
                  ]}
                  onPress={() => {
                    cart.setShippingMethod('pickup');
                    cart.setShippingAmount(0);
                  }}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      cart.shippingMethod === 'pickup' &&
                        styles.toggleTextActive,
                    ]}
                  >
                    איסוף
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    cart.shippingMethod === 'delivery' &&
                      styles.toggleBtnActive,
                  ]}
                  onPress={() => cart.setShippingMethod('delivery')}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      cart.shippingMethod === 'delivery' &&
                        styles.toggleTextActive,
                    ]}
                  >
                    משלוח
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Delivery Address + Shipping Cost */}
            {cart.shippingMethod === 'delivery' && (
              <View style={styles.addressSection}>
                <TextInput
                  style={styles.addressInput}
                  placeholder="עיר *"
                  placeholderTextColor={designTokens.colors.ink[400]}
                  value={cart.customer.address?.city || ''}
                  onChangeText={(v) =>
                    cart.setCustomer({
                      ...cart.customer,
                      address: {
                        ...cart.customer.address,
                        city: v,
                        street: cart.customer.address?.street || '',
                      },
                    })
                  }
                  textAlign="right"
                />
                <View style={styles.addressRow}>
                  <TextInput
                    style={[styles.addressInput, { flex: 1 }]}
                    placeholder="מס׳ בית"
                    placeholderTextColor={designTokens.colors.ink[400]}
                    value={cart.customer.address?.houseNumber || ''}
                    onChangeText={(v) =>
                      cart.setCustomer({
                        ...cart.customer,
                        address: {
                          ...cart.customer.address,
                          houseNumber: v,
                          street: cart.customer.address?.street || '',
                          city: cart.customer.address?.city || '',
                        },
                      })
                    }
                    textAlign="right"
                  />
                  <TextInput
                    style={[styles.addressInput, { flex: 2 }]}
                    placeholder="רחוב *"
                    placeholderTextColor={designTokens.colors.ink[400]}
                    value={cart.customer.address?.street || ''}
                    onChangeText={(v) =>
                      cart.setCustomer({
                        ...cart.customer,
                        address: {
                          ...cart.customer.address,
                          street: v,
                          city: cart.customer.address?.city || '',
                        },
                      })
                    }
                    textAlign="right"
                  />
                </View>
                <View style={styles.addressRow}>
                  <TextInput
                    style={[styles.addressInput, { flex: 1 }]}
                    placeholder="מיקוד"
                    placeholderTextColor={designTokens.colors.ink[400]}
                    value={cart.customer.address?.zipCode || ''}
                    onChangeText={(v) =>
                      cart.setCustomer({
                        ...cart.customer,
                        address: {
                          ...cart.customer.address,
                          zipCode: v,
                          street: cart.customer.address?.street || '',
                          city: cart.customer.address?.city || '',
                        },
                      })
                    }
                    textAlign="right"
                  />
                  <TextInput
                    style={[styles.addressInput, { flex: 1 }]}
                    placeholder="קומה"
                    placeholderTextColor={designTokens.colors.ink[400]}
                    value={cart.customer.address?.floor || ''}
                    onChangeText={(v) =>
                      cart.setCustomer({
                        ...cart.customer,
                        address: {
                          ...cart.customer.address,
                          floor: v,
                          street: cart.customer.address?.street || '',
                          city: cart.customer.address?.city || '',
                        },
                      })
                    }
                    textAlign="right"
                  />
                  <TextInput
                    style={[styles.addressInput, { flex: 1 }]}
                    placeholder="דירה"
                    placeholderTextColor={designTokens.colors.ink[400]}
                    value={cart.customer.address?.apartment || ''}
                    onChangeText={(v) =>
                      cart.setCustomer({
                        ...cart.customer,
                        address: {
                          ...cart.customer.address,
                          apartment: v,
                          street: cart.customer.address?.street || '',
                          city: cart.customer.address?.city || '',
                        },
                      })
                    }
                    textAlign="right"
                  />
                </View>
                {/* Shipping Cost */}
                <View style={styles.shippingCostRow}>
                  <TextInput
                    style={[styles.addressInput, { flex: 1 }]}
                    placeholder="0"
                    placeholderTextColor={designTokens.colors.ink[400]}
                    value={
                      cart.shippingAmount > 0
                        ? String(cart.shippingAmount)
                        : ''
                    }
                    onChangeText={(v) =>
                      cart.setShippingAmount(parseFloat(v) || 0)
                    }
                    keyboardType="numeric"
                    textAlign="right"
                  />
                  <Text style={styles.shippingCostLabel}>עלות משלוח (₪)</Text>
                </View>
              </View>
            )}

            {/* Coupon / Discount Code */}
            <View style={styles.couponSection}>
              <Text style={styles.couponLabel}>קוד קופון / הנחה</Text>
              <View style={styles.couponRow}>
                <TextInput
                  style={styles.couponInput}
                  placeholder="הזן קוד קופון..."
                  placeholderTextColor={designTokens.colors.ink[400]}
                  value={couponInput}
                  onChangeText={setCouponInput}
                  autoCapitalize="none"
                  textAlign="right"
                  onSubmitEditing={handleApplyCoupon}
                />
                <TouchableOpacity
                  style={[
                    styles.couponApplyBtn,
                    validateCoupon.isPending && { opacity: 0.6 },
                  ]}
                  onPress={handleApplyCoupon}
                  disabled={validateCoupon.isPending || !couponInput.trim()}
                >
                  {validateCoupon.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.couponApplyText}>הפעל</Text>
                  )}
                </TouchableOpacity>
              </View>
              {cart.appliedCoupons.map((coupon) => (
                <View key={coupon.code} style={styles.appliedCoupon}>
                  <TouchableOpacity
                    onPress={() => cart.removeCoupon(coupon.code)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={designTokens.colors.semantic.danger.DEFAULT}
                    />
                  </TouchableOpacity>
                  <Text style={styles.appliedCouponText}>
                    {coupon.code}
                    {coupon.type === 'percentage'
                      ? ` (${coupon.value}%)`
                      : ` (₪${coupon.value})`}
                  </Text>
                  <Ionicons
                    name="pricetag-outline"
                    size={14}
                    color={designTokens.colors.semantic.success.DEFAULT}
                  />
                </View>
              ))}
            </View>

            {/* Partial payment */}
            {cart.total > 0 && (
              <View style={styles.partialSection}>
                <View style={styles.optionRow}>
                  <Text style={styles.optionLabel}>תשלום חלקי</Text>
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      isPartialPayment && styles.checkboxActive,
                    ]}
                    onPress={() => {
                      setIsPartialPayment(!isPartialPayment);
                      if (isPartialPayment) setPartialPaymentAmount('');
                    }}
                  >
                    {isPartialPayment && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </View>
                {isPartialPayment && (
                  <View style={styles.partialInputWrap}>
                    <TextInput
                      style={styles.partialInput}
                      placeholder={`0 - ${cart.total.toFixed(0)}`}
                      placeholderTextColor={designTokens.colors.ink[400]}
                      value={partialPaymentAmount}
                      onChangeText={setPartialPaymentAmount}
                      keyboardType="numeric"
                      textAlign="right"
                    />
                    <Text style={styles.partialHint}>סכום שהלקוח משלם עכשיו (₪)</Text>
                    {parseFloat(partialPaymentAmount) > 0 && (
                      <View style={styles.partialSummary}>
                        <View style={styles.partialSummaryRow}>
                          <Text style={styles.partialSummaryValue}>{formatCurrency(parseFloat(partialPaymentAmount))}</Text>
                          <Text style={styles.partialSummaryLabel}>שולם:</Text>
                        </View>
                        <View style={styles.partialSummaryRow}>
                          <Text style={styles.partialSummaryValue}>{formatCurrency(cart.total - parseFloat(partialPaymentAmount))}</Text>
                          <Text style={styles.partialSummaryLabel}>נותר:</Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Mark as paid toggle */}
            {!isPartialPayment && (
              <View style={styles.optionRow}>
                <Text style={styles.optionLabel}>סמן כשולם (מזומן/אחר)</Text>
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    cart.markAsPaid && styles.checkboxActive,
                  ]}
                  onPress={() => cart.setMarkAsPaid(!cart.markAsPaid)}
                >
                  {cart.markAsPaid && (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Notes */}
            <TextInput
              style={styles.notesInput}
              placeholder="הערות להזמנה..."
              placeholderTextColor={designTokens.colors.ink[400]}
              value={cart.notes}
              onChangeText={cart.setNotes}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Summary */}
          <View style={styles.summarySection}>
            {cart.mode === 'exchange' && cart.returnTotal !== 0 ? (
              <>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>זיכוי (החזרות)</Text>
                  <Text style={[styles.summaryValue, { color: '#EA580C' }]}>
                    {formatCurrency(cart.returnTotal)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>רכישות חדשות</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(cart.purchaseTotal)}
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>סכום ביניים</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(cart.subtotal)}
                </Text>
              </View>
            )}
            {cart.discountAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>הנחה</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    {
                      color:
                        designTokens.colors.semantic.success.DEFAULT,
                    },
                  ]}
                >
                  -{formatCurrency(cart.discountAmount)}
                </Text>
              </View>
            )}
            {cart.shippingAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>משלוח</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(cart.shippingAmount)}
                </Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>
                {cart.total < 0 ? 'זיכוי ללקוח' : 'סה"כ'}
              </Text>
              <Text
                style={[
                  styles.totalValue,
                  cart.total < 0 && { color: '#EA580C' },
                ]}
              >
                {formatCurrency(Math.abs(cart.total))}
              </Text>
            </View>
          </View>

          {/* Checkout Button */}
          <TouchableOpacity
            style={[
              cart.mode === 'exchange'
                ? styles.checkoutBtnExchange
                : styles.checkoutBtn,
              createOrder.isPending && styles.checkoutBtnDisabled,
            ]}
            onPress={handleCheckout}
            disabled={createOrder.isPending}
            activeOpacity={0.8}
          >
            {createOrder.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : cart.mode === 'exchange' ? (
              <>
                <Ionicons
                  name="swap-horizontal-outline"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.checkoutBtnText}>
                  {cart.total <= 0
                    ? 'בצע החלפה'
                    : `החלפה + תשלום ${formatCurrency(cart.total)}`}
                </Text>
              </>
            ) : isPartialPayment && parseFloat(partialPaymentAmount) > 0 ? (
              <>
                <Ionicons name="card-outline" size={20} color="#FFFFFF" />
                <Text style={styles.checkoutBtnText}>
                  תשלום חלקי • {formatCurrency(parseFloat(partialPaymentAmount))}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="card-outline" size={20} color="#FFFFFF" />
                <Text style={styles.checkoutBtnText}>
                  {cart.markAsPaid ? 'סגור הזמנה' : 'המשך לתשלום'} •{' '}
                  {formatCurrency(cart.total)}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: designTokens.spacing[10] }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Variant Selection Modal */}
      <BottomSheet
        visible={!!variantModalProduct}
        onClose={() => setVariantModalProduct(null)}
      >
        <Text style={styles.modalTitle}>
          {cart.mode === 'exchange' ? 'בחר וריאציה להחזרה' : variantModalProduct?.name}
        </Text>
        {variantsLoading ? (
          <ActivityIndicator
            style={{ padding: designTokens.spacing[4] }}
            color={designTokens.colors.brand[500]}
          />
        ) : (
          <FlatList
            data={variantsData?.variants || []}
            keyExtractor={(v) => v.id}
            renderItem={({ item: variant }) => {
              const variantOut = isVariantOutOfStock(variant);
              const variantLow = variant.inventory !== null && variant.inventory > 0 && variant.inventory <= 5;
              const variantDisabled = variantOut && cart.mode !== 'exchange';

              return (
                <TouchableOpacity
                  style={[
                    styles.variantRow,
                    cart.mode === 'exchange' && styles.variantRowExchange,
                    variantDisabled && styles.variantRowDisabled,
                  ]}
                  onPress={() => handleVariantSelect(variant)}
                  disabled={variantDisabled}
                >
                  <View style={styles.variantInfo}>
                    <Text style={[
                      styles.variantTitle,
                      variantDisabled && { color: designTokens.colors.ink[400] },
                    ]}>{variant.title}</Text>
                    {variant.inventory !== null && (
                      <Text style={[
                        styles.variantStock,
                        variantOut && { color: designTokens.colors.semantic.danger.DEFAULT },
                        variantLow && { color: '#EA580C' },
                        !variantOut && !variantLow && { color: designTokens.colors.semantic.success.DEFAULT },
                      ]}>
                        {variantOut ? 'אזל מהמלאי' : variantLow ? `נותרו ${variant.inventory}` : `${variant.inventory} במלאי`}
                      </Text>
                    )}
                  </View>
                  <Text style={[
                    styles.variantPrice,
                    variantDisabled && { color: designTokens.colors.ink[400] },
                  ]}>
                    {variant.price ? formatCurrency(variant.price) : '—'}
                  </Text>
                  {cart.mode === 'exchange' && (
                    <Ionicons name="return-down-back" size={16} color="#EA580C" />
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>אין וריאציות זמינות</Text>
            }
          />
        )}
        <TouchableOpacity
          style={styles.modalCloseBtn}
          onPress={() => setVariantModalProduct(null)}
        >
          <Text style={styles.modalCloseBtnText}>סגור</Text>
        </TouchableOpacity>
      </BottomSheet>

      {/* Customer Modal */}
      <BottomSheet
        visible={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
      >
        <Text style={styles.modalTitle}>פרטי לקוח</Text>

        {/* Customer Search */}
        {cart.customer.type !== 'existing' && (
          <View style={styles.customerSearchSection}>
            <View style={styles.customerSearchRow}>
              <TextInput
                style={styles.customerSearchInput}
                placeholder="חיפוש לקוח קיים..."
                placeholderTextColor={designTokens.colors.ink[400]}
                value={customerSearchQuery}
                onChangeText={setCustomerSearchQuery}
                textAlign="right"
              />
              <Ionicons
                name="search-outline"
                size={18}
                color={designTokens.colors.ink[400]}
              />
            </View>
            {customerSearchLoading && debouncedCustomerSearch.length >= 2 && (
              <ActivityIndicator
                size="small"
                color={designTokens.colors.brand[500]}
                style={{ marginTop: designTokens.spacing[2] }}
              />
            )}
            {customerSearchData?.customers &&
              customerSearchData.customers.length > 0 && (
                <View style={styles.customerSearchResults}>
                  {customerSearchData.customers
                    .slice(0, 5)
                    .map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        style={styles.customerSearchItem}
                        onPress={() => handleSelectCustomer(c)}
                      >
                        <View style={styles.customerSearchAvatar}>
                          <Text style={styles.customerSearchAvatarText}>
                            {(c.name || c.email).charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.customerSearchItemInfo}>
                          <Text style={styles.customerSearchItemName}>
                            {c.name || c.email}
                          </Text>
                          <Text style={styles.customerSearchItemDetail}>
                            {c.email}
                          </Text>
                          {c.totalOrders > 0 && (
                            <Text style={styles.customerSearchItemDetail}>
                              {c.totalOrders} הזמנות
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                </View>
              )}
          </View>
        )}

        {/* Selected customer display */}
        {cart.customer.type === 'existing' && cart.customer.name && (
          <View style={styles.selectedCustomerBanner}>
            <TouchableOpacity
              onPress={() => {
                cart.setCustomer({
                  type: 'guest',
                  name: '',
                  email: '',
                  phone: '',
                });
              }}
            >
              <Text style={styles.selectedCustomerClear}>נקה</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.selectedCustomerName}>
                {cart.customer.name}
              </Text>
              <Text style={styles.selectedCustomerEmail}>
                {cart.customer.email}
              </Text>
            </View>
            <View style={styles.selectedCustomerAvatar}>
              <Text style={styles.selectedCustomerAvatarText}>
                {cart.customer.name.charAt(0)}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.formGroup}>
          <TextInput
            style={styles.formInput}
            placeholder="שם מלא *"
            placeholderTextColor={designTokens.colors.ink[400]}
            value={cart.customer.name}
            onChangeText={(v) =>
              cart.setCustomer({ ...cart.customer, name: v })
            }
            textAlign="right"
          />
          <TextInput
            style={styles.formInput}
            placeholder="אימייל *"
            placeholderTextColor={designTokens.colors.ink[400]}
            value={cart.customer.email}
            onChangeText={(v) =>
              cart.setCustomer({ ...cart.customer, email: v })
            }
            keyboardType="email-address"
            autoCapitalize="none"
            textAlign="right"
          />
          <TextInput
            style={styles.formInput}
            placeholder="טלפון *"
            placeholderTextColor={designTokens.colors.ink[400]}
            value={cart.customer.phone}
            onChangeText={(v) =>
              cart.setCustomer({ ...cart.customer, phone: v })
            }
            keyboardType="phone-pad"
            textAlign="right"
          />
        </View>
        <TouchableOpacity
          style={styles.modalSaveBtn}
          onPress={() => setCustomerModalOpen(false)}
        >
          <Text style={styles.modalSaveBtnText}>שמור</Text>
        </TouchableOpacity>
      </BottomSheet>

      {/* Manual Item Modal */}
      <BottomSheet
        visible={manualItemModal}
        onClose={() => {
          setManualItemModal(false);
          setManualName('');
          setManualPrice('');
        }}
      >
        <Text style={styles.modalTitle}>פריט ידני</Text>
        <View style={styles.formGroup}>
          <TextInput
            style={styles.formInput}
            placeholder="שם הפריט"
            placeholderTextColor={designTokens.colors.ink[400]}
            value={manualName}
            onChangeText={setManualName}
            textAlign="right"
          />
          <TextInput
            style={styles.formInput}
            placeholder="מחיר (₪)"
            placeholderTextColor={designTokens.colors.ink[400]}
            value={manualPrice}
            onChangeText={setManualPrice}
            keyboardType="numeric"
            textAlign="right"
          />
        </View>
        <TouchableOpacity
          style={styles.modalSaveBtn}
          onPress={handleAddManualItem}
        >
          <Text style={styles.modalSaveBtnText}>הוסף לעגלה</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.modalCloseBtn}
          onPress={() => {
            setManualItemModal(false);
            setManualName('');
            setManualPrice('');
          }}
        >
          <Text style={styles.modalCloseBtnText}>ביטול</Text>
        </TouchableOpacity>
      </BottomSheet>

      {/* Barcode Scanner Modal */}
      <Modal
        visible={scannerOpen}
        animationType="slide"
        onRequestClose={() => setScannerOpen(false)}
      >
        <SafeAreaView style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity
              onPress={() => setScannerOpen(false)}
              style={styles.scannerCloseBtn}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>סרוק ברקוד</Text>
            <View style={{ width: 44 }} />
          </View>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: [
                'ean13',
                'ean8',
                'upc_a',
                'upc_e',
                'code128',
                'code39',
                'qr',
              ],
            }}
            onBarcodeScanned={handleBarcodeScan}
          />
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame} />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const dt = designTokens;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dt.colors.surface.background,
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: dt.spacing[10] },

  // Mode Toggle
  modeToggle: {
    flexDirection: 'row',
    marginHorizontal: dt.spacing[4],
    marginTop: dt.spacing[3],
    marginBottom: dt.spacing[1],
    gap: dt.spacing[2],
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: dt.spacing[2],
    paddingVertical: dt.spacing[2],
    borderRadius: dt.radii.lg,
    backgroundColor: dt.colors.ink[100],
    minHeight: 44,
  },
  modeBtnActive: {
    backgroundColor: dt.colors.brand[500],
  },
  modeBtnExchange: {
    backgroundColor: '#EA580C',
  },
  modeBtnText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: dt.colors.ink[600],
  },
  modeBtnTextActive: {
    color: '#FFFFFF',
  },

  // Search action buttons
  manualBtn: {
    width: 44,
    height: 44,
    borderRadius: dt.radii.md,
    backgroundColor: dt.colors.ink[800],
    alignItems: 'center',
    justifyContent: 'center',
  },
  barcodeBtn: {
    width: 44,
    height: 44,
    borderRadius: dt.radii.md,
    backgroundColor: dt.colors.surface.card,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dt.spacing[2],
    marginHorizontal: dt.spacing[4],
    marginTop: dt.spacing[2],
    padding: dt.spacing[3],
    backgroundColor: '#FEF2F2',
    borderRadius: dt.radii.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#991B1B',
    textAlign: 'right',
  },

  // Products
  productsGrid: {
    paddingHorizontal: GRID_PADDING,
    marginTop: dt.spacing[3],
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  productTile: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.md,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    padding: dt.spacing[1],
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  productTileExchange: {
    borderColor: '#FDBA74',
    backgroundColor: '#FFF7ED',
  },
  productTileDisabled: {
    opacity: 0.55,
  },
  productImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: dt.radii.sm,
  },
  productImagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: dt.colors.ink[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: dt.radii.sm,
  },
  productTileName: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: dt.colors.ink[950],
    textAlign: 'center',
    marginTop: dt.spacing[1],
  },
  productTilePrice: {
    fontSize: 13,
    fontFamily: MONO_FONT,
    color: dt.colors.brand[500],
    marginTop: 2,
  },
  stockLabel: {
    fontSize: 8,
    fontFamily: fonts.regular,
    marginTop: 1,
    textAlign: 'center',
  },
  stockLabelOut: {
    color: dt.colors.semantic.danger.DEFAULT,
  },
  stockLabelLow: {
    color: '#EA580C',
  },
  stockLabelOk: {
    color: dt.colors.semantic.success.DEFAULT,
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: dt.radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: dt.radii.sm,
  },
  outOfStockBadgeText: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: dt.colors.semantic.danger.DEFAULT,
  },
  variantBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: dt.colors.semantic.info.light,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: dt.radii.sm,
  },
  variantBadgeText: {
    fontSize: 9,
    fontFamily: fonts.medium,
    color: dt.colors.semantic.info.dark,
  },
  returnBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyProducts: {
    alignItems: 'center',
    padding: dt.spacing[6],
    gap: dt.spacing[2],
  },
  emptyText: {
    fontSize: 14,
    color: dt.colors.ink[500],
    fontFamily: fonts.regular,
    textAlign: 'center',
  },

  // Cart
  cartSection: {
    marginHorizontal: dt.spacing[4],
    marginTop: dt.spacing[4],
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    padding: dt.spacing[3],
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dt.spacing[2],
  },
  cartTitle: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[950],
    textAlign: 'right',
  },
  cartClearBtn: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartClearText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: dt.colors.semantic.danger.DEFAULT,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dt.spacing[2],
    paddingVertical: dt.spacing[2],
    borderTopWidth: 1,
    borderTopColor: dt.colors.ink[100],
  },
  cartItemReturn: {
    backgroundColor: '#FFF7ED',
    borderRadius: dt.radii.md,
    marginHorizontal: -dt.spacing[1],
    paddingHorizontal: dt.spacing[1],
  },
  cartItemInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  cartItemName: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: dt.colors.ink[950],
    textAlign: 'right',
  },
  cartItemPrice: {
    fontSize: 12,
    fontFamily: MONO_FONT,
    color: dt.colors.ink[500],
  },
  cartItemTotal: {
    fontSize: 14,
    fontFamily: MONO_FONT,
    color: dt.colors.ink[950],
  },
  cartItemReturnText: {
    color: '#EA580C',
  },
  cartDeleteBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dt.spacing[1],
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: dt.radii.full,
    backgroundColor: dt.colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[950],
    minWidth: 20,
    textAlign: 'center',
  },
  returnTag: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: dt.radii.sm,
  },
  returnTagText: {
    fontSize: 9,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
  },

  // Customer
  customerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dt.spacing[3],
    marginHorizontal: dt.spacing[4],
    marginTop: dt.spacing[3],
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    padding: dt.spacing[3],
    minHeight: 56,
  },
  customerIcon: {
    width: 44,
    height: 44,
    borderRadius: dt.radii.full,
    backgroundColor: dt.colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  customerName: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[950],
    textAlign: 'right',
  },
  customerDetail: {
    fontSize: 12,
    color: dt.colors.ink[500],
    marginTop: 2,
    textAlign: 'right',
  },
  customerPlaceholder: {
    fontSize: 14,
    color: dt.colors.ink[400],
    fontFamily: fonts.regular,
    textAlign: 'right',
  },

  // Options
  optionsSection: {
    marginHorizontal: dt.spacing[4],
    marginTop: dt.spacing[3],
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    padding: dt.spacing[3],
    gap: dt.spacing[3],
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  optionLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: dt.colors.ink[950],
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  toggleRow: {
    flexDirection: 'row',
    borderRadius: dt.radii.full,
    backgroundColor: dt.colors.ink[100],
    overflow: 'hidden',
  },
  toggleBtn: {
    paddingHorizontal: dt.spacing[4],
    paddingVertical: dt.spacing[2],
    minHeight: 44,
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: dt.colors.brand[500],
    borderRadius: dt.radii.full,
  },
  toggleText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: dt.colors.ink[600],
    textAlign: 'right',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: dt.radii.sm,
    borderWidth: 2,
    borderColor: dt.colors.ink[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: dt.colors.brand[500],
    borderColor: dt.colors.brand[500],
  },

  // Address Section
  addressSection: {
    gap: dt.spacing[2],
    paddingTop: dt.spacing[1],
  },
  addressRow: {
    flexDirection: 'row',
    gap: dt.spacing[2],
  },
  addressInput: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.md,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    paddingHorizontal: dt.spacing[3],
    paddingVertical: dt.spacing[2],
    fontFamily: fonts.regular,
    fontSize: 14,
    color: dt.colors.ink[950],
    minHeight: 44,
  },
  shippingCostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dt.spacing[2],
    marginTop: dt.spacing[1],
  },
  shippingCostLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: dt.colors.ink[600],
    textAlign: 'right',
  },

  // Coupon
  couponSection: {
    gap: dt.spacing[2],
  },
  couponLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: dt.colors.ink[600],
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  couponRow: {
    flexDirection: 'row',
    gap: dt.spacing[2],
    alignItems: 'center',
  },
  couponInput: {
    flex: 1,
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.md,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    paddingHorizontal: dt.spacing[3],
    paddingVertical: dt.spacing[2],
    fontFamily: fonts.regular,
    fontSize: 14,
    color: dt.colors.ink[950],
    minHeight: 44,
  },
  couponApplyBtn: {
    backgroundColor: dt.colors.brand[500],
    borderRadius: dt.radii.md,
    paddingHorizontal: dt.spacing[4],
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponApplyText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
  },
  appliedCoupon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dt.spacing[2],
    backgroundColor: '#F0FDF4',
    borderRadius: dt.radii.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: dt.spacing[3],
    paddingVertical: dt.spacing[2],
  },
  appliedCouponText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#166534',
    textAlign: 'right',
  },

  partialSection: {
    marginBottom: dt.spacing[2],
  },
  partialInputWrap: {
    backgroundColor: '#EFF6FF',
    borderRadius: dt.radii.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: dt.spacing[3],
    marginTop: dt.spacing[2],
  },
  partialInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: dt.radii.md,
    borderWidth: 1,
    borderColor: '#93C5FD',
    padding: dt.spacing[2],
    fontFamily: fonts.regular,
    fontSize: 14,
    color: dt.colors.ink[950],
    minHeight: 40,
  },
  partialHint: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: '#1E40AF',
    marginTop: dt.spacing[1],
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  partialSummary: {
    marginTop: dt.spacing[2],
    gap: dt.spacing[1],
  },
  partialSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  partialSummaryLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#1E40AF',
  },
  partialSummaryValue: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#1E40AF',
  },

  notesInput: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.md,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    padding: dt.spacing[3],
    fontFamily: fonts.regular,
    fontSize: 14,
    color: dt.colors.ink[950],
    textAlign: 'right',
    minHeight: 60,
  },

  // Summary
  summarySection: {
    marginHorizontal: dt.spacing[4],
    marginTop: dt.spacing[3],
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    padding: dt.spacing[3],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: dt.spacing[1],
  },
  summaryLabel: {
    fontSize: 14,
    color: dt.colors.ink[600],
    fontFamily: fonts.regular,
    textAlign: 'right',
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: MONO_FONT,
    color: dt.colors.ink[950],
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: dt.colors.ink[100],
    paddingTop: dt.spacing[2],
    marginTop: dt.spacing[1],
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: dt.colors.ink[950],
    textAlign: 'right',
  },
  totalValue: {
    fontSize: 16,
    fontFamily: MONO_FONT,
    color: dt.colors.brand[500],
  },

  // Checkout
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: dt.spacing[2],
    marginHorizontal: dt.spacing[4],
    marginTop: dt.spacing[4],
    backgroundColor: dt.colors.brand[500],
    borderRadius: dt.radii.lg,
    paddingVertical: dt.spacing[4],
    minHeight: 56,
  },
  checkoutBtnExchange: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: dt.spacing[2],
    marginHorizontal: dt.spacing[4],
    marginTop: dt.spacing[4],
    backgroundColor: '#EA580C',
    borderRadius: dt.radii.lg,
    paddingVertical: dt.spacing[4],
    minHeight: 56,
  },
  checkoutBtnDisabled: { opacity: 0.6 },
  checkoutBtnText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
    textAlign: 'right',
  },

  // Modal / Bottom Sheet
  modalSheetWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: dt.colors.surface.card,
    borderTopLeftRadius: dt.radii.xl,
    borderTopRightRadius: dt.radii.xl,
    padding: dt.spacing[4],
    maxHeight: '80%',
    ...dt.shadows.card,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: dt.colors.ink[300],
    alignSelf: 'center',
    marginBottom: dt.spacing[3],
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[950],
    textAlign: 'center',
    marginBottom: dt.spacing[3],
  },
  modalCloseBtn: {
    paddingVertical: dt.spacing[3],
    marginTop: dt.spacing[2],
    minHeight: 44,
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: dt.colors.ink[500],
    textAlign: 'center',
  },
  modalSaveBtn: {
    backgroundColor: dt.colors.brand[500],
    borderRadius: dt.radii.lg,
    paddingVertical: dt.spacing[3],
    marginTop: dt.spacing[3],
    minHeight: 48,
    justifyContent: 'center',
  },
  modalSaveBtnText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: dt.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: dt.colors.ink[100],
    minHeight: 56,
  },
  variantRowExchange: {
    backgroundColor: '#FFF7ED',
    borderRadius: dt.radii.md,
    paddingHorizontal: dt.spacing[2],
    marginBottom: dt.spacing[1],
  },
  variantRowDisabled: {
    opacity: 0.5,
  },
  variantInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  variantTitle: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: dt.colors.ink[950],
    textAlign: 'right',
  },
  variantStock: {
    fontSize: 12,
    color: dt.colors.ink[500],
    marginTop: 2,
    textAlign: 'right',
  },
  variantPrice: {
    fontSize: 15,
    fontFamily: MONO_FONT,
    color: dt.colors.brand[500],
  },

  // Form
  formGroup: { gap: dt.spacing[3] },
  formInput: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.md,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    paddingHorizontal: dt.spacing[3],
    paddingVertical: dt.spacing[3],
    fontFamily: fonts.regular,
    fontSize: 15,
    color: dt.colors.ink[950],
    minHeight: 48,
  },

  // Customer Search
  customerSearchSection: {
    marginBottom: dt.spacing[3],
  },
  customerSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dt.spacing[2],
    backgroundColor: dt.colors.ink[50],
    borderRadius: dt.radii.md,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    paddingHorizontal: dt.spacing[3],
  },
  customerSearchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: dt.colors.ink[950],
    paddingVertical: dt.spacing[3],
    minHeight: 44,
  },
  customerSearchResults: {
    marginTop: dt.spacing[2],
    borderRadius: dt.radii.md,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    overflow: 'hidden',
  },
  customerSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dt.spacing[3],
    padding: dt.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: dt.colors.ink[100],
    minHeight: 56,
  },
  customerSearchItemInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  customerSearchItemName: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: dt.colors.ink[950],
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  customerSearchItemDetail: {
    fontSize: 12,
    color: dt.colors.ink[500],
    marginTop: 2,
    writingDirection: 'rtl',
  },
  customerSearchAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: dt.colors.ink[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerSearchAvatarText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[600],
  },

  // Selected Customer
  selectedCustomerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dt.spacing[3],
    backgroundColor: '#F0FDF4',
    borderRadius: dt.radii.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: dt.spacing[3],
    marginBottom: dt.spacing[3],
  },
  selectedCustomerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCustomerAvatarText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
  },
  selectedCustomerName: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[950],
    textAlign: 'right',
  },
  selectedCustomerEmail: {
    fontSize: 12,
    color: dt.colors.ink[500],
    textAlign: 'right',
  },
  selectedCustomerClear: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: dt.colors.ink[500],
  },

  // Scanner
  scannerContainer: { flex: 1, backgroundColor: '#000000' },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: dt.spacing[4],
    paddingVertical: dt.spacing[3],
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  scannerTitle: {
    fontSize: 17,
    fontFamily: fonts.semiBold,
    color: '#FFFFFF',
    textAlign: 'right',
  },
  scannerCloseBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerFrame: {
    width: 260,
    height: 160,
    borderRadius: dt.radii.lg,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
  },
});
