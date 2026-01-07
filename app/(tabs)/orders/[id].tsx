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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOrder, useUpdateOrderStatus } from '@/hooks';
import {
  Text,
  Title,
  Subtitle,
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
  OrderStatusBadge,
  LoadingScreen,
  colors,
  spacing,
  borderRadius,
  shadows,
} from '@/components/ui';
import { formatCurrency, formatDateTime, formatAddress, formatPhone } from '@/lib/utils/format';
import type { Order, FulfillmentStatus } from '@/types';

const STATUS_OPTIONS: { status: Order['status']; label: string }[] = [
  { status: 'pending', label: 'ממתינה' },
  { status: 'confirmed', label: 'אושרה' },
  { status: 'processing', label: 'בטיפול' },
  { status: 'shipped', label: 'נשלחה' },
  { status: 'delivered', label: 'נמסרה' },
  { status: 'cancelled', label: 'בוטלה' },
];

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, error } = useOrder(id);
  const updateStatus = useUpdateOrderStatus();
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  if (isLoading) {
    return <LoadingScreen message="טוען פרטי הזמנה..." />;
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text color="error" center>
            שגיאה בטעינת ההזמנה
          </Text>
          <Button onPress={() => router.back()} variant="outline" style={{ marginTop: spacing[4] }}>
            חזור
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const { order, items, customer, timeline } = data;

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
    const address = formatAddress(order.shippingAddress);
    if (address) {
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
        {/* Status Section */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <OrderStatusBadge status={order.status} />
            <TouchableOpacity
              style={styles.changeStatusButton}
              onPress={() => setShowStatusPicker(!showStatusPicker)}
            >
              <Text color="secondary" size="sm">
                שנה סטטוס ▼
              </Text>
            </TouchableOpacity>
          </View>

          {showStatusPicker && (
            <View style={styles.statusPicker}>
              {STATUS_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.status}
                  style={[
                    styles.statusOption,
                    order.status === option.status && styles.statusOptionActive,
                  ]}
                  onPress={() => handleStatusChange(option.status)}
                  disabled={updateStatus.isPending}
                >
                  <Text
                    weight={order.status === option.status ? 'semiBold' : 'regular'}
                    style={order.status === option.status ? { color: colors.primary } : undefined}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Card>

        {/* Customer Info */}
        <Card style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="person-outline" size={20} color="#6D7175" />
            <Text weight="semiBold" style={styles.sectionTitleText}>פרטי לקוח</Text>
          </View>
          <View style={styles.customerRow}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
              <Ionicons name="call-outline" size={20} color="#00785C" />
            </TouchableOpacity>
            <View style={styles.customerInfo}>
              <Text weight="medium" style={{ textAlign: 'right', color: '#202223' }}>{order.customerName}</Text>
              <Text color="secondary" size="sm" style={{ textAlign: 'right' }}>
                {order.customerEmail}
              </Text>
              {order.customerPhone && (
                <Text color="secondary" size="sm" style={{ textAlign: 'right' }}>
                  {formatPhone(order.customerPhone)}
                </Text>
              )}
            </View>
          </View>
        </Card>

        {/* Shipping Address */}
        <Card style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="home-outline" size={20} color="#6D7175" />
            <Text weight="semiBold" style={styles.sectionTitleText}>כתובת משלוח</Text>
          </View>
          <Text style={{ textAlign: 'right', color: '#202223' }}>{formatAddress(order.shippingAddress)}</Text>
          <TouchableOpacity style={styles.navigateButton} onPress={handleNavigate}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1] }}>
              <Ionicons name="navigate-outline" size={16} color="#00785C" />
              <Text style={{ color: '#00785C' }}>נווט לכתובת</Text>
            </View>
          </TouchableOpacity>
        </Card>

        {/* Order Items */}
        <Card style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="cube-outline" size={20} color="#6D7175" />
            <Text weight="semiBold" style={styles.sectionTitleText}>פריטים</Text>
          </View>
          {items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text weight="semiBold" style={{ color: '#00785C' }}>{formatCurrency(item.total)}</Text>
              <View style={styles.itemInfo}>
                <Text weight="medium" numberOfLines={2} style={{ textAlign: 'right', color: '#202223' }}>
                  {item.name}
                </Text>
                {item.variantTitle && (
                  <Text color="secondary" size="sm" style={{ textAlign: 'right' }}>
                    {item.variantTitle}
                  </Text>
                )}
                <Text color="secondary" size="sm" style={{ textAlign: 'right' }}>
                  x{item.quantity} @ {formatCurrency(item.price)}
                </Text>
              </View>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
              ) : (
                <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                  <Ionicons name="image-outline" size={24} color="#9CA3AF" />
                </View>
              )}
            </View>
          ))}
        </Card>

        {/* Order Summary */}
        <Card style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="cash-outline" size={20} color="#6D7175" />
            <Text weight="semiBold" style={styles.sectionTitleText}>סיכום</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={{ color: '#202223' }}>{formatCurrency(order.subtotal)}</Text>
            <Text style={{ color: '#6D7175', textAlign: 'right' }}>סכום ביניים</Text>
          </View>
          {order.discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={{ color: '#00785C' }}>-{formatCurrency(order.discountAmount)}</Text>
              <Text style={{ color: '#00785C', textAlign: 'right' }}>
                הנחה {order.discountCode && `(${order.discountCode})`}
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={{ color: '#202223' }}>{formatCurrency(order.shippingAmount)}</Text>
            <Text style={{ color: '#6D7175', textAlign: 'right' }}>משלוח</Text>
          </View>
          {order.taxAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={{ color: '#202223' }}>{formatCurrency(order.taxAmount)}</Text>
              <Text style={{ color: '#6D7175', textAlign: 'right' }}>מע"מ</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text weight="bold" size="lg" style={{ color: '#00785C' }}>
              {formatCurrency(order.total)}
            </Text>
            <Text weight="bold" size="lg" style={{ color: '#202223', textAlign: 'right' }}>
              סה"כ
            </Text>
          </View>
        </Card>

        {/* Notes */}
        {(order.note || order.internalNote) && (
          <Card style={styles.card}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="create-outline" size={20} color="#6D7175" />
              <Text weight="semiBold" style={styles.sectionTitleText}>הערות</Text>
            </View>
            {order.note && (
              <View style={styles.noteSection}>
                <Text size="sm" style={{ color: '#6D7175', textAlign: 'right', marginBottom: spacing[1] }}>
                  הערת לקוח:
                </Text>
                <Text style={{ textAlign: 'right', color: '#202223' }}>{order.note}</Text>
              </View>
            )}
            {order.internalNote && (
              <View style={styles.noteSection}>
                <Text size="sm" style={{ color: '#6D7175', textAlign: 'right', marginBottom: spacing[1] }}>
                  הערה פנימית:
                </Text>
                <Text style={{ textAlign: 'right', color: '#202223' }}>{order.internalNote}</Text>
              </View>
            )}
          </Card>
        )}

        {/* Timeline */}
        {timeline && timeline.length > 0 && (
          <Card style={styles.card}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="document-text-outline" size={20} color="#6D7175" />
              <Text weight="semiBold" style={styles.sectionTitleText}>היסטוריה</Text>
            </View>
            {timeline.map((event, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineContent}>
                  <Text size="sm" style={{ textAlign: 'right', color: '#202223' }}>{event.description}</Text>
                  <Text size="xs" style={{ textAlign: 'right', color: '#9CA3AF' }}>
                    {formatDateTime(event.createdAt)}
                  </Text>
                </View>
                <View style={styles.timelineDot} />
              </View>
            ))}
          </Card>
        )}

        {/* Spacer */}
        <View style={{ height: spacing[10] }} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        {order.status === 'pending' && (
          <Button
            fullWidth
            onPress={() => handleStatusChange('processing')}
            loading={updateStatus.isPending}
            icon={<Ionicons name="checkmark-circle" size={18} color={colors.white} />}
            iconPosition="right"
          >
            התחל טיפול
          </Button>
        )}
        {order.status === 'processing' && (
          <Button
            fullWidth
            onPress={() => handleStatusChange('shipped')}
            loading={updateStatus.isPending}
            icon={<Ionicons name="checkmark-circle" size={18} color={colors.white} />}
            iconPosition="right"
          >
            סמן כנשלחה
          </Button>
        )}
        {order.status === 'shipped' && (
          <Button
            fullWidth
            onPress={() => handleStatusChange('delivered')}
            loading={updateStatus.isPending}
            icon={<Ionicons name="checkmark-circle" size={18} color={colors.white} />}
            iconPosition="right"
          >
            סמן כנמסרה
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F6F6F7',
  },
  scrollContent: {
    padding: spacing[4],
    gap: spacing[3],
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  statusCard: {
    padding: spacing[4],
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#E1E3E5',
    ...shadows.sm,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  changeStatusButton: {
    padding: spacing[2],
  },
  statusPicker: {
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: '#E1E3E5',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  statusOption: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: '#F6F6F7',
  },
  statusOptionActive: {
    backgroundColor: '#E4F8F0',
    borderWidth: 1,
    borderColor: '#00785C',
  },
  sectionTitle: {
    marginBottom: spacing[3],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#E1E3E5',
    ...shadows.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  sectionTitleText: {
    fontSize: 16,
    color: '#202223',
    textAlign: 'right',
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  customerActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F6F6F7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E1E3E5',
  },
  navigateButton: {
    marginTop: spacing[3],
    paddingVertical: spacing[2],
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: '#E1E3E5',
    gap: spacing[3],
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
  },
  itemImagePlaceholder: {
    backgroundColor: '#F6F6F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E1E3E5',
    marginTop: spacing[2],
    paddingTop: spacing[3],
  },
  noteSection: {
    marginBottom: spacing[3],
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: spacing[3],
    gap: spacing[3],
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00785C',
    marginTop: 6,
  },
  timelineContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  bottomAction: {
    padding: spacing[4],
    paddingBottom: spacing[6],
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E1E3E5',
  },
});

