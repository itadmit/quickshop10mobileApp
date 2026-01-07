import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks';
import { Text, Title, Button, Input, colors, spacing, borderRadius, shadows } from '@/components/ui';

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
    <SafeAreaView style={styles.container} edges={['top']}>
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
            <Text style={styles.title}>QuickShop</Text>
            <Text color="secondary" style={styles.subtitle}>
              ניהול החנות שלך מכל מקום
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <View style={styles.formTitleContainer}>
              <Text weight="bold" size="xl" style={styles.formTitle}>
                התחברות
              </Text>
            </View>
            <View style={styles.formSubtitleContainer}>
              <Text color="secondary" style={styles.formSubtitle}>
                היכנס לחשבון שלך כדי להמשיך
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.formInputs}>
                <Input
                  label="אימייל"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    clearError();
                  }}
                  placeholder="your@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoggingIn}
                />
              </View>

              <View style={styles.formInputs}>
                <Input
                  label="סיסמה"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    clearError();
                  }}
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isLoggingIn}
                  rightIcon={
                    <Ionicons 
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                      size={20} 
                      color={colors.gray400} 
                    />
                  }
                  onRightIconPress={() => setShowPassword(!showPassword)}
                />
              </View>

              {loginError && (
                <View style={styles.errorContainer}>
                  <Text color="error" style={styles.errorText}>
                    {loginError}
                  </Text>
                  <Ionicons name="alert-circle" size={16} color={colors.error} />
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
                התחבר לחשבון
              </Button>

              <TouchableOpacity style={styles.forgotPassword}>
                <Text size="sm" style={{ color: '#00785C' }}>
                  שכחת סיסמה?
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity>
              <Text
                size="sm"
                weight="semiBold"
                style={{ color: '#00785C', textAlign: 'center' }}
              >
                צור חנות חדשה
              </Text>
            </TouchableOpacity>
            <Text color="secondary" size="sm" style={{ textAlign: 'center' }}>
              {' '}אין לך חשבון?
            </Text>
          </View>

          {/* Version */}
          <View style={styles.version}>
            <Text color="secondary" size="xs" style={{ textAlign: 'center' }}>
              v.3.0.1
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
    backgroundColor: '#F6F6F7',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing[6],
    justifyContent: 'center',
    minHeight: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  title: {
    fontSize: 48,
    fontFamily: 'Pacifico_400Regular',
    marginBottom: spacing[2],
    textAlign: 'center',
    color: '#00785C',
    letterSpacing: 1,
  },
  subtitle: {
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    marginBottom: spacing[6],
    borderWidth: 1,
    borderColor: '#E1E3E5',
    ...shadows.base,
  },
  formTitleContainer: {
    alignItems: 'flex-end', // ב-RTL, flex-end = ימין המסך
    marginBottom: spacing[1],
  },
  formTitle: {
    textAlign: 'right',
    color: '#202223',
  },
  formSubtitleContainer: {
    alignItems: 'flex-end', // ב-RTL, flex-end = ימין המסך
    marginBottom: spacing[6],
  },
  formSubtitle: {
    textAlign: 'right',
  },
  form: {
    gap: spacing[4],
    
  },
  formInputs: {
    
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    padding: spacing[3],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row', // ב-RTL, row = ימין לשמאל (טקסט מימין, אייקון משמאל)
    alignItems: 'center',
    gap: spacing[2],
  },
  errorText: {
    flex: 1,
    textAlign: 'right',
  },
  loginButton: {
    marginTop: spacing[2],
    backgroundColor: '#00785C',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: spacing[2],
  },
  footer: {
    flexDirection: 'column-reverse', // ב-RTL, row = ימין לשמאל
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  version: {
    alignItems: 'center',
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
  },
});

