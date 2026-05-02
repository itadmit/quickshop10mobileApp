import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, fonts, designTokens } from '@/components/ui';
import { useAppStore } from '@/stores';
import { useAuthStore } from '@/stores/auth';
import { hapticSelection } from '@/lib/utils/haptics';

const dt = designTokens;

// Tab icons
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const iconMap: Record<string, { name: keyof typeof Ionicons.glyphMap; outline: keyof typeof Ionicons.glyphMap }> = {
    index: { name: 'home', outline: 'home-outline' },
    orders: { name: 'cube', outline: 'cube-outline' },
    products: { name: 'bag', outline: 'bag-outline' },
    customers: { name: 'people', outline: 'people-outline' },
    pos: { name: 'card', outline: 'card-outline' },
    more: { name: 'ellipsis-horizontal', outline: 'ellipsis-horizontal-outline' },
  };

  const icon = iconMap[name] || { name: 'apps', outline: 'apps-outline' };
  const iconName = focused ? icon.name : icon.outline;

  return (
    <Ionicons
      name={iconName}
      size={22}
      color={focused ? dt.colors.brand[500] : dt.colors.ink[400]}
    />
  );
}

export default function TabsLayout() {
  const unreadNotifications = useAppStore((s) => s.unreadNotifications);
  const activePlugins = useAuthStore((s) => s.activePlugins);
  const hasPOS = activePlugins.includes('pos');
  const insets = useSafeAreaInsets();
  const tabBarHeight = 40 + Math.max(insets.bottom, 4);

  return (
    <Tabs
      screenListeners={{ tabPress: () => hapticSelection() }}
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        headerTitleStyle: {
          fontFamily: fonts.bold,
          fontSize: 17,
          color: dt.colors.ink[950],
        },
        headerStyle: {
          backgroundColor: dt.colors.surface.card,
          shadowColor: 'transparent',
          elevation: 0,
          borderBottomWidth: 0,
        },
        tabBarStyle: {
          backgroundColor: dt.colors.surface.card,
          borderTopColor: dt.colors.ink[100],
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: Math.max(insets.bottom, 4),
          paddingTop: 4,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.medium,
          fontSize: 11,
        },
        tabBarActiveTintColor: dt.colors.brand[500],
        tabBarInactiveTintColor: dt.colors.ink[400],
        tabBarPosition: 'bottom',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'בית',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon name="index" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'הזמנות',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon name="orders" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'מוצרים',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon name="products" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: 'לקוחות',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon name="customers" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="pos"
        options={{
          title: 'קופה',
          headerShown: false,
          href: hasPOS ? '/(tabs)/pos' : null,
          tabBarIcon: ({ focused }) => <TabIcon name="pos" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'עוד',
          headerTitle: 'עוד',
          tabBarIcon: ({ focused }) => (
            <View>
              <TabIcon name="more" focused={focused} />
              {unreadNotifications > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="discounts"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="returns"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    end: -10,
    backgroundColor: dt.colors.semantic.danger.DEFAULT,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: dt.colors.surface.onBrand,
    fontSize: 10,
    fontFamily: fonts.bold,
  },
});
