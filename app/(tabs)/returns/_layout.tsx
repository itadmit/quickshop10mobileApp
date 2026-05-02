import { Stack } from 'expo-router';

export default function ReturnsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_left' }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
      <Stack.Screen name="pending" options={{ headerShown: false }} />
    </Stack>
  );
}
