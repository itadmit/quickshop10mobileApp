import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { useAuth } from '@/hooks';
import { useAuthStore } from '@/stores';
import {
  Text,
  Badge,
  designTokens,
  fonts,
} from '@/components/ui';

const dt = designTokens;

const QUICKSHOP_DOMAIN = 'my-quickshop.com';
const SUPPORT_EMAIL = 'info@quick-shop.co.il';
const SUPPORT_WHATSAPP = '+972552554432';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  badge?: string;
  onPress: () => void;
  destructive?: boolean;
}

function MenuItem({ icon, title, subtitle, badge, onPress, destructive }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View
        style={[
          styles.menuIconContainer,
          destructive && { backgroundColor: dt.colors.semantic.danger.light },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={destructive ? dt.colors.semantic.danger.DEFAULT : dt.colors.ink[600]}
        />
      </View>
      <View style={styles.menuContent}>
        <Text
          style={[
            styles.menuTitle,
            destructive && { color: dt.colors.semantic.danger.DEFAULT },
          ]}
        >
          {title}
        </Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {badge && (
        <Badge variant="error" size="sm">
          {badge}
        </Badge>
      )}
      <Ionicons name="chevron-back" size={16} color={dt.colors.ink[300]} />
    </TouchableOpacity>
  );
}

function MenuSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View style={styles.menuSection}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <View style={styles.menuCard}>{children}</View>
    </View>
  );
}

export default function MoreScreen() {
  const router = useRouter();
  const { logout, isLoggingOut } = useAuth();
  const { currentStore, user, stores, activePlugins, refreshCurrentStore } = useAuthStore();
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    refreshCurrentStore();
  }, [refreshCurrentStore]);

  const handleLogout = () => {
    Alert.alert(
      'התנתקות',
      'האם אתה בטוח שברצונך להתנתק?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'התנתק',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleSwitchStore = () => {
    if (stores.length > 1) {
      router.push('/(auth)/store-select');
    } else {
      Alert.alert('חנות יחידה', 'יש לך רק חנות אחת');
    }
  };

  const handleOpenStoreSettings = () => {
    if (currentStore?.slug) {
      Linking.openURL(`https://${QUICKSHOP_DOMAIN}/shops/${currentStore.slug}/admin/settings`);
    }
  };

  const handleOpenHelp = () => {
    Linking.openURL(`https://${QUICKSHOP_DOMAIN}/help`);
  };

  const handleContactEmail = () => {
    setShowContactModal(false);
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  };

  const handleContactWhatsApp = () => {
    setShowContactModal(false);
    const message = encodeURIComponent(`שלום, אני צריך עזרה עם חנות ${currentStore?.name || ''}`);
    Linking.openURL(`https://wa.me/${SUPPORT_WHATSAPP}?text=${message}`);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'מחיקת חשבון',
      'מחיקת החשבון היא פעולה בלתי הפיכה. תועבר לדף ההגדרות המתקדמות באתר כדי לבצע את המחיקה.',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'המשך למחיקה',
          style: 'destructive',
          onPress: () => {
            if (currentStore?.slug) {
              Linking.openURL(`https://${QUICKSHOP_DOMAIN}/shops/${currentStore.slug}/admin/settings/advanced`);
            } else {
              Linking.openURL(`https://${QUICKSHOP_DOMAIN}/settings/advanced`);
            }
          },
        },
      ]
    );
  };

  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const buildNumber =
    (Constants.expoConfig as { ios?: { buildNumber?: string }; android?: { versionCode?: number } } | null)?.ios?.buildNumber ||
    (Constants.expoConfig as { ios?: { buildNumber?: string }; android?: { versionCode?: number } } | null)?.android?.versionCode?.toString() ||
    '';
  const updateId = Updates.updateId ? Updates.updateId.slice(-8) : 'embedded';
  const runtimeVersion = Updates.runtimeVersion || appVersion;

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Store */}
        <View style={styles.storeCard}>
          <View style={styles.storeContent}>
            <View style={styles.storeLogo}>
              <Text style={styles.storeLogoText}>
                {currentStore?.name.charAt(0) || '?'}
              </Text>
            </View>
            <View style={styles.storeInfo}>
              <Text style={styles.storeName}>{currentStore?.name || 'החנות שלי'}</Text>
              <Text style={styles.storeUrl}>{currentStore?.slug}.quickshop.co.il</Text>
            </View>
          </View>
        </View>

        {/* Management */}
        <MenuSection title="ניהול">
          {activePlugins.includes('pos') && (
            <MenuItem
              icon="card-outline"
              title="קופה (POS)"
              subtitle="מכירה ישירה"
              onPress={() => router.push('/(tabs)/pos')}
            />
          )}
          <MenuItem
            icon="pricetag-outline"
            title="קופונים והנחות"
            onPress={() => router.push('/(tabs)/discounts')}
          />
          <MenuItem
            icon="stats-chart-outline"
            title="דוחות ואנליטיקס"
            onPress={() => router.push('/(tabs)/analytics')}
          />
          <MenuItem
            icon="refresh-outline"
            title="החזרות והחלפות"
            subtitle="ניהול מתקדם דרך האתר"
            onPress={() => Linking.openURL(`https://${QUICKSHOP_DOMAIN}/shops/${currentStore?.slug}/admin/returns`)}
          />
        </MenuSection>

        {/* Settings */}
        <MenuSection title="הגדרות">
          <MenuItem
            icon="settings-outline"
            title="הגדרות חנות"
            subtitle="ניהול מתקדם דרך האתר"
            onPress={handleOpenStoreSettings}
          />
          <MenuItem
            icon="notifications-outline"
            title="התראות"
            subtitle="הזמנות, מלאי, החזרות"
            onPress={() => router.push('/(tabs)/notifications')}
          />
          {stores.length > 1 && (
            <MenuItem
              icon="storefront-outline"
              title="החלפת חנות"
              subtitle={`${stores.length} חנויות`}
              onPress={handleSwitchStore}
            />
          )}
        </MenuSection>

        {/* Support */}
        <MenuSection title="עזרה">
          <MenuItem
            icon="help-circle-outline"
            title="מרכז עזרה"
            subtitle="ניהול מתקדם דרך האתר"
            onPress={handleOpenHelp}
          />
          <MenuItem
            icon="chatbubble-outline"
            title="צור קשר"
            subtitle="מייל או וואטסאפ"
            onPress={() => setShowContactModal(true)}
          />
        </MenuSection>

        {/* Account */}
        <MenuSection title="חשבון">
          <MenuItem
            icon="person-outline"
            title={user?.name || 'המשתמש שלי'}
            subtitle={user?.email}
            onPress={() => { }}
          />
          <MenuItem
            icon="trash-outline"
            title="מחיקת חשבון"
            subtitle="מחיקה דרך הגדרות האתר"
            onPress={handleDeleteAccount}
            destructive
          />
          <MenuItem
            icon="log-out-outline"
            title={isLoggingOut ? 'מתנתק...' : 'התנתקות'}
            onPress={handleLogout}
            destructive
          />
        </MenuSection>

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>
            QuickShop v{appVersion}
            {buildNumber ? ` (build ${buildNumber})` : ''}
          </Text>
          <Text style={styles.versionSubText}>
            runtime {runtimeVersion} · OTA {updateId}
          </Text>
        </View>
      </ScrollView>

      {/* Contact Modal */}
      <Modal
        visible={showContactModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowContactModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowContactModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>צור קשר</Text>
            <Text style={styles.modalSubtitle}>בחר את הדרך הנוחה לך</Text>

            <TouchableOpacity style={styles.contactOption} onPress={handleContactWhatsApp}>
              <View style={[styles.contactIconContainer, { backgroundColor: '#25D36615' }]}>
                <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>וואטסאפ</Text>
                <Text style={styles.contactDetail}>מענה מהיר</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactOption} onPress={handleContactEmail}>
              <View style={[styles.contactIconContainer, { backgroundColor: dt.colors.brand[50] }]}>
                <Ionicons name="mail-outline" size={24} color={dt.colors.brand[500]} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>אימייל</Text>
                <Text style={styles.contactDetail}>{SUPPORT_EMAIL}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowContactModal(false)}
            >
              <Text style={styles.modalCloseBtnText}>סגור</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    padding: dt.spacing[4],
    paddingBottom: dt.spacing[10],
  },

  // Store Card
  storeCard: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    padding: dt.spacing[4],
    marginBottom: dt.spacing[4],
  },
  storeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dt.spacing[3],
  },
  storeLogo: {
    width: 48,
    height: 48,
    borderRadius: dt.radii.lg,
    backgroundColor: dt.colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeLogoText: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
  },
  storeInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  storeName: {
    fontSize: 17,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[950],
    textAlign: 'right',
  },
  storeUrl: {
    fontSize: 13,
    color: dt.colors.ink[500],
    marginTop: 2,
    textAlign: 'right',
  },

  // Menu Section
  menuSection: {
    marginBottom: dt.spacing[4],
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: dt.colors.ink[500],
    textAlign: 'right',
    writingDirection: 'rtl',
    alignSelf: 'stretch',
    marginBottom: dt.spacing[2],
    paddingHorizontal: dt.spacing[1],
  },
  menuCard: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: dt.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: dt.colors.ink[100],
    gap: dt.spacing[3],
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: dt.radii.md,
    backgroundColor: dt.colors.ink[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
    alignItems: 'flex-start',
  },
  menuTitle: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: dt.colors.ink[950],
    textAlign: 'right',
  },
  menuSubtitle: {
    fontSize: 12,
    color: dt.colors.ink[500],
    marginTop: 2,
    textAlign: 'right',
  },

  // Version
  versionContainer: {
    alignItems: 'center',
    paddingTop: dt.spacing[4],
  },
  versionText: {
    fontSize: 12,
    color: dt.colors.ink[400],
  },
  versionSubText: {
    fontSize: 10,
    color: dt.colors.ink[300],
    marginTop: 2,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: dt.spacing[4],
  },
  modalContent: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.xl,
    padding: dt.spacing[6],
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: dt.colors.ink[950],
    textAlign: 'center',
    marginBottom: dt.spacing[1],
  },
  modalSubtitle: {
    fontSize: 14,
    color: dt.colors.ink[500],
    textAlign: 'center',
    marginBottom: dt.spacing[4],
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: dt.spacing[4],
    backgroundColor: dt.colors.ink[50],
    borderRadius: dt.radii.lg,
    marginBottom: dt.spacing[3],
    gap: dt.spacing[3],
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: dt.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  contactTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[950],
  },
  contactDetail: {
    fontSize: 13,
    color: dt.colors.ink[500],
    marginTop: 2,
  },
  modalCloseBtn: {
    paddingVertical: dt.spacing[3],
    marginTop: dt.spacing[2],
  },
  modalCloseBtnText: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: dt.colors.ink[500],
    textAlign: 'center',
  },
});
