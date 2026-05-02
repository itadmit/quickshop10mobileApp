import React, { useState, useMemo, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Button,
  Card,
  ScreenHeader,
  SectionHeader,
  EmptyState,
  designTokens,
  fonts,
} from '@/components/ui';
import { useInfiniteOrders, useOrder, useCreateReturnRequest } from '@/hooks';
import { showToast } from '@/lib/utils/toast';
import { formatCurrency, formatDateTimeShort } from '@/lib/utils/format';
import { RETURN_REASON_LABELS, type ReturnReason } from '@/lib/api/returns';

const dt = designTokens;

const TYPE_OPTIONS: { key: 'return' | 'exchange'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'return', label: 'החזרה', icon: 'return-down-back-outline' },
  { key: 'exchange', label: 'החלפה', icon: 'swap-horizontal-outline' },
];

const RESOLUTION_OPTIONS: { key: 'refund' | 'store_credit' | 'exchange'; label: string }[] = [
  { key: 'refund', label: 'החזר כספי' },
  { key: 'store_credit', label: 'זיכוי' },
  { key: 'exchange', label: 'החלפה' },
];

const REASON_KEYS: ReturnReason[] = [
  'wrong_size',
  'defective',
  'not_as_described',
  'changed_mind',
  'wrong_item',
  'damaged_shipping',
  'other',
];

export default function NewReturnScreen() {
  const router = useRouter();
  const create = useCreateReturnRequest();

  const [step, setStep] = useState<'pickOrder' | 'fillForm'>('pickOrder');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const [type, setType] = useState<'return' | 'exchange'>('return');
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [reason, setReason] = useState<ReturnReason>('changed_mind');
  const [reasonDetails, setReasonDetails] = useState('');
  const [resolution, setResolution] = useState<'refund' | 'store_credit' | 'exchange'>('refund');

  const { data: ordersData, isLoading: ordersLoading } = useInfiniteOrders({
    search: orderSearch.trim() || undefined,
    limit: 15,
  });

  const orders = useMemo(
    () => ordersData?.pages.flatMap((p) => p.orders) ?? [],
    [ordersData],
  );

  const { data: orderDetail } = useOrder(selectedOrderId ?? '');
  const orderItems = orderDetail?.items ?? [];

  // When type flips to exchange, default resolution to 'exchange'.
  useEffect(() => {
    if (type === 'exchange') setResolution('exchange');
    else if (resolution === 'exchange') setResolution('refund');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const totalAmount = orderItems.reduce((sum, item) => {
    const q = itemQuantities[item.id] ?? 0;
    return sum + Number(item.price ?? 0) * q;
  }, 0);

  const selectedItemCount = Object.values(itemQuantities).reduce((s, q) => s + q, 0);

  const handlePickOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setStep('fillForm');
  };

  const handleSubmit = async () => {
    const items = Object.entries(itemQuantities)
      .filter(([, q]) => q > 0)
      .map(([orderItemId, quantity]) => ({ orderItemId, quantity }));

    if (items.length === 0) {
      showToast('בחר לפחות פריט אחד', 'error');
      return;
    }
    if (!selectedOrderId) {
      showToast('בחר הזמנה', 'error');
      return;
    }

    try {
      const r = await create.mutateAsync({
        orderId: selectedOrderId,
        type,
        items,
        reason,
        reasonDetails: reasonDetails.trim() || undefined,
        requestedResolution: resolution,
      });
      if (r.success && r.requestId) {
        showToast(`בקשה ${r.requestNumber} נוצרה`, 'success');
        router.replace(`/(tabs)/returns/${r.requestId}`);
      } else {
        showToast(r.error || 'אירעה שגיאה', 'error');
      }
    } catch (e: any) {
      showToast(e?.message || 'אירעה שגיאה', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title={step === 'pickOrder' ? 'בחר הזמנה' : 'בקשת החזרה חדשה'}
        onBack={
          step === 'fillForm'
            ? () => {
                setStep('pickOrder');
                setSelectedOrderId(null);
                setItemQuantities({});
              }
            : undefined
        }
      />

      {step === 'pickOrder' ? (
        <View style={{ flex: 1 }}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color={dt.colors.ink[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="חיפוש לפי מספר הזמנה / לקוח"
              placeholderTextColor={dt.colors.ink[400]}
              value={orderSearch}
              onChangeText={setOrderSearch}
              textAlign="right"
            />
          </View>
          {ordersLoading ? (
            <ActivityIndicator style={{ marginTop: dt.spacing[8] }} color={dt.colors.brand[500]} />
          ) : orders.length === 0 ? (
            <EmptyState
              icon={<Ionicons name="receipt-outline" size={48} color={dt.colors.brand[500]} />}
              title="לא נמצאו הזמנות"
              description={orderSearch ? 'נסה חיפוש אחר' : 'אין הזמנות להחזיר עדיין'}
            />
          ) : (
            <ScrollView contentContainerStyle={styles.list}>
              {orders.map((order) => (
                <TouchableOpacity
                  key={order.id}
                  style={styles.orderRow}
                  onPress={() => handlePickOrder(order.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.orderRowMain}>
                    <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
                    <Text style={styles.orderTotal}>{formatCurrency(Number(order.total))}</Text>
                  </View>
                  <View style={styles.orderRowMeta}>
                    <Text style={styles.orderMetaText} numberOfLines={1}>
                      {order.customerName ?? 'אורח'}
                    </Text>
                    <Text style={styles.orderMetaDate}>{formatDateTimeShort(order.createdAt)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
          {/* Type */}
          <View style={styles.section}>
            <SectionHeader title="סוג בקשה" />
            <View style={styles.typeGrid}>
              {TYPE_OPTIONS.map((opt) => {
                const active = type === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.typeChip, active && styles.typeChipActive]}
                    onPress={() => setType(opt.key)}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={20}
                      color={active ? dt.colors.surface.onBrand : dt.colors.ink[600]}
                    />
                    <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Items */}
          <View style={styles.section}>
            <SectionHeader title="פריטים להחזרה" />
            <Card variant="outlined" padding={0}>
              {orderItems.length === 0 ? (
                <View style={{ padding: dt.spacing[6] }}>
                  <ActivityIndicator color={dt.colors.brand[500]} />
                </View>
              ) : (
                orderItems.map((item, idx) => {
                  const qty = itemQuantities[item.id] ?? 0;
                  return (
                    <View
                      key={item.id}
                      style={[styles.itemRow, idx < orderItems.length - 1 && styles.itemRowBorder]}
                    >
                      {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                      ) : (
                        <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                          <Ionicons name="cube-outline" size={20} color={dt.colors.ink[400]} />
                        </View>
                      )}
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                        {item.variantTitle ? (
                          <Text style={styles.itemVariant}>{item.variantTitle}</Text>
                        ) : null}
                        <Text style={styles.itemMeta}>
                          {formatCurrency(Number(item.price ?? 0))} · נרכש {item.quantity}
                        </Text>
                      </View>
                      <View style={styles.qtyControl}>
                        <TouchableOpacity
                          onPress={() =>
                            setItemQuantities((prev) => ({
                              ...prev,
                              [item.id]: Math.max(0, (prev[item.id] ?? 0) - 1),
                            }))
                          }
                          disabled={qty === 0}
                          style={[styles.qtyBtn, qty === 0 && styles.qtyBtnDisabled]}
                        >
                          <Ionicons name="remove" size={16} color={dt.colors.ink[700]} />
                        </TouchableOpacity>
                        <Text style={styles.qtyValue}>{qty}</Text>
                        <TouchableOpacity
                          onPress={() =>
                            setItemQuantities((prev) => ({
                              ...prev,
                              [item.id]: Math.min(item.quantity, (prev[item.id] ?? 0) + 1),
                            }))
                          }
                          disabled={qty >= item.quantity}
                          style={[styles.qtyBtn, qty >= item.quantity && styles.qtyBtnDisabled]}
                        >
                          <Ionicons name="add" size={16} color={dt.colors.ink[700]} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </Card>
          </View>

          {/* Reason */}
          <View style={styles.section}>
            <SectionHeader title="סיבה" />
            <View style={styles.reasonGrid}>
              {REASON_KEYS.map((key) => {
                const active = reason === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.reasonChip, active && styles.reasonChipActive]}
                    onPress={() => setReason(key)}
                  >
                    <Text style={[styles.reasonChipText, active && styles.reasonChipTextActive]}>
                      {RETURN_REASON_LABELS[key]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TextInput
              style={styles.detailsInput}
              placeholder="פירוט נוסף (אופציונלי)"
              placeholderTextColor={dt.colors.ink[400]}
              value={reasonDetails}
              onChangeText={setReasonDetails}
              multiline
              textAlign="right"
            />
          </View>

          {/* Resolution */}
          <View style={styles.section}>
            <SectionHeader title="פתרון מבוקש" />
            <View style={styles.resolutionGrid}>
              {RESOLUTION_OPTIONS.map((opt) => {
                const active = resolution === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.resolutionChip, active && styles.resolutionChipActive]}
                    onPress={() => setResolution(opt.key)}
                  >
                    <Text style={[styles.resolutionChipText, active && styles.resolutionChipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Summary */}
          <Card variant="outlined" style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryValue}>{selectedItemCount}</Text>
              <Text style={styles.summaryLabel}>פריטים נבחרו</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotal}>{formatCurrency(totalAmount)}</Text>
              <Text style={styles.summaryLabel}>סכום לבקשה</Text>
            </View>
          </Card>

          <Button
            variant="primary"
            onPress={handleSubmit}
            loading={create.isPending}
            disabled={selectedItemCount === 0}
            fullWidth
            style={{ marginTop: dt.spacing[3] }}
          >
            צור בקשה
          </Button>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: dt.colors.surface.background },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dt.spacing[2],
    margin: dt.spacing[4],
    paddingHorizontal: dt.spacing[3],
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: dt.colors.ink[950],
  },
  list: {
    padding: dt.spacing[4],
    paddingTop: 0,
  },
  orderRow: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    padding: dt.spacing[4],
    marginBottom: dt.spacing[2],
    gap: dt.spacing[2],
  },
  orderRowMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[950],
  },
  orderTotal: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: dt.colors.brand[500],
  },
  orderRowMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderMetaText: {
    fontSize: 13,
    color: dt.colors.ink[500],
    flex: 1,
  },
  orderMetaDate: {
    fontSize: 12,
    color: dt.colors.ink[400],
  },
  formScroll: {
    padding: dt.spacing[4],
    gap: dt.spacing[4],
  },
  section: { gap: dt.spacing[2] },
  typeGrid: { flexDirection: 'row', gap: dt.spacing[2] },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: dt.spacing[3],
    backgroundColor: dt.colors.ink[50],
    borderRadius: dt.radii.md,
  },
  typeChipActive: { backgroundColor: dt.colors.brand[500] },
  typeChipText: { fontSize: 13, fontFamily: fonts.medium, color: dt.colors.ink[700] },
  typeChipTextActive: { color: dt.colors.surface.onBrand },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: dt.spacing[3],
    gap: dt.spacing[3],
  },
  itemRowBorder: { borderBottomWidth: 1, borderBottomColor: dt.colors.ink[100] },
  itemImage: { width: 48, height: 48, borderRadius: dt.radii.md, backgroundColor: dt.colors.ink[100] },
  itemImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: 13, fontFamily: fonts.medium, color: dt.colors.ink[950], textAlign: 'right', writingDirection: 'rtl' },
  itemVariant: { fontSize: 12, color: dt.colors.ink[500], textAlign: 'right', writingDirection: 'rtl' },
  itemMeta: { fontSize: 11, color: dt.colors.ink[400], textAlign: 'right', writingDirection: 'rtl' },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: dt.colors.ink[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnDisabled: { opacity: 0.4 },
  qtyValue: {
    minWidth: 18,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[950],
  },
  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: dt.spacing[2],
  },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: dt.colors.ink[50],
    borderRadius: dt.radii.full,
  },
  reasonChipActive: { backgroundColor: dt.colors.brand[500] },
  reasonChipText: { fontSize: 13, fontFamily: fonts.medium, color: dt.colors.ink[700] },
  reasonChipTextActive: { color: dt.colors.surface.onBrand },
  detailsInput: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.md,
    padding: dt.spacing[3],
    fontSize: 14,
    fontFamily: fonts.regular,
    color: dt.colors.ink[950],
    minHeight: 70,
    marginTop: dt.spacing[2],
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
  },
  resolutionGrid: { flexDirection: 'row', gap: dt.spacing[2] },
  resolutionChip: {
    flex: 1,
    paddingVertical: dt.spacing[3],
    alignItems: 'center',
    backgroundColor: dt.colors.ink[50],
    borderRadius: dt.radii.md,
  },
  resolutionChipActive: { backgroundColor: dt.colors.brand[500] },
  resolutionChipText: { fontSize: 13, fontFamily: fonts.medium, color: dt.colors.ink[700] },
  resolutionChipTextActive: { color: dt.colors.surface.onBrand },
  summary: { gap: dt.spacing[2] },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: { fontSize: 13, color: dt.colors.ink[500] },
  summaryValue: { fontSize: 14, fontFamily: fonts.semiBold, color: dt.colors.ink[950] },
  summaryTotal: { fontSize: 18, fontFamily: fonts.bold, color: dt.colors.brand[500] },
});
