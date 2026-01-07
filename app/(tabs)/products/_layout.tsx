import { Stack } from 'expo-router';
import { colors, fonts } from '@/components/ui';

export default function ProductsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTitleStyle: {
          fontFamily: fonts.semiBold,
          fontSize: 18,
        },
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'מוצרים',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'פרטי מוצר',
        }}
      />
      <Stack.Screen
        name="scanner"
        options={{
          title: 'סורק ברקוד',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}

