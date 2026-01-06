import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, Camera } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBarcodeSearch } from '@/hooks';
import {
  Text,
  Button,
  Card,
  LoadingScreen,
  colors,
  spacing,
  borderRadius,
  fonts,
} from '@/components/ui';
import { formatCurrency } from '@/lib/utils/format';

export default function BarcodeScannerScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scannedCode, setScannedCode] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [torchOn, setTorchOn] = useState(false);

  const { data: barcodeResult, isLoading: isSearching } = useBarcodeSearch(scannedCode);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (data && data !== scannedCode) {
      setScannedCode(data);
    }
  };

  const handleManualSearch = () => {
    if (manualInput.trim()) {
      setScannedCode(manualInput.trim());
    }
  };

  const handleProductPress = () => {
    if (barcodeResult?.product) {
      router.push(`/(tabs)/products/${barcodeResult.product.id}`);
    }
  };

  const handleRescan = () => {
    setScannedCode('');
    setManualInput('');
  };

  if (hasPermission === null) {
    return <LoadingScreen message="מבקש הרשאות מצלמה..." />;
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionDenied}>
          <Text style={{ fontSize: 48 }}>📷</Text>
          <Text size="xl" weight="semiBold" center style={{ marginTop: spacing[4] }}>
            נדרשת גישה למצלמה
          </Text>
          <Text color="secondary" center style={{ marginTop: spacing[2] }}>
            יש לאשר גישה למצלמה בהגדרות המכשיר כדי לסרוק ברקודים
          </Text>
          <Button
            onPress={() => router.back()}
            variant="outline"
            style={{ marginTop: spacing[6] }}
          >
            חזור
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          enableTorch={torchOn}
          onBarcodeScanned={scannedCode ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
          }}
        />
        
        {/* Scan Overlay */}
        <View style={styles.scanOverlay}>
          <View style={styles.scanFrame} />
        </View>

        {/* Torch Toggle */}
        <TouchableOpacity
          style={styles.torchButton}
          onPress={() => setTorchOn(!torchOn)}
        >
          <Text style={{ fontSize: 24 }}>{torchOn ? '🔦' : '💡'}</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        {/* Manual Input */}
        <View style={styles.manualInput}>
          <TextInput
            style={styles.input}
            placeholder="או הזן ברקוד ידנית..."
            placeholderTextColor={colors.textMuted}
            value={manualInput}
            onChangeText={setManualInput}
            keyboardType="number-pad"
            returnKeyType="search"
            onSubmitEditing={handleManualSearch}
          />
          <Button onPress={handleManualSearch} size="sm">
            חפש
          </Button>
        </View>

        {/* Search Results */}
        {isSearching && (
          <View style={styles.loadingContainer}>
            <Text color="secondary">מחפש מוצר...</Text>
          </View>
        )}

        {scannedCode && barcodeResult && !isSearching && (
          <View style={styles.resultContainer}>
            {barcodeResult.found ? (
              <Card onPress={handleProductPress}>
                <View style={styles.productResult}>
                  <View style={styles.productInfo}>
                    <Text weight="semiBold" numberOfLines={2}>
                      {barcodeResult.product?.name}
                    </Text>
                    {barcodeResult.variant && (
                      <Text color="secondary" size="sm">
                        {barcodeResult.variant.title}
                      </Text>
                    )}
                    <View style={styles.productMeta}>
                      <Text weight="bold" style={{ color: colors.primary }}>
                        {formatCurrency(barcodeResult.variant?.price || barcodeResult.product?.price || 0)}
                      </Text>
                      <Text color="secondary" size="sm">
                        מלאי: {barcodeResult.variant?.inventory ?? barcodeResult.product?.inventory ?? 0}
                      </Text>
                    </View>
                  </View>
                  <Text color="secondary">לחץ לעריכה ←</Text>
                </View>
              </Card>
            ) : (
              <Card>
                <View style={styles.notFound}>
                  <Text style={{ fontSize: 32 }}>🔍</Text>
                  <Text weight="semiBold" style={{ marginTop: spacing[2] }}>
                    לא נמצא מוצר
                  </Text>
                  <Text color="secondary" size="sm">
                    ברקוד: {scannedCode}
                  </Text>
                </View>
              </Card>
            )}

            <Button
              variant="outline"
              onPress={handleRescan}
              style={{ marginTop: spacing[3] }}
              fullWidth
            >
              סרוק שוב
            </Button>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scanFrame: {
    width: 280,
    height: 150,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.lg,
    backgroundColor: 'transparent',
  },
  torchButton: {
    position: 'absolute',
    bottom: spacing[4],
    right: spacing[4],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing[4],
    paddingBottom: spacing[6],
  },
  manualInput: {
    flexDirection: 'row-reverse',
    gap: spacing[2],
  },
  input: {
    flex: 1,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    fontFamily: fonts.regular,
    fontSize: 16,
    textAlign: 'right',
  },
  loadingContainer: {
    padding: spacing[4],
    alignItems: 'center',
  },
  resultContainer: {
    marginTop: spacing[4],
  },
  productResult: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productMeta: {
    flexDirection: 'row-reverse',
    gap: spacing[3],
    marginTop: spacing[2],
  },
  notFound: {
    alignItems: 'center',
    padding: spacing[4],
  },
  permissionDenied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
    backgroundColor: colors.background,
  },
});

