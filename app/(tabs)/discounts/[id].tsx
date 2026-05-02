import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useDiscount,
  useUpdateDiscount,
  useDeleteDiscount,
  useToggleDiscountStatus,
  useCategories,
  useProducts,
} from '@/hooks';
import {
  Text,
  LoadingScreen,
  Badge,
  Button,
  spacing,
  fonts,
  designTokens,
} from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { showToast } from '@/lib/utils/toast';
import type { DiscountType } from '@/lib/api/analytics';

const dt = designTokens;

const DISCOUNT_TYPES: { key: DiscountType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'percentage', label: 'אחוז הנחה', icon: 'trending-down-outline' },
  { key: 'fixed_amount', label: 'סכום קבוע', icon: 'cash-outline' },
  { key: 'free_shipping', label: 'משלוח חינם', icon: 'car-outline' },
];

type AppliesTo = 'all' | 'category' | 'product';

interface EditFormData {
  code: string;
  title: string;
  type: DiscountType;
  value: string;
  minimumAmount: string;
  usageLimit: string;
  usageLimitPerCustomer: string;
  isAutomatic: boolean;
  appliesTo: AppliesTo;
  categoryIds: string[];
  productIds: string[];
}

export default function DiscountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: discountData, isLoading, error } = useDiscount(id);
  const discount = discountData?.discount;

  const deleteDiscount = useDeleteDiscount();
  const toggleStatus = useToggleDiscountStatus();
  const updateDiscount = useUpdateDiscount();
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.categories;
  const { data: productsData } = useProducts({ limit: 50 });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<EditFormData>({
    code: '',
    title: '',
    type: 'percentage',
    value: '',
    minimumAmount: '',
    usageLimit: '',
    usageLimitPerCustomer: '',
    isAutomatic: false,
    appliesTo: 'all',
    categoryIds: [],
    productIds: [],
  });

  useEffect(() => {
    if (discount) {
      setFormData({
        code: discount.code || '',
        title: discount.title || '',
        type: discount.type,
        value: discount.value?.toString() || '',
        minimumAmount: discount.minimumAmount?.toString() || '',
        usageLimit: discount.usageLimit?.toString() || '',
        usageLimitPerCustomer: discount.usageLimitPerCustomer?.toString() || '',
        isAutomatic: discount.isAutomatic,
        appliesTo: (discount.appliesTo as AppliesTo) || 'all',
        categoryIds: discount.categoryIds || [],
        productIds: discount.productIds || [],
      });
    }
  }, [discount]);

  const updateField = (field: keyof EditFormData, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleCategoryId = (catId: string) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(catId)
        ? prev.categoryIds.filter(id => id !== catId)
        : [...prev.categoryIds, catId],
    }));
  };

  const toggleProductId = (prodId: string) => {
    setFormData(prev => ({
      ...prev,
      productIds: prev.productIds.includes(prodId)
        ? prev.productIds.filter(id => id !== prodId)
        : [...prev.productIds, prodId],
    }));
  };

  const handleSaveEdit = async () => {
    try {
      const data: Parameters<typeof updateDiscount.mutateAsync>[0]['data'] = {
        code: formData.isAutomatic ? undefined : formData.code.trim().toUpperCase() || undefined,
        title: formData.title.trim() || undefined,
        type: formData.type,
        value: formData.type === 'free_shipping' ? 0 : parseFloat(formData.value) || 0,
        minimumAmount: formData.minimumAmount ? parseFloat(formData.minimumAmount) : undefined,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
        usageLimitPerCustomer: formData.usageLimitPerCustomer
          ? parseInt(formData.usageLimitPerCustomer)
          : undefined,
        isAutomatic: formData.isAutomatic,
        appliesTo: formData.appliesTo,
        categoryIds: formData.appliesTo === 'category' ? formData.categoryIds : [],
        productIds: formData.appliesTo === 'product' ? formData.productIds : [],
      };

      await updateDiscount.mutateAsync({ discountId: id, data });
      setIsEditing(false);
      showToast('הקופון עודכן בהצלחה', 'success');
    } catch {
      showToast('לא הצלחנו לעדכן את הקופון', 'error');
    }
  };

  const handleToggleStatus = async () => {
    if (!discount) return;
    try {
      await toggleStatus.mutateAsync({
        discountId: discount.id,
        isActive: !discount.isActive,
      });
    } catch {
      showToast('לא הצלחנו לעדכן את הסטטוס', 'error');
    }
  };

  const handleDelete = () => {
    Alert.alert('מחיקת קופון', 'האם אתה בטוח שברצונך למחוק את הקופון?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDiscount.mutateAsync(id);
            router.back();
          } catch {
            showToast('לא הצלחנו למחוק את הקופון', 'error');
          }
        },
      },
    ]);
  };

  const handleShare = async () => {
    if (!discount?.code) return;
    try {
      await Share.share({
        message: `השתמש בקוד ${discount.code} וקבל ${getDiscountValueText()}!`,
      });
    } catch {
      // Cancelled
    }
  };

  const getDiscountValueText = () => {
    if (!discount) return '';
    switch (discount.type) {
      case 'percentage':
        return `${discount.value}% הנחה`;
      case 'fixed_amount':
        return `${formatCurrency(discount.value)} הנחה`;
      case 'free_shipping':
        return 'משלוח חינם';
      case 'buy_x_get_y':
        return 'קנה X קבל Y';
      default:
        return '';
    }
  };

  const getStatusInfo = () => {
    if (!discount) return { label: '', variant: 'default' as const, color: dt.colors.ink[400] };
    if (!discount.isActive) {
      return { label: 'לא פעיל', variant: 'default' as const, color: dt.colors.ink[400] };
    }
    if (discount.endsAt && new Date(discount.endsAt) < new Date()) {
      return { label: 'פג תוקף', variant: 'warning' as const, color: dt.colors.semantic.warning.DEFAULT };
    }
    return { label: 'פעיל', variant: 'success' as const, color: dt.colors.semantic.success.DEFAULT };
  };

  if (isLoading) {
    return <LoadingScreen message="טוען פרטי קופון..." />;
  }

  if (error || !discount) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={dt.colors.semantic.danger.DEFAULT} />
          <Text style={styles.errorText}>הקופון לא נמצא</Text>
          <Button variant="outline" onPress={() => router.back()} style={{ marginTop: spacing[4] }}>
            חזור
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = getStatusInfo();
  const isExpired = discount.endsAt && new Date(discount.endsAt) < new Date();
  const products = productsData?.products || [];

  // -------- Edit Mode --------
  if (isEditing) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.editHeader}>
            <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.editHeaderBtn}>
              <Text style={styles.editHeaderBtnText}>ביטול</Text>
            </TouchableOpacity>
            <Text style={styles.editHeaderTitle}>עריכת קופון</Text>
            <TouchableOpacity
              onPress={handleSaveEdit}
              style={[styles.editHeaderBtn, styles.editHeaderSaveBtn]}
              disabled={updateDiscount.isPending}
            >
              <Text style={styles.editHeaderSaveBtnText}>
                {updateDiscount.isPending ? 'שומר...' : 'שמור'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.editScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Discount Type */}
            <View style={styles.editSection}>
              <Text style={styles.editSectionTitle}>סוג הנחה</Text>
              <View style={styles.typeGrid}>
                {DISCOUNT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeCard,
                      formData.type === type.key && styles.typeCardActive,
                    ]}
                    onPress={() => updateField('type', type.key)}
                  >
                    <Ionicons
                      name={type.icon}
                      size={24}
                      color={formData.type === type.key ? dt.colors.brand[500] : dt.colors.ink[400]}
                    />
                    <Text
                      style={[
                        styles.typeLabel,
                        formData.type === type.key && styles.typeLabelActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Value */}
            {formData.type !== 'free_shipping' && (
              <View style={styles.editSection}>
                <Text style={styles.editSectionTitle}>
                  {formData.type === 'percentage' ? 'אחוז הנחה' : 'סכום הנחה'}
                </Text>
                <View style={styles.editCard}>
                  <View style={styles.valueInputContainer}>
                    <Text style={styles.valueSuffix}>
                      {formData.type === 'percentage' ? '%' : '₪'}
                    </Text>
                    <TextInput
                      style={styles.valueInput}
                      value={formData.value}
                      onChangeText={(v) => updateField('value', v)}
                      placeholder="0"
                      keyboardType="decimal-pad"
                      textAlign="center"
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Code */}
            <View style={styles.editSection}>
              <Text style={styles.editSectionTitle}>קוד קופון</Text>
              <View style={styles.editCard}>
                <TouchableOpacity
                  style={styles.toggleRow}
                  onPress={() => updateField('isAutomatic', !formData.isAutomatic)}
                >
                  <View style={[styles.toggle, formData.isAutomatic && styles.toggleActive]}>
                    <View
                      style={[styles.toggleThumb, formData.isAutomatic && styles.toggleThumbActive]}
                    />
                  </View>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleTitle}>הנחה אוטומטית</Text>
                    <Text style={styles.toggleDescription}>
                      {formData.isAutomatic
                        ? 'ההנחה תחול אוטומטית בקופה'
                        : 'הלקוח צריך להזין קוד קופון'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {!formData.isAutomatic && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>קוד קופון</Text>
                    <TextInput
                      style={[styles.input, { letterSpacing: 2, fontFamily: fonts.semiBold }]}
                      value={formData.code}
                      onChangeText={(v) => updateField('code', v.toUpperCase())}
                      placeholder="SAVE20"
                      autoCapitalize="characters"
                      textAlign="right"
                    />
                  </View>
                )}
              </View>
            </View>

            {/* Title & Minimum */}
            <View style={styles.editSection}>
              <Text style={styles.editSectionTitle}>פרטים נוספים</Text>
              <View style={styles.editCard}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>שם הקופון (אופציונלי)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.title}
                    onChangeText={(v) => updateField('title', v)}
                    placeholder="לדוגמה: הנחת חורף"
                    textAlign="right"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>מינימום הזמנה</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.minimumAmount}
                    onChangeText={(v) => updateField('minimumAmount', v)}
                    placeholder="0 (ללא מינימום)"
                    keyboardType="decimal-pad"
                    textAlign="right"
                  />
                </View>
              </View>
            </View>

            {/* Limits */}
            <View style={styles.editSection}>
              <Text style={styles.editSectionTitle}>הגבלות שימוש</Text>
              <View style={styles.editCard}>
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>לכל לקוח</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.usageLimitPerCustomer}
                      onChangeText={(v) => updateField('usageLimitPerCustomer', v)}
                      placeholder="ללא הגבלה"
                      keyboardType="number-pad"
                      textAlign="right"
                    />
                  </View>
                  <View style={{ width: spacing[3] }} />
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>סה"כ שימושים</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.usageLimit}
                      onChangeText={(v) => updateField('usageLimit', v)}
                      placeholder="ללא הגבלה"
                      keyboardType="number-pad"
                      textAlign="right"
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Applies To */}
            <View style={styles.editSection}>
              <Text style={styles.editSectionTitle}>חל על</Text>
              <View style={styles.editCard}>
                {(['all', 'category', 'product'] as AppliesTo[]).map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={styles.radioRow}
                    onPress={() => updateField('appliesTo', opt)}
                  >
                    <Ionicons
                      name={formData.appliesTo === opt ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={formData.appliesTo === opt ? dt.colors.brand[500] : dt.colors.ink[400]}
                    />
                    <Text style={styles.radioLabel}>
                      {opt === 'all' ? 'כל המוצרים' : opt === 'category' ? 'קטגוריות ספציפיות' : 'מוצרים ספציפיים'}
                    </Text>
                  </TouchableOpacity>
                ))}

                {formData.appliesTo === 'category' && categories && (
                  <View style={styles.restrictList}>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.restrictItem,
                          formData.categoryIds.includes(cat.id) && styles.restrictItemSelected,
                        ]}
                        onPress={() => toggleCategoryId(cat.id)}
                      >
                        <Text
                          style={[
                            styles.restrictItemText,
                            formData.categoryIds.includes(cat.id) && styles.restrictItemTextSelected,
                          ]}
                        >
                          {cat.name}
                        </Text>
                        {formData.categoryIds.includes(cat.id) && (
                          <Ionicons name="checkmark" size={16} color={dt.colors.brand[500]} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {formData.appliesTo === 'product' && products.length > 0 && (
                  <View style={styles.restrictList}>
                    {products.map((prod) => (
                      <TouchableOpacity
                        key={prod.id}
                        style={[
                          styles.restrictItem,
                          formData.productIds.includes(prod.id) && styles.restrictItemSelected,
                        ]}
                        onPress={() => toggleProductId(prod.id)}
                      >
                        <Text
                          style={[
                            styles.restrictItemText,
                            formData.productIds.includes(prod.id) && styles.restrictItemTextSelected,
                          ]}
                        >
                          {prod.name}
                        </Text>
                        {formData.productIds.includes(prod.id) && (
                          <Ionicons name="checkmark" size={16} color={dt.colors.brand[500]} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            <View style={{ height: spacing[10] }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // -------- View Mode --------
  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.viewScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadgeRow}>
            <Badge variant={statusInfo.variant} size="sm">
              {statusInfo.label}
            </Badge>
          </View>
          <Text style={styles.heroValue}>{getDiscountValueText()}</Text>
          {discount.code && (
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{discount.code}</Text>
            </View>
          )}
          {discount.title && <Text style={styles.heroTitle}>{discount.title}</Text>}
          {discount.isAutomatic && (
            <View style={styles.automaticBadge}>
              <Ionicons name="flash-outline" size={14} color={dt.colors.brand[500]} />
              <Text style={styles.automaticText}>הנחה אוטומטית</Text>
            </View>
          )}
        </View>

        {/* Toggle Status Card */}
        <View style={styles.toggleCard}>
          <TouchableOpacity
            style={[
              styles.toggleSwitch,
              discount.isActive ? styles.toggleSwitchActive : styles.toggleSwitchInactive,
            ]}
            onPress={handleToggleStatus}
            disabled={toggleStatus.isPending}
          >
            <View
              style={[
                styles.toggleSwitchThumb,
                discount.isActive ? styles.toggleSwitchThumbActive : styles.toggleSwitchThumbInactive,
              ]}
            />
          </TouchableOpacity>
          <View style={styles.toggleCardInfo}>
            <Text style={styles.toggleCardTitle}>סטטוס קופון</Text>
            <Text style={styles.toggleCardDescription}>
              {discount.isActive ? 'הקופון פעיל וניתן לשימוש' : 'הקופון מושבת'}
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{discount.usageCount}</Text>
            <Text style={styles.statLabel}>שימושים</Text>
          </View>
          {discount.usageLimit ? (
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{discount.usageLimit - discount.usageCount}</Text>
              <Text style={styles.statLabel}>נותרו</Text>
            </View>
          ) : (
            <View style={styles.statCard}>
              <Text style={styles.statValue}>∞</Text>
              <Text style={styles.statLabel}>ללא הגבלה</Text>
            </View>
          )}
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>פרטים</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailValue}>
              {discount.type === 'percentage'
                ? 'אחוז הנחה'
                : discount.type === 'fixed_amount'
                  ? 'סכום קבוע'
                  : discount.type === 'free_shipping'
                    ? 'משלוח חינם'
                    : 'קנה X קבל Y'}
            </Text>
            <Text style={styles.detailLabel}>סוג הנחה</Text>
          </View>

          {discount.minimumAmount != null && discount.minimumAmount > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailValue}>{formatCurrency(discount.minimumAmount)}</Text>
              <Text style={styles.detailLabel}>מינימום הזמנה</Text>
            </View>
          )}

          {discount.usageLimit != null && (
            <View style={styles.detailRow}>
              <Text style={styles.detailValue}>{discount.usageLimit}</Text>
              <Text style={styles.detailLabel}>הגבלת שימושים</Text>
            </View>
          )}

          {discount.usageLimitPerCustomer != null && (
            <View style={styles.detailRow}>
              <Text style={styles.detailValue}>{discount.usageLimitPerCustomer}</Text>
              <Text style={styles.detailLabel}>לכל לקוח</Text>
            </View>
          )}

          {discount.startsAt && (
            <View style={styles.detailRow}>
              <Text style={styles.detailValue}>{formatDate(discount.startsAt)}</Text>
              <Text style={styles.detailLabel}>תאריך התחלה</Text>
            </View>
          )}

          {discount.endsAt && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailValue, isExpired && { color: dt.colors.semantic.danger.DEFAULT }]}>
                {formatDate(discount.endsAt)}
              </Text>
              <Text style={styles.detailLabel}>תאריך סיום</Text>
            </View>
          )}

          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailValue}>{formatDate(discount.createdAt)}</Text>
            <Text style={styles.detailLabel}>תאריך יצירה</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionRow} onPress={() => setIsEditing(true)}>
            <Ionicons name="chevron-back" size={16} color={dt.colors.ink[400]} />
            <View style={styles.actionRowContent}>
              <Text style={styles.actionRowText}>עריכת קופון</Text>
            </View>
            <View style={[styles.actionIconBox, { backgroundColor: dt.colors.brand[50] }]}>
              <Ionicons name="create-outline" size={18} color={dt.colors.brand[500]} />
            </View>
          </TouchableOpacity>
          <View style={styles.actionDivider} />

          {discount.code && (
            <>
              <TouchableOpacity style={styles.actionRow} onPress={handleShare}>
                <Ionicons name="chevron-back" size={16} color={dt.colors.ink[400]} />
                <View style={styles.actionRowContent}>
                  <Text style={styles.actionRowText}>שתף קופון</Text>
                </View>
                <View style={[styles.actionIconBox, { backgroundColor: dt.colors.brand[50] }]}>
                  <Ionicons name="share-outline" size={18} color={dt.colors.brand[500]} />
                </View>
              </TouchableOpacity>
              <View style={styles.actionDivider} />
            </>
          )}

          <TouchableOpacity style={styles.actionRow} onPress={handleDelete}>
            <Ionicons name="chevron-back" size={16} color={dt.colors.ink[400]} />
            <View style={styles.actionRowContent}>
              <Text style={[styles.actionRowText, { color: dt.colors.semantic.danger.DEFAULT }]}>
                {deleteDiscount.isPending ? 'מוחק...' : 'מחק קופון'}
              </Text>
            </View>
            <View style={[styles.actionIconBox, { backgroundColor: dt.colors.semantic.danger.light }]}>
              <Ionicons name="trash-outline" size={18} color={dt.colors.semantic.danger.DEFAULT} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: spacing[10] }} />
      </ScrollView>
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
  viewScrollContent: {
    padding: spacing[4],
    gap: spacing[4],
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  errorText: {
    fontSize: 16,
    color: dt.colors.ink[400],
    fontFamily: fonts.medium,
  },

  // Hero Card
  heroCard: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    padding: spacing[6],
    alignItems: 'center',
    gap: spacing[2],
  },
  heroBadgeRow: {
    marginBottom: spacing[1],
  },
  heroValue: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: dt.colors.brand[500],
  },
  codeBox: {
    backgroundColor: dt.colors.ink[100],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2.5],
    borderRadius: dt.radii.md,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: dt.colors.ink[950],
    letterSpacing: 2,
  },
  heroTitle: {
    fontSize: 15,
    color: dt.colors.ink[600],
    fontFamily: fonts.regular,
  },
  automaticBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: dt.colors.brand[50],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: dt.radii.full,
    marginTop: spacing[1],
  },
  automaticText: {
    fontSize: 13,
    color: dt.colors.brand[500],
    fontFamily: fonts.medium,
  },

  // Toggle Card (view mode)
  toggleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    padding: spacing[4],
  },
  toggleCardInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  toggleCardTitle: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[950],
  },
  toggleCardDescription: {
    fontSize: 13,
    color: dt.colors.ink[400],
    marginTop: 2,
  },
  toggleSwitch: {
    width: 52,
    height: 32,
    borderRadius: 16,
    padding: 2,
  },
  toggleSwitchActive: {
    backgroundColor: dt.colors.brand[50],
  },
  toggleSwitchInactive: {
    backgroundColor: dt.colors.ink[200],
  },
  toggleSwitchThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: dt.colors.surface.card,
  },
  toggleSwitchThumbActive: {
    alignSelf: 'flex-end',
    backgroundColor: dt.colors.brand[500],
  },
  toggleSwitchThumbInactive: {
    alignSelf: 'flex-start',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  statCard: {
    flex: 1,
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    padding: spacing[4],
    alignItems: 'center',
    gap: spacing[1],
  },
  statValue: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: dt.colors.ink[950],
  },
  statLabel: {
    fontSize: 13,
    color: dt.colors.ink[400],
    fontFamily: fonts.regular,
  },

  // Details Card
  detailsCard: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    padding: spacing[4],
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[950],
    textAlign: 'right',
    marginBottom: spacing[3],
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: dt.colors.ink[200],
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 14,
    color: dt.colors.ink[400],
    fontFamily: fonts.regular,
  },
  detailValue: {
    fontSize: 14,
    color: dt.colors.ink[950],
    fontFamily: fonts.medium,
  },

  // Actions Card
  actionsCard: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    gap: spacing[3],
  },
  actionRowContent: {
    flex: 1,
  },
  actionRowText: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: dt.colors.brand[500],
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDivider: {
    height: 1,
    backgroundColor: dt.colors.ink[200],
    marginHorizontal: spacing[4],
  },

  // -------- Edit Mode Styles --------
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: dt.colors.surface.card,
    borderBottomWidth: 1,
    borderBottomColor: dt.colors.ink[200],
  },
  editHeaderTitle: {
    fontSize: 17,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[950],
  },
  editHeaderBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
  },
  editHeaderBtnText: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: dt.colors.ink[400],
  },
  editHeaderSaveBtn: {
    backgroundColor: dt.colors.brand[500],
    borderRadius: dt.radii.md,
  },
  editHeaderSaveBtnText: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: dt.colors.surface.onBrand,
  },
  editScrollContent: {
    paddingTop: spacing[4],
  },
  editSection: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  editSectionTitle: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[950],
    textAlign: 'right',
    marginBottom: spacing[2],
  },
  editCard: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    padding: spacing[4],
  },

  // Type Grid
  typeGrid: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  typeCard: {
    flex: 1,
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.md,
    padding: spacing[3],
    alignItems: 'center',
    gap: spacing[2],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardActive: {
    borderColor: dt.colors.brand[500],
    backgroundColor: dt.colors.brand[50],
  },
  typeLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: dt.colors.ink[400],
    textAlign: 'center',
  },
  typeLabelActive: {
    color: dt.colors.brand[500],
  },

  // Value Input
  valueInputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[2],
  },
  valueInput: {
    fontSize: 48,
    fontFamily: fonts.bold,
    color: dt.colors.brand[500],
    minWidth: 120,
  },
  valueSuffix: {
    fontSize: 24,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[400],
  },

  // Form elements
  inputGroup: {
    marginBottom: spacing[3],
  },
  inputLabel: {
    fontSize: 13,
    color: dt.colors.ink[600],
    marginBottom: spacing[1],
    textAlign: 'right',
    fontFamily: fonts.medium,
  },
  input: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.md,
    padding: spacing[3],
    fontFamily: fonts.regular,
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: dt.colors.ink[200],
    color: dt.colors.ink[950],
  },
  row: {
    flexDirection: 'row',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  toggleInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  toggleTitle: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[950],
  },
  toggleDescription: {
    fontSize: 13,
    color: dt.colors.ink[400],
    marginTop: 2,
  },
  toggle: {
    width: 52,
    height: 32,
    borderRadius: 16,
    padding: 2,
    backgroundColor: dt.colors.ink[200],
  },
  toggleActive: {
    backgroundColor: dt.colors.brand[50],
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: dt.colors.surface.card,
    alignSelf: 'flex-end',
  },
  toggleThumbActive: {
    alignSelf: 'flex-start',
    backgroundColor: dt.colors.brand[500],
  },

  // Radio
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
  },
  radioLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: dt.colors.ink[950],
  },

  // Restrict list
  restrictList: {
    marginTop: spacing[2],
    backgroundColor: dt.colors.ink[50],
    borderRadius: dt.radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    maxHeight: 200,
  },
  restrictItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: dt.colors.ink[200],
  },
  restrictItemSelected: {
    backgroundColor: dt.colors.brand[50],
  },
  restrictItemText: {
    fontSize: 14,
    color: dt.colors.ink[950],
    fontFamily: fonts.regular,
  },
  restrictItemTextSelected: {
    color: dt.colors.brand[500],
    fontFamily: fonts.medium,
  },
});
