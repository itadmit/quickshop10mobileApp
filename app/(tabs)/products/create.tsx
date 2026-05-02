import React, { useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useCreateProduct, useCategories, useUploadImage } from '@/hooks';
import {
  Text,
  Button,
  designTokens,
  fonts,
} from '@/components/ui';

interface VariantOption {
  name: string;
  values: string[];
}

interface VariantRow {
  title: string;
  price: string;
  inventory: string;
  sku: string;
  option1?: string;
  option2?: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  comparePrice: string;
  cost: string;
  sku: string;
  barcode: string;
  inventory: string;
  weight: string;
  categoryId: string | null;
  trackInventory: boolean;
  isActive: boolean;
}

interface CreateImage {
  id: string;
  url: string;
}

export default function CreateProductScreen() {
  const router = useRouter();
  const createProduct = useCreateProduct();
  const uploadImage = useUploadImage();
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const categories = categoriesData?.categories;
  const scrollRef = useRef<ScrollView>(null);

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    comparePrice: '',
    cost: '',
    sku: '',
    barcode: '',
    inventory: '',
    weight: '',
    categoryId: null,
    trackInventory: true,
    isActive: true,
  });

  const [images, setImages] = useState<CreateImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Variants
  const [hasVariants, setHasVariants] = useState(false);
  const [options, setOptions] = useState<VariantOption[]>([]);
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionValue, setNewOptionValue] = useState('');
  const [editingOptionIdx, setEditingOptionIdx] = useState<number | null>(null);
  const [variants, setVariants] = useState<VariantRow[]>([]);

  const updateField = (field: keyof ProductFormData, value: string | boolean | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePickImage = async () => {
    const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permResult.granted) {
      Alert.alert('הרשאה נדרשת', 'יש לאשר גישה לגלריה כדי להעלות תמונות');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsMultipleSelection: true,
      selectionLimit: 10,
    });

    if (result.canceled || result.assets.length === 0) return;

    setIsUploading(true);
    try {
      for (const asset of result.assets) {
        const fileName = asset.fileName || `image_${Date.now()}.jpg`;
        const mimeType = asset.mimeType || 'image/jpeg';

        const uploaded = await uploadImage.mutateAsync({
          uri: asset.uri,
          fileName,
          mimeType,
        });

        setImages(prev => [
          ...prev,
          {
            id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            url: uploaded.url,
          },
        ]);
      }
    } catch {
      Alert.alert('שגיאה', 'לא הצלחנו להעלות את התמונה');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  // --- Variant helpers ---
  const addOption = () => {
    const name = newOptionName.trim();
    if (!name) {
      Alert.alert('שגיאה', 'נא להזין שם אופציה (לדוגמה: גודל, צבע)');
      return;
    }
    if (options.length >= 2) {
      Alert.alert('שגיאה', 'ניתן להוסיף עד 2 אופציות');
      return;
    }
    setOptions(prev => [...prev, { name, values: [] }]);
    setNewOptionName('');
    setEditingOptionIdx(options.length);
  };

  const addOptionValue = (optionIdx: number) => {
    const val = newOptionValue.trim();
    if (!val) return;
    setOptions(prev => {
      const updated = [...prev];
      if (!updated[optionIdx].values.includes(val)) {
        updated[optionIdx] = { ...updated[optionIdx], values: [...updated[optionIdx].values, val] };
      }
      return updated;
    });
    setNewOptionValue('');
  };

  const removeOptionValue = (optionIdx: number, valueIdx: number) => {
    setOptions(prev => {
      const updated = [...prev];
      updated[optionIdx] = {
        ...updated[optionIdx],
        values: updated[optionIdx].values.filter((_, i) => i !== valueIdx),
      };
      return updated;
    });
  };

  const removeOption = (optionIdx: number) => {
    setOptions(prev => prev.filter((_, i) => i !== optionIdx));
    if (editingOptionIdx === optionIdx) setEditingOptionIdx(null);
  };

  const generateVariants = () => {
    if (options.length === 0 || options.every(o => o.values.length === 0)) {
      setVariants([]);
      return;
    }

    const newVariants: VariantRow[] = [];
    const opt1 = options[0];
    const opt2 = options[1];

    if (opt1 && opt1.values.length > 0) {
      for (const v1 of opt1.values) {
        if (opt2 && opt2.values.length > 0) {
          for (const v2 of opt2.values) {
            newVariants.push({
              title: `${v1} / ${v2}`,
              price: formData.price,
              inventory: '',
              sku: '',
              option1: v1,
              option2: v2,
            });
          }
        } else {
          newVariants.push({
            title: v1,
            price: formData.price,
            inventory: '',
            sku: '',
            option1: v1,
          });
        }
      }
    }

    setVariants(newVariants);
  };

  const updateVariant = (idx: number, field: keyof VariantRow, value: string) => {
    setVariants(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('שגיאה', 'נא להזין שם מוצר');
      return false;
    }
    if (!hasVariants && (!formData.price || parseFloat(formData.price) <= 0)) {
      Alert.alert('שגיאה', 'נא להזין מחיר תקין');
      return false;
    }
    if (hasVariants && variants.length === 0) {
      Alert.alert('שגיאה', 'נא להוסיף אופציות וליצור וריאציות');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const productData: Parameters<typeof createProduct.mutateAsync>[0] = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: hasVariants ? parseFloat(variants[0]?.price || '0') : parseFloat(formData.price),
        comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : undefined,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        sku: formData.sku.trim() || undefined,
        barcode: formData.barcode.trim() || undefined,
        inventory: formData.inventory ? parseInt(formData.inventory) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        categoryIds: formData.categoryId ? [formData.categoryId] : [],
        trackInventory: formData.trackInventory,
        isActive: formData.isActive,
        images: images.map((img, index) => ({
          url: img.url,
          isPrimary: index === 0,
        })),
      };

      if (hasVariants && variants.length > 0) {
        productData.options = options
          .filter(o => o.values.length > 0)
          .map(o => ({ name: o.name, values: o.values }));

        productData.variants = variants.map(v => ({
          title: v.title,
          price: parseFloat(v.price || '0'),
          inventory: v.inventory ? parseInt(v.inventory) : undefined,
          sku: v.sku || undefined,
          option1: v.option1,
          option2: v.option2,
        }));
      }

      await createProduct.mutateAsync(productData);
      Alert.alert('הצלחה', 'המוצר נוצר בהצלחה', [
        { text: 'אישור', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('שגיאה', 'לא הצלחנו ליצור את המוצר. בדוק את הנתונים ונסה שוב.');
    }
  };

  const selectedCategory = categories?.find(c => c.id === formData.categoryId);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaView style={styles.container} edges={[]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Images Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>תמונות</Text>
            <View style={styles.card}>
              {images.length > 0 ? (
                <View>
                  <View style={{ direction: 'ltr' }}>
                    <DraggableFlatList
                      data={images}
                      horizontal
                      keyExtractor={(item) => item.id}
                      activationDistance={5}
                      onDragBegin={() => {
                        scrollRef.current?.setNativeProps?.({ scrollEnabled: false });
                      }}
                      onDragEnd={({ data: reordered }) => {
                        scrollRef.current?.setNativeProps?.({ scrollEnabled: true });
                        setImages(reordered);
                      }}
                      onRelease={() => {
                        scrollRef.current?.setNativeProps?.({ scrollEnabled: true });
                      }}
                      renderItem={({ item, getIndex, drag, isActive }: RenderItemParams<CreateImage>) => {
                        const idx = getIndex() ?? 0;
                        return (
                          <ScaleDecorator>
                            <TouchableOpacity
                              onLongPress={drag}
                              delayLongPress={150}
                              disabled={isActive}
                              style={[
                                styles.imageContainer,
                                { marginLeft: designTokens.spacing[2] },
                                isActive && { opacity: 0.9, transform: [{ scale: 1.08 }] },
                              ]}
                            >
                              <Image source={{ uri: item.url }} style={styles.imagePreview} />
                              {idx === 0 && (
                                <View style={styles.primaryBadge}>
                                  <Text style={styles.primaryBadgeText}>ראשית</Text>
                                </View>
                              )}
                              <TouchableOpacity
                                style={styles.removeImageBtn}
                                onPress={() => handleRemoveImage(item.id)}
                              >
                                <Ionicons name="close" size={16} color="#fff" />
                              </TouchableOpacity>
                            </TouchableOpacity>
                          </ScaleDecorator>
                        );
                      }}
                      showsHorizontalScrollIndicator={false}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.addImageBtnWide, { marginTop: designTokens.spacing[2] }]}
                    onPress={handlePickImage}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Text style={styles.addImageText}>מעלה...</Text>
                    ) : (
                      <>
                        <Ionicons name="add" size={22} color={designTokens.colors.ink[400]} />
                        <Text style={styles.addImageText}>הוסף תמונה</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addImageBtn}
                  onPress={handlePickImage}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Text style={styles.addImageText}>מעלה...</Text>
                  ) : (
                    <>
                      <Ionicons name="image-outline" size={32} color={designTokens.colors.ink[400]} />
                      <Text style={styles.addImageText}>הוסף תמונות</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>פרטי מוצר</Text>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>שם המוצר *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(v) => updateField('name', v)}
                  placeholder="לדוגמה: חולצת כותנה לבנה"
                  textAlign="right"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>תיאור</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(v) => updateField('description', v)}
                  placeholder="תיאור המוצר..."
                  textAlign="right"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>קטגוריה</Text>
                <TouchableOpacity
                  style={styles.selectBtn}
                  onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                >
                  <Ionicons
                    name={showCategoryPicker ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={designTokens.colors.ink[400]}
                  />
                  <Text style={selectedCategory ? styles.selectValue : styles.selectPlaceholder}>
                    {selectedCategory?.name || 'בחר קטגוריה'}
                  </Text>
                </TouchableOpacity>
                {showCategoryPicker && (
                  <View style={styles.categoryList}>
                    <TouchableOpacity
                      style={styles.categoryItem}
                      onPress={() => {
                        updateField('categoryId', null);
                        setShowCategoryPicker(false);
                      }}
                    >
                      <Text style={styles.categoryItemText}>ללא קטגוריה</Text>
                    </TouchableOpacity>
                    {categoriesLoading && (
                      <View style={styles.categoryItem}>
                        <Text style={[styles.categoryItemText, { color: designTokens.colors.ink[400] }]}>
                          טוען קטגוריות...
                        </Text>
                      </View>
                    )}
                    {categories && categories.length === 0 && (
                      <View style={styles.categoryItem}>
                        <Text style={[styles.categoryItemText, { color: designTokens.colors.ink[400] }]}>
                          אין קטגוריות — ניתן ליצור דרך האתר
                        </Text>
                      </View>
                    )}
                    {categories?.map(cat => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryItem,
                          formData.categoryId === cat.id && styles.categoryItemSelected,
                        ]}
                        onPress={() => {
                          updateField('categoryId', cat.id);
                          setShowCategoryPicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.categoryItemText,
                            formData.categoryId === cat.id && styles.categoryItemTextSelected,
                          ]}
                        >
                          {cat.name}
                        </Text>
                        {formData.categoryId === cat.id && (
                          <Ionicons name="checkmark" size={18} color={designTokens.colors.brand[500]} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Pricing */}
          {!hasVariants && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>מחיר</Text>
              <View style={styles.card}>
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>מחיר השוואה</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.comparePrice}
                      onChangeText={(v) => updateField('comparePrice', v)}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      textAlign="right"
                    />
                  </View>
                  <View style={{ width: designTokens.spacing[3] }} />
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>מחיר *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.price}
                      onChangeText={(v) => updateField('price', v)}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      textAlign="right"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>עלות (לא מוצג ללקוחות)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.cost}
                    onChangeText={(v) => updateField('cost', v)}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    textAlign="right"
                  />
                </View>
              </View>
            </View>
          )}

          {/* Variants Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>וריאציות</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => {
                  setHasVariants(!hasVariants);
                  if (hasVariants) {
                    setOptions([]);
                    setVariants([]);
                  }
                }}
              >
                <View style={[styles.toggle, hasVariants && styles.toggleActive]}>
                  <View style={[styles.toggleThumb, hasVariants && styles.toggleThumbActive]} />
                </View>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleTitle}>למוצר יש וריאציות</Text>
                  <Text style={styles.toggleDescription}>
                    גדלים, צבעים או אפשרויות שונות
                  </Text>
                </View>
              </TouchableOpacity>

              {hasVariants && (
                <View style={{ marginTop: designTokens.spacing[3] }}>
                  {/* Existing options */}
                  {options.map((opt, optIdx) => (
                    <View key={optIdx} style={styles.optionBlock}>
                      <View style={styles.optionHeader}>
                        <TouchableOpacity onPress={() => removeOption(optIdx)}>
                          <Ionicons name="trash-outline" size={18} color={designTokens.colors.semantic.danger.DEFAULT} />
                        </TouchableOpacity>
                        <Text style={styles.optionName}>{opt.name}</Text>
                      </View>
                      <View style={styles.optionValues}>
                        {opt.values.map((val, valIdx) => (
                          <View key={valIdx} style={styles.optionValueChip}>
                            <TouchableOpacity onPress={() => removeOptionValue(optIdx, valIdx)}>
                              <Ionicons name="close-circle" size={16} color={designTokens.colors.ink[400]} />
                            </TouchableOpacity>
                            <Text style={styles.optionValueText}>{val}</Text>
                          </View>
                        ))}
                      </View>
                      {editingOptionIdx === optIdx && (
                        <View style={styles.addValueRow}>
                          <TouchableOpacity
                            style={styles.addValueBtn}
                            onPress={() => addOptionValue(optIdx)}
                          >
                            <Ionicons name="add" size={18} color={designTokens.colors.brand[500]} />
                          </TouchableOpacity>
                          <TextInput
                            style={[styles.input, { flex: 1 }]}
                            value={newOptionValue}
                            onChangeText={setNewOptionValue}
                            placeholder="ערך חדש (לדוגמה: S, M, L)"
                            textAlign="right"
                            onSubmitEditing={() => addOptionValue(optIdx)}
                            returnKeyType="done"
                          />
                        </View>
                      )}
                      {editingOptionIdx !== optIdx && (
                        <TouchableOpacity
                          style={styles.addValueLink}
                          onPress={() => {
                            setEditingOptionIdx(optIdx);
                            setNewOptionValue('');
                          }}
                        >
                          <Text style={styles.addValueLinkText}>+ הוסף ערך</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}

                  {/* Add new option */}
                  {options.length < 2 && (
                    <View style={styles.addOptionRow}>
                      <TouchableOpacity style={styles.addOptionBtn} onPress={addOption}>
                        <Text style={styles.addOptionBtnText}>הוסף</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        value={newOptionName}
                        onChangeText={setNewOptionName}
                        placeholder="שם אופציה (גודל, צבע...)"
                        textAlign="right"
                        onSubmitEditing={addOption}
                        returnKeyType="done"
                      />
                    </View>
                  )}

                  {/* Generate variants button */}
                  {options.some(o => o.values.length > 0) && (
                    <TouchableOpacity style={styles.generateBtn} onPress={generateVariants}>
                      <Ionicons name="grid-outline" size={18} color={designTokens.colors.brand[500]} />
                      <Text style={styles.generateBtnText}>צור וריאציות</Text>
                    </TouchableOpacity>
                  )}

                  {/* Variants list */}
                  {variants.length > 0 && (
                    <View style={{ marginTop: designTokens.spacing[3] }}>
                      <Text style={[styles.inputLabel, { marginBottom: designTokens.spacing[2] }]}>
                        וריאציות ({variants.length})
                      </Text>
                      {variants.map((v, idx) => (
                        <View key={idx} style={styles.variantEditRow}>
                          <Text style={styles.variantEditTitle}>{v.title}</Text>
                          <View style={styles.variantEditFields}>
                            <View style={[styles.inputGroup, { flex: 1, marginBottom: 0 }]}>
                              <Text style={styles.variantFieldLabel}>מחיר</Text>
                              <TextInput
                                style={styles.variantInput}
                                value={v.price}
                                onChangeText={(val) => updateVariant(idx, 'price', val)}
                                keyboardType="decimal-pad"
                                textAlign="right"
                                placeholder="0.00"
                              />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginBottom: 0 }]}>
                              <Text style={styles.variantFieldLabel}>מלאי</Text>
                              <TextInput
                                style={styles.variantInput}
                                value={v.inventory}
                                onChangeText={(val) => updateVariant(idx, 'inventory', val)}
                                keyboardType="number-pad"
                                textAlign="right"
                                placeholder="0"
                              />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginBottom: 0 }]}>
                              <Text style={styles.variantFieldLabel}>מק"ט</Text>
                              <TextInput
                                style={styles.variantInput}
                                value={v.sku}
                                onChangeText={(val) => updateVariant(idx, 'sku', val)}
                                textAlign="right"
                                placeholder="SKU"
                              />
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Inventory */}
          {!hasVariants && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>מלאי</Text>
              <View style={styles.card}>
                <TouchableOpacity
                  style={styles.toggleRow}
                  onPress={() => updateField('trackInventory', !formData.trackInventory)}
                >
                  <View
                    style={[styles.toggle, formData.trackInventory && styles.toggleActive]}
                  >
                    <View
                      style={[
                        styles.toggleThumb,
                        formData.trackInventory && styles.toggleThumbActive,
                      ]}
                    />
                  </View>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleTitle}>מעקב מלאי</Text>
                    <Text style={styles.toggleDescription}>עקוב אחר כמות המלאי</Text>
                  </View>
                </TouchableOpacity>

                {formData.trackInventory && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>כמות במלאי</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.inventory}
                      onChangeText={(v) => updateField('inventory', v)}
                      placeholder="0"
                      keyboardType="number-pad"
                      textAlign="right"
                    />
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Additional Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>מידע נוסף</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>ברקוד</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.barcode}
                    onChangeText={(v) => updateField('barcode', v)}
                    placeholder="7290000000000"
                    textAlign="right"
                  />
                </View>
                <View style={{ width: designTokens.spacing[3] }} />
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>מק"ט</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.sku}
                    onChangeText={(v) => updateField('sku', v)}
                    placeholder="SKU-001"
                    textAlign="right"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>משקל (גרם)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.weight}
                  onChangeText={(v) => updateField('weight', v)}
                  placeholder="0"
                  keyboardType="number-pad"
                  textAlign="right"
                />
              </View>
            </View>
          </View>

          {/* Status */}
          <View style={styles.section}>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => updateField('isActive', !formData.isActive)}
              >
                <View style={[styles.toggle, formData.isActive && styles.toggleActive]}>
                  <View
                    style={[styles.toggleThumb, formData.isActive && styles.toggleThumbActive]}
                  />
                </View>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleTitle}>מוצר פעיל</Text>
                  <Text style={styles.toggleDescription}>
                    {formData.isActive ? 'המוצר יוצג בחנות' : 'המוצר יישמר כטיוטה'}
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
            loading={createProduct.isPending}
          >
            צור מוצר
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </GestureHandlerRootView>
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
    borderWidth: 1,
    borderColor: designTokens.colors.ink[200],
  },

  // Images
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: designTokens.radii.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: designTokens.colors.ink[100],
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: designTokens.colors.brand[500],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: designTokens.radii.sm,
  },
  primaryBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontFamily: fonts.medium,
  },
  addImageBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: designTokens.spacing[6],
    gap: designTokens.spacing[2],
  },
  addImageBtnWide: {
    width: '100%',
    height: 44,
    borderRadius: designTokens.radii.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: designTokens.colors.ink[300],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addImageText: {
    fontSize: 12,
    color: designTokens.colors.ink[400],
    fontFamily: fonts.medium,
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

  // Select
  selectBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: designTokens.colors.ink[50],
    borderRadius: designTokens.radii.md,
    padding: designTokens.spacing[3],
    borderWidth: 1,
    borderColor: designTokens.colors.ink[200],
  },
  selectValue: {
    fontSize: 15,
    color: designTokens.colors.ink[950],
    fontFamily: fonts.regular,
  },
  selectPlaceholder: {
    fontSize: 15,
    color: designTokens.colors.ink[400],
    fontFamily: fonts.regular,
  },
  categoryList: {
    marginTop: designTokens.spacing[2],
    backgroundColor: designTokens.colors.ink[50],
    borderRadius: designTokens.radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: designTokens.colors.ink[200],
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: designTokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.ink[200],
  },
  categoryItemSelected: {
    backgroundColor: designTokens.colors.brand[50],
  },
  categoryItemText: {
    fontSize: 14,
    color: designTokens.colors.ink[950],
    fontFamily: fonts.regular,
  },
  categoryItemTextSelected: {
    color: designTokens.colors.brand[500],
    fontFamily: fonts.medium,
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing[3],
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

  // Variants
  optionBlock: {
    backgroundColor: designTokens.colors.ink[50],
    borderRadius: designTokens.radii.md,
    padding: designTokens.spacing[3],
    marginBottom: designTokens.spacing[3],
    borderWidth: 1,
    borderColor: designTokens.colors.ink[200],
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing[2],
  },
  optionName: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: designTokens.colors.ink[950],
  },
  optionValues: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing[2],
    marginBottom: designTokens.spacing[2],
  },
  optionValueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing[1],
    backgroundColor: designTokens.colors.surface.card,
    paddingHorizontal: designTokens.spacing[2],
    paddingVertical: designTokens.spacing[1],
    borderRadius: designTokens.radii.full,
    borderWidth: 1,
    borderColor: designTokens.colors.ink[200],
  },
  optionValueText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: designTokens.colors.ink[950],
  },
  addValueRow: {
    flexDirection: 'row',
    gap: designTokens.spacing[2],
    alignItems: 'center',
  },
  addValueBtn: {
    width: 40,
    height: 40,
    borderRadius: designTokens.radii.md,
    backgroundColor: designTokens.colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  addValueLink: {
    paddingVertical: designTokens.spacing[1],
  },
  addValueLinkText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: designTokens.colors.brand[500],
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  addOptionRow: {
    flexDirection: 'row',
    gap: designTokens.spacing[2],
    alignItems: 'center',
    marginBottom: designTokens.spacing[2],
  },
  addOptionBtn: {
    paddingHorizontal: designTokens.spacing[3],
    paddingVertical: designTokens.spacing[3],
    backgroundColor: designTokens.colors.brand[500],
    borderRadius: designTokens.radii.md,
  },
  addOptionBtnText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: designTokens.colors.surface.card,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: designTokens.spacing[2],
    paddingVertical: 10,
    marginTop: designTokens.spacing[2],
    backgroundColor: designTokens.colors.brand[50],
    borderRadius: designTokens.radii.md,
  },
  generateBtnText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: designTokens.colors.brand[500],
  },
  variantEditRow: {
    backgroundColor: designTokens.colors.ink[50],
    borderRadius: designTokens.radii.md,
    padding: designTokens.spacing[3],
    marginBottom: designTokens.spacing[2],
    borderWidth: 1,
    borderColor: designTokens.colors.ink[200],
  },
  variantEditTitle: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: designTokens.colors.ink[950],
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: designTokens.spacing[2],
  },
  variantEditFields: {
    flexDirection: 'row',
    gap: designTokens.spacing[2],
  },
  variantFieldLabel: {
    fontSize: 11,
    color: designTokens.colors.ink[400],
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: 2,
  },
  variantInput: {
    backgroundColor: designTokens.colors.surface.card,
    borderRadius: designTokens.radii.sm,
    padding: designTokens.spacing[2],
    fontFamily: fonts.regular,
    fontSize: 13,
    borderWidth: 1,
    borderColor: designTokens.colors.ink[200],
    color: designTokens.colors.ink[950],
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
