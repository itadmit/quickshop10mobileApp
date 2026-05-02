import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks';
import { Text, Button, Input, designTokens, fonts } from '@/components/ui';

const dt = designTokens;

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

  const openURL = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Hero Header */}
          <SafeAreaView edges={['top']} style={styles.heroSection}>
            <View style={styles.heroContent}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>QuickShop</Text>
              </View>
            </View>
          </SafeAreaView>

          {/* Form Area */}
          <View style={styles.formArea}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>{'\u05D4\u05EA\u05D7\u05D1\u05E8\u05D5\u05EA'}</Text>
              <Text style={styles.formSubtitle}>{'\u05D4\u05D9\u05DB\u05E0\u05E1 \u05DC\u05D7\u05E9\u05D1\u05D5\u05DF \u05E9\u05DC\u05DA \u05DB\u05D3\u05D9 \u05DC\u05D4\u05DE\u05E9\u05D9\u05DA'}</Text>

              <View style={styles.form}>
                <Input
                  label={'\u05D0\u05D9\u05DE\u05D9\u05D9\u05DC'}
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

                <Input
                  label={'\u05E1\u05D9\u05E1\u05DE\u05D4'}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    clearError();
                  }}
                  placeholder={'\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isLoggingIn}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={dt.colors.ink[400]}
                      />
                    </TouchableOpacity>
                  }
                />

                {loginError && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{loginError}</Text>
                    <Ionicons name="alert-circle" size={16} color={dt.colors.semantic.danger.DEFAULT} />
                  </View>
                )}

                <Button
                  onPress={handleLogin}
                  loading={isLoggingIn}
                  disabled={!email || !password}
                  fullWidth
                  size="lg"
                >
                  {'\u05D4\u05EA\u05D7\u05D1\u05E8'}
                </Button>

                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={() => openURL('https://my-quickshop.com/forgot-password')}
                >
                  <Text style={styles.forgotPasswordText}>{'\u05E9\u05DB\u05D7\u05EA \u05E1\u05D9\u05E1\u05DE\u05D4?'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Legal Links */}
            <View style={styles.legalSection}>
              <Text style={styles.legalNote}>
                {'\u05D1\u05D4\u05EA\u05D7\u05D1\u05E8\u05D5\u05EA \u05D0\u05EA\u05D4 \u05DE\u05E1\u05DB\u05D9\u05DD \u05DC\u05EA\u05E0\u05D0\u05D9 \u05D4\u05E9\u05D9\u05DE\u05D5\u05E9 \u05D5\u05DE\u05D3\u05D9\u05E0\u05D9\u05D5\u05EA \u05D4\u05E4\u05E8\u05D8\u05D9\u05D5\u05EA \u05E9\u05DC\u05E0\u05D5'}
              </Text>
              <View style={styles.legalLinks}>
                <TouchableOpacity onPress={() => openURL('https://my-quickshop.com/privacy')}>
                  <Text style={styles.legalLink}>{'\u05DE\u05D3\u05D9\u05E0\u05D9\u05D5\u05EA \u05E4\u05E8\u05D8\u05D9\u05D5\u05EA'}</Text>
                </TouchableOpacity>
                <Text style={styles.legalSeparator}> {'\u2022'} </Text>
                <TouchableOpacity onPress={() => openURL('https://my-quickshop.com/terms')}>
                  <Text style={styles.legalLink}>{'\u05EA\u05E0\u05D0\u05D9 \u05E9\u05D9\u05DE\u05D5\u05E9'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dt.colors.surface.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Hero
  heroSection: {
    backgroundColor: dt.colors.surface.background,
    paddingBottom: dt.spacing[6],
  },
  heroContent: {
    alignItems: 'center',
    paddingTop: dt.spacing[10],
    paddingBottom: dt.spacing[4],
  },
  logoContainer: {
    marginBottom: dt.spacing[2],
  },
  logoText: {
    fontSize: 42,
    fontFamily: 'Pacifico_400Regular',
    color: dt.colors.brand[500],
    letterSpacing: 1,
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: dt.colors.ink[500],
    marginTop: dt.spacing[2],
    textAlign: 'right',
  },

  // Form Area
  formArea: {
    flex: 1,
    paddingHorizontal: dt.spacing[5],
  },
  formCard: {
    backgroundColor: dt.colors.surface.card,
    borderRadius: dt.radii.lg,
    borderWidth: 1,
    borderColor: dt.colors.ink[200],
    padding: dt.spacing[6],
  },
  formTitle: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: dt.colors.ink[950],
    textAlign: 'right',
    writingDirection: 'rtl',
    alignSelf: 'flex-start',
    marginBottom: dt.spacing[1],
  },
  formSubtitle: {
    fontSize: 14,
    color: dt.colors.ink[400],
    textAlign: 'right',
    writingDirection: 'rtl',
    alignSelf: 'flex-start',
    marginBottom: dt.spacing[6],
  },
  form: {
    gap: dt.spacing[2],
  },
  errorContainer: {
    backgroundColor: dt.colors.semantic.danger.light,
    padding: dt.spacing[3],
    borderRadius: dt.radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: dt.spacing[2],
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: dt.colors.semantic.danger.DEFAULT,
    textAlign: 'right',
  },
  forgotPassword: {
    alignItems: 'center',
    paddingVertical: dt.spacing[2],
  },
  forgotPasswordText: {
    fontSize: 14,
    color: dt.colors.brand[500],
    fontFamily: fonts.medium,
  },

  // Legal
  legalSection: {
    alignItems: 'center',
    marginTop: dt.spacing[4],
    paddingBottom: dt.spacing[6],
    gap: dt.spacing[2],
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dt.spacing[1],
  },
  legalLink: {
    fontSize: 12,
    color: dt.colors.ink[400],
    fontFamily: fonts.medium,
  },
  legalSeparator: {
    fontSize: 12,
    color: dt.colors.ink[400],
  },
  legalNote: {
    fontSize: 11,
    color: dt.colors.ink[400],
    textAlign: 'center',
    lineHeight: 16,
  },
});
