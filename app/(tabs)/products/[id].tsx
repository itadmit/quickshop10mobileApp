import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProduct, useUpdateInventory, useUpdatePrice, useToggleProductStatus } from '@/hooks';
import {
  Text,
  Subtitle,
  Card,
  Button,
  Badge,
  StockBadge,
  LoadingScreen,
  colors,
  spacing,
  borderRadius,
  fonts,
  shadows,
} from '@/components/ui';
import { formatCurrency } from '@/lib/utils/format';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, error } = useProduct(id);
  const updateInventory = useUpdateInventory();
  const updatePrice = useUpdatePrice();
  const toggleStatus = useToggleProductStatus();

  const [editingInventory, setEditingInventory] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [newInventory, setNewInventory] = useState('');
  const [newPrice, setNewPrice] = useState('');

  if (isLoading) {
    return <LoadingScreen message="טוען פרטי מוצר..." />;
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text color="error" center>
            שגיאה בטעינת המוצר
          </Text>
          <Button onPress={() => router.back()} variant="outline" style={{ marginTop: spacing[4] }}>
            חזור
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const { product, images, variants, category } = data;
  const primaryImage = images?.find(img => img.isPrimary) || images?.[0];

  const handleInventoryUpdate = async () => {
    const value = parseInt(newInventory);
    if (isNaN(value) || value < 0) {
      Alert.alert('שגיאה', 'נא להזין מספר חיובי');
      return;
    }
    
    try {
      await updateInventory.mutateAsync({
        productId: product.id,
        data: { inventory: value },
      });
      setEditingInventory(false);
      setNewInventory('');
    } catch {
      Alert.alert('שגיאה', 'לא הצלחנו לעדכן את המלאי');
    }
  };

  const handlePriceUpdate = async () => {
    const value = parseFloat(newPrice);
    if (isNaN(value) || value < 0) {
      Alert.alert('שגיאה', 'נא להזין מחיר תקין');
      return;
    }
    
    try {
      await updatePrice.mutateAsync({
        productId: product.id,
        data: { price: value },
      });
      setEditingPrice(false);
      setNewPrice('');
    } catch {
      Alert.alert('שגיאה', 'לא הצלחנו לעדכן את המחיר');
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = !product.isActive;
    Alert.alert(
      newStatus ? 'הפעלת מוצר' : 'השבתת מוצר',
      newStatus 
        ? 'המוצר יהיה גלוי בחנות'
        : 'המוצר לא יהיה גלוי בחנות',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'אישור',
          onPress: async () => {
            try {
              await toggleStatus.mutateAsync({
                productId: product.id,
                isActive: newStatus,
              });
            } catch {
              Alert.alert('שגיאה', 'לא הצלחנו לעדכן את הסטטוס');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {primaryImage ? (
            <Image source={{ uri: primaryImage.url }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImage, styles.imagePlaceholder]}>
              <Ionicons name="image-outline" size={64} color={colors.textMuted} />
            </View>
          )}
          {!product.isActive && (
            <View style={styles.draftOverlay}>
              <Text weight="bold" style={{ color: colors.white }}>
                טיוטה - לא פעיל
              </Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <Card style={styles.card}>
          <Text size="2xl" weight="bold" style={{ textAlign: 'right', color: '#202223' }}>
            {product.name}
          </Text>
          {category && (
            <Badge variant="default" style={styles.categoryBadge}>
              {category.name}
            </Badge>
          )}
          {product.description && (
            <Text color="secondary" style={{ ...styles.description, textAlign: 'right' }}>
              {product.description}
            </Text>
          )}
        </Card>

        {/* Quick Edit - Price */}
        <Card style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="pricetag-outline" size={20} color="#6D7175" />
            <Text weight="semiBold" style={styles.sectionTitleText}>מחיר</Text>
          </View>
          {editingPrice ? (
            <View style={styles.editRow}>
              <Button
                size="sm"
                variant="ghost"
                onPress={() => {
                  setEditingPrice(false);
                  setNewPrice('');
                }}
              >
                ביטול
              </Button>
              <Button
                size="sm"
                onPress={handlePriceUpdate}
                loading={updatePrice.isPending}
                style={styles.editButton}
              >
                שמור
              </Button>
              <TextInput
                style={styles.editInput}
                value={newPrice}
                onChangeText={setNewPrice}
                keyboardType="numeric"
                placeholder={product.price?.toString() || '0'}
                autoFocus
              />
            </View>
          ) : (
            <View style={styles.valueRow}>
              <Button
                size="sm"
                variant="outline"
                onPress={() => {
                  setNewPrice(product.price?.toString() || '');
                  setEditingPrice(true);
                }}
              >
                עריכה
              </Button>
              <View style={{ alignItems: 'flex-end' }}>
                <Text size="2xl" weight="bold" style={{ color: '#00785C' }}>
                  {product.price ? formatCurrency(product.price) : 'ללא מחיר'}
                </Text>
                {product.comparePrice && (
                  <Text style={{ ...styles.comparePrice, textAlign: 'right', color: '#9CA3AF' }}>
                    מחיר מקורי: {formatCurrency(product.comparePrice)}
                  </Text>
                )}
              </View>
            </View>
          )}
        </Card>

        {/* Quick Edit - Inventory */}
        {!product.hasVariants && product.trackInventory && (
          <Card style={styles.card}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="cube-outline" size={20} color="#6D7175" />
              <Text weight="semiBold" style={styles.sectionTitleText}>מלאי</Text>
            </View>
            {editingInventory ? (
              <View style={styles.editRow}>
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => {
                    setEditingInventory(false);
                    setNewInventory('');
                  }}
                >
                  ביטול
                </Button>
                <Button
                  size="sm"
                  onPress={handleInventoryUpdate}
                  loading={updateInventory.isPending}
                  style={styles.editButton}
                >
                  שמור
                </Button>
                <TextInput
                  style={styles.editInput}
                  value={newInventory}
                  onChangeText={setNewInventory}
                  keyboardType="number-pad"
                  placeholder={product.inventory?.toString() || '0'}
                  autoFocus
                />
              </View>
            ) : (
              <View style={styles.valueRow}>
                <Button
                  size="sm"
                  variant="outline"
                  onPress={() => {
                    setNewInventory(product.inventory?.toString() || '0');
                    setEditingInventory(true);
                  }}
                >
                  עריכה
                </Button>
                <View style={styles.inventoryInfo}>
                  <StockBadge inventory={product.inventory} />
                  <Text size="2xl" weight="bold" style={{ color: '#202223' }}>
                    {product.inventory ?? 0}
                  </Text>
                </View>
              </View>
            )}
          </Card>
        )}

        {/* Variants */}
        {product.hasVariants && variants && variants.length > 0 && (
          <Card style={styles.card}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="color-palette-outline" size={20} color="#6D7175" />
              <Text weight="semiBold" style={styles.sectionTitleText}>וריאנטים</Text>
            </View>
            {variants.map((variant) => (
              <View key={variant.id} style={styles.variantRow}>
                <View style={styles.variantRight}>
                  <StockBadge inventory={variant.inventory} size="sm" />
                  <Text weight="semiBold" style={{ color: '#00785C' }}>{formatCurrency(variant.price)}</Text>
                </View>
                <View style={styles.variantInfo}>
                  <Text weight="medium" style={{ textAlign: 'right', color: '#202223' }}>{variant.title}</Text>
                  <Text size="sm" style={{ textAlign: 'right', color: '#6D7175' }}>
                    {variant.sku || 'ללא מק"ט'}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Additional Info */}
        <Card style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="document-text-outline" size={20} color="#6D7175" />
            <Text weight="semiBold" style={styles.sectionTitleText}>פרטים נוספים</Text>
          </View>
          {product.sku && (
            <View style={styles.infoRow}>
              <Text style={{ color: '#202223' }}>{product.sku}</Text>
              <Text style={{ color: '#6D7175', textAlign: 'right' }}>מק"ט</Text>
            </View>
          )}
          {product.barcode && (
            <View style={styles.infoRow}>
              <Text style={{ color: '#202223' }}>{product.barcode}</Text>
              <Text style={{ color: '#6D7175', textAlign: 'right' }}>ברקוד</Text>
            </View>
          )}
          {product.weight && (
            <View style={styles.infoRow}>
              <Text style={{ color: '#202223' }}>{product.weight} גרם</Text>
              <Text style={{ color: '#6D7175', textAlign: 'right' }}>משקל</Text>
            </View>
          )}
        </Card>

        {/* Status Toggle */}
        <Card style={styles.card}>
          <View style={styles.statusRow}>
            <Button
              variant={product.isActive ? 'outline' : 'primary'}
              size="sm"
              onPress={handleToggleStatus}
              loading={toggleStatus.isPending}
              style={product.isActive ? {} : { backgroundColor: '#00785C' }}
            >
              {product.isActive ? 'השבת' : 'הפעל'}
            </Button>
            <View style={{ alignItems: 'flex-end' }}>
              <Text weight="medium" style={{ textAlign: 'right', color: '#202223' }}>סטטוס מוצר</Text>
              <Text size="sm" style={{ textAlign: 'right', color: '#6D7175' }}>
                {product.isActive ? 'המוצר מוצג בחנות' : 'המוצר מוסתר מהחנות'}
              </Text>
            </View>
          </View>
        </Card>

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
  imageContainer: {
    position: 'relative',
    marginBottom: spacing[2],
  },
  productImage: {
    width: '100%',
    height: 250,
    borderRadius: borderRadius.lg,
  },
  imagePlaceholder: {
    backgroundColor: '#F6F6F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: spacing[2],
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    alignItems: 'center',
  },
  categoryBadge: {
    marginTop: spacing[2],
  },
  description: {
    marginTop: spacing[3],
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
  sectionTitle: {
    marginBottom: spacing[3],
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  editInput: {
    flex: 1,
    backgroundColor: '#F6F6F7',
    borderRadius: borderRadius.md,
    padding: spacing[3],
    fontFamily: fonts.regular,
    fontSize: 18,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: '#E1E3E5',
  },
  editButton: {
    minWidth: 60,
  },
  comparePrice: {
    textDecorationLine: 'line-through',
  },
  inventoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  variantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: '#E1E3E5',
  },
  variantInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  variantRight: {
    alignItems: 'flex-start',
    gap: spacing[1],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: '#E1E3E5',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

