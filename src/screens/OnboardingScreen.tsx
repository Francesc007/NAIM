import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NaimDialog } from '../components/NaimDialog';
import { APP_NAME } from '../constants/mockData';
import { useAuthSession } from '../context/AuthSessionContext';
import { useUser } from '../context/UserContext';
import type { RootStackParamList } from '../navigation/types';
import {
  markOnboardingCompleted,
  saveOnboardingPreferences,
} from '../services/authService';
import { createAnonymousSession, saveOnboardingProfile } from '../services/profileService';
import { colors, naimButtons, radius, shadows, spacing, typography } from '../theme';

type StyleOption = 'Casual' | 'Formal' | 'Negocios' | 'Sport';
type ClimateOption = 'Cálido' | 'Templado' | 'Frío';

const STYLE_OPTIONS: StyleOption[] = ['Casual', 'Formal', 'Negocios', 'Sport'];
const CLIMATE_OPTIONS: ClimateOption[] = ['Cálido', 'Templado', 'Frío'];

const STEP_BACKGROUNDS = [
  require('../../assets/hero/ropa.jpg'),
  require('../../assets/hero/t-shirt.jpg'),
  require('../../assets/hero/jeans.jpg'),
] as const;

const STEP_LABELS = ['Descubrir', 'Personalizar', 'Crear'] as const;

const CARD_GRADIENTS = {
  welcome: [
    'rgba(255, 247, 240, 0.98)',
    'rgba(248, 232, 218, 0.94)',
    'rgba(255, 252, 249, 0.97)',
  ],
  personalize: [
    'rgba(255, 255, 255, 0.98)',
    'rgba(253, 250, 247, 0.97)',
    'rgba(255, 255, 255, 0.98)',
  ],
  create: [
    'rgba(255, 255, 255, 0.98)',
    'rgba(252, 249, 246, 0.97)',
    'rgba(255, 255, 255, 0.98)',
  ],
} as const;

const SLIDE_OFFSET = 28;
const ANIM_DURATION = 340;

function VogueProgress({ step }: { step: number }) {
  const fillAnim = useRef(new Animated.Value(step / 2)).current;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: step / 2,
      duration: ANIM_DURATION,
      useNativeDriver: false,
    }).start();
  }, [fillAnim, step]);

  const fillWidth = fillAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0%', '50%', '100%'],
  });

  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: fillWidth }]} />
      </View>
      <View style={styles.progressLabels}>
        {STEP_LABELS.map((label, index) => {
          const active = index === step;
          const done = index < step;
          return (
            <View key={label} style={styles.progressLabelItem}>
              <View
                style={[
                  styles.progressDot,
                  (active || done) && styles.progressDotActive,
                ]}
              />
              <Text
                style={[
                  styles.progressLabelText,
                  active && styles.progressLabelTextActive,
                  done && !active && styles.progressLabelTextDone,
                ]}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function OnboardingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { session, applySession } = useAuthSession();
  const { setUserName } = useUser();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [stylePref, setStylePref] = useState<StyleOption>('Casual');
  const [climatePref, setClimatePref] = useState<ClimateOption>('Templado');
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: '',
    message: '',
  });
  const hasInitializedSession = useRef(false);

  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardTranslate = useRef(new Animated.Value(0)).current;
  const bgOpacities = useRef(STEP_BACKGROUNDS.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;

  const animateStepChange = (nextStep: number, direction: 'forward' | 'back') => {
    const outOffset = direction === 'forward' ? -SLIDE_OFFSET : SLIDE_OFFSET;
    const inOffset = direction === 'forward' ? SLIDE_OFFSET : -SLIDE_OFFSET;

    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: ANIM_DURATION * 0.45,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslate, {
        toValue: outOffset,
        duration: ANIM_DURATION * 0.45,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(nextStep);

      bgOpacities.forEach((anim, index) => {
        Animated.timing(anim, {
          toValue: index === nextStep ? 1 : 0,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }).start();
      });

      cardTranslate.setValue(inOffset);
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
        Animated.spring(cardTranslate, {
          toValue: 0,
          friction: 9,
          tension: 68,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const goNext = () => {
    if (step >= 2) return;
    animateStepChange(step + 1, 'forward');
  };

  const goBack = () => {
    if (step <= 0) return;
    animateStepChange(step - 1, 'back');
  };

  useEffect(() => {
    if (hasInitializedSession.current) return;
    hasInitializedSession.current = true;

    void (async () => {
      if (session) return;
      try {
        const anonSession = await createAnonymousSession();
        applySession(anonSession);
      } catch (err) {
        setDialog({
          visible: true,
          title: 'No pudimos iniciar',
          message:
            err instanceof Error
              ? err.message
              : 'Hubo un problema iniciando la sesión. Reinténtalo.',
        });
      }
    })();
  }, [applySession, session]);

  const finishOnboarding = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setDialog({
        visible: true,
        title: 'Nombre requerido',
        message: 'Cuéntanos cómo quieres que te saludemos para personalizar tu experiencia.',
      });
      return;
    }

    setBusy(true);
    try {
      await saveOnboardingProfile({
        name: trimmed,
        stylePreference: stylePref,
        climatePreference: climatePref,
      });
      await saveOnboardingPreferences(stylePref, climatePref);
      await markOnboardingCompleted();
      await setUserName(trimmed);

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        })
      );
    } catch (err) {
      setDialog({
        visible: true,
        title: 'No pudimos completar',
        message:
          err instanceof Error
            ? err.message
            : 'Inténtalo de nuevo en un momento para finalizar el onboarding.',
      });
    } finally {
      setBusy(false);
    }
  };

  const renderStepContent = () => {
    if (step === 0) {
      return (
        <>
          <Text style={[styles.eyebrow, styles.eyebrowProminent]}>Bienvenida</Text>
          <Text style={styles.title}>Tu asistente de estilo personal.</Text>
          <Text style={styles.subtitle}>
            NAIM organiza tu guardarropa inteligente y te ayuda a decidir qué ponerte cada día en
            segundos.
          </Text>
          <TouchableOpacity
            style={[naimButtons.primary, styles.mainAction]}
            onPress={goNext}
            activeOpacity={0.85}
          >
            <Text style={naimButtons.primaryText}>Siguiente</Text>
          </TouchableOpacity>
        </>
      );
    }

    if (step === 1) {
      return (
        <>
          <Text style={styles.eyebrow}>Personalización</Text>
          <Text style={styles.title}>Personalización Express</Text>

          <Text style={styles.fieldLabel}>¿Cómo te llamas?</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholder="Tu nombre"
            placeholderTextColor={colors.onSurfaceVariant}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!busy}
          />

          <Text style={styles.fieldLabel}>¿Cuál es tu enfoque actual?</Text>
          <View style={styles.choiceWrap}>
            {STYLE_OPTIONS.map((item) => (
              <Pressable
                key={item}
                onPress={() => setStylePref(item)}
                style={[styles.choiceChip, stylePref === item && styles.choiceChipActive]}
              >
                <Text
                  style={[styles.choiceText, stylePref === item && styles.choiceTextActive]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.fieldLabel}>¿Qué clima predomina en tu ciudad?</Text>
          <View style={styles.choiceWrap}>
            {CLIMATE_OPTIONS.map((item) => (
              <Pressable
                key={item}
                onPress={() => setClimatePref(item)}
                style={[styles.choiceChip, climatePref === item && styles.choiceChipActive]}
              >
                <Text
                  style={[styles.choiceText, climatePref === item && styles.choiceTextActive]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[naimButtons.secondary, naimButtons.actionInRow]}
              onPress={goBack}
              activeOpacity={0.8}
            >
              <Text style={naimButtons.secondaryText}>Atrás</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[naimButtons.primary, naimButtons.actionInRow]}
              onPress={goNext}
              activeOpacity={0.85}
            >
              <Text style={naimButtons.primaryText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </>
      );
    }

    return (
      <>
        <Text style={styles.eyebrow}>Listo</Text>
        <Text style={styles.title}>Todo listo para transformar tu estilo.</Text>
        <Text style={styles.subtitle}>
          Hemos creado un guardarropa único para ti. Comienza a subir tus prendas favoritas.
        </Text>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryLine}>Nombre: {name.trim() || '—'}</Text>
          <Text style={styles.summaryLine}>Estilo: {stylePref}</Text>
          <Text style={styles.summaryLine}>Clima: {climatePref}</Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[naimButtons.secondary, styles.editAction]}
            onPress={goBack}
            activeOpacity={0.8}
            disabled={busy}
          >
            <Text style={naimButtons.secondaryText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[naimButtons.primary, styles.createAction, busy && styles.disabled]}
            onPress={() => void finishOnboarding()}
            activeOpacity={0.85}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text
                style={[naimButtons.primaryText, naimButtons.actionCompactText]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                Empezar a Crear
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </>
    );
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.backgroundStack}>
        {STEP_BACKGROUNDS.map((source, index) => (
          <Animated.View
            key={index}
            style={[StyleSheet.absoluteFill, { opacity: bgOpacities[index] }]}
          >
            <ImageBackground source={source} style={styles.background} resizeMode="cover" />
          </Animated.View>
        ))}
      </View>

      <LinearGradient
        colors={['rgba(248,249,250,0.72)', 'rgba(248,249,250,0.88)', 'rgba(248,249,250,0.97)']}
        style={[styles.overlay, { paddingTop: insets.top + spacing.xl }]}
      >
        <View style={styles.topBar}>
          <View style={styles.brandWrap}>
            <Text style={styles.brand}>{APP_NAME}</Text>
          </View>
          <Text style={styles.stepCounter}>
            {String(step + 1).padStart(2, '0')} / 03
          </Text>
        </View>

        <VogueProgress step={step} />

        {step === 0 ? (
          <View style={styles.welcomeBody}>
            <Animated.View
              style={[
                styles.card,
                styles.cardWelcome,
                {
                  opacity: cardOpacity,
                  transform: [{ translateX: cardTranslate }],
                },
              ]}
            >
              <LinearGradient
                colors={[...CARD_GRADIENTS.welcome]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                {renderStepContent()}
              </LinearGradient>
            </Animated.View>
          </View>
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.flex}
          >
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              <Animated.View
                style={[
                  styles.card,
                  step === 2 && styles.cardCreate,
                  {
                    opacity: cardOpacity,
                    transform: [{ translateX: cardTranslate }],
                  },
                ]}
              >
                <LinearGradient
                  colors={[...(step === 1 ? CARD_GRADIENTS.personalize : CARD_GRADIENTS.create)]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardGradient}
                >
                  {renderStepContent()}
                </LinearGradient>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </LinearGradient>

      <NaimDialog
        visible={dialog.visible}
        title={dialog.title}
        message={dialog.message}
        tone="info"
        primaryText="Entendido"
        onDismiss={() => setDialog((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  flex: {
    flex: 1,
  },
  backgroundStack: {
    ...StyleSheet.absoluteFillObject,
  },
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  brandWrap: {
    alignSelf: 'flex-start',
    paddingBottom: 2,
  },
  brand: {
    fontFamily: typography.fontFamily.vogue,
    fontSize: 40,
    letterSpacing: 16,
    lineHeight: 46,
    color: colors.textPrimary,
    transform: [{ scaleY: 1.28 }],
    transformOrigin: 'left top',
    includeFontPadding: false,
  },
  stepCounter: {
    fontFamily: typography.fontFamily.vogue,
    fontSize: 20,
    letterSpacing: 3,
    color: '#9A7358',
  },
  progressWrap: {
    marginBottom: spacing.lg,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(201, 168, 138, 0.45)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#A67C52',
    borderRadius: 2,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  progressLabelItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(166, 124, 82, 0.4)',
    marginBottom: 8,
  },
  progressDotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#A67C52',
  },
  progressLabelText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    letterSpacing: 0.4,
    color: '#6B5344',
  },
  progressLabelTextActive: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 15,
    color: '#8B5E3C',
  },
  progressLabelTextDone: {
    fontFamily: typography.fontFamily.regular,
    color: '#7A5C47',
  },
  welcomeBody: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: spacing.xl,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(221, 190, 169, 0.65)',
    ...shadows.elevated,
  },
  cardWelcome: {
    borderColor: 'rgba(201, 168, 138, 0.75)',
    shadowColor: '#A67C52',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 6,
  },
  cardCreate: {
    borderColor: 'rgba(221, 190, 169, 0.7)',
  },
  cardGradient: {
    padding: spacing.lg,
  },
  createAction: {
    flex: 1.35,
    minWidth: 0,
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
  },
  editAction: {
    flex: 0.85,
    minWidth: 0,
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
  },
  eyebrow: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 13,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: colors.primaryVariant,
    marginBottom: spacing.xs,
  },
  eyebrowProminent: {
    fontSize: 16,
    letterSpacing: 4,
    color: '#9A7358',
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: typography.fontFamily.vogue,
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: 1.1,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    lineHeight: 23,
    color: colors.textSecondary,
  },
  fieldLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
  },
  choiceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  choiceChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  choiceChipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primaryVariant,
  },
  choiceText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  choiceTextActive: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.semiBold,
  },
  actionsRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  mainAction: {
    marginTop: spacing.lg,
  },
  summaryBox: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
    gap: spacing.xs,
  },
  summaryLine: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  disabled: {
    opacity: 0.7,
  },
});
