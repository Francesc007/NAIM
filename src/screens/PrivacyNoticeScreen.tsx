import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PRIVACY_NOTICE } from '../constants/privacyNotice';
import { colors, radius, spacing, typography } from '../theme';

export function PrivacyNoticeScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.updated}>Última actualización: {PRIVACY_NOTICE.lastUpdated}</Text>

        {PRIVACY_NOTICE.sections.map((section) => (
          <View key={section.heading} style={styles.block}>
            <Text style={styles.heading}>{section.heading}</Text>
            <Text style={styles.body}>{section.body}</Text>
          </View>
        ))}

        <Text style={styles.footer}>
          Este aviso es informativo para la versión demo de NAIM. Antes del lanzamiento comercial,
          revisa el texto con asesoría legal en México.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  updated: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.regular,
    marginBottom: spacing.lg,
  },
  block: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  heading: {
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.semiBold,
    marginBottom: spacing.xs,
    letterSpacing: 0.2,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.regular,
  },
  footer: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.onSurfaceVariant,
    fontFamily: typography.fontFamily.light,
    fontStyle: 'italic',
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.md,
  },
});
