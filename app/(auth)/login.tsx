import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks';
import { Text, Title, Button, Input, colors, spacing } from '@/components/ui';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoggingIn, loginError, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    
    try {
      const response = await login(email, password);
      if (response.success) {
        if (response.stores.length > 1) {
          router.replace('/(auth)/store-select');
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Text size="3xl" weight="extraBold" style={{ color: colors.white }}>
                QS
              </Text>
            </View>
            <Title style={styles.title}>QuickShop</Title>
            <Text color="secondary" center>
              ניהול החנות שלך מכל מקום
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="אימייל"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                clearError();
              }}
              placeholder="הזן את האימייל שלך"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoggingIn}
            />

            <Input
              label="סיסמה"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                clearError();
              }}
              placeholder="הזן את הסיסמה שלך"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!isLoggingIn}
              rightIcon={
                <Text color="secondary" size="sm">
                  {showPassword ? 'הסתר' : 'הצג'}
                </Text>
              }
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            {loginError && (
              <View style={styles.errorContainer}>
                <Text color="error" center>
                  {loginError}
                </Text>
              </View>
            )}

            <Button
              onPress={handleLogin}
              loading={isLoggingIn}
              disabled={!email || !password}
              fullWidth
              size="lg"
              style={styles.loginButton}
            >
              התחבר
            </Button>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text color="secondary" size="sm" center>
              אין לך חשבון?{' '}
            </Text>
            <Text
              size="sm"
              weight="semiBold"
              style={{ color: colors.primary }}
            >
              צור חנות חדשה באתר
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing[6],
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing[10],
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  title: {
    marginBottom: spacing[2],
  },
  form: {
    marginBottom: spacing[6],
  },
  errorContainer: {
    backgroundColor: colors.errorLight,
    padding: spacing[3],
    borderRadius: 8,
    marginBottom: spacing[4],
  },
  loginButton: {
    marginTop: spacing[2],
  },
  footer: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

