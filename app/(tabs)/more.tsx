import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useAuth } from '@/hooks';
import { useAuthStore } from '@/stores';
import {
  Text,
  Card,
  Badge,
  colors,
  spacing,
  borderRadius,
} from '@/components/ui';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  badge?: string;
  onPress: () => void;
}

function MenuItem({ icon, title, subtitle, badge, onPress }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
      {badge && (
        <Badge variant="error" size="sm">
          {badge}
        </Badge>
      )}
      <View style={styles.menuContent}>
        <Text weight="medium" style={{ textAlign: 'right' }}>{title}</Text>
        {subtitle && (
          <Text color="secondary" size="sm" style={{ textAlign: 'right' }}>
            {subtitle}
          </Text>
        )}
      </View>
      <Ionicons name={icon} size={20} color={colors.textSecondary} style={styles.menuIcon} />
    </TouchableOpacity>
  );
}

function MenuSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View style={styles.menuSection}>
      {title && (
        <View style={styles.sectionTitleContainer}>
          <Text color="secondary" size="sm" style={styles.sectionTitle}>
            {title}
          </Text>
        </View>
      )}
      <Card padding={0}>{children}</Card>
    </View>
  );
}

export default function MoreScreen() {
  const router = useRouter();
  const { logout, isLoggingOut } = useAuth();
  const { currentStore, user, stores } = useAuthStore();

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

  const handleOpenWebDashboard = () => {
    if (currentStore) {
      Linking.openURL(`https://quickshop.co.il/dashboard`);
    }
  };

  const handleSupport = () => {
    Linking.openURL('mailto:support@quickshop.co.il');
  };

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Store */}
        <Card style={styles.storeCard}>
          <View style={styles.storeHeader}>
            <View style={styles.storeLogo}>
              <Text style={{ fontSize: 24, color: colors.white }}>
                {currentStore?.name.charAt(0) || '?'}
              </Text>
            </View>
            <View style={styles.storeInfo}>
              <Text weight="bold" size="lg">
                {currentStore?.name || 'החנות שלי'}
              </Text>
              <Text color="secondary" size="sm">
                {currentStore?.slug}.quickshop.co.il
              </Text>
            </View>
          </View>
        </Card>

        {/* Management */}
        <MenuSection title="ניהול">
          <MenuItem
            icon="pricetag-outline"
            title="קופונים והנחות"
            onPress={() => Alert.alert('בקרוב', 'תכונה זו תהיה זמינה בקרוב')}
          />
          <MenuItem
            icon="stats-chart-outline"
            title="דוחות ואנליטיקס"
            onPress={() => Alert.alert('בקרוב', 'תכונה זו תהיה זמינה בקרוב')}
          />
          <MenuItem
            icon="refresh-outline"
            title="החזרות והחלפות"
            onPress={() => Alert.alert('בקרוב', 'תכונה זו תהיה זמינה בקרוב')}
          />
          <MenuItem
            icon="star-outline"
            title="משפיענים"
            onPress={() => Alert.alert('בקרוב', 'תכונה זו תהיה זמינה בקרוב')}
          />
        </MenuSection>

        {/* Settings */}
        <MenuSection title="הגדרות">
          <MenuItem
            icon="settings-outline"
            title="הגדרות חנות"
            subtitle="לניהול מתקדם עבור לאתר"
            onPress={handleOpenWebDashboard}
          />
          <MenuItem
            icon="notifications-outline"
            title="הגדרות התראות"
            onPress={() => Alert.alert('בקרוב', 'תכונה זו תהיה זמינה בקרוב')}
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
            onPress={() => Linking.openURL('https://quickshop.co.il/help')}
          />
          <MenuItem
            icon="chatbubble-outline"
            title="צור קשר"
            subtitle="support@quickshop.co.il"
            onPress={handleSupport}
          />
        </MenuSection>

        {/* Account */}
        <MenuSection title="חשבון">
          <MenuItem
            icon="person-outline"
            title={user?.name || 'המשתמש שלי'}
            subtitle={user?.email}
            onPress={() => {}}
          />
          <TouchableOpacity
            style={[styles.menuItem, styles.logoutItem]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} style={styles.menuIcon} />
            <View style={styles.menuContent}>
              <Text weight="medium" color="error">
                {isLoggingOut ? 'מתנתק...' : 'התנתקות'}
              </Text>
            </View>
          </TouchableOpacity>
        </MenuSection>

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text color="muted" size="sm" center>
            QuickShop Mobile v{appVersion}
          </Text>
          <Text color="muted" size="xs" center style={{ marginTop: spacing[1] }}>
            © 2026 QuickShop. כל הזכויות שמורות.
          </Text>
        </View>
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
    paddingBottom: spacing[10],
  },
  storeCard: {
    marginBottom: spacing[4],
  },
  storeHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  storeLogo: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeInfo: {
    flex: 1,
    marginRight: spacing[3],
  },
  menuSection: {
    marginBottom: spacing[4],
  },
  sectionTitleContainer: {
    alignItems: 'flex-start', // ב-RTL, flex-end = ימין המסך
    marginBottom: spacing[2],
  },
  sectionTitle: {
    textAlign: 'right',
    marginRight: spacing[2],
  },
  menuItem: {
    flexDirection: 'row-reverse', // ב-RTL, row = ימין לשמאל (חץ מימין, תוכן, אייקון משמאל)
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuIcon: {
    marginRight: spacing[3], // ב-RTL, marginRight = שמאל המסך
  },
  menuContent: {
    flex: 1,
    alignItems: 'flex-start', // יישור טקסט לימין
  },
  menuArrow: {
    fontSize: 16,
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  versionContainer: {
    marginTop: spacing[4],
    padding: spacing[4],
  },
});

