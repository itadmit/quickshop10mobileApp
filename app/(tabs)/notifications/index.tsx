import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Linking,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useNotificationSettings, useUpdateNotificationSettings } from '@/hooks';
import {
  Text,
  Badge,
  LoadingScreen,
  designTokens,
  fonts,
} from '@/components/ui';

const dt = designTokens;

interface ToggleRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
}

function ToggleRow({ icon, title, subtitle, value, onValueChange, disabled }: ToggleRowProps) {
  return (
    <View style={[styles.row, disabled && { opacity: 0.5 }]}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={dt.colors.ink[600]} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: dt.colors.ink[200], true: dt.colors.brand[500] }}
        thumbColor="#fff"
        ios_backgroundColor={dt.colors.ink[200]}
      />
    </View>
  );
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <View style={styles.card}>{children}</View>
    </View>
  );
}

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useNotificationSettings();
  const update = useUpdateNotificationSettings();
  const [permissionStatus, setPermissionStatus] = React.useState<Notifications.PermissionStatus | null>(null);

  React.useEffect(() => {
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
    })();
  }, []);

  const settings = data?.settings;
  const masterOff = !!settings && !settings.notificationsEnabled;
  const noPermission = permissionStatus !== null && permissionStatus !== 'granted';
  const noToken = !!settings && !settings.hasPushToken;

  const openSystemSettings = () => {
    Linking.openSettings().catch(() => {});
  };

  const requestPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setPermissionStatus(status);
    if (status !== 'granted') openSystemSettings();
  };

  if (isLoading) {
    return <LoadingScreen message="טוען הגדרות..." />;
  }

  if (isError || !settings) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'התראות', headerShown: true }} />
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>שגיאה בטעינת הגדרות ההתראות</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>נסה שוב</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <Stack.Screen options={{ title: 'התראות', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Permission / token banner */}
        {(noPermission || noToken) && (
          <View style={styles.banner}>
            <Ionicons name="alert-circle" size={20} color={dt.colors.semantic.warning.DEFAULT} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>
                {noPermission ? 'אין הרשאה להתראות' : 'הטוקן לא רשום'}
              </Text>
              <Text style={styles.bannerSubtitle}>
                {noPermission
                  ? `${Platform.OS === 'ios' ? 'iOS' : 'אנדרואיד'} חוסם התראות עד שתאפשר אותן בהגדרות המערכת.`
                  : 'התראות לא יישלחו עד שהמכשיר יירשם מחדש (התחבר ועליך מחדש).'}
              </Text>
              <TouchableOpacity onPress={noPermission ? requestPermission : openSystemSettings}>
                <Text style={styles.bannerLink}>
                  {noPermission ? 'אפשר התראות' : 'פתח הגדרות מערכת'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Master switch */}
        <Section>
          <ToggleRow
            icon="notifications-outline"
            title="קבלת התראות במכשיר זה"
            subtitle="מתג ראשי - כיבוי משתיק את כל ההתראות"
            value={settings.notificationsEnabled}
            onValueChange={(v) => update.mutate({ notificationsEnabled: v })}
          />
        </Section>

        {/* Per-event toggles */}
        <Section title="סוגי התראות">
          <ToggleRow
            icon="bag-handle-outline"
            title="הזמנות"
            subtitle="הזמנה חדשה, נשלחה, בוטלה, זוכתה"
            value={settings.notifyNewOrders}
            onValueChange={(v) => update.mutate({ notifyNewOrders: v })}
            disabled={masterOff}
          />
          <View style={styles.divider} />
          <ToggleRow
            icon="cube-outline"
            title="מלאי"
            subtitle="מלאי נמוך / אזל מהמלאי"
            value={settings.notifyLowStock}
            onValueChange={(v) => update.mutate({ notifyLowStock: v })}
            disabled={masterOff}
          />
          <View style={styles.divider} />
          <ToggleRow
            icon="return-down-back-outline"
            title="החזרות"
            subtitle="בקשת החזר חדשה"
            value={settings.notifyReturns}
            onValueChange={(v) => update.mutate({ notifyReturns: v })}
            disabled={masterOff}
          />
        </Section>

        {/* Status footer */}
        <View style={styles.statusRow}>
          <Badge variant={settings.hasPushToken ? 'success' : 'default'} size="sm">
            {settings.hasPushToken ? 'טוקן פעיל' : 'אין טוקן'}
          </Badge>
          {permissionStatus === 'granted' && (
            <Badge variant="success" size="sm">הרשאה ✓</Badge>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dt.colors.surface.background,
  },
  scroll: {
    padding: dt.spacing[4],
    gap: dt.spacing[4],
  },

  // Banner
  banner: {
    flexDirection: 'row',
    gap: dt.spacing[3],
    padding: dt.spacing[4],
    borderRadius: dt.radii.lg,
    backgroundColor: dt.colors.semantic.warning.light,
    borderWidth: 1,
    borderColor: dt.colors.semantic.warning.DEFAULT,
  },
  bannerTitle: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[900],
    textAlign: 'right',
  },
  bannerSubtitle: {
    fontSize: 12,
    color: dt.colors.ink[600],
    marginTop: 2,
    textAlign: 'right',
  },
  bannerLink: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: dt.colors.brand[500],
    marginTop: dt.spacing[2],
    textAlign: 'right',
  },

  // Section
  section: {
    gap: dt.spacing[2],
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: dt.colors.ink[500],
    paddingHorizontal: dt.spacing[1],
    textAlign: 'right',
  },
  card: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    overflow: 'hidden',
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: dt.spacing[3],
    paddingHorizontal: dt.spacing[4],
    gap: dt.spacing[3],
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: dt.colors.ink[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: dt.colors.ink[900],
    textAlign: 'right',
  },
  rowSubtitle: {
    fontSize: 12,
    color: dt.colors.ink[500],
    marginTop: 2,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: dt.colors.ink[100],
    marginStart: 56,
  },

  // Status footer
  statusRow: {
    flexDirection: 'row',
    gap: dt.spacing[2],
    justifyContent: 'center',
    paddingTop: dt.spacing[2],
  },

  // Error
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: dt.spacing[6],
    gap: dt.spacing[3],
  },
  errorText: {
    fontSize: 14,
    color: dt.colors.semantic.danger.DEFAULT,
    textAlign: 'center',
  },
  retryBtn: {
    paddingVertical: dt.spacing[2],
    paddingHorizontal: dt.spacing[4],
    borderRadius: dt.radii.md,
    backgroundColor: dt.colors.brand[500],
  },
  retryText: {
    color: '#fff',
    fontFamily: fonts.semiBold,
  },
});
