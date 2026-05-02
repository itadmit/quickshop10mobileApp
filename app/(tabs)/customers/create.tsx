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
import { useCreateCustomer } from '@/hooks';
import {
  Text,
  Button,
  designTokens,
  fonts,
} from '@/components/ui';
import { showToast } from '@/lib/utils/toast';

interface CustomerFormData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  notes: string;
  acceptsMarketing: boolean;
  street: string;
  houseNumber: string;
  apartment: string;
  floor: string;
  city: string;
  zipCode: string;
}

export default function CreateCustomerScreen() {
  const router = useRouter();
  const createCustomer = useCreateCustomer();

  const [formData, setFormData] = useState<CustomerFormData>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    notes: '',
    acceptsMarketing: true,
    street: '',
    houseNumber: '',
    apartment: '',
    floor: '',
    city: '',
    zipCode: '',
  });

  const updateField = (field: keyof CustomerFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.email.trim()) {
      showToast('נא להזין כתובת אימייל', 'error');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showToast('כתובת אימייל לא תקינה', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const hasAddress = formData.street || formData.city;

    try {
      const customerData = {
        email: formData.email.trim(),
        firstName: formData.firstName.trim() || undefined,
        lastName: formData.lastName.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        acceptsMarketing: formData.acceptsMarketing,
        defaultAddress: hasAddress ? {
          street: formData.street.trim() || undefined,
          houseNumber: formData.houseNumber.trim() || undefined,
          apartment: formData.apartment.trim() || undefined,
          floor: formData.floor.trim() || undefined,
          city: formData.city.trim() || undefined,
          zipCode: formData.zipCode.trim() || undefined,
        } : undefined,
      };

      const result = await createCustomer.mutateAsync(customerData);
      Alert.alert('הצלחה', 'הלקוח נוצר בהצלחה', [
        {
          text: 'צפה בלקוח',
          onPress: () => router.replace(`/(tabs)/customers/${result.customer.id}`)
        },
        { text: 'סגור', onPress: () => router.back() }
      ]);
    } catch (error) {
      showToast('לא הצלחנו ליצור את הלקוח', 'error');
    }
  };

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
          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>פרטים אישיים</Text>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>אימייל *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(v) => updateField('email', v)}
                  placeholder="email@example.com"
                  textAlign="right"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>שם משפחה</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.lastName}
                    onChangeText={(v) => updateField('lastName', v)}
                    placeholder="כהן"
                    textAlign="right"
                  />
                </View>
                <View style={{ width: designTokens.spacing[3] }} />
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>שם פרטי</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.firstName}
                    onChangeText={(v) => updateField('firstName', v)}
                    placeholder="ישראל"
                    textAlign="right"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>טלפון</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(v) => updateField('phone', v)}
                  placeholder="050-0000000"
                  textAlign="right"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {/* Address */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>כתובת (אופציונלי)</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>מספר בית</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.houseNumber}
                    onChangeText={(v) => updateField('houseNumber', v)}
                    placeholder="10"
                    textAlign="right"
                    keyboardType="number-pad"
                  />
                </View>
                <View style={{ width: designTokens.spacing[3] }} />
                <View style={[styles.inputGroup, { flex: 2 }]}>
                  <Text style={styles.inputLabel}>רחוב</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.street}
                    onChangeText={(v) => updateField('street', v)}
                    placeholder="שם הרחוב"
                    textAlign="right"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>קומה</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.floor}
                    onChangeText={(v) => updateField('floor', v)}
                    placeholder="3"
                    textAlign="right"
                    keyboardType="number-pad"
                  />
                </View>
                <View style={{ width: designTokens.spacing[3] }} />
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>דירה</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.apartment}
                    onChangeText={(v) => updateField('apartment', v)}
                    placeholder="5"
                    textAlign="right"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>מיקוד</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.zipCode}
                    onChangeText={(v) => updateField('zipCode', v)}
                    placeholder="0000000"
                    textAlign="right"
                    keyboardType="number-pad"
                  />
                </View>
                <View style={{ width: designTokens.spacing[3] }} />
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>עיר</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.city}
                    onChangeText={(v) => updateField('city', v)}
                    placeholder="תל אביב"
                    textAlign="right"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>הערות</Text>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.notes}
                  onChangeText={(v) => updateField('notes', v)}
                  placeholder="הערות פנימיות על הלקוח..."
                  textAlign="right"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </View>

          {/* Marketing */}
          <View style={styles.section}>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => updateField('acceptsMarketing', !formData.acceptsMarketing)}
              >
                <View style={[
                  styles.toggle,
                  formData.acceptsMarketing && styles.toggleActive
                ]}>
                  <View style={[
                    styles.toggleThumb,
                    formData.acceptsMarketing && styles.toggleThumbActive
                  ]} />
                </View>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleTitle}>קבלת עדכונים שיווקיים</Text>
                  <Text style={styles.toggleDescription}>
                    הלקוח מסכים לקבל עדכונים ומבצעים
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: designTokens.spacing[4] }} />
        </ScrollView>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <Button
            onPress={() => router.back()}
            variant="outline"
          >
            ביטול
          </Button>
          <Button
            onPress={handleSubmit}
            loading={createCustomer.isPending}
          >
            צור לקוח
          </Button>
        </View>
      </KeyboardAvoidingView>
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
    paddingTop: designTokens.spacing[4],
  },

  // Section
  section: {
    paddingHorizontal: designTokens.spacing[4],
    marginBottom: designTokens.spacing[4],
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: designTokens.colors.ink[950],
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: designTokens.spacing[2],
  },
  card: {
    backgroundColor: designTokens.colors.surface.card,
    borderRadius: designTokens.radii.lg,
    padding: designTokens.spacing[4],
  },

  // Inputs
  inputGroup: {
    marginBottom: designTokens.spacing[3],
  },
  inputLabel: {
    fontSize: 13,
    color: designTokens.colors.ink[500],
    marginBottom: designTokens.spacing[1],
    textAlign: 'left',
    writingDirection: 'rtl',
    fontFamily: fonts.medium,
  },
  input: {
    backgroundColor: designTokens.colors.ink[50],
    borderRadius: designTokens.radii.md,
    padding: designTokens.spacing[3],
    fontFamily: fonts.regular,
    fontSize: 15,
    borderWidth: 1,
    borderColor: designTokens.colors.ink[200],
    color: designTokens.colors.ink[950],
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  toggleTitle: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: designTokens.colors.ink[950],
  },
  toggleDescription: {
    fontSize: 13,
    color: designTokens.colors.ink[400],
    marginTop: 2,
  },
  toggle: {
    width: 52,
    height: 32,
    borderRadius: 16,
    padding: 2,
    backgroundColor: designTokens.colors.ink[200],
  },
  toggleActive: {
    backgroundColor: designTokens.colors.brand[100],
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: designTokens.colors.surface.card,
    alignSelf: 'flex-end',
  },
  toggleThumbActive: {
    alignSelf: 'flex-start',
    backgroundColor: designTokens.colors.brand[500],
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: designTokens.spacing[4],
    paddingBottom: designTokens.spacing[6],
    backgroundColor: designTokens.colors.surface.card,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.ink[200],
    gap: designTokens.spacing[3],
  },
});
