import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReturnRequest, useProcessReturn } from '@/hooks';
import {
  Text,
  Button,
  Card,
  SectionHeader,
  LoadingScreen,
  designTokens,
  fonts,
} from '@/components/ui';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';
import { showToast } from '@/lib/utils/toast';
import type { ReturnResolution, ReturnRequestStatus } from '@/lib/api/returns';

const dt = designTokens;

const STATUS_LABEL: Record<ReturnRequestStatus, string> = {
  pending: 'ממתינה לאישור',
  under_review: 'בבדיקה',
  approved: 'אושרה',
  awaiting_shipment: 'ממתינה למשלוח',
  item_received: 'הפריט התקבל',
  completed: 'הסתיימה',
  rejected: 'נדחתה',
  cancelled: 'בוטלה',
};

const RESOLUTION_OPTIONS: { key: ReturnResolution; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'refund', label: 'החזר כספי', icon: 'cash-outline' },
  { key: 'store_credit', label: 'זיכוי לחנות', icon: 'gift-outline' },
  { key: 'exchange', label: 'החלפה', icon: 'swap-horizontal-outline' },
];

export default function ReturnRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useReturnRequest(id!);
  const process = useProcessReturn();

  const [resolution, setResolution] = useState<ReturnResolution>('refund');
  const [amountInput, setAmountInput] = useState('');
  const [notes, setNotes] = useState('');

  if (isLoading || !data) {
    return <LoadingScreen message="טוען בקשה..." />;
  }

  const { request, order, customer } = data;
  const totalValue = request.totalValue || 0;
  const editable = request.status === 'pending' || request.status === 'under_review';

  const handleApprove = async () => {
    const amount = amountInput ? parseFloat(amountInput) : totalValue;
    if (resolution !== 'exchange' && (isNaN(amount) || amount <= 0)) {
      showToast('סכום לא תקין', 'error');
      return;
    }
    try {
      const r = await process.mutateAsync({
        id: id!,
        action: 'approve',
        resolution,
        amount: resolution === 'exchange' ? undefined : amount,
        customerNotes: notes.trim() || undefined,
      });
      if (r.success) {
        showToast('הבקשה אושרה', 'success');
        router.back();
      } else {
        showToast(r.error || 'אירעה שגיאה', 'error');
      }
    } catch (e: any) {
      showToast(e?.message || 'אירעה שגיאה', 'error');
    }
  };

  const handleReject = () => {
    Alert.alert('דחיית בקשה', 'האם לדחות את הבקשה?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'דחה',
        style: 'destructive',
        onPress: async () => {
          try {
            const r = await process.mutateAsync({
              id: id!,
              action: 'reject',
              customerNotes: notes.trim() || undefined,
            });
            if (r.success) {
              showToast('הבקשה נדחתה', 'success');
              router.back();
            } else {
              showToast(r.error || 'אירעה שגיאה', 'error');
            }
          } catch (e: any) {
            showToast(e?.message || 'אירעה שגיאה', 'error');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-forward" size={22} color={dt.colors.ink[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>בקשה #{request.requestNumber}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status hero */}
        <Card variant="outlined" style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{STATUS_LABEL[request.status]}</Text>
          </View>
          <Text style={styles.heroAmount}>{formatCurrency(totalValue)}</Text>
          <Text style={styles.heroSub}>
            {request.type === 'exchange' ? 'החלפה' : 'החזרה'} · {request.items?.length ?? 0} פריטים
          </Text>
          {request.finalResolution && (
            <Text style={styles.heroResolution}>
              פתרון: {request.finalResolution === 'refund' ? 'החזר כספי' : request.finalResolution === 'store_credit' ? 'זיכוי' : 'החלפה'}
            </Text>
          )}
        </Card>

        {/* Customer + order */}
        {(order || customer) && (
          <View style={styles.section}>
            <SectionHeader title="פרטים" />
            <Card variant="outlined" padding={0}>
              {order && (
                <TouchableOpacity
                  style={styles.detailRow}
                  onPress={() => router.push(`/(tabs)/orders/${order.id}`)}
                >
                  <Ionicons name="chevron-back" size={16} color={dt.colors.ink[400]} />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailValue}>#{order.orderNumber}</Text>
                    <Text style={styles.detailLabel}>הזמנה</Text>
                  </View>
                </TouchableOpacity>
              )}
              {customer && (
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailValue}>
                      {[customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.email}
                    </Text>
                    <Text style={styles.detailLabel}>לקוח</Text>
                  </View>
                </View>
              )}
              {customer?.creditBalance ? (
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailValue}>{formatCurrency(customer.creditBalance)}</Text>
                    <Text style={styles.detailLabel}>יתרת זיכוי</Text>
                  </View>
                </View>
              ) : null}
              <View style={[styles.detailRow, styles.detailRowBorder]}>
                <View style={styles.detailContent}>
                  <Text style={styles.detailValue}>{formatDateTime(request.createdAt)}</Text>
                  <Text style={styles.detailLabel}>תאריך</Text>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* Items */}
        {request.items && request.items.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="פריטים" />
            <Card variant="outlined" padding={0}>
              {request.items.map((item, idx) => (
                <View
                  key={idx}
                  style={[styles.itemRow, idx < (request.items?.length ?? 0) - 1 && styles.itemRowBorder]}
                >
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                  ) : (
                    <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                      <Ionicons name="cube-outline" size={20} color={dt.colors.ink[400]} />
                    </View>
                  )}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>{item.name ?? 'פריט'}</Text>
                    {item.variantTitle ? <Text style={styles.itemVariant}>{item.variantTitle}</Text> : null}
                    <Text style={styles.itemMeta}>כמות: {item.quantity}</Text>
                  </View>
                  {item.total ? <Text style={styles.itemTotal}>{formatCurrency(item.total)}</Text> : null}
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Reason */}
        {(request.reason || request.reasonDetails) && (
          <View style={styles.section}>
            <SectionHeader title="סיבה" />
            <Card variant="outlined" style={styles.reasonCard}>
              {request.reason ? <Text style={styles.reasonTitle}>{request.reason}</Text> : null}
              {request.reasonDetails ? (
                <Text style={styles.reasonDetails}>{request.reasonDetails}</Text>
              ) : null}
            </Card>
          </View>
        )}

        {/* Resolution selector + actions */}
        {editable && (
          <View style={styles.section}>
            <SectionHeader title="החלטה" />
            <Card variant="outlined" style={styles.resolutionCard}>
              <View style={styles.resolutionGrid}>
                {RESOLUTION_OPTIONS.map((opt) => {
                  const active = resolution === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.resolutionChip, active && styles.resolutionChipActive]}
                      onPress={() => setResolution(opt.key)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={20}
                        color={active ? dt.colors.surface.onBrand : dt.colors.ink[600]}
                      />
                      <Text style={[styles.resolutionChipText, active && styles.resolutionChipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {resolution !== 'exchange' && (
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>סכום (אופציונלי, ברירת מחדל: {formatCurrency(totalValue)})</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={amountInput}
                    onChangeText={setAmountInput}
                    placeholder={String(totalValue)}
                    keyboardType="decimal-pad"
                    textAlign="right"
                  />
                </View>
              )}

              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>הערה ללקוח (תופיע באישור)</Text>
                <TextInput
                  style={[styles.amountInput, styles.notesInput]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="לדוגמה: ההחזר יבוצע ב-3 ימי עסקים"
                  multiline
                  textAlign="right"
                />
              </View>
            </Card>

            <View style={styles.actionsRow}>
              <Button
                variant="outline"
                onPress={handleReject}
                loading={process.isPending}
                style={styles.actionBtn}
              >
                דחה בקשה
              </Button>
              <Button
                variant="primary"
                onPress={handleApprove}
                loading={process.isPending}
                style={styles.actionBtn}
              >
                אשר {resolution === 'refund' ? 'החזר' : resolution === 'store_credit' ? 'זיכוי' : 'החלפה'}
              </Button>
            </View>
          </View>
        )}

        {/* Customer notes (if processed) */}
        {!editable && request.customerNotes ? (
          <View style={styles.section}>
            <SectionHeader title="הערה ללקוח" />
            <Card variant="outlined" style={styles.reasonCard}>
              <Text style={styles.reasonDetails}>{request.customerNotes}</Text>
            </Card>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dt.colors.surface.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: dt.spacing[4],
    paddingVertical: dt.spacing[3],
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[950],
  },
  scroll: {
    padding: dt.spacing[4],
    gap: dt.spacing[4],
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: dt.spacing[5],
  },
  heroBadge: {
    paddingHorizontal: dt.spacing[3],
    paddingVertical: dt.spacing[1],
    borderRadius: dt.radii.full,
    backgroundColor: dt.colors.brand[50],
    marginBottom: dt.spacing[3],
  },
  heroBadgeText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: dt.colors.brand[700],
  },
  heroAmount: {
    fontSize: 32,
    fontFamily: fonts.bold,
    color: dt.colors.ink[950],
  },
  heroSub: {
    fontSize: 13,
    color: dt.colors.ink[500],
    marginTop: dt.spacing[1],
  },
  heroResolution: {
    fontSize: 13,
    color: dt.colors.semantic.success.dark,
    fontFamily: fonts.medium,
    marginTop: dt.spacing[2],
  },
  section: {
    gap: dt.spacing[2],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: dt.spacing[3],
    gap: dt.spacing[3],
  },
  detailRowBorder: {
    borderTopWidth: 1,
    borderTopColor: dt.colors.ink[100],
  },
  detailContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  detailValue: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: dt.colors.ink[950],
  },
  detailLabel: {
    fontSize: 12,
    color: dt.colors.ink[400],
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: dt.spacing[3],
    gap: dt.spacing[3],
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: dt.colors.ink[100],
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: dt.radii.md,
    backgroundColor: dt.colors.ink[100],
  },
  itemImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
  itemName: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: dt.colors.ink[950],
    textAlign: 'right',
  },
  itemVariant: {
    fontSize: 12,
    color: dt.colors.ink[500],
  },
  itemMeta: {
    fontSize: 12,
    color: dt.colors.ink[400],
  },
  itemTotal: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[950],
  },
  reasonCard: {
    gap: dt.spacing[2],
  },
  reasonTitle: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: dt.colors.ink[950],
    textAlign: 'right',
  },
  reasonDetails: {
    fontSize: 13,
    color: dt.colors.ink[600],
    lineHeight: 19,
    textAlign: 'right',
  },
  resolutionCard: {
    gap: dt.spacing[3],
  },
  resolutionGrid: {
    flexDirection: 'row',
    gap: dt.spacing[2],
  },
  resolutionChip: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: dt.spacing[3],
    borderRadius: dt.radii.md,
    backgroundColor: dt.colors.ink[50],
    gap: 6,
  },
  resolutionChipActive: {
    backgroundColor: dt.colors.brand[500],
  },
  resolutionChipText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: dt.colors.ink[700],
  },
  resolutionChipTextActive: {
    color: dt.colors.surface.onBrand,
  },
  amountRow: {
    gap: dt.spacing[1],
  },
  amountLabel: {
    fontSize: 12,
    color: dt.colors.ink[500],
    textAlign: 'right',
  },
  amountInput: {
    backgroundColor: dt.colors.ink[50],
    borderRadius: dt.radii.md,
    padding: dt.spacing[3],
    fontSize: 14,
    color: dt.colors.ink[950],
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    fontFamily: fonts.regular,
  },
  notesInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: dt.spacing[3],
    marginTop: dt.spacing[3],
  },
  actionBtn: {
    flex: 1,
  },
});
