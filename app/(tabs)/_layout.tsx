import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, colors, fonts } from '@/components/ui';
import { useAppStore } from '@/stores';

// Tab icons
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const iconMap: Record<string, { name: keyof typeof Ionicons.glyphMap; outline: keyof typeof Ionicons.glyphMap }> = {
    index: { name: 'home', outline: 'home-outline' },
    orders: { name: 'cube', outline: 'cube-outline' },
    products: { name: 'bag', outline: 'bag-outline' },
    customers: { name: 'people', outline: 'people-outline' },
    more: { name: 'settings', outline: 'settings-outline' },
  };

  const icon = iconMap[name] || { name: 'phone-portrait', outline: 'phone-portrait-outline' };
  const iconName = focused ? icon.name : icon.outline;

  return (
    <Ionicons 
      name={iconName} 
      size={24} 
      color={focused ? colors.primary : colors.gray400} 
    />
  );
}

export default function TabsLayout() {
  const unreadNotifications = useAppStore((s) => s.unreadNotifications);

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerTitleStyle: {
          fontFamily: fonts.semiBold,
          fontSize: 18,
        },
        headerStyle: {
          backgroundColor: colors.surface,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderLight,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.medium,
          fontSize: 11,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray400,
        tabBarPosition: 'bottom',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'בית',
          headerShown: false, // Using custom header in the screen
          tabBarIcon: ({ focused }) => <TabIcon name="index" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'הזמנות',
          headerShown: false, // Has its own stack
          tabBarIcon: ({ focused }) => <TabIcon name="orders" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'מוצרים',
          headerShown: false, // Has its own stack
          tabBarIcon: ({ focused }) => <TabIcon name="products" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: 'לקוחות',
          headerShown: false, // Has its own stack
          tabBarIcon: ({ focused }) => <TabIcon name="customers" focused={focused} />,
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
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
});

