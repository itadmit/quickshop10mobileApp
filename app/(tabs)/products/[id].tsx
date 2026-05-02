import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  ScrollView,
  FlatList,
  StyleSheet,
  Image,
  Alert,
  TextInput,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  useProduct,
  useUpdateProduct,
  useUpdateInventory,
  useUpdatePrice,
  useToggleProductStatus,
  useDeleteProduct,
  useDuplicateProduct,
  useCategories,
  useUploadImage,
} from '@/hooks';
import {
  Text,
  Button,
  Badge,
  StockBadge,
  LoadingScreen,
  SectionHeader,
  ScreenHeader,
  designTokens,
  fonts,
} from '@/components/ui';
import { formatCurrency, formatProductPrice } from '@/lib/utils/format';
import { showToast } from '@/lib/utils/toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MONO_FONT = designTokens.typography.fontFamily.mono;

function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

interface EditFormData {
  name: string;
  description: string;
  price: string;
  comparePrice: string;
  cost: string;
  sku: string;
  barcode: string;
  weight: string;
  inventory: string;
  categoryId: string | null;
  trackInventory: boolean;
  isActive: boolean;
}

interface VariantFormData {
  id: string;
  title: string;
  price: string;
  comparePrice: string;
  cost: string;
  inventory: string;
  sku: string;
}

interface EditImage {
  id: string;
  url: string;
  sortOrder: number;
  isPrimary: boolean;
  alt: string | null;
  isNew?: boolean;
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { data, isLoading, error } = useProduct(id);
  const updateProduct = useUpdateProduct();
  const updateInventory = useUpdateInventory();
  const updatePrice = useUpdatePrice();
  const toggleStatus = useToggleProductStatus();
  const deleteProduct = useDeleteProduct();
  const duplicateProduct = useDuplicateProduct();
  const uploadImage = useUploadImage();
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.categories;

  const [isEditing, setIsEditing] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [variantsFormData, setVariantsFormData] = useState<VariantFormData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [editImages, setEditImages] = useState<EditImage[]>([]);
  const [realImageAspect, setRealImageAspect] = useState(3 / 4);
  const [imageViewMode, setImageViewMode] = useState<'full' | 'compact'>('compact');
  const galleryRef = useRef<FlatList>(null);
  const scrollRef = useRef<ScrollView>(null);

  const COMPACT_HEIGHT = 300;
  const imageAspect = imageViewMode === 'full' ? realImageAspect : undefined;
  const imageHeight = imageViewMode === 'compact' ? COMPACT_HEIGHT : undefined;
  const [formData, setFormData] = useState<EditFormData>({
    name: '',
    description: '',
    price: '',
    comparePrice: '',
    cost: '',
    sku: '',
    barcode: '',
    weight: '',
    inventory: '',
    categoryId: null,
    trackInventory: true,
    isActive: true,
  });

  useEffect(() => {
    if (data?.product) {
      const p = data.product;
      setFormData({
        name: p.name || '',
        description: p.description ? stripHtml(p.description) : '',
        price: p.price?.toString() || '',
        comparePrice: p.comparePrice?.toString() || '',
        cost: p.cost?.toString() || '',
        sku: p.sku || '',
        barcode: p.barcode || '',
        weight: p.weight?.toString() || '',
        inventory: p.inventory?.toString() || '',
        categoryId: data.category?.id || null,
        trackInventory: p.trackInventory ?? true,
        isActive: p.isActive ?? true,
      });
      if (data.variants && data.variants.length > 0) {
        setVariantsFormData(data.variants.map(v => ({
          id: v.id,
          title: v.title,
          price: v.price?.toString() || '',
          comparePrice: v.comparePrice?.toString() || '',
          cost: v.cost?.toString() || '',
          inventory: v.inventory?.toString() || '',
          sku: v.sku || '',
        })));
      }
      if (data.images) {
        setEditImages(
          [...data.images]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((img, idx) => ({
              id: img.id,
              url: img.url,
              sortOrder: idx,
              isPrimary: idx === 0,
              alt: img.alt,
            }))
        );
      }
    }
  }, [data]);

  useEffect(() => {
    const firstImage = data?.images?.[0];
    if (firstImage?.url) {
      Image.getSize(firstImage.url, (w, h) => {
        if (w && h) setRealImageAspect(w / h);
      });
    }
  }, [data?.images]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: isEditing ? undefined : () => (
        <TouchableOpacity
          onPress={() => setImageViewMode(prev => prev === 'compact' ? 'full' : 'compact')}
          style={{ paddingHorizontal: 8 }}
        >
          <Ionicons
            name={imageViewMode === 'compact' ? 'expand-outline' : 'contract-outline'}
            size={22}
            color={designTokens.colors.ink[700]}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, imageViewMode, isEditing]);

  const updateField = (field: keyof EditFormData, value: string | boolean | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateVariantField = (variantId: string, field: keyof VariantFormData, value: string) => {
    setVariantsFormData(prev => prev.map(v =>
      v.id === variantId ? { ...v, [field]: value } : v
    ));
  };

  const removeVariant = (variantId: string, variantTitle: string) => {
    Alert.alert(
      'מחיקת וריאציה',
      `האם למחוק את "${variantTitle}"?`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: () => {
            setVariantsFormData(prev => prev.filter(v => v.id !== variantId));
          },
        },
      ]
    );
  };

  const removeEditImage = (imageId: string) => {
    setEditImages(prev => {
      const filtered = prev.filter(img => img.id !== imageId);
      return filtered.map((img, idx) => ({
        ...img,
        sortOrder: idx,
        isPrimary: idx === 0,
      }));
    });
  };

  const moveEditImage = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    setEditImages(prev => {
      if (toIndex < 0 || toIndex >= prev.length) return prev;
      const arr = [...prev];
      [arr[fromIndex], arr[toIndex]] = [arr[toIndex], arr[fromIndex]];
      return arr.map((img, idx) => ({
        ...img,
        sortOrder: idx,
        isPrimary: idx === 0,
      }));
    });
  };

  const onGalleryScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveImageIndex(index);
  }, []);

  const pickAndUploadImage = async () => {
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

        setEditImages(prev => {
          const newImg: EditImage = {
            id: `new_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            url: uploaded.url,
            sortOrder: prev.length,
            isPrimary: prev.length === 0,
            alt: null,
            isNew: true,
          };
          return [...prev, newImg];
        });
      }
    } catch {
      showToast('לא הצלחנו להעלות את התמונה', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="טוען פרטי מוצר..." />;
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="bag-outline" size={48} color={designTokens.colors.semantic.danger.DEFAULT} />
          <Text style={styles.errorTitle}>שגיאה בטעינת המוצר</Text>
          <Text style={styles.errorDescription}>לא הצלחנו למצוא את המוצר המבוקש</Text>
          <Button onPress={() => router.back()} variant="outline" style={{ marginTop: designTokens.spacing[4] }}>
            חזור למוצרים
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const { product, images, variants, category } = data;
  const sortedImages = [...(images || [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const primaryImage = images?.find(img => img.isPrimary) || images?.[0];
  const productWithVariants = { ...product, variants };
  const selectedCategory = categories?.find(c => c.id === formData.categoryId);

  const handleSaveEdit = async () => {
    if (!formData.name.trim()) {
      showToast('נא להזין שם מוצר', 'error');
      return;
    }

    try {
      const productData: Record<string, unknown> = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: formData.price ? parseFloat(formData.price) : product.price || 0,
        comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        sku: formData.sku.trim() || null,
        barcode: formData.barcode.trim() || null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        inventory: formData.inventory ? parseInt(formData.inventory) : null,
        categoryIds: formData.categoryId ? [formData.categoryId] : [],
        trackInventory: formData.trackInventory,
        isActive: formData.isActive,
      };

      if (variantsFormData.length > 0) {
        productData.variants = variantsFormData.map(v => ({
          id: v.id,
          title: v.title,
          price: v.price ? parseFloat(v.price) : 0,
          comparePrice: v.comparePrice ? parseFloat(v.comparePrice) : undefined,
          cost: v.cost ? parseFloat(v.cost) : undefined,
          inventory: v.inventory ? parseInt(v.inventory) : undefined,
          sku: v.sku || undefined,
        }));
      }

      productData.images = editImages.map((img, idx) => ({
        url: img.url,
        alt: img.alt || undefined,
        isPrimary: idx === 0,
      }));

      await updateProduct.mutateAsync({
        productId: product.id,
        data: productData,
      });
      setIsEditing(false);
      showToast('המוצר עודכן בהצלחה', 'success');
    } catch {
      showToast('לא הצלחנו לעדכן את המוצר', 'error');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'מחיקת מוצר',
      `האם למחוק את "${product.name}"? פעולה זו לא ניתנת לביטול.`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct.mutateAsync(product.id);
              router.back();
            } catch {
              showToast('לא הצלחנו למחוק את המוצר', 'error');
            }
          },
        },
      ]
    );
  };

  const handleDuplicate = async () => {
    try {
      const result = await duplicateProduct.mutateAsync(product.id);
      Alert.alert('הצלחה', 'המוצר שוכפל בהצלחה', [
        {
          text: 'צפה במוצר',
          onPress: () => router.replace(`/(tabs)/products/${result.data.id}`),
        },
        { text: 'סגור' },
      ]);
    } catch {
      showToast('לא הצלחנו לשכפל את המוצר', 'error');
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = !product.isActive;
    Alert.alert(
      newStatus ? 'הפעלת מוצר' : 'השבתת מוצר',
      newStatus ? 'המוצר יהיה גלוי בחנות' : 'המוצר לא יהיה גלוי בחנות',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'אישור',
          onPress: async () => {
            try {
              await toggleStatus.mutateAsync({ productId: product.id, isActive: newStatus });
            } catch {
              showToast('לא הצלחנו לעדכן את הסטטוס', 'error');
            }
          },
        },
      ]
    );
  };

  const getStockInfo = () => {
    const inventory = product.inventory ?? null;
    if (inventory === null) return { label: 'ללא מעקב', color: designTokens.colors.ink[400] };
    if (inventory === 0) return { label: 'אזל', color: designTokens.colors.semantic.danger.DEFAULT };
    if (inventory <= 5) return { label: 'מלאי נמוך', color: designTokens.colors.semantic.warning.DEFAULT };
    return { label: 'במלאי', color: designTokens.colors.semantic.success.DEFAULT };
  };

  const stockInfo = getStockInfo();

  // -------- Edit Mode --------
  if (isEditing) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Edit Header */}
          <View style={styles.editHeader}>
            <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.editHeaderBtn}>
              <Text style={styles.editHeaderBtnText}>ביטול</Text>
            </TouchableOpacity>
            <Text style={styles.editHeaderTitle}>עריכת מוצר</Text>
            <TouchableOpacity
              onPress={handleSaveEdit}
              style={[styles.editHeaderBtn, styles.editHeaderSaveBtn]}
              disabled={updateProduct.isPending}
            >
              <Text style={styles.editHeaderSaveBtnText}>
                {updateProduct.isPending ? 'שומר...' : 'שמור'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.scrollView}
            contentContainerStyle={styles.editScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Image Management */}
            <View style={styles.editSection}>
              <Text style={styles.editSectionTitle}>תמונות</Text>
              <View style={styles.editCard}>
                {editImages.length > 0 ? (
                  <View>
                    <View style={{ direction: 'ltr' }}>
                      <DraggableFlatList
                        data={editImages}
                        horizontal
                        keyExtractor={(item) => item.id}
                        activationDistance={5}
                        onDragBegin={() => {
                          scrollRef.current?.setNativeProps?.({ scrollEnabled: false });
                        }}
                        onDragEnd={({ data: reordered }) => {
                          scrollRef.current?.setNativeProps?.({ scrollEnabled: true });
                          setEditImages(reordered.map((img, idx) => ({
                            ...img,
                            sortOrder: idx,
                            isPrimary: idx === 0,
                          })));
                        }}
                        onRelease={() => {
                          scrollRef.current?.setNativeProps?.({ scrollEnabled: true });
                        }}
                        renderItem={({ item, getIndex, drag, isActive }: RenderItemParams<EditImage>) => {
                          const idx = getIndex() ?? 0;
                          return (
                            <ScaleDecorator>
                              <TouchableOpacity
                                onLongPress={drag}
                                delayLongPress={150}
                                disabled={isActive}
                                style={[
                                  styles.imageGridItem,
                                  { marginLeft: designTokens.spacing[2] },
                                  isActive && { opacity: 0.9, transform: [{ scale: 1.08 }] },
                                ]}
                              >
                                <Image source={{ uri: item.url }} style={styles.imageGridThumb} />
                                {idx === 0 && (
                                  <View style={styles.primaryBadge}>
                                    <Text style={styles.primaryBadgeText}>ראשית</Text>
                                  </View>
                                )}
                                <TouchableOpacity
                                  style={styles.imageDeleteBtn}
                                  onPress={() => removeEditImage(item.id)}
                                >
                                  <Ionicons name="close" size={16} color="#fff" />
                                </TouchableOpacity>
                              </TouchableOpacity>
                            </ScaleDecorator>
                          );
                        }}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingLeft: designTokens.spacing[2] }}
                      />
                    </View>
                    <TouchableOpacity
                      style={[styles.imageAddBtn, { marginTop: designTokens.spacing[2] }]}
                      onPress={pickAndUploadImage}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Text style={styles.imageAddText}>מעלה...</Text>
                      ) : (
                        <>
                          <Ionicons name="add" size={28} color={designTokens.colors.ink[400]} />
                          <Text style={styles.imageAddText}>הוסף תמונה</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.imageEmptyAdd}
                    onPress={pickAndUploadImage}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Text style={styles.imageAddText}>מעלה...</Text>
                    ) : (
                      <>
                        <Ionicons name="image-outline" size={32} color={designTokens.colors.ink[400]} />
                        <Text style={styles.imageAddText}>הוסף תמונות</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Basic Info */}
            <View style={styles.editSection}>
              <Text style={styles.editSectionTitle}>פרטי מוצר</Text>
              <View style={styles.editCard}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>שם המוצר *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.name}
                    onChangeText={(v) => updateField('name', v)}
                    placeholder="שם המוצר"
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
                    <Text style={selectedCategory ? styles.selectValue : styles.selectPlaceholder}>
                      {selectedCategory?.name || 'בחר קטגוריה'}
                    </Text>
                    <Ionicons
                      name={showCategoryPicker ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={designTokens.colors.ink[400]}
                    />
                  </TouchableOpacity>
                  {showCategoryPicker && categories && (
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
                      {categories.map((cat) => (
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

            {/* Pricing - only for products without variants */}
            {variantsFormData.length === 0 && (
              <View style={styles.editSection}>
                <Text style={styles.editSectionTitle}>מחיר</Text>
                <View style={styles.editCard}>
                  <View style={styles.row}>
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
                    <View style={{ width: designTokens.spacing[3] }} />
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

            {/* Variants */}
            {variantsFormData.length > 0 && (
              <View style={styles.editSection}>
                <Text style={styles.editSectionTitle}>וריאציות ({variantsFormData.length})</Text>
                {variantsFormData.map((variant, index) => (
                  <View
                    key={variant.id}
                    style={[styles.editCard, index < variantsFormData.length - 1 && { marginBottom: designTokens.spacing[3] }]}
                  >
                    <View style={styles.variantEditHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.variantEditTitle}>{variant.title}</Text>
                        {variant.sku ? <Text style={styles.variantEditSku}>{variant.sku}</Text> : null}
                      </View>
                      <TouchableOpacity
                        style={styles.variantDeleteBtn}
                        onPress={() => removeVariant(variant.id, variant.title)}
                      >
                        <Ionicons name="close" size={18} color={designTokens.colors.semantic.danger.DEFAULT} />
                      </TouchableOpacity>
                    </View>

                    <View style={[styles.row, { marginTop: designTokens.spacing[3] }]}>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.inputLabel}>מחיר</Text>
                        <TextInput
                          style={styles.input}
                          value={variant.price}
                          onChangeText={(v) => updateVariantField(variant.id, 'price', v)}
                          placeholder="0.00"
                          keyboardType="decimal-pad"
                          textAlign="right"
                        />
                      </View>
                      <View style={{ width: designTokens.spacing[3] }} />
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.inputLabel}>מלאי</Text>
                        <TextInput
                          style={styles.input}
                          value={variant.inventory}
                          onChangeText={(v) => updateVariantField(variant.id, 'inventory', v)}
                          placeholder="0"
                          keyboardType="number-pad"
                          textAlign="right"
                        />
                      </View>
                    </View>

                    <View style={styles.row}>
                      <View style={[styles.inputGroup, { flex: 1, marginBottom: 0 }]}>
                        <Text style={styles.inputLabel}>מחיר השוואה</Text>
                        <TextInput
                          style={styles.input}
                          value={variant.comparePrice}
                          onChangeText={(v) => updateVariantField(variant.id, 'comparePrice', v)}
                          placeholder="0.00"
                          keyboardType="decimal-pad"
                          textAlign="right"
                        />
                      </View>
                      <View style={{ width: designTokens.spacing[3] }} />
                      <View style={[styles.inputGroup, { flex: 1, marginBottom: 0 }]}>
                        <Text style={styles.inputLabel}>עלות</Text>
                        <TextInput
                          style={styles.input}
                          value={variant.cost}
                          onChangeText={(v) => updateVariantField(variant.id, 'cost', v)}
                          placeholder="0.00"
                          keyboardType="decimal-pad"
                          textAlign="right"
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Inventory - only for products without variants */}
            {variantsFormData.length === 0 && (
              <View style={styles.editSection}>
                <Text style={styles.editSectionTitle}>מלאי</Text>
                <View style={styles.editCard}>
                  <TouchableOpacity
                    style={styles.toggleRow}
                    onPress={() => updateField('trackInventory', !formData.trackInventory)}
                  >
                    <View style={styles.toggleInfo}>
                      <Text style={styles.toggleTitle}>מעקב מלאי</Text>
                    </View>
                    <View
                      style={[styles.toggle, formData.trackInventory && styles.toggleActive]}
                    >
                      <View
                        style={[styles.toggleThumb, formData.trackInventory && styles.toggleThumbActive]}
                      />
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
            <View style={styles.editSection}>
              <Text style={styles.editSectionTitle}>מידע נוסף</Text>
              <View style={styles.editCard}>
                <View style={styles.row}>
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
                  <View style={{ width: designTokens.spacing[3] }} />
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
            <View style={styles.editSection}>
              <View style={styles.editCard}>
                <TouchableOpacity
                  style={styles.toggleRow}
                  onPress={() => updateField('isActive', !formData.isActive)}
                >
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleTitle}>מוצר פעיל</Text>
                    <Text style={styles.toggleDescription}>
                      {formData.isActive ? 'המוצר יוצג בחנות' : 'המוצר יישמר כטיוטה'}
                    </Text>
                  </View>
                  <View style={[styles.toggle, formData.isActive && styles.toggleActive]}>
                    <View
                      style={[styles.toggleThumb, formData.isActive && styles.toggleThumbActive]}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ height: designTokens.spacing[10] }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  // -------- View Mode --------
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title={product.name} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Gallery */}
        <View style={[styles.heroContainer, imageAspect ? { aspectRatio: imageAspect } : { height: imageHeight }]}>
          {sortedImages.length > 0 ? (
            <>
              <FlatList
                ref={galleryRef}
                data={sortedImages}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onGalleryScroll}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Image source={{ uri: item.url }} style={[styles.galleryImage, imageAspect ? { aspectRatio: imageAspect } : { height: imageHeight }]} />
                )}
              />
              {sortedImages.length > 1 && (
                <>
                  <View style={styles.dotIndicators}>
                    {sortedImages.map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          i === activeImageIndex && styles.dotActive,
                        ]}
                      />
                    ))}
                  </View>
                  <View style={styles.imageCountBadge}>
                    <Text style={styles.imageCountText}>
                      {sortedImages.length}/{activeImageIndex + 1}
                    </Text>
                  </View>
                </>
              )}
            </>
          ) : (
            <View style={[styles.galleryImage, styles.heroPlaceholder, { height: COMPACT_HEIGHT }]}>
              <Ionicons name="image-outline" size={48} color={designTokens.colors.ink[300]} />
            </View>
          )}
          {!product.isActive && (
            <View style={styles.draftBadge}>
              <Ionicons name="eye-off" size={14} color={designTokens.colors.surface.card} />
              <Text style={styles.draftText}>טיוטה</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.editFloatingBtn}
            onPress={() => setIsEditing(true)}
          >
            <Ionicons name="pencil" size={18} color={designTokens.colors.surface.card} />
          </TouchableOpacity>
        </View>

        {/* Product Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.productName}>{product.name}</Text>
          {category && <Text style={styles.productCategory}>{category.name}</Text>}
          {product.description && (
            <Text style={styles.productDescription}>{stripHtml(product.description)}</Text>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>מחיר</Text>
            <Text style={styles.statValuePrice}>{formatProductPrice(productWithVariants)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>מלאי</Text>
            <Text style={styles.statValue}>
              {product.hasVariants
                ? variants
                    .filter(v => v.isActive)
                    .reduce((sum, v) => sum + (v.inventory ?? 0), 0)
                : product.inventory ?? '—'}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>נמכרו</Text>
            <Text style={styles.statValue}>0</Text>
          </View>
        </View>

        {/* Variants (read-only) */}
        {product.hasVariants && variants && variants.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title={`וריאציות (${variants.length})`} />
            <View style={styles.variantsList}>
              {variants.map((variant, index) => (
                <View
                  key={variant.id}
                  style={[styles.variantRow, index < variants.length - 1 && styles.variantRowBorder]}
                >
                  <View style={styles.variantInfo}>
                    <Text style={styles.variantTitle}>{variant.title}</Text>
                    <Text style={styles.variantSku}>{variant.sku || 'ללא מק"ט'}</Text>
                  </View>
                  <View style={styles.variantMeta}>
                    <Text style={styles.variantPrice}>{formatCurrency(variant.price)}</Text>
                    <StockBadge inventory={variant.inventory} size="sm" />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Details */}
        <View style={styles.section}>
          <SectionHeader title="פרטים" />
          <View style={styles.detailsCard}>
            {product.sku && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>מק"ט</Text>
                <Text style={styles.detailValue}>{product.sku}</Text>
              </View>
            )}
            {product.barcode && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>ברקוד</Text>
                <Text style={styles.detailValue}>{product.barcode}</Text>
              </View>
            )}
            {product.weight && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>משקל</Text>
                <Text style={styles.detailValue}>{product.weight} גרם</Text>
              </View>
            )}
            <View style={[styles.detailRow, styles.detailRowLast]}>
              <Text style={styles.detailLabel}>מעקב מלאי</Text>
              <Badge variant={product.trackInventory ? 'success' : 'default'} size="sm">
                {product.trackInventory ? 'פעיל' : 'לא פעיל'}
              </Badge>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <SectionHeader title="פעולות" />
          <View style={styles.actionsCard}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setIsEditing(true)}>
              <Ionicons name="create-outline" size={20} color={designTokens.colors.brand[500]} />
              <Text style={styles.actionBtnText}>עריכת מוצר</Text>
            </TouchableOpacity>
            <View style={styles.actionDivider} />
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleToggleStatus}
              disabled={toggleStatus.isPending}
            >
              <Ionicons
                name={product.isActive ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={designTokens.colors.brand[500]}
              />
              <Text style={styles.actionBtnText}>
                {product.isActive ? 'הסתר מהחנות' : 'הצג בחנות'}
              </Text>
            </TouchableOpacity>
            <View style={styles.actionDivider} />
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleDuplicate}
              disabled={duplicateProduct.isPending}
            >
              <Ionicons name="copy-outline" size={20} color={designTokens.colors.brand[500]} />
              <Text style={styles.actionBtnText}>
                {duplicateProduct.isPending ? 'משכפל...' : 'שכפל מוצר'}
              </Text>
            </TouchableOpacity>
            <View style={styles.actionDivider} />
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleDelete}
              disabled={deleteProduct.isPending}
            >
              <Ionicons name="trash-outline" size={20} color={designTokens.colors.semantic.danger.DEFAULT} />
              <Text style={[styles.actionBtnText, { color: designTokens.colors.semantic.danger.DEFAULT }]}>
                {deleteProduct.isPending ? 'מוחק...' : 'מחק מוצר'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

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

  // Hero
  heroContainer: {
    position: 'relative',
    width: SCREEN_WIDTH,
    backgroundColor: designTokens.colors.surface.card,
  },
  galleryImage: {
    width: SCREEN_WIDTH,
  },
  dotIndicators: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: designTokens.colors.surface.onBrand,
    width: 18,
    borderRadius: 4,
  },
  imageCountBadge: {
    position: 'absolute',
    top: designTokens.spacing[3],
    right: designTokens.spacing[3],
    backgroundColor: designTokens.colors.overlay.scrim,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: designTokens.radii.full,
  },
  imageCountText: {
    color: designTokens.colors.surface.onBrand,
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  heroPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftBadge: {
    position: 'absolute',
    top: designTokens.spacing[4],
    left: designTokens.spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing[1],
    backgroundColor: designTokens.colors.ink[700],
    paddingHorizontal: designTokens.spacing[3],
    paddingVertical: 6,
    borderRadius: designTokens.radii.full,
  },
  draftText: {
    color: designTokens.colors.surface.card,
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  editFloatingBtn: {
    position: 'absolute',
    bottom: designTokens.spacing[3],
    left: designTokens.spacing[3],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: designTokens.colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },

  // Info Card
  infoCard: {
    marginHorizontal: designTokens.spacing[4],
    backgroundColor: designTokens.colors.surface.card,
    borderRadius: designTokens.radii.lg,
    padding: designTokens.spacing[4],
    alignItems: 'flex-start',
  },
  productName: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: designTokens.colors.ink[950],
    textAlign: 'left',
    writingDirection: 'rtl',
    alignSelf: 'stretch',
  },
  stockBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: designTokens.spacing[3],
    alignSelf: 'stretch',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: designTokens.spacing[2],
    paddingVertical: designTokens.spacing[1],
    borderRadius: designTokens.radii.full,
    borderWidth: 1,
    borderColor: designTokens.colors.ink[200],
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockText: {
    fontSize: 11,
    fontFamily: fonts.medium,
  },
  productCategory: {
    fontSize: 13,
    color: designTokens.colors.ink[400],
    marginTop: designTokens.spacing[1],
    textAlign: 'left',
    writingDirection: 'rtl',
    alignSelf: 'stretch',
  },
  productDescription: {
    fontSize: 14,
    color: designTokens.colors.ink[500],
    marginTop: designTokens.spacing[3],
    textAlign: 'left',
    writingDirection: 'rtl',
    lineHeight: 22,
    alignSelf: 'stretch',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: designTokens.spacing[4],
    gap: designTokens.spacing[3],
  },
  statCard: {
    flex: 1,
    backgroundColor: designTokens.colors.surface.card,
    borderRadius: designTokens.radii.lg,
    padding: designTokens.spacing[3],
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: designTokens.colors.ink[400],
    fontFamily: fonts.regular,
    marginBottom: designTokens.spacing[1],
  },
  statValue: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: designTokens.colors.ink[950],
  },
  statValuePrice: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: designTokens.colors.brand[500],
  },

  // Section
  section: {
    paddingHorizontal: designTokens.spacing[4],
  },

  // Variants
  variantsList: {
    backgroundColor: designTokens.colors.surface.card,
    borderRadius: designTokens.radii.lg,
    overflow: 'hidden',
  },
  variantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: designTokens.spacing[3],
  },
  variantRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.ink[200],
  },
  variantInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  variantTitle: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: designTokens.colors.ink[950],
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  variantSku: {
    fontSize: 12,
    color: designTokens.colors.ink[400],
    marginTop: 2,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  variantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing[2],
  },
  variantPrice: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: designTokens.colors.brand[500],
  },

  // Details
  detailsCard: {
    backgroundColor: designTokens.colors.surface.card,
    borderRadius: designTokens.radii.lg,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: designTokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.ink[200],
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 14,
    color: designTokens.colors.ink[400],
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  detailValue: {
    fontSize: 14,
    color: designTokens.colors.ink[950],
    fontFamily: fonts.medium,
  },

  // Actions
  actionsCard: {
    backgroundColor: designTokens.colors.surface.card,
    borderRadius: designTokens.radii.lg,
    overflow: 'hidden',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: designTokens.spacing[4],
    gap: designTokens.spacing[2],
  },
  actionBtnText: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.medium,
    color: designTokens.colors.brand[500],
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  actionDivider: {
    height: 1,
    backgroundColor: designTokens.colors.ink[200],
    marginHorizontal: designTokens.spacing[4],
  },

  // -------- Edit Mode Styles --------
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing[4],
    paddingVertical: designTokens.spacing[3],
    backgroundColor: designTokens.colors.surface.card,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.ink[200],
  },
  editHeaderTitle: {
    fontSize: 17,
    fontFamily: fonts.semiBold,
    color: designTokens.colors.ink[950],
  },
  editHeaderBtn: {
    paddingHorizontal: designTokens.spacing[3],
    paddingVertical: 6,
  },
  editHeaderBtnText: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: designTokens.colors.ink[400],
  },
  editHeaderSaveBtn: {
    backgroundColor: designTokens.colors.brand[500],
    borderRadius: designTokens.radii.md,
  },
  editHeaderSaveBtnText: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: designTokens.colors.surface.card,
  },
  editScrollContent: {
    paddingTop: designTokens.spacing[4],
  },
  editSection: {
    paddingHorizontal: designTokens.spacing[4],
    marginBottom: designTokens.spacing[4],
  },
  editSectionTitle: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: designTokens.colors.ink[950],
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: designTokens.spacing[2],
    alignSelf: 'stretch',
  },
  editCard: {
    backgroundColor: designTokens.colors.surface.card,
    borderRadius: designTokens.radii.lg,
    padding: designTokens.spacing[4],
  },

  // Shared form styles
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
    alignSelf: 'stretch',
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
    writingDirection: 'rtl',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
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
    textAlign: 'left',
    writingDirection: 'rtl',
    flex: 1,
  },
  selectPlaceholder: {
    fontSize: 15,
    color: designTokens.colors.ink[400],
    fontFamily: fonts.regular,
    textAlign: 'left',
    writingDirection: 'rtl',
    flex: 1,
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
    flex: 1,
    fontSize: 14,
    color: designTokens.colors.ink[950],
    fontFamily: fonts.regular,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  categoryItemTextSelected: {
    color: designTokens.colors.brand[500],
    fontFamily: fonts.medium,
  },
  variantEditHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: designTokens.spacing[1],
  },
  variantDeleteBtn: {
    width: 32,
    height: 32,
    borderRadius: designTokens.radii.md,
    backgroundColor: designTokens.colors.semantic.danger.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantEditTitle: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: designTokens.colors.ink[950],
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  variantEditSku: {
    fontSize: 12,
    color: designTokens.colors.ink[400],
    marginTop: 2,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing[3],
  },
  toggleInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  toggleTitle: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: designTokens.colors.ink[950],
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  toggleDescription: {
    fontSize: 13,
    color: designTokens.colors.ink[400],
    marginTop: 2,
    textAlign: 'left',
    writingDirection: 'rtl',
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

  // Image Management (Edit Mode)
  imageGridItem: {
    width: 100,
    height: 100,
    borderRadius: designTokens.radii.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: designTokens.colors.ink[100],
  },
  imageGridThumb: {
    width: '100%',
    height: '100%',
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 4,
    start: 4,
    backgroundColor: designTokens.colors.brand[500],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: designTokens.radii.sm,
  },
  primaryBadgeText: {
    color: designTokens.colors.surface.onBrand,
    fontSize: 10,
    fontFamily: fonts.medium,
  },
  imageDeleteBtn: {
    position: 'absolute',
    top: 4,
    end: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: designTokens.colors.overlay.heavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageAddBtn: {
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
  imageAddText: {
    fontSize: 12,
    color: designTokens.colors.ink[400],
    fontFamily: fonts.medium,
  },
  imageEmptyAdd: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: designTokens.spacing[6],
    gap: designTokens.spacing[2],
  },
});
