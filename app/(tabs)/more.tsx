import React from 'react';
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
  icon: string;
  title: string;
  subtitle?: string;
  badge?: string;
  onPress: () => void;
}

function MenuItem({ icon, title, subtitle, badge, onPress }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <View style={styles.menuContent}>
        <Text weight="medium">{title}</Text>
        {subtitle && (
          <Text color="secondary" size="sm">
            {subtitle}
          </Text>
        )}
      </View>
      {badge && (
        <Badge variant="error" size="sm">
          {badge}
        </Badge>
      )}
      <Text color="muted" style={styles.menuArrow}>
        ←
      </Text>
    </TouchableOpacity>
  );
}

function MenuSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View style={styles.menuSection}>
      {title && (
        <Text color="secondary" size="sm" style={styles.sectionTitle}>
          {title}
        </Text>
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
            icon="🏷️"
            title="קופונים והנחות"
            onPress={() => Alert.alert('בקרוב', 'תכונה זו תהיה זמינה בקרוב')}
          />
          <MenuItem
            icon="📊"
            title="דוחות ואנליטיקס"
            onPress={() => Alert.alert('בקרוב', 'תכונה זו תהיה זמינה בקרוב')}
          />
          <MenuItem
            icon="🔄"
            title="החזרות והחלפות"
            onPress={() => Alert.alert('בקרוב', 'תכונה זו תהיה זמינה בקרוב')}
          />
          <MenuItem
            icon="👑"
            title="משפיענים"
            onPress={() => Alert.alert('בקרוב', 'תכונה זו תהיה זמינה בקרוב')}
          />
        </MenuSection>

        {/* Settings */}
        <MenuSection title="הגדרות">
          <MenuItem
            icon="⚙️"
            title="הגדרות חנות"
            subtitle="לניהול מתקדם עבור לאתר"
            onPress={handleOpenWebDashboard}
          />
          <MenuItem
            icon="🔔"
            title="הגדרות התראות"
            onPress={() => Alert.alert('בקרוב', 'תכונה זו תהיה זמינה בקרוב')}
          />
          {stores.length > 1 && (
            <MenuItem
              icon="🏪"
              title="החלפת חנות"
              subtitle={`${stores.length} חנויות`}
              onPress={handleSwitchStore}
            />
          )}
        </MenuSection>

        {/* Support */}
        <MenuSection title="עזרה">
          <MenuItem
            icon="❓"
            title="מרכז עזרה"
            onPress={() => Linking.openURL('https://quickshop.co.il/help')}
          />
          <MenuItem
            icon="💬"
            title="צור קשר"
            subtitle="support@quickshop.co.il"
            onPress={handleSupport}
          />
        </MenuSection>

        {/* Account */}
        <MenuSection title="חשבון">
          <MenuItem
            icon="👤"
            title={user?.name || 'המשתמש שלי'}
            subtitle={user?.email}
            onPress={() => {}}
          />
          <TouchableOpacity
            style={[styles.menuItem, styles.logoutItem]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <Text style={styles.menuIcon}>🚪</Text>
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
  sectionTitle: {
    marginBottom: spacing[2],
    marginRight: spacing[2],
  },
  menuItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuIcon: {
    fontSize: 20,
    marginLeft: spacing[3],
  },
  menuContent: {
    flex: 1,
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

