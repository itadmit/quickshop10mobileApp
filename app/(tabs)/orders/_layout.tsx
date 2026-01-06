import { Stack } from 'expo-router';
import { colors, fonts } from '@/components/ui';

export default function OrdersLayout() {
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
        animation: 'slide_from_left',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'הזמנות',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'פרטי הזמנה',
        }}
      />
    </Stack>
  );
}

