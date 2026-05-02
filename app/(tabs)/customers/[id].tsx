import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCustomer, useAddCustomerCredit } from '@/hooks';
import {
  Text,
  Button,
  Card,
  Badge,
  StatusBadge,
  SectionHeader,
  LoadingScreen,
  designTokens,
  fonts,
} from '@/components/ui';
import { formatCurrency, formatDateTime, formatPhone, formatAddress } from '@/lib/utils/format';
import { avatarColor } from '@/lib/utils/avatar';
import { showToast } from '@/lib/utils/toast';

// removed MONO_FONT - using fonts.bold for consistency

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, error } = useCustomer(id);
  const addCredit = useAddCustomerCredit();

  const [showAddCredit, setShowAddCredit] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');

  if (isLoading) {
    return <LoadingScreen message="טוען פרטי לקוח..." />;
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
            <Ionicons name="person-outline" size={48} color={designTokens.colors.semantic.danger.DEFAULT} />
          <Text style={styles.errorTitle}>שגיאה בטעינת הלקוח</Text>
          <Text style={styles.errorDescription}>לא הצלחנו למצוא את הלקוח המבוקש</Text>
          <Button onPress={() => router.back()} variant="outline" style={{ marginTop: designTokens.spacing[4] }}>
            חזור ללקוחות
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const { customer, orders, creditHistory } = data;
  const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'לקוח ללא שם';
  const customerAvatarColor = avatarColor(fullName);

  const handleCall = () => {
    if (customer.phone) {
      Linking.openURL(`tel:${customer.phone}`);
    }
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${customer.email}`);
  };

  const handleWhatsApp = () => {
    if (customer.phone) {
      const cleanPhone = customer.phone.replace(/\D/g, '');
      Linking.openURL(`https://wa.me/${cleanPhone}`);
    }
  };

  const handleAddCredit = async () => {
    const amount = parseFloat(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('נא להזין סכום חיובי', 'error');
      return;
    }
    if (!creditReason.trim()) {
      showToast('נא להזין סיבה', 'error');
      return;
    }

    try {
      await addCredit.mutateAsync({
        customerId: customer.id,
        data: { amount, reason: creditReason },
      });
      setShowAddCredit(false);
      setCreditAmount('');
      setCreditReason('');
      showToast('הקרדיט נוסף בהצלחה', 'success');
    } catch {
      showToast('לא הצלחנו להוסיף קרדיט', 'error');
    }
  };

  const handleOrderPress = (orderId: string) => {
    router.push(`/(tabs)/orders/${orderId}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <Card variant="outlined" padding={5} style={styles.headerCard}>
              <View style={[styles.avatarLarge, { backgroundColor: customerAvatarColor }]}>
            <Text style={styles.avatarText}>{fullName.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.customerName}>{fullName}</Text>
              <Text style={styles.customerEmail}>{customer.email}</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => {
                if (orders && orders.length > 0) {
                  router.push(`/(tabs)/orders?customerId=${customer.id}`);
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.statValue, orders && orders.length > 0 && { color: designTokens.colors.brand[500] }]}>{customer.totalOrders}</Text>
              <Text style={styles.statLabel}>הזמנות</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatCurrency(customer.totalSpent)}</Text>
              <Text style={styles.statLabel}>סה"כ</Text>
                </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: designTokens.colors.semantic.success.DEFAULT }]}>
                    {formatCurrency(customer.creditBalance)}
                  </Text>
              <Text style={styles.statLabel}>קרדיט</Text>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <Card variant="outlined" padding={2} style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
            <View style={styles.actionIconCircle}>
              <Ionicons name="call-outline" size={20} color={designTokens.colors.ink[950]} />
            </View>
            <Text style={styles.actionLabel}>התקשר</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleEmail}>
            <View style={styles.actionIconCircle}>
              <Ionicons name="mail-outline" size={20} color={designTokens.colors.ink[950]} />
            </View>
            <Text style={styles.actionLabel}>אימייל</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleWhatsApp}>
            <View style={styles.actionIconCircle}>
              <Ionicons name="logo-whatsapp" size={20} color={designTokens.colors.ink[950]} />
            </View>
            <Text style={styles.actionLabel}>וואטסאפ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowAddCredit(!showAddCredit)}>
            <View style={styles.actionIconCircle}>
              <Ionicons name="card-outline" size={20} color={designTokens.colors.ink[950]} />
            </View>
            <Text style={styles.actionLabel}>קרדיט</Text>
          </TouchableOpacity>
        </Card>

        {/* Add Credit Form */}
        {showAddCredit && (
          <Card variant="outlined">
            <SectionHeader title="הוספת קרדיט" />
            <View style={styles.creditForm}>
              <View style={styles.creditInputRow}>
                <TextInput
                  style={[styles.creditInput, { flex: 1 }]}
                  placeholder="סכום"
                  placeholderTextColor={designTokens.colors.ink[400]}
                  value={creditAmount}
                  onChangeText={setCreditAmount}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.creditInput, { flex: 2 }]}
                  placeholder="סיבה"
                  placeholderTextColor={designTokens.colors.ink[400]}
                  value={creditReason}
                  onChangeText={setCreditReason}
                />
              </View>
              <View style={styles.creditFormActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setShowAddCredit(false);
                    setCreditAmount('');
                    setCreditReason('');
                  }}
                >
                  <Text style={styles.cancelBtnText}>ביטול</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addCreditBtn}
                  onPress={handleAddCredit}
                  disabled={addCredit.isPending}
                >
                  <Text style={styles.addCreditBtnText}>
                    {addCredit.isPending ? 'מוסיף...' : 'הוסף'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        )}

        {/* Contact Info */}
        <View style={styles.section}>
          <SectionHeader title="פרטי קשר" />
          <Card variant="outlined" padding={0} style={styles.detailsCard}>
            {customer.phone && (
              <TouchableOpacity style={styles.detailRow} onPress={handleCall}>
                <Ionicons name="call-outline" size={18} color={designTokens.colors.brand[500]} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailValue}>{formatPhone(customer.phone)}</Text>
                  <Text style={styles.detailLabel}>טלפון</Text>
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.detailRow} onPress={handleEmail}>
              <Ionicons name="mail-outline" size={18} color={designTokens.colors.brand[500]} />
              <View style={styles.detailContent}>
                <Text style={styles.detailValue}>{customer.email}</Text>
                <Text style={styles.detailLabel}>אימייל</Text>
              </View>
            </TouchableOpacity>
            {customer.defaultAddress && (
              <View style={styles.detailRow}>
                <View style={{ width: 18 }} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailValue}>{formatAddress(customer.defaultAddress)}</Text>
                  <Text style={styles.detailLabel}>כתובת</Text>
                </View>
              </View>
            )}
            <View style={[styles.detailRow, styles.detailRowLast]}>
              <Badge variant={customer.acceptsMarketing ? 'success' : 'default'} size="sm">
                {customer.acceptsMarketing ? 'מאשר' : 'לא מאשר'}
              </Badge>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>הסכמה לדיוור</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Orders */}
        {orders && orders.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title={`הזמנות (${orders.length})`} />
            <View style={styles.ordersList}>
              {orders.map((order, index) => (
                <TouchableOpacity
                  key={order.id}
                  style={[styles.orderRow, index < orders.length - 1 && styles.orderRowBorder]}
                  onPress={() => handleOrderPress(order.id)}
                >
                  <Ionicons name="chevron-back" size={16} color={designTokens.colors.ink[400]} />
                  <View style={styles.orderMeta}>
                    <Text style={styles.orderAmount}>{formatCurrency(order.total)}</Text>
                    <StatusBadge status={order.status} size="sm" />
                  </View>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderNumber}>{order.orderNumber.startsWith('#') ? order.orderNumber : `#${order.orderNumber}`}</Text>
                    <Text style={styles.orderDate}>{formatDateTime(order.createdAt)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Credit History */}
        {creditHistory && creditHistory.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="היסטוריית קרדיט" />
            <View style={styles.creditList}>
              {creditHistory.slice(0, 5).map((item) => (
                <View key={item.id} style={styles.creditRow}>
                  <Text style={[
                    styles.creditAmount,
                    { color: item.type === 'debit' ? designTokens.colors.semantic.danger.DEFAULT : designTokens.colors.semantic.success.DEFAULT }
                  ]}>
                    {item.type === 'debit' ? '-' : '+'}{formatCurrency(item.amount)}
                  </Text>
                  <View style={styles.creditInfo}>
                    <Text style={styles.creditType}>
                      {item.type === 'credit' ? 'זיכוי' : 'חיוב'}
                    </Text>
                    {item.reason && (
                      <Text style={styles.creditReason}>{item.reason}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Notes */}
        {customer.notes && (
          <View style={styles.section}>
            <SectionHeader title="הערות" />
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{customer.notes}</Text>
            </View>
            </View>
        )}

        <View style={{ height: designTokens.spacing[10] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.surface.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: designTokens.spacing[4],
    gap: designTokens.spacing[4],
  },

  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: designTokens.spacing[6],
  },
  errorTitle: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: designTokens.colors.ink[950],
    marginTop: designTokens.spacing[3],
  },
  errorDescription: {
    fontSize: 14,
    color: designTokens.colors.ink[400],
    marginTop: designTokens.spacing[2],
    textAlign: 'center',
  },

  // Header Card (rendered via <Card variant="outlined" padding={5}>)
  headerCard: {
    alignItems: 'center',
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: designTokens.colors.surface.card,
  },
  customerName: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: designTokens.colors.ink[950],
    marginTop: designTokens.spacing[3],
  },
  customerEmail: {
    fontSize: 14,
    color: designTokens.colors.ink[400],
    marginTop: designTokens.spacing[1],
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: designTokens.spacing[5],
    paddingTop: designTokens.spacing[4],
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.ink[200],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: designTokens.colors.ink[950],
  },
  statLabel: {
    fontSize: 12,
    color: designTokens.colors.ink[400],
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: designTokens.colors.ink[200],
    marginHorizontal: designTokens.spacing[2],
  },

  // Actions (rendered via <Card variant="outlined" padding={2}>)
  actionsRow: {
    flexDirection: 'row',
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: designTokens.spacing[2],
    gap: designTokens.spacing[1],
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: designTokens.colors.ink[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 12,
    color: designTokens.colors.ink[500],
    fontFamily: fonts.medium,
  },

  // Credit Form (rendered via <Card variant="outlined">)
  creditForm: {
    gap: designTokens.spacing[3],
  },
  creditInputRow: {
    flexDirection: 'row',
    gap: designTokens.spacing[2],
  },
  creditInput: {
    backgroundColor: designTokens.colors.ink[50],
    borderRadius: designTokens.radii.md,
    padding: designTokens.spacing[3],
    fontFamily: fonts.regular,
    fontSize: 14,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: designTokens.colors.ink[200],
  },
  creditFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: designTokens.spacing[2],
  },
  cancelBtn: {
    paddingHorizontal: designTokens.spacing[4],
    paddingVertical: designTokens.spacing[2],
    borderRadius: designTokens.radii.md,
    borderWidth: 1,
    borderColor: designTokens.colors.ink[200],
  },
  cancelBtnText: {
    fontSize: 14,
    color: designTokens.colors.ink[500],
    fontFamily: fonts.medium,
  },
  addCreditBtn: {
    paddingHorizontal: designTokens.spacing[4],
    paddingVertical: designTokens.spacing[2],
    borderRadius: designTokens.radii.md,
    backgroundColor: designTokens.colors.brand[500],
  },
  addCreditBtnText: {
    fontSize: 14,
    color: designTokens.colors.surface.card,
    fontFamily: fonts.medium,
  },

  // Section
  section: {
    gap: designTokens.spacing[2],
  },

  // Details (rendered via <Card variant="outlined" padding={0}>)
  detailsCard: {
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: designTokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.ink[200],
    gap: designTokens.spacing[3],
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailContent: {
    flex: 1,
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 12,
    color: designTokens.colors.ink[400],
  },
  detailValue: {
    fontSize: 14,
    color: designTokens.colors.ink[950],
    fontFamily: fonts.medium,
    textAlign: 'right',
  },

  // Orders
  ordersList: {
    backgroundColor: designTokens.colors.surface.card,
    borderRadius: designTokens.radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: designTokens.colors.ink[200],
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: designTokens.spacing[3],
    gap: designTokens.spacing[3],
  },
  orderRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.ink[200],
  },
  orderInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: designTokens.colors.ink[950],
  },
  orderDate: {
    fontSize: 12,
    color: designTokens.colors.ink[400],
    marginTop: 2,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing[2],
  },
  orderAmount: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: designTokens.colors.ink[950],
  },

  // Credit
  creditList: {
    backgroundColor: designTokens.colors.surface.card,
    borderRadius: designTokens.radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: designTokens.colors.ink[200],
  },
  creditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: designTokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.ink[200],
  },
  creditInfo: {
    alignItems: 'flex-end',
  },
  creditType: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: designTokens.colors.ink[950],
  },
  creditReason: {
    fontSize: 12,
    color: designTokens.colors.ink[400],
    marginTop: 2,
  },
  creditAmount: {
    fontSize: 14,
    fontFamily: fonts.bold,
  },

  // Notes
  notesCard: {
    backgroundColor: designTokens.colors.ink[50],
    borderRadius: designTokens.radii.lg,
    padding: designTokens.spacing[3],
    borderWidth: 1,
    borderColor: designTokens.colors.ink[200],
  },
  notesText: {
    fontSize: 14,
    color: designTokens.colors.ink[950],
    textAlign: 'right',
    lineHeight: 22,
  },
});
