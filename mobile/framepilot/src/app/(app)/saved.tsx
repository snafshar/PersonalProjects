import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, Screen, SectionTitle, Surface, TopBar } from '@/components/ui';
import { useFramePilot } from '@/contexts/app-context';
import { palette, spacing } from '@/theme';

export default function SavedScreen() {
  const router = useRouter();
  const { saved, savedLoading, deleteSetup } = useFramePilot();

  return <Screen>
    <TopBar eyebrow="PRIVATE LIBRARY" title="Saved setups" />
    <SectionTitle title="Keep the setups worth returning to." description="Saved entries preserve the recommendation, field conditions, and gear profile used at that moment." />
    {savedLoading ? <View style={styles.loading}><ActivityIndicator color={palette.accent} /><Text style={styles.muted}>Synchronising your library…</Text></View> : null}
    {!savedLoading && !saved.length ? <Surface style={styles.empty}><Text style={styles.emptyIcon}>◇</Text><Text style={styles.emptyTitle}>No saved setups yet</Text><Text style={styles.muted}>Open a scenario, adjust it to the scene, and save the result here.</Text><PrimaryButton label="Browse scenarios" onPress={() => router.push('/scenarios')} /></Surface> : null}
    <View style={styles.list}>{saved.map((setup) => <Surface key={setup.id} style={styles.card}>
      <View style={styles.cardTop}><View style={styles.cardCopy}><Text style={styles.kicker}>{setup.recommendation.scenarioName.toUpperCase()}</Text><Text style={styles.name}>{setup.name}</Text><Text style={styles.date}>{new Date(setup.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</Text></View><Pressable accessibilityLabel={`Delete ${setup.name}`} onPress={() => void deleteSetup(setup.id)} style={styles.delete}><Text style={styles.deleteText}>×</Text></Pressable></View>
      <View style={styles.settings}><View><Text style={styles.settingLabel}>APERTURE</Text><Text style={styles.settingValue}>{setup.recommendation.aperture}</Text></View><View><Text style={styles.settingLabel}>SHUTTER</Text><Text style={styles.settingValue}>{setup.recommendation.shutter}</Text></View><View><Text style={styles.settingLabel}>ISO</Text><Text style={styles.settingValue}>≈ {setup.recommendation.isoEstimate.toLocaleString()}</Text></View></View>
      <Text style={styles.context}>{setup.context.light} light · {setup.context.motion} motion · {setup.context.intent} intent</Text>
      <Pressable onPress={() => router.push({ pathname: '/scenario/[id]', params: { id: setup.scenarioId } })}><Text style={styles.open}>Reopen scenario  ›</Text></Pressable>
    </Surface>)}</View>
  </Screen>;
}

const styles = StyleSheet.create({
  loading: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: spacing.md }, muted: { color: palette.textMuted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  empty: { minHeight: 300, alignItems: 'center', justifyContent: 'center', gap: spacing.md }, emptyIcon: { color: palette.accent, fontSize: 36 }, emptyTitle: { color: palette.text, fontSize: 20, fontWeight: '800' },
  list: { gap: spacing.md }, card: { gap: spacing.lg }, cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }, cardCopy: { flex: 1, gap: 3 }, kicker: { color: palette.accent, fontSize: 8, fontWeight: '800', letterSpacing: 1.2 }, name: { color: palette.text, fontSize: 18, fontWeight: '800' }, date: { color: palette.textMuted, fontSize: 10 },
  delete: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceSoft }, deleteText: { color: palette.error, fontSize: 22 },
  settings: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: palette.line }, settingLabel: { color: palette.textMuted, fontSize: 8, fontWeight: '800', letterSpacing: 0.8 }, settingValue: { marginTop: 3, color: palette.text, fontSize: 12, fontWeight: '800' },
  context: { color: palette.textMuted, fontSize: 11, textTransform: 'capitalize' }, open: { color: palette.accent, fontSize: 12, fontWeight: '800' },
});
