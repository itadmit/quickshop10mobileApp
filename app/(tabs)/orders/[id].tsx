import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOrder, useUpdateOrderStatus, useCancelOrder, useRefundOrder, useFulfillOrder, useAddOrderNote } from '@/hooks';
import {
  Text,
  Button,
  LoadingScreen,
  StatusBadge,
  SectionHeader,
  designTokens,
  fonts,
} from '@/components/ui';
import { formatCurrency, formatDateTime, formatAddress, formatPhone } from '@/lib/utils/format';
import type { Order } from '@/types';

const dt = designTokens;
const mono = dt.typography.fontFamily.mono;

const STATUS_OPTIONS: { status: Order['status']; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { status: 'pending', label: 'ממתינה', icon: 'time-outline' },
  { status: 'confirmed', label: 'אושרה', icon: 'checkmark-outline' },
  { status: 'processing', label: 'בטיפול', icon: 'build-outline' },
  { status: 'shipped', label: 'נשלחה', icon: 'car-outline' },
  { status: 'delivered', label: 'נמסרה', icon: 'checkmark-done-outline' },
  { status: 'cancelled', label: 'בוטלה', icon: 'close-outline' },
];

const FINANCIAL_LABELS: Record<string, string> = {
  pending: 'ממתין לתשלום',
  paid: 'שולם',
  partially_paid: 'שולם חלקית',
  refunded: 'זוכה',
  partially_refunded: 'זוכה חלקית',
};

function getFinancialLabel(status: string): string {
  return FINANCIAL_LABELS[status] || status;
}

function getFinancialColor(status: string): string {
  switch (status) {
    case 'paid': return dt.colors.semantic.success.DEFAULT;
    case 'pending': return dt.colors.semantic.warning.DEFAULT;
    case 'partially_paid': return dt.colors.semantic.warning.DEFAULT;
    case 'refunded': return dt.colors.semantic.danger.DEFAULT;
    case 'partially_refunded': return dt.colors.semantic.warning.DEFAULT;
    default: return dt.colors.ink[400];
  }
}

// Generate a consistent color from a name string
function avatarColorFromName(name: string): string {
  const palette = [
    dt.colors.brand[500],
    dt.colors.semantic.success.DEFAULT,
    dt.colors.semantic.warning.DEFAULT,
    dt.colors.semantic.info.DEFAULT,
    '#8B5CF6',
    '#EC4899',
    '#14B8A6',
    '#F59E0B',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, error } = useOrder(id);
  const updateStatus = useUpdateOrderStatus();
  const cancelOrder = useCancelOrder();
  const refundOrder = useRefundOrder();
  const fulfillOrder = useFulfillOrder();
  const addOrderNote = useAddOrderNote();
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  if (isLoading) {
    return <LoadingScreen message="טוען פרטי הזמנה..." />;
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={dt.colors.semantic.danger.DEFAULT} />
          <Text style={styles.errorTitle}>שגיאה בטעינת ההזמנה</Text>
          <Text style={styles.errorDescription}>לא הצלחנו למצוא את ההזמנה המבוקשת</Text>
          <Button onPress={() => router.back()} variant="outline" style={{ marginTop: dt.spacing[4] }}>
            חזור להזמנות
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const { order, items, customer, timeline, shipments } = data as typeof data & { shipments?: Array<{ id: string; trackingNumber: string | null; labelUrl: string | null; status: string; statusDescription: string | null; provider: string; createdAt: string }> };

  const handleCancel = () => {
    if (order.status === 'cancelled') return;
    Alert.alert('ביטול הזמנה', `האם לבטל את הזמנה #${order.orderNumber}?`, [
      { text: 'לא', style: 'cancel' },
      {
        text: 'כן, בטל',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelOrder.mutateAsync(order.id);
            Alert.alert('הצלחה', 'ההזמנה בוטלה');
          } catch {
            Alert.alert('שגיאה', 'לא הצלחנו לבטל את ההזמנה');
          }
        },
      },
    ]);
  };

  const handleRefund = () => {
    if (order.financialStatus !== 'paid' && order.financialStatus !== 'partially_refunded') {
      Alert.alert('לא ניתן', 'ניתן לבצע החזר רק להזמנות ששולמו');
      return;
    }
    Alert.alert('החזר כספי', `האם לבצע החזר כספי מלא של ${formatCurrency(order.total)}?`, [
      { text: 'לא', style: 'cancel' },
      {
        text: 'כן, בצע החזר',
        style: 'destructive',
        onPress: async () => {
          try {
            await refundOrder.mutateAsync({ orderId: order.id });
            Alert.alert('הצלחה', 'ההחזר בוצע בהצלחה');
          } catch {
            Alert.alert('שגיאה', 'לא הצלחנו לבצע את ההחזר');
          }
        },
      },
    ]);
  };

  const handleFulfill = () => {
    Alert.prompt ? Alert.prompt(
      'סימון כנשלח',
      'הזן מספר מעקב (אופציונלי)',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'סמן כנשלח',
          onPress: async (trackingNumber?: string) => {
            try {
              await fulfillOrder.mutateAsync({
                orderId: order.id,
                data: trackingNumber ? { trackingNumber } : undefined,
              });
              Alert.alert('הצלחה', 'ההזמנה סומנה כנשלחה');
            } catch {
              Alert.alert('שגיאה', 'לא הצלחנו לסמן את ההזמנה כנשלחה');
            }
          },
        },
      ],
      'plain-text'
    ) : (async () => {
      try {
        await fulfillOrder.mutateAsync({ orderId: order.id });
        Alert.alert('הצלחה', 'ההזמנה סומנה כנשלחה');
      } catch {
        Alert.alert('שגיאה', 'לא הצלחנו לסמן את ההזמנה כנשלחה');
      }
    })();
  };

  const handleStatusChange = async (newStatus: Order['status']) => {
    setShowStatusPicker(false);
    try {
      await updateStatus.mutateAsync({
        orderId: order.id,
        data: { status: newStatus, notifyCustomer: true },
      });
    } catch (err) {
      Alert.alert('שגיאה', 'לא הצלחנו לעדכן את הסטטוס');
    }
  };

  const handleCall = () => {
    const phone = order.customerPhone || customer?.phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleNavigate = () => {
    if (!order.shippingAddress) return;
    const address = formatAddress(order.shippingAddress);
    if (address && address !== 'לא צוינה כתובת') {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <View style={styles.card}>
          <View style={styles.headerTop}>
            <Text style={styles.orderNumber}>
              {order.orderNumber.startsWith('#') ? order.orderNumber : `#${order.orderNumber}`}
            </Text>
            <StatusBadge status={order.status} />
          </View>
          <View style={styles.headerBottom}>
            <Text style={styles.orderDate}>{formatDateTime(order.createdAt)}</Text>
            <Text style={styles.orderTotal}>{formatCurrency(order.total)}</Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <SectionHeader title={`פריטים (${items.length})`} />
          <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
            {items.map((item, index) => (
              <View
                key={item.id}
                style={[styles.itemRow, index < items.length - 1 && styles.itemRowBorder]}
              >
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                ) : (
                  <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                    <Ionicons name="image-outline" size={22} color={dt.colors.ink[400]} />
                  </View>
                )}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                  {item.variantTitle && (
                    <Text style={styles.itemVariant}>{item.variantTitle}</Text>
                  )}
                  <Text style={styles.itemMeta}>{item.quantity} × {formatCurrency(item.price)}</Text>
                </View>
                <Text style={styles.itemTotal}>{formatCurrency(item.total)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <SectionHeader title="סיכום" />
          <View style={styles.card}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>סכום ביניים</Text>
              <Text style={styles.summaryValue}>{formatCurrency(order.subtotal)}</Text>
            </View>
            {order.discountAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  הנחה{order.discountCode ? ` (${order.discountCode})` : ''}
                </Text>
                <Text style={[styles.summaryValue, { color: dt.colors.semantic.success.DEFAULT }]}>
                  -{formatCurrency(order.discountAmount)}
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>משלוח</Text>
              <Text style={styles.summaryValue}>{formatCurrency(order.shippingAmount)}</Text>
            </View>
            {order.taxAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>מע"מ</Text>
                <Text style={styles.summaryValue}>{formatCurrency(order.taxAmount)}</Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>סה"כ</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.total)}</Text>
            </View>
            <View style={[styles.summaryRow, { marginTop: dt.spacing[2], borderTopWidth: 1, borderTopColor: dt.colors.ink[100], paddingTop: dt.spacing[3] }]}>
              <Text style={styles.summaryLabel}>סטטוס תשלום</Text>
              <View style={styles.financialBadge}>
                <View style={[styles.financialDot, { backgroundColor: getFinancialColor(order.financialStatus) }]} />
                <Text style={[styles.financialText, { color: getFinancialColor(order.financialStatus) }]}>
                  {getFinancialLabel(order.financialStatus)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Customer */}
        <View style={styles.section}>
          <SectionHeader title="לקוח" />
          <View style={styles.card}>
            <View style={styles.customerRow}>
              <View
                style={[
                  styles.customerAvatar,
                  { backgroundColor: avatarColorFromName(order.customerName || '?') },
                ]}
              >
                <Text style={styles.customerAvatarText}>
                  {order.customerName?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{order.customerName}</Text>
                <Text style={styles.customerEmail}>{order.customerEmail}</Text>
                {order.customerPhone && (
                  <Text style={styles.customerPhone}>{formatPhone(order.customerPhone)}</Text>
                )}
              </View>
              <TouchableOpacity style={styles.customerCallBtn} onPress={handleCall}>
                <Ionicons name="call" size={18} color={dt.colors.brand[500]} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Shipping Address */}
        {order.shippingAddress && (
          <View style={styles.section}>
            <SectionHeader title="כתובת משלוח" />
            <View style={styles.card}>
              <Text style={styles.addressText}>{formatAddress(order.shippingAddress)}</Text>
              <TouchableOpacity style={styles.navigateBtn} onPress={handleNavigate}>
                <Ionicons name="navigate" size={16} color={dt.colors.brand[500]} />
                <Text style={styles.navigateBtnText}>נווט לכתובת</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.card}>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
              <View style={styles.actionIconCircle}>
                <Ionicons name="call-outline" size={20} color={dt.colors.ink[700]} />
              </View>
              <Text style={styles.actionLabel}>התקשר</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleNavigate}>
              <View style={styles.actionIconCircle}>
                <Ionicons name="navigate-outline" size={20} color={dt.colors.ink[700]} />
              </View>
              <Text style={styles.actionLabel}>נווט</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setShowStatusPicker(!showStatusPicker)}>
              <View style={styles.actionIconCircle}>
                <Ionicons name="swap-horizontal-outline" size={20} color={dt.colors.ink[700]} />
              </View>
              <Text style={styles.actionLabel}>שנה סטטוס</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Picker */}
        {showStatusPicker && (
          <View style={styles.card}>
            <SectionHeader title="בחר סטטוס" style={{ marginBottom: dt.spacing[3] }} />
            <View style={styles.statusGrid}>
              {STATUS_OPTIONS.map((option) => {
                const isActive = order.status === option.status;
                return (
                  <TouchableOpacity
                    key={option.status}
                    style={[
                      styles.statusOption,
                      isActive && styles.statusOptionActive,
                    ]}
                    onPress={() => handleStatusChange(option.status)}
                    disabled={updateStatus.isPending}
                  >
                    <Ionicons
                      name={option.icon}
                      size={18}
                      color={isActive ? dt.colors.brand[500] : dt.colors.ink[400]}
                    />
                    <Text
                      style={[
                        styles.statusOptionText,
                        isActive && styles.statusOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Order Actions */}
        <View style={styles.card}>
          <SectionHeader title="פעולות" style={{ marginBottom: dt.spacing[3] }} />
          <View style={{ gap: dt.spacing[2] }}>
            {order.fulfillmentStatus !== 'fulfilled' && order.status !== 'cancelled' && order.status !== 'refunded' && (
              <TouchableOpacity
                style={[styles.orderActionBtn, { backgroundColor: dt.colors.brand[50] }]}
                onPress={handleFulfill}
                disabled={fulfillOrder.isPending}
              >
                <Ionicons name="car-outline" size={18} color={dt.colors.brand[600]} />
                <Text style={[styles.orderActionText, { color: dt.colors.brand[600] }]}>
                  {fulfillOrder.isPending ? 'מעדכן...' : 'סמן כנשלח'}
                </Text>
              </TouchableOpacity>
            )}
            {order.financialStatus === 'paid' && order.status !== 'refunded' && (
              <TouchableOpacity
                style={[styles.orderActionBtn, { backgroundColor: dt.colors.semantic.warning.light }]}
                onPress={handleRefund}
                disabled={refundOrder.isPending}
              >
                <Ionicons name="arrow-undo-outline" size={18} color={dt.colors.semantic.warning.DEFAULT} />
                <Text style={[styles.orderActionText, { color: dt.colors.semantic.warning.DEFAULT }]}>
                  {refundOrder.isPending ? 'מבצע החזר...' : 'החזר כספי'}
                </Text>
              </TouchableOpacity>
            )}
            {order.status !== 'cancelled' && order.status !== 'refunded' && (
              <TouchableOpacity
                style={[styles.orderActionBtn, { backgroundColor: dt.colors.semantic.danger.light }]}
                onPress={handleCancel}
                disabled={cancelOrder.isPending}
              >
                <Ionicons name="close-circle-outline" size={18} color={dt.colors.semantic.danger.DEFAULT} />
                <Text style={[styles.orderActionText, { color: dt.colors.semantic.danger.DEFAULT }]}>
                  {cancelOrder.isPending ? 'מבטל...' : 'בטל הזמנה'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Shipments */}
        {shipments && shipments.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="משלוחים" />
            {shipments.map((shipment) => (
              <View key={shipment.id} style={styles.card}>
                <View style={styles.shipmentRow}>
                  <Ionicons name="car-outline" size={18} color={dt.colors.ink[500]} />
                  <Text style={styles.shipmentProvider}>{shipment.provider}</Text>
                  <StatusBadge status={shipment.status as 'pending' | 'processing' | 'shipped' | 'delivered'} />
                </View>
                {shipment.trackingNumber && (
                  <View style={styles.shipmentRow}>
                    <Text style={styles.shipmentLabel}>מספר מעקב:</Text>
                    <Text style={styles.shipmentValue}>{shipment.trackingNumber}</Text>
                  </View>
                )}
                {shipment.labelUrl && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(shipment.labelUrl!)}
                    style={[styles.orderActionBtn, { backgroundColor: dt.colors.brand[50], marginTop: dt.spacing[2] }]}
                  >
                    <Ionicons name="print-outline" size={16} color={dt.colors.brand[600]} />
                    <Text style={[styles.orderActionText, { color: dt.colors.brand[600] }]}>הדפס מדבקה</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        {(order.note || order.internalNote) && (
          <View style={styles.section}>
            <SectionHeader title="הערות" />
            {order.note && (
              <View style={styles.noteCard}>
                <Text style={styles.noteLabel}>הערת לקוח</Text>
                <Text style={styles.noteText}>{order.note}</Text>
              </View>
            )}
            {order.internalNote && (
              <View style={[styles.noteCard, styles.internalNote]}>
                <Text style={styles.noteLabel}>הערה פנימית</Text>
                <Text style={styles.noteText}>{order.internalNote}</Text>
              </View>
            )}
          </View>
        )}

        {/* Timeline */}
        {timeline && timeline.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="היסטוריה" />
            <View style={styles.card}>
              {timeline.map((event, index) => (
                <View key={index} style={styles.timelineItem}>
                  <View style={styles.timelineLine}>
                    <View style={[styles.timelineDot, index === 0 && styles.timelineDotActive]} />
                    {index < timeline.length - 1 && <View style={styles.timelineConnector} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineText}>{event.description}</Text>
                    <Text style={styles.timelineDate}>{formatDateTime(event.createdAt)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: dt.spacing[16] }} />
      </ScrollView>

      {/* Bottom Action */}
      {(order.status === 'pending' || order.status === 'processing' || order.status === 'shipped') && (
        <View style={styles.bottomAction}>
          <Button
            fullWidth
            onPress={() => {
              const nextStatus = order.status === 'pending' ? 'processing' :
                order.status === 'processing' ? 'shipped' : 'delivered';
              handleStatusChange(nextStatus);
            }}
            loading={updateStatus.isPending}
            size="lg"
          >
            {order.status === 'pending' && 'התחל טיפול'}
            {order.status === 'processing' && 'סמן כנשלחה'}
            {order.status === 'shipped' && 'סמן כנמסרה'}
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dt.colors.surface.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: dt.spacing[4],
    gap: dt.spacing[4],
  },

  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: dt.spacing[6],
  },
  errorTitle: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[950],
    marginTop: dt.spacing[3],
  },
  errorDescription: {
    fontSize: 14,
    color: dt.colors.ink[400],
    marginTop: dt.spacing[2],
    textAlign: 'center',
  },

  // Shared card style
  card: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    padding: dt.spacing[4],
  },

  // Header Card
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: dt.colors.ink[950],
  },
  headerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: dt.spacing[3],
  },
  orderDate: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: dt.colors.ink[500],
  },
  orderTotal: {
    fontSize: 28,
    fontFamily: fonts.extraBold,
    color: dt.colors.ink[950],
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: dt.spacing[2],
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: dt.radii.full,
    backgroundColor: dt.colors.ink[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: dt.colors.ink[700],
  },

  // Status Picker
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: dt.spacing[2],
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dt.spacing[2],
    paddingHorizontal: dt.spacing[3],
    paddingVertical: dt.spacing[2],
    borderRadius: dt.radii.md,
    backgroundColor: dt.colors.ink[50],
  },
  statusOptionActive: {
    backgroundColor: dt.colors.brand[50],
  },
  statusOptionText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: dt.colors.ink[500],
  },
  statusOptionTextActive: {
    color: dt.colors.brand[500],
  },

  // Sections
  section: {},

  // Customer
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dt.spacing[3],
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerAvatarText: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
  },
  customerInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  customerName: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[950],
  },
  customerEmail: {
    fontSize: 13,
    color: dt.colors.ink[500],
    marginTop: 2,
  },
  customerPhone: {
    fontSize: 13,
    color: dt.colors.ink[500],
    marginTop: 2,
  },
  customerCallBtn: {
    width: 40,
    height: 40,
    borderRadius: dt.radii.full,
    backgroundColor: dt.colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Address
  addressText: {
    fontSize: 14,
    color: dt.colors.ink[800],
    lineHeight: 22,
    textAlign: 'right',
    writingDirection: 'rtl',
    alignSelf: 'flex-start',
  },
  navigateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dt.spacing[1],
    marginTop: dt.spacing[3],
    paddingTop: dt.spacing[3],
    borderTopWidth: 1,
    borderTopColor: dt.colors.ink[200],
  },
  navigateBtnText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: dt.colors.brand[500],
  },

  // Items
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: dt.spacing[4],
    gap: dt.spacing[3],
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: dt.colors.ink[100],
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: dt.radii.md,
  },
  itemImagePlaceholder: {
    backgroundColor: dt.colors.ink[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  itemName: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: dt.colors.ink[950],
    textAlign: 'right',
  },
  itemVariant: {
    fontSize: 13,
    color: dt.colors.ink[500],
    marginTop: 2,
  },
  itemMeta: {
    fontSize: 13,
    color: dt.colors.ink[500],
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: dt.colors.ink[950],
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: dt.spacing[1],
  },
  summaryLabel: {
    fontSize: 14,
    color: dt.colors.ink[500],
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: dt.colors.ink[800],
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: dt.colors.ink[200],
    paddingTop: dt.spacing[3],
    marginTop: dt.spacing[2],
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[950],
  },
  totalValue: {
    fontSize: 20,
    fontFamily: fonts.extraBold,
    color: dt.colors.ink[950],
  },

  // Financial Status
  financialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'transparent',
  },
  financialDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  financialText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
  },

  // Notes
  noteCard: {
    backgroundColor: dt.colors.ink[50],
    borderRadius: dt.radii.lg,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    padding: dt.spacing[4],
  },
  internalNote: {
    backgroundColor: dt.colors.semantic.warning.light,
    borderColor: dt.colors.semantic.warning.light,
    marginTop: dt.spacing[2],
  },
  noteLabel: {
    fontSize: 12,
    color: dt.colors.ink[500],
    marginBottom: dt.spacing[1],
  },
  noteText: {
    fontSize: 14,
    color: dt.colors.ink[800],
    textAlign: 'right',
    lineHeight: 22,
  },

  // Timeline
  timelineItem: {
    flexDirection: 'row',
    gap: dt.spacing[3],
  },
  timelineLine: {
    alignItems: 'center',
    width: 16,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: dt.colors.ink[300],
    marginTop: 4,
  },
  timelineDotActive: {
    backgroundColor: dt.colors.brand[500],
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: dt.colors.ink[200],
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: dt.spacing[4],
    alignItems: 'flex-start',
  },
  timelineText: {
    fontSize: 14,
    color: dt.colors.ink[800],
    textAlign: 'right',
  },
  timelineDate: {
    fontSize: 12,
    color: dt.colors.ink[400],
    marginTop: 2,
  },

  // Bottom Action
  bottomAction: {
    padding: dt.spacing[4],
    paddingBottom: dt.spacing[8],
    backgroundColor: dt.colors.surface.card,
    borderTopWidth: 1,
    borderTopColor: dt.colors.ink[200],
  },

  // Order Actions
  orderActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: dt.spacing[2],
    paddingVertical: dt.spacing[3],
    borderRadius: dt.radii.md,
  },
  orderActionText: {
    fontSize: 14,
    fontFamily: fonts.medium,
  },

  // Shipments
  shipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dt.spacing[2],
    marginBottom: dt.spacing[1],
  },
  shipmentProvider: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: dt.colors.ink[800],
    flex: 1,
    textAlign: 'right',
  },
  shipmentLabel: {
    fontSize: 13,
    color: dt.colors.ink[500],
    fontFamily: fonts.regular,
  },
  shipmentValue: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: dt.colors.ink[800],
  },
});
