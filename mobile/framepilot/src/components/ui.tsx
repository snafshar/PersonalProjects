import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette, radius, spacing } from '@/theme';
import type { Scenario } from '@/types/photography';

export function Screen({ children, scroll = true, contentStyle, ...props }: PropsWithChildren<ScrollViewProps & { scroll?: boolean; contentStyle?: ViewStyle }>) {
  return <SafeAreaView style={styles.safe} edges={['top']}>
    {scroll ? <ScrollView {...props} contentContainerStyle={[styles.screenContent, contentStyle]} showsVerticalScrollIndicator={false}>{children}</ScrollView> : <View style={[styles.screenContent, styles.flex, contentStyle]}>{children}</View>}
  </SafeAreaView>;
}

export function BrandMark({ small = false }: { small?: boolean }) {
  return <View style={[styles.brandMark, small && styles.brandMarkSmall]}><View style={styles.apertureOne} /><View style={styles.apertureTwo} /><View style={styles.apertureDot} /></View>;
}

export function TopBar({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return <View style={styles.topBar}><View style={styles.topIdentity}><BrandMark small /><View>{eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}<Text style={styles.topTitle}>{title}</Text></View></View>{action}</View>;
}

export function SectionTitle({ kicker, title, description, action }: { kicker?: string; title: string; description?: string; action?: ReactNode }) {
  return <View style={styles.sectionHeading}><View style={styles.headingCopy}>{kicker ? <Text style={styles.eyebrow}>{kicker}</Text> : null}<Text style={styles.sectionTitle}>{title}</Text>{description ? <Text style={styles.sectionDescription}>{description}</Text> : null}</View>{action}</View>;
}

export function Surface({ children, style }: PropsWithChildren<{ style?: ViewStyle | ViewStyle[] }>) {
  return <View style={[styles.surface, style]}>{children}</View>;
}

export function Pill({ label, selected = false, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.pill, selected && styles.pillSelected, pressed && styles.pressed]}><Text style={[styles.pillText, selected && styles.pillTextSelected]}>{label}</Text></Pressable>;
}

export function ChoiceChips<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Array<{ value: T; label: string }>; onChange: (value: T) => void }) {
  return <View style={styles.choiceGroup}><Text style={styles.fieldLabel}>{label}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>{options.map((option) => <Pill key={option.value} label={option.label} selected={value === option.value} onPress={() => onChange(option.value)} />)}</ScrollView></View>;
}

export function PrimaryButton({ label, onPress, disabled = false, icon }: { label: string; onPress: () => void; disabled?: boolean; icon?: string }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.primaryButton, disabled && styles.disabled, pressed && styles.pressed]}><Text style={styles.primaryButtonText}>{icon ? `${icon}  ` : ''}{label}</Text></Pressable>;
}

export function SecondaryButton({ label, onPress, danger = false }: { label: string; onPress: () => void; danger?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={[styles.secondaryButtonText, danger && { color: palette.error }]}>{label}</Text></Pressable>;
}

export function ScenarioCard({ scenario, onPress, compact = false }: { scenario: Scenario; onPress: () => void; compact?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`Open ${scenario.name}`} onPress={onPress} style={({ pressed }) => [styles.scenarioCard, compact && styles.scenarioCardCompact, pressed && styles.pressed]}>
    <View style={styles.scenarioIcon}><Text style={styles.scenarioIconText}>{scenario.icon}</Text></View>
    <View style={styles.scenarioCopy}><Text style={styles.scenarioCategory}>{scenario.category.replace('-', ' ').toUpperCase()}</Text><Text style={styles.scenarioName}>{scenario.name}</Text>{compact ? null : <Text style={styles.scenarioDescription}>{scenario.shortDescription}</Text>}</View>
    <Text style={styles.chevron}>›</Text>
  </Pressable>;
}

export function Metric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <View style={[styles.metric, accent && styles.metricAccent]}><Text style={styles.metricLabel}>{label}</Text><Text style={[styles.metricValue, accent && styles.metricValueAccent]} numberOfLines={2}>{value}</Text></View>;
}

export function ParameterRow({ label, value, reason }: { label: string; value: string; reason: string }) {
  return <View style={styles.parameterRow}><View style={styles.parameterTop}><Text style={styles.parameterLabel}>{label}</Text><Text style={styles.parameterValue}>{value}</Text></View><Text style={styles.parameterReason}>{reason}</Text></View>;
}

export function Stepper({ label, value, suffix, min, max, step, onChange }: { label: string; value: number; suffix?: string; min: number; max: number; step: number; onChange: (value: number) => void }) {
  return <View style={styles.stepper}><Text style={styles.fieldLabel}>{label}</Text><View style={styles.stepperControl}><Pressable accessibilityLabel={`Decrease ${label}`} onPress={() => onChange(Math.max(min, Number((value - step).toFixed(1))))} style={styles.stepButton}><Text style={styles.stepButtonText}>−</Text></Pressable><Text style={styles.stepValue}>{value}{suffix}</Text><Pressable accessibilityLabel={`Increase ${label}`} onPress={() => onChange(Math.min(max, Number((value + step).toFixed(1))))} style={styles.stepButton}><Text style={styles.stepButtonText}>+</Text></Pressable></View></View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, safe: { flex: 1, backgroundColor: palette.ink },
  screenContent: { paddingHorizontal: spacing.lg, paddingBottom: 116, gap: spacing.xl, width: '100%', maxWidth: 760, alignSelf: 'center' },
  topBar: { minHeight: 64, paddingTop: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topIdentity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  brandMark: { width: 68, height: 68, borderRadius: 22, backgroundColor: palette.accent, position: 'relative', overflow: 'hidden' },
  brandMarkSmall: { width: 38, height: 38, borderRadius: 13 },
  apertureOne: { position: 'absolute', width: '72%', height: '35%', top: '8%', left: '-4%', backgroundColor: palette.ink, transform: [{ rotate: '-20deg' }], borderRadius: 18 },
  apertureTwo: { position: 'absolute', width: '72%', height: '35%', bottom: '7%', right: '-6%', backgroundColor: palette.ink, transform: [{ rotate: '-20deg' }], borderRadius: 18 },
  apertureDot: { position: 'absolute', width: '22%', aspectRatio: 1, borderRadius: 99, backgroundColor: palette.text, top: '39%', left: '39%' },
  eyebrow: { color: palette.accent, fontSize: 10, lineHeight: 14, fontWeight: '800', letterSpacing: 1.5 },
  topTitle: { color: palette.text, fontSize: 19, lineHeight: 24, fontWeight: '700', letterSpacing: -0.4 },
  sectionHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.lg },
  headingCopy: { flex: 1, gap: spacing.xs }, sectionTitle: { color: palette.text, fontSize: 27, lineHeight: 33, fontWeight: '700', letterSpacing: -0.8 },
  sectionDescription: { color: palette.textMuted, fontSize: 14, lineHeight: 21, maxWidth: 620 },
  surface: { padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, gap: spacing.md },
  pill: { minHeight: 38, paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface },
  pillSelected: { backgroundColor: palette.accentSoft, borderColor: palette.accent }, pillText: { color: palette.textMuted, fontSize: 12, fontWeight: '700' }, pillTextSelected: { color: palette.accent },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] }, disabled: { opacity: 0.45 },
  choiceGroup: { gap: spacing.sm }, fieldLabel: { color: palette.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' }, chipRow: { gap: spacing.sm, paddingRight: spacing.lg },
  primaryButton: { minHeight: 52, borderRadius: radius.md, backgroundColor: palette.accent, paddingHorizontal: spacing.xl, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: palette.ink, fontSize: 14, fontWeight: '800' },
  secondaryButton: { minHeight: 46, borderRadius: radius.md, borderWidth: 1, borderColor: palette.line, paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface },
  secondaryButtonText: { color: palette.text, fontSize: 13, fontWeight: '700' },
  scenarioCard: { minHeight: 118, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface },
  scenarioCardCompact: { minHeight: 78, paddingVertical: spacing.md }, scenarioIcon: { width: 48, height: 48, borderRadius: 17, backgroundColor: palette.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
  scenarioIconText: { color: palette.accent, fontSize: 22, fontWeight: '600' }, scenarioCopy: { flex: 1, gap: 3 }, scenarioCategory: { color: palette.accent, fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  scenarioName: { color: palette.text, fontSize: 17, lineHeight: 22, fontWeight: '700' }, scenarioDescription: { color: palette.textMuted, fontSize: 12, lineHeight: 18 }, chevron: { color: palette.textMuted, fontSize: 26, fontWeight: '300' },
  metric: { minHeight: 82, minWidth: 126, flex: 1, padding: spacing.md, justifyContent: 'space-between', borderRadius: radius.md, backgroundColor: palette.surfaceSoft },
  metricAccent: { backgroundColor: palette.accentSoft, borderWidth: 1, borderColor: '#6B3C2A' }, metricLabel: { color: palette.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  metricValue: { color: palette.text, fontSize: 16, lineHeight: 20, fontWeight: '800' }, metricValueAccent: { color: palette.accent },
  parameterRow: { paddingVertical: spacing.md, gap: 5, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.line }, parameterTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.lg },
  parameterLabel: { flex: 0.42, color: palette.textMuted, fontSize: 12, lineHeight: 18, fontWeight: '700' }, parameterValue: { flex: 0.58, color: palette.text, fontSize: 13, lineHeight: 19, fontWeight: '700', textAlign: 'right' },
  parameterReason: { color: '#788689', fontSize: 11, lineHeight: 17 }, stepper: { gap: spacing.sm }, stepperControl: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: radius.md, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface },
  stepButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }, stepButtonText: { color: palette.accent, fontSize: 24, fontWeight: '500' }, stepValue: { color: palette.text, fontSize: 15, fontWeight: '800' },
});

export const sharedStyles = styles;
