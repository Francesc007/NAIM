import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
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
import { useAuthSession } from '../context/AuthSessionContext';
import { useUser } from '../context/UserContext';
import type { RootStackParamList } from '../navigation/types';
import {
  markOnboardingCompleted,
  saveOnboardingPreferences,
} from '../services/authService';
import { createAnonymousSession, saveOnboardingProfile } from '../services/profileService';
import { startGuestSession } from '../services/identityTransitionService';
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
const NAIM_LOGO = require('../../assets/naim.png');
const LOGO_ASSET = Image.resolveAssetSource(NAIM_LOGO);
const LOGO_MAX_WIDTH = 252;
const LOGO_CORNER_MAX_WIDTH = 50;
const LOGO_IVORY = '#F8F6F2';
const LOGO_INTRINSIC_WIDTH = LOGO_ASSET?.width ?? 1024;
const LOGO_INTRINSIC_HEIGHT = LOGO_ASSET?.height ?? 1024;
const LOGO_DISPLAY = {
  width: LOGO_MAX_WIDTH,
  height: (LOGO_MAX_WIDTH * LOGO_INTRINSIC_HEIGHT) / LOGO_INTRINSIC_WIDTH,
};
const LOGO_CORNER_DISPLAY = {
  width: LOGO_CORNER_MAX_WIDTH,
  height: (LOGO_CORNER_MAX_WIDTH * LOGO_INTRINSIC_HEIGHT) / LOGO_INTRINSIC_WIDTH,
};
const LOGO_CORNER_PLATE = {
  width: LOGO_CORNER_DISPLAY.width + 10,
  height: LOGO_CORNER_DISPLAY.height + 14,
};

const STEP_LABELS = ['Descubrir', 'Personalizar', 'Crear'] as const;

const CARD_GRADIENTS = {
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
        const anonSession = await startGuestSession();
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
          <Text style={[styles.eyebrow, styles.eyebrowProminent, styles.welcomeEyebrow]}>Bienvenida</Text>
          <Text style={[styles.title, styles.welcomeTitle]}>Tu asistente de estilo personal.</Text>
          <Text style={[styles.subtitle, styles.welcomeSubtitle]}>
            NAIM organiza tu guardarropa inteligente y te ayuda a decidir qué ponerte cada día en
            segundos.
          </Text>
        </>
      );
    }

    if (step === 1) {
      return (
        <>
          <Text style={styles.eyebrow}>Personalización</Text>
          <Text style={[styles.title, styles.titlePersonalize]}>Personalización Express</Text>

          <Text style={[styles.fieldLabel, styles.fieldLabelCompact]}>¿Cómo te llamas?</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={[styles.input, styles.inputCompact]}
            placeholder="Tu nombre"
            placeholderTextColor={colors.onSurfaceVariant}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!busy}
          />

          <Text style={[styles.fieldLabel, styles.fieldLabelCompact]}>¿Cuál es tu enfoque actual?</Text>
          <View style={styles.choiceWrap}>
            {STYLE_OPTIONS.map((item) => (
              <Pressable
                key={item}
                onPress={() => setStylePref(item)}
                style={[styles.choiceChip, styles.choiceChipCompact, stylePref === item && styles.choiceChipActive]}
              >
                <Text
                  style={[styles.choiceText, stylePref === item && styles.choiceTextActive]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.fieldLabel, styles.fieldLabelCompact]}>¿Qué clima predomina en tu ciudad?</Text>
          <View style={styles.choiceWrap}>
            {CLIMATE_OPTIONS.map((item) => (
              <Pressable
                key={item}
                onPress={() => setClimatePref(item)}
                style={[styles.choiceChip, styles.choiceChipCompact, climatePref === item && styles.choiceChipActive]}
              >
                <Text
                  style={[styles.choiceText, climatePref === item && styles.choiceTextActive]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={[styles.actionsRow, styles.actionsRowCompact]}>
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
            <Text style={naimButtons.secondaryText}>Atrás</Text>
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
        colors={['rgba(248,249,250,0.68)', 'rgba(248,249,250,0.84)', 'rgba(248,249,250,0.93)']}
        style={[styles.overlay, { paddingTop: insets.top + spacing.xl }]}
      >
        <View style={[styles.topBar, step > 0 && styles.topBarWithLogo]}>
          {step > 0 ? (
            <View
              style={[
                styles.logoCornerCluster,
                {
                  width: LOGO_CORNER_PLATE.width,
                  height: LOGO_CORNER_PLATE.height,
                },
              ]}
            >
              <View
                style={[
                  styles.logoCornerPlate,
                  {
                    width: LOGO_CORNER_PLATE.width,
                    height: LOGO_CORNER_PLATE.height,
                  },
                ]}
              />
              <View
                style={[
                  styles.logoImageFrame,
                  styles.logoCornerImage,
                  {
                    width: LOGO_CORNER_DISPLAY.width,
                    height: LOGO_CORNER_DISPLAY.height,
                  },
                ]}
              >
                <Image
                  source={NAIM_LOGO}
                  style={{
                    width: LOGO_CORNER_DISPLAY.width,
                    height: LOGO_CORNER_DISPLAY.height,
                  }}
                  resizeMode="cover"
                />
              </View>
            </View>
          ) : (
            <View style={styles.topBarLeading} />
          )}
          <Text style={styles.stepCounter}>
            {String(step + 1).padStart(2, '0')} / 03
          </Text>
        </View>

        <VogueProgress step={step} />

        {step === 0 ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[
              styles.welcomeScrollContent,
              { paddingBottom: insets.bottom + spacing.md },
            ]}
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.welcomeColumn}>
              <View style={styles.logoBetweenWrap}>
                <View
                  style={[
                    styles.logoImageFrame,
                    { width: LOGO_DISPLAY.width, height: LOGO_DISPLAY.height },
                  ]}
                >
                  <Image
                    source={NAIM_LOGO}
                    style={{ width: LOGO_DISPLAY.width, height: LOGO_DISPLAY.height }}
                    resizeMode="cover"
                  />
                </View>
              </View>

              <Animated.View
                style={[
                  styles.card,
                  styles.cardWelcomeCompact,
                  {
                    opacity: cardOpacity,
                    transform: [{ translateX: cardTranslate }],
                  },
                ]}
              >
                <LinearGradient
                  colors={[...CARD_GRADIENTS.personalize]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.cardGradient, styles.cardGradientWelcome]}
                >
                  {renderStepContent()}
                </LinearGradient>
              </Animated.View>

              <View style={styles.welcomeActions}>
                <TouchableOpacity
                  style={[naimButtons.primary, styles.welcomeActionButton]}
                  onPress={goNext}
                  activeOpacity={0.85}
                >
                  <Text style={[naimButtons.primaryText, styles.welcomeActionPrimaryText]}>
                    Siguiente
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[naimButtons.secondary, styles.welcomeActionButton]}
                  onPress={() => navigation.navigate('Login')}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[naimButtons.secondaryText, styles.welcomeActionSecondaryText]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.82}
                  >
                    Ya tengo cuenta
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.flex}
          >
            <ScrollView
              contentContainerStyle={[
                styles.content,
                styles.contentWithCornerLogo,
                step === 1 && styles.contentPersonalize,
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={step !== 1}
              bounces={step !== 1}
            >
              <Animated.View
                style={[
                  styles.card,
                  step === 1 && styles.cardPersonalize,
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
                  style={[styles.cardGradient, step === 1 && styles.cardGradientPersonalize]}
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
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  topBarWithLogo: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  topBarLeading: {
    flex: 1,
  },
  logoCornerCluster: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -10,
  },
  logoCornerPlate: {
    position: 'absolute',
    backgroundColor: LOGO_IVORY,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 138, 0.28)',
  },
  logoCornerImage: {
    zIndex: 1,
  },
  logoBetweenWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: spacing.xs,
  },
  welcomeScrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  welcomeColumn: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  welcomeActions: {
    flexDirection: 'row',
    alignSelf: 'center',
    width: '92%',
    maxWidth: 340,
    gap: spacing.xs,
    flexShrink: 0,
  },
  welcomeActionButton: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: spacing.xs,
    minHeight: 42,
  },
  welcomeActionPrimaryText: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  welcomeActionSecondaryText: {
    fontSize: 13,
    letterSpacing: 0.1,
  },
  logoImageFrame: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  stepCounter: {
    fontFamily: typography.fontFamily.vogue,
    fontSize: 20,
    letterSpacing: 3,
    color: '#9A7358',
  },
  progressWrap: {
    marginBottom: spacing.sm,
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
  content: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  contentWithCornerLogo: {
    justifyContent: 'flex-start',
    paddingTop: spacing.xxl,
  },
  contentPersonalize: {
    paddingTop: spacing.xl,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(221, 190, 169, 0.65)',
    ...shadows.elevated,
  },
  cardWelcomeCompact: {
    alignSelf: 'center',
    width: '92%',
    maxWidth: 360,
    flexShrink: 0,
  },
  cardGradientWelcome: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm + 4,
  },
  welcomeEyebrow: {
    fontSize: 12,
    letterSpacing: 2.5,
    marginBottom: 4,
  },
  welcomeTitle: {
    fontSize: 21,
    lineHeight: 27,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 0,
  },
  cardCreate: {
    borderColor: 'rgba(221, 190, 169, 0.7)',
  },
  cardPersonalize: {
    borderColor: 'rgba(221, 190, 169, 0.62)',
  },
  cardGradient: {
    padding: spacing.lg,
  },
  cardGradientPersonalize: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm + 2,
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
  titlePersonalize: {
    fontSize: 26,
    lineHeight: 32,
    marginBottom: spacing.xs,
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
  fieldLabelCompact: {
    marginTop: spacing.sm,
    marginBottom: spacing.xxs,
    fontSize: 13,
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
  inputCompact: {
    paddingVertical: spacing.xs + 2,
    fontSize: 14,
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
  choiceChipCompact: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
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
  actionsRowCompact: {
    marginTop: spacing.md,
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
