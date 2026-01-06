import React, { useState } from 'react';
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
              <Text style={{ fontSize: 64 }}>🖼️</Text>
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
        <Card>
          <Text size="2xl" weight="bold">
            {product.name}
          </Text>
          {category && (
            <Badge variant="default" style={styles.categoryBadge}>
              {category.name}
            </Badge>
          )}
          {product.description && (
            <Text color="secondary" style={styles.description}>
              {product.description}
            </Text>
          )}
        </Card>

        {/* Quick Edit - Price */}
        <Card>
          <Subtitle style={styles.sectionTitle}>💰 מחיר</Subtitle>
          {editingPrice ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.editInput}
                value={newPrice}
                onChangeText={setNewPrice}
                keyboardType="numeric"
                placeholder={product.price?.toString() || '0'}
                autoFocus
              />
              <Button
                size="sm"
                onPress={handlePriceUpdate}
                loading={updatePrice.isPending}
                style={styles.editButton}
              >
                שמור
              </Button>
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
            </View>
          ) : (
            <View style={styles.valueRow}>
              <View>
                <Text size="2xl" weight="bold">
                  {product.price ? formatCurrency(product.price) : 'ללא מחיר'}
                </Text>
                {product.comparePrice && (
                  <Text color="muted" style={styles.comparePrice}>
                    מחיר מקורי: {formatCurrency(product.comparePrice)}
                  </Text>
                )}
              </View>
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
            </View>
          )}
        </Card>

        {/* Quick Edit - Inventory */}
        {!product.hasVariants && product.trackInventory && (
          <Card>
            <Subtitle style={styles.sectionTitle}>📦 מלאי</Subtitle>
            {editingInventory ? (
              <View style={styles.editRow}>
                <TextInput
                  style={styles.editInput}
                  value={newInventory}
                  onChangeText={setNewInventory}
                  keyboardType="number-pad"
                  placeholder={product.inventory?.toString() || '0'}
                  autoFocus
                />
                <Button
                  size="sm"
                  onPress={handleInventoryUpdate}
                  loading={updateInventory.isPending}
                  style={styles.editButton}
                >
                  שמור
                </Button>
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
              </View>
            ) : (
              <View style={styles.valueRow}>
                <View style={styles.inventoryInfo}>
                  <Text size="2xl" weight="bold">
                    {product.inventory ?? 0}
                  </Text>
                  <StockBadge inventory={product.inventory} />
                </View>
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
              </View>
            )}
          </Card>
        )}

        {/* Variants */}
        {product.hasVariants && variants && variants.length > 0 && (
          <Card>
            <Subtitle style={styles.sectionTitle}>🎨 וריאנטים</Subtitle>
            {variants.map((variant) => (
              <View key={variant.id} style={styles.variantRow}>
                <View style={styles.variantInfo}>
                  <Text weight="medium">{variant.title}</Text>
                  <Text color="secondary" size="sm">
                    {variant.sku || 'ללא מק"ט'}
                  </Text>
                </View>
                <View style={styles.variantRight}>
                  <Text weight="semiBold">{formatCurrency(variant.price)}</Text>
                  <StockBadge inventory={variant.inventory} size="sm" />
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Additional Info */}
        <Card>
          <Subtitle style={styles.sectionTitle}>📋 פרטים נוספים</Subtitle>
          {product.sku && (
            <View style={styles.infoRow}>
              <Text color="secondary">מק"ט</Text>
              <Text>{product.sku}</Text>
            </View>
          )}
          {product.barcode && (
            <View style={styles.infoRow}>
              <Text color="secondary">ברקוד</Text>
              <Text>{product.barcode}</Text>
            </View>
          )}
          {product.weight && (
            <View style={styles.infoRow}>
              <Text color="secondary">משקל</Text>
              <Text>{product.weight} גרם</Text>
            </View>
          )}
        </Card>

        {/* Status Toggle */}
        <Card>
          <View style={styles.statusRow}>
            <View>
              <Text weight="medium">סטטוס מוצר</Text>
              <Text color="secondary" size="sm">
                {product.isActive ? 'המוצר מוצג בחנות' : 'המוצר מוסתר מהחנות'}
              </Text>
            </View>
            <Button
              variant={product.isActive ? 'outline' : 'primary'}
              size="sm"
              onPress={handleToggleStatus}
              loading={toggleStatus.isPending}
            >
              {product.isActive ? 'השבת' : 'הפעל'}
            </Button>
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
    backgroundColor: colors.gray100,
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
  sectionTitle: {
    marginBottom: spacing[3],
  },
  valueRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[2],
  },
  editInput: {
    flex: 1,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    fontFamily: fonts.regular,
    fontSize: 18,
    textAlign: 'right',
  },
  editButton: {
    minWidth: 60,
  },
  comparePrice: {
    textDecorationLine: 'line-through',
  },
  inventoryInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[3],
  },
  variantRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  variantInfo: {
    flex: 1,
  },
  variantRight: {
    alignItems: 'flex-start',
    gap: spacing[1],
  },
  infoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  statusRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

