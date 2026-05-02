import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCreateDiscount, useCategories, useProducts } from '@/hooks';
import {
  Text,
  Button,
  ScreenHeader,
  designTokens,
  fonts,
} from '@/components/ui';
import type { DiscountType, CreateDiscountData } from '@/lib/api/analytics';

const dt = designTokens;

const DISCOUNT_TYPES: { key: DiscountType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'percentage', label: '\u05D0\u05D7\u05D5\u05D6 \u05D4\u05E0\u05D7\u05D4', icon: 'trending-down-outline' },
  { key: 'fixed_amount', label: '\u05E1\u05DB\u05D5\u05DD \u05E7\u05D1\u05D5\u05E2', icon: 'cash-outline' },
  { key: 'free_shipping', label: '\u05DE\u05E9\u05DC\u05D5\u05D7 \u05D7\u05D9\u05E0\u05DD', icon: 'car-outline' },
];

type AppliesTo = 'all' | 'category' | 'product';

interface FormData {
  code: string;
  title: string;
  type: DiscountType;
  value: string;
  minimumAmount: string;
  usageLimit: string;
  usageLimitPerCustomer: string;
  isAutomatic: boolean;
  endsAt: string;
  appliesTo: AppliesTo;
  categoryIds: string[];
  productIds: string[];
}

export default function CreateDiscountScreen() {
  const router = useRouter();
  const createDiscount = useCreateDiscount();
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.categories;
  const { data: productsData } = useProducts({ limit: 50 });

  const [formData, setFormData] = useState<FormData>({
    code: '',
    title: '',
    type: 'percentage',
    value: '',
    minimumAmount: '',
    usageLimit: '',
    usageLimitPerCustomer: '',
    isAutomatic: false,
    endsAt: '',
    appliesTo: 'all',
    categoryIds: [],
    productIds: [],
  });

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

  const updateField = (field: keyof FormData, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    updateField('code', code);
  };

  const validateForm = (): boolean => {
    if (!formData.isAutomatic && !formData.code.trim()) {
      Alert.alert('\u05E9\u05D2\u05D9\u05D0\u05D4', '\u05E0\u05D0 \u05DC\u05D4\u05D6\u05D9\u05DF \u05E7\u05D5\u05D3 \u05E7\u05D5\u05E4\u05D5\u05DF');
      return false;
    }
    if (formData.type !== 'free_shipping' && (!formData.value || parseFloat(formData.value) <= 0)) {
      Alert.alert('\u05E9\u05D2\u05D9\u05D0\u05D4', '\u05E0\u05D0 \u05DC\u05D4\u05D6\u05D9\u05DF \u05E2\u05E8\u05DA \u05D4\u05E0\u05D7\u05D4 \u05EA\u05E7\u05D9\u05DF');
      return false;
    }
    if (formData.type === 'percentage' && parseFloat(formData.value) > 100) {
      Alert.alert('\u05E9\u05D2\u05D9\u05D0\u05D4', '\u05D0\u05D7\u05D5\u05D6 \u05D4\u05E0\u05D7\u05D4 \u05DC\u05D0 \u05D9\u05DB\u05D5\u05DC \u05DC\u05D4\u05D9\u05D5\u05EA \u05D9\u05D5\u05EA\u05E8 \u05DE-100%');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const discountData: CreateDiscountData = {
        _kind: formData.isAutomatic ? 'automatic' : 'coupon',
        type: formData.type,
        value: formData.type === 'free_shipping' ? 0 : parseFloat(formData.value),
        minimumAmount: formData.minimumAmount ? parseFloat(formData.minimumAmount) : undefined,
        isActive: true,
        endsAt: formData.endsAt ? new Date(formData.endsAt).toISOString() : undefined,
        appliesTo: formData.appliesTo,
        categoryIds: formData.appliesTo === 'category' ? formData.categoryIds : undefined,
        productIds: formData.appliesTo === 'product' ? formData.productIds : undefined,
      };

      if (formData.isAutomatic) {
        discountData.name = formData.title.trim() || formData.code.trim() || 'הנחה אוטומטית';
      } else {
        discountData.code = formData.code.trim().toUpperCase();
        discountData.title = formData.title.trim() || undefined;
        discountData.usageLimit = formData.usageLimit ? parseInt(formData.usageLimit) : undefined;
        discountData.usageLimitPerCustomer = formData.usageLimitPerCustomer ? parseInt(formData.usageLimitPerCustomer) : undefined;
      }

      await createDiscount.mutateAsync(discountData);
      Alert.alert('\u05D4\u05E6\u05DC\u05D7\u05D4', '\u05D4\u05E7\u05D5\u05E4\u05D5\u05DF \u05E0\u05D5\u05E6\u05E8 \u05D1\u05D4\u05E6\u05DC\u05D7\u05D4', [
        { text: '\u05D0\u05D9\u05E9\u05D5\u05E8', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('\u05E9\u05D2\u05D9\u05D0\u05D4', '\u05DC\u05D0 \u05D4\u05E6\u05DC\u05D7\u05E0\u05D5 \u05DC\u05D9\u05E6\u05D5\u05E8 \u05D0\u05EA \u05D4\u05E7\u05D5\u05E4\u05D5\u05DF');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="קופון חדש" />
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
          {/* Discount Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{'\u05E1\u05D5\u05D2 \u05D4\u05E0\u05D7\u05D4'}</Text>
            <View style={styles.typeGrid}>
              {DISCOUNT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.typeCard,
                    formData.type === type.key && styles.typeCardActive
                  ]}
                  onPress={() => updateField('type', type.key)}
                >
                  <Ionicons
                    name={type.icon}
                    size={24}
                    color={formData.type === type.key ? dt.colors.brand[500] : dt.colors.ink[400]}
                  />
                  <Text style={[
                    styles.typeLabel,
                    formData.type === type.key && styles.typeLabelActive
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Value */}
          {formData.type !== 'free_shipping' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {formData.type === 'percentage' ? '\u05D0\u05D7\u05D5\u05D6 \u05D4\u05E0\u05D7\u05D4' : '\u05E1\u05DB\u05D5\u05DD \u05D4\u05E0\u05D7\u05D4'}
              </Text>
              <View style={styles.card}>
                <View style={styles.valueInputContainer}>
                  <Text style={styles.valueSuffix}>
                    {formData.type === 'percentage' ? '%' : '\u20AA'}
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

          {/* Automatic or Code */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{'\u05D0\u05D5\u05E4\u05DF \u05D4\u05E4\u05E2\u05DC\u05D4'}</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => updateField('isAutomatic', !formData.isAutomatic)}
              >
                <View style={[
                  styles.toggle,
                  formData.isAutomatic && styles.toggleActive
                ]}>
                  <View style={[
                    styles.toggleThumb,
                    formData.isAutomatic && styles.toggleThumbActive
                  ]} />
                </View>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleTitle}>{'\u05D4\u05E0\u05D7\u05D4 \u05D0\u05D5\u05D8\u05D5\u05DE\u05D8\u05D9\u05EA'}</Text>
                  <Text style={styles.toggleDescription}>
                    {formData.isAutomatic
                      ? '\u05D4\u05D4\u05E0\u05D7\u05D4 \u05EA\u05D7\u05D5\u05DC \u05D0\u05D5\u05D8\u05D5\u05DE\u05D8\u05D9\u05EA \u05D1\u05E7\u05D5\u05E4\u05D4'
                      : '\u05D4\u05DC\u05E7\u05D5\u05D7 \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D6\u05D9\u05DF \u05E7\u05D5\u05D3 \u05E7\u05D5\u05E4\u05D5\u05DF'}
                  </Text>
                </View>
              </TouchableOpacity>

              {!formData.isAutomatic && (
                <View style={styles.codeSection}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{'\u05E7\u05D5\u05D3 \u05E7\u05D5\u05E4\u05D5\u05DF'}</Text>
                    <View style={styles.codeInputRow}>
                      <TouchableOpacity style={styles.generateBtn} onPress={generateCode}>
                        <Ionicons name="refresh-outline" size={18} color={dt.colors.brand[500]} />
                      </TouchableOpacity>
                      <TextInput
                        style={[styles.input, styles.codeInput]}
                        value={formData.code}
                        onChangeText={(v) => updateField('code', v.toUpperCase())}
                        placeholder="SAVE20"
                        autoCapitalize="characters"
                        textAlign="right"
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{'\u05E4\u05E8\u05D8\u05D9\u05DD \u05E0\u05D5\u05E1\u05E4\u05D9\u05DD'}</Text>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{'\u05E9\u05DD \u05D4\u05E7\u05D5\u05E4\u05D5\u05DF (\u05D0\u05D5\u05E4\u05E6\u05D9\u05D5\u05E0\u05DC\u05D9)'}</Text>
                <TextInput
                  style={styles.input}
                  value={formData.title}
                  onChangeText={(v) => updateField('title', v)}
                  placeholder={'\u05DC\u05D3\u05D5\u05D2\u05DE\u05D4: \u05D4\u05E0\u05D7\u05EA \u05D7\u05D5\u05E8\u05E3'}
                  textAlign="right"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{'\u05DE\u05D9\u05E0\u05D9\u05DE\u05D5\u05DD \u05D4\u05D6\u05DE\u05E0\u05D4'}</Text>
                <TextInput
                  style={styles.input}
                  value={formData.minimumAmount}
                  onChangeText={(v) => updateField('minimumAmount', v)}
                  placeholder={'0 (\u05DC\u05DC\u05D0 \u05DE\u05D9\u05E0\u05D9\u05DE\u05D5\u05DD)'}
                  keyboardType="decimal-pad"
                  textAlign="right"
                />
              </View>
            </View>
          </View>

          {/* Applies To */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{'\u05D7\u05DC \u05E2\u05DC'}</Text>
            <View style={styles.card}>
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
                    {opt === 'all' ? '\u05DB\u05DC \u05D4\u05DE\u05D5\u05E6\u05E8\u05D9\u05DD' : opt === 'category' ? '\u05E7\u05D8\u05D2\u05D5\u05E8\u05D9\u05D5\u05EA \u05E1\u05E4\u05E6\u05D9\u05E4\u05D9\u05D5\u05EA' : '\u05DE\u05D5\u05E6\u05E8\u05D9\u05DD \u05E1\u05E4\u05E6\u05D9\u05E4\u05D9\u05D9\u05DD'}
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

              {formData.appliesTo === 'product' && productsData?.products && (
                <View style={styles.restrictList}>
                  {productsData.products.map((prod) => (
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

          {/* Limits */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{'\u05D4\u05D2\u05D1\u05DC\u05D5\u05EA \u05E9\u05D9\u05DE\u05D5\u05E9'}</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>{'\u05DC\u05DB\u05DC \u05DC\u05E7\u05D5\u05D7'}</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.usageLimitPerCustomer}
                    onChangeText={(v) => updateField('usageLimitPerCustomer', v)}
                    placeholder={'\u05DC\u05DC\u05D0 \u05D4\u05D2\u05D1\u05DC\u05D4'}
                    keyboardType="number-pad"
                    textAlign="right"
                  />
                </View>
                <View style={{ width: dt.spacing[3] }} />
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>{'\u05E1\u05D4"\u05DB \u05E9\u05D9\u05DE\u05D5\u05E9\u05D9\u05DD'}</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.usageLimit}
                    onChangeText={(v) => updateField('usageLimit', v)}
                    placeholder={'\u05DC\u05DC\u05D0 \u05D4\u05D2\u05D1\u05DC\u05D4'}
                    keyboardType="number-pad"
                    textAlign="right"
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={{ height: dt.spacing[4] }} />
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <Button
            onPress={handleSubmit}
            loading={createDiscount.isPending}
            style={{ flex: 1 }}
          >
            {'\u05E6\u05D5\u05E8 \u05E7\u05D5\u05E4\u05D5\u05DF'}
          </Button>
        </View>
      </KeyboardAvoidingView>
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
    paddingTop: dt.spacing[4],
  },

  // Section
  section: {
    paddingHorizontal: dt.spacing[4],
    marginBottom: dt.spacing[4],
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[950],
    textAlign: 'right',
    marginBottom: dt.spacing[2],
  },
  card: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    padding: dt.spacing[4],
  },

  // Type Grid
  typeGrid: {
    flexDirection: 'row',
    gap: dt.spacing[3],
  },
  typeCard: {
    flex: 1,
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    padding: dt.spacing[3],
    alignItems: 'center',
    gap: dt.spacing[2],
    borderWidth: 2,
    borderColor: dt.colors.ink[200],
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
    gap: dt.spacing[2],
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

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  toggleTitle: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[950],
    textAlign: 'right',
  },
  toggleDescription: {
    fontSize: 13,
    color: dt.colors.ink[400],
    marginTop: 2,
    textAlign: 'right',
  },
  toggle: {
    width: 52,
    height: 32,
    borderRadius: 16,
    padding: 2,
    backgroundColor: dt.colors.ink[200],
  },
  toggleActive: {
    backgroundColor: dt.colors.brand[100],
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: dt.colors.surface.onBrand,
    alignSelf: 'flex-end',
  },
  toggleThumbActive: {
    alignSelf: 'flex-start',
    backgroundColor: dt.colors.brand[500],
  },

  // Code Section
  codeSection: {
    marginTop: dt.spacing[4],
    paddingTop: dt.spacing[4],
    borderTopWidth: 1,
    borderTopColor: dt.colors.ink[200],
  },
  codeInputRow: {
    flexDirection: 'row',
    gap: dt.spacing[2],
  },
  codeInput: {
    flex: 1,
    letterSpacing: 2,
    fontFamily: fonts.semiBold,
  },
  generateBtn: {
    width: 44,
    height: 44,
    borderRadius: dt.radii.md,
    backgroundColor: dt.colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Inputs
  inputGroup: {
    marginBottom: dt.spacing[3],
  },
  inputLabel: {
    fontSize: 13,
    color: dt.colors.ink[500],
    marginBottom: dt.spacing[1],
    textAlign: 'right',
    fontFamily: fonts.medium,
  },
  input: {
    backgroundColor: dt.colors.ink[50],
    borderRadius: dt.radii.md,
    padding: dt.spacing[3],
    fontFamily: fonts.regular,
    fontSize: 15,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    color: dt.colors.ink[950],
  },
  row: {
    flexDirection: 'row',
  },

  // Radio
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dt.spacing[2],
    paddingVertical: dt.spacing[2],
  },
  radioLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: dt.colors.ink[950],
    textAlign: 'right',
  },

  // Restrict list
  restrictList: {
    marginTop: dt.spacing[2],
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
    padding: dt.spacing[3],
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
    textAlign: 'right',
  },
  restrictItemTextSelected: {
    color: dt.colors.brand[500],
    fontFamily: fonts.medium,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    padding: dt.spacing[4],
    paddingBottom: dt.spacing[6],
    backgroundColor: dt.colors.surface.card,
    borderTopWidth: 1,
    borderTopColor: dt.colors.ink[200],
    gap: dt.spacing[3],
  },
});
