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
  Subtitle,
  Card,
  Button,
  Badge,
  OrderStatusBadge,
  LoadingScreen,
  colors,
  spacing,
  borderRadius,
  fonts,
  shadows,
} from '@/components/ui';
import { formatCurrency, formatDateTime, formatPhone, formatAddress } from '@/lib/utils/format';

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
          <Text color="error" center>
            שגיאה בטעינת הלקוח
          </Text>
          <Button onPress={() => router.back()} variant="outline" style={{ marginTop: spacing[4] }}>
            חזור
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const { customer, orders, creditHistory } = data;
  const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'לקוח ללא שם';

  const handleCall = () => {
    if (customer.phone) {
      Linking.openURL(`tel:${customer.phone}`);
    }
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${customer.email}`);
  };

  const handleAddCredit = async () => {
    const amount = parseFloat(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('שגיאה', 'נא להזין סכום חיובי');
      return;
    }
    if (!creditReason.trim()) {
      Alert.alert('שגיאה', 'נא להזין סיבה');
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
      Alert.alert('הצלחה', 'הקרדיט נוסף בהצלחה');
    } catch {
      Alert.alert('שגיאה', 'לא הצלחנו להוסיף קרדיט');
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
        {/* Customer Header */}
        <Card style={styles.headerCard}>
          <View style={styles.avatar}>
            <Text style={{ fontSize: 32, color: colors.white }}>
              {fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text size="2xl" weight="bold" center style={{ marginTop: spacing[3] }}>
            {fullName}
          </Text>
          <Text color="secondary" center>
            {customer.email}
          </Text>
          
          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
              <Text size="sm" color="secondary">
                אימייל
              </Text>
            </TouchableOpacity>
            {customer.phone && (
              <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
                <Ionicons name="call-outline" size={20} color={colors.textSecondary} />
                <Text size="sm" color="secondary">
                  טלפון
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text size="2xl" weight="bold" center>
              {customer.totalOrders}
            </Text>
            <Text color="secondary" size="sm" center>
              הזמנות
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <Text size="2xl" weight="bold" center>
              {formatCurrency(customer.totalSpent)}
            </Text>
            <Text color="secondary" size="sm" center>
              סה"כ קניות
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <Text size="2xl" weight="bold" center style={{ color: colors.success }}>
              {formatCurrency(customer.creditBalance)}
            </Text>
            <Text color="secondary" size="sm" center>
              קרדיט
            </Text>
          </Card>
        </View>

        {/* Credit Section */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="card-outline" size={20} color="#6D7175" />
              <Text weight="semiBold" style={styles.sectionTitleText}>קרדיט</Text>
            </View>
            <Button
              size="sm"
              variant="outline"
              onPress={() => setShowAddCredit(!showAddCredit)}
            >
              {showAddCredit ? 'ביטול' : 'הוסף קרדיט'}
            </Button>
          </View>

          {showAddCredit && (
            <View style={styles.addCreditForm}>
              <TextInput
                style={styles.input}
                placeholder="סכום"
                placeholderTextColor={colors.textMuted}
                value={creditAmount}
                onChangeText={setCreditAmount}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, { flex: 2 }]}
                placeholder="סיבה"
                placeholderTextColor={colors.textMuted}
                value={creditReason}
                onChangeText={setCreditReason}
              />
              <Button
                size="sm"
                onPress={handleAddCredit}
                loading={addCredit.isPending}
              >
                הוסף
              </Button>
            </View>
          )}

          {creditHistory && creditHistory.length > 0 && (
            <View style={styles.creditHistory}>
              {creditHistory.slice(0, 5).map((item) => (
                <View key={item.id} style={styles.creditRow}>
                  <View>
                    <Text size="sm">
                      {item.type === 'credit' ? 'זיכוי' : item.type === 'debit' ? 'חיוב' : 'החזר'}
                    </Text>
                    {item.reason && (
                      <Text color="muted" size="xs">
                        {item.reason}
                      </Text>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-start' }}>
                    <Text
                      weight="semiBold"
                      style={{
                        color: item.type === 'debit' ? colors.error : colors.success,
                      }}
                    >
                      {item.type === 'debit' ? '-' : '+'}
                      {formatCurrency(item.amount)}
                    </Text>
                    <Text color="muted" size="xs">
                      {formatDateTime(item.createdAt)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Contact Info */}
        <Card style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="document-text-outline" size={20} color="#6D7175" />
            <Text weight="semiBold" style={styles.sectionTitleText}>פרטים</Text>
          </View>
          {customer.phone && (
            <View style={styles.infoRow}>
              <Text style={{ color: '#202223' }}>{formatPhone(customer.phone)}</Text>
              <Text style={{ color: '#6D7175', textAlign: 'right' }}>טלפון</Text>
            </View>
          )}
          {customer.defaultAddress && (
            <View style={styles.infoRow}>
              <Text style={{ flex: 1, textAlign: 'left', color: '#202223' }}>
                {formatAddress(customer.defaultAddress)}
              </Text>
              <Text style={{ color: '#6D7175', textAlign: 'right' }}>כתובת</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={{ color: '#202223' }}>{formatDateTime(customer.createdAt)}</Text>
            <Text style={{ color: '#6D7175', textAlign: 'right' }}>לקוח מאז</Text>
          </View>
          <View style={styles.infoRow}>
            <Badge variant={customer.acceptsMarketing ? 'success' : 'default'} size="sm">
              {customer.acceptsMarketing ? 'מאשר' : 'לא מאשר'}
            </Badge>
            <Text style={{ color: '#6D7175', textAlign: 'right' }}>דיוור</Text>
          </View>
        </Card>

        {/* Orders History */}
        {orders && orders.length > 0 && (
          <Card style={styles.card}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="cube-outline" size={20} color="#6D7175" />
              <Text weight="semiBold" style={styles.sectionTitleText}>הזמנות</Text>
            </View>
            {orders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderRow}
                onPress={() => handleOrderPress(order.id)}
              >
                <View style={{ alignItems: 'flex-start' }}>
                  <Text weight="semiBold" style={{ color: '#00785C' }}>{formatCurrency(order.total)}</Text>
                  <OrderStatusBadge status={order.status} size="sm" />
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text weight="medium" style={{ color: '#202223', textAlign: 'right' }}>#{order.orderNumber}</Text>
                  <Text size="xs" style={{ color: '#9CA3AF', textAlign: 'right' }}>
                    {formatDateTime(order.createdAt)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {/* Notes */}
        {customer.notes && (
          <Card style={styles.card}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="create-outline" size={20} color="#6D7175" />
              <Text weight="semiBold" style={styles.sectionTitleText}>הערות</Text>
            </View>
            <Text style={{ textAlign: 'right', color: '#6D7175' }}>{customer.notes}</Text>
          </Card>
        )}

        {/* Spacer */}
        <View style={{ height: spacing[10] }} />
      </ScrollView>
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
  headerCard: {
    alignItems: 'center',
    padding: spacing[6],
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#E1E3E5',
    ...shadows.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00785C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row-reverse',
    gap: spacing[6],
    marginTop: spacing[4],
  },
  actionButton: {
    alignItems: 'center',
    gap: spacing[1],
  },
  statsRow: {
    flexDirection: 'row-reverse',
    gap: spacing[3],
  },
  statCard: {
    flex: 1,
    padding: spacing[3],
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#E1E3E5',
    ...shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    marginBottom: spacing[3],
  },
  addCreditForm: {
    flexDirection: 'row-reverse',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  input: {
    flex: 1,
    backgroundColor: '#F6F6F7',
    borderRadius: borderRadius.md,
    padding: spacing[3],
    fontFamily: fonts.regular,
    fontSize: 14,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: '#E1E3E5',
  },
  creditHistory: {
    borderTopWidth: 1,
    borderTopColor: '#E1E3E5',
    paddingTop: spacing[3],
  },
  creditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: '#E1E3E5',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: '#E1E3E5',
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: '#E1E3E5',
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
});

