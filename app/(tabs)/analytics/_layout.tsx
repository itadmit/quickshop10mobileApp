import { Stack } from 'expo-router';

export default function AnalyticsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="sales" />
      <Stack.Screen name="products" />
      <Stack.Screen name="customers" />
      <Stack.Screen name="inventory" />
      <Stack.Screen name="coupons" />
    </Stack>
  );
}
