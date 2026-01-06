import React, { useState } from 'react';
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
        <Card>
          <Subtitle style={styles.sectionTitle}>👤 פרטי לקוח</Subtitle>
          <View style={styles.customerRow}>
            <View style={styles.customerInfo}>
              <Text weight="medium">{order.customerName}</Text>
              <Text color="secondary" size="sm">
                {order.customerEmail}
              </Text>
              {order.customerPhone && (
                <Text color="secondary" size="sm">
                  {formatPhone(order.customerPhone)}
                </Text>
              )}
            </View>
            <View style={styles.customerActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
                <Text>📞</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Shipping Address */}
        <Card>
          <Subtitle style={styles.sectionTitle}>🏠 כתובת משלוח</Subtitle>
          <Text>{formatAddress(order.shippingAddress)}</Text>
          <TouchableOpacity style={styles.navigateButton} onPress={handleNavigate}>
            <Text style={{ color: colors.primary }}>📍 נווט לכתובת</Text>
          </TouchableOpacity>
        </Card>

        {/* Order Items */}
        <Card>
          <Subtitle style={styles.sectionTitle}>📦 פריטים</Subtitle>
          {items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
              ) : (
                <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                  <Text color="muted">🖼️</Text>
                </View>
              )}
              <View style={styles.itemInfo}>
                <Text weight="medium" numberOfLines={2}>
                  {item.name}
                </Text>
                {item.variantTitle && (
                  <Text color="secondary" size="sm">
                    {item.variantTitle}
                  </Text>
                )}
                <Text color="secondary" size="sm">
                  x{item.quantity} @ {formatCurrency(item.price)}
                </Text>
              </View>
              <Text weight="semiBold">{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </Card>

        {/* Order Summary */}
        <Card>
          <Subtitle style={styles.sectionTitle}>💰 סיכום</Subtitle>
          <View style={styles.summaryRow}>
            <Text>סכום ביניים</Text>
            <Text>{formatCurrency(order.subtotal)}</Text>
          </View>
          {order.discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text color="success">
                הנחה {order.discountCode && `(${order.discountCode})`}
              </Text>
              <Text color="success">-{formatCurrency(order.discountAmount)}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text>משלוח</Text>
            <Text>{formatCurrency(order.shippingAmount)}</Text>
          </View>
          {order.taxAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text>מע"מ</Text>
              <Text>{formatCurrency(order.taxAmount)}</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text weight="bold" size="lg">
              סה"כ
            </Text>
            <Text weight="bold" size="lg">
              {formatCurrency(order.total)}
            </Text>
          </View>
        </Card>

        {/* Notes */}
        {(order.note || order.internalNote) && (
          <Card>
            <Subtitle style={styles.sectionTitle}>📝 הערות</Subtitle>
            {order.note && (
              <View style={styles.noteSection}>
                <Text size="sm" color="secondary">
                  הערת לקוח:
                </Text>
                <Text>{order.note}</Text>
              </View>
            )}
            {order.internalNote && (
              <View style={styles.noteSection}>
                <Text size="sm" color="secondary">
                  הערה פנימית:
                </Text>
                <Text>{order.internalNote}</Text>
              </View>
            )}
          </Card>
        )}

        {/* Timeline */}
        {timeline && timeline.length > 0 && (
          <Card>
            <Subtitle style={styles.sectionTitle}>📋 היסטוריה</Subtitle>
            {timeline.map((event, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text size="sm">{event.description}</Text>
                  <Text size="xs" color="muted">
                    {formatDateTime(event.createdAt)}
                  </Text>
                </View>
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
          >
            ✓ התחל טיפול
          </Button>
        )}
        {order.status === 'processing' && (
          <Button
            fullWidth
            onPress={() => handleStatusChange('shipped')}
            loading={updateStatus.isPending}
          >
            ✓ סמן כנשלחה
          </Button>
        )}
        {order.status === 'shipped' && (
          <Button
            fullWidth
            onPress={() => handleStatusChange('delivered')}
            loading={updateStatus.isPending}
          >
            ✓ סמן כנמסרה
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    gap: spacing[4],
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  statusCard: {
    padding: spacing[4],
  },
  statusHeader: {
    flexDirection: 'row-reverse',
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
    borderTopColor: colors.borderLight,
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  statusOption: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
  },
  statusOptionActive: {
    backgroundColor: colors.primaryLight,
  },
  sectionTitle: {
    marginBottom: spacing[3],
  },
  customerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  customerInfo: {
    flex: 1,
  },
  customerActions: {
    flexDirection: 'row-reverse',
    gap: spacing[2],
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigateButton: {
    marginTop: spacing[3],
    paddingVertical: spacing[2],
  },
  itemRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
  },
  itemImagePlaceholder: {
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    marginHorizontal: spacing[3],
  },
  summaryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: spacing[2],
    paddingTop: spacing[3],
  },
  noteSection: {
    marginBottom: spacing[3],
  },
  timelineItem: {
    flexDirection: 'row-reverse',
    marginBottom: spacing[3],
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
    marginLeft: spacing[3],
  },
  timelineContent: {
    flex: 1,
  },
  bottomAction: {
    padding: spacing[4],
    paddingBottom: spacing[6],
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});

