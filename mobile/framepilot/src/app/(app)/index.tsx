import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Metric, ScenarioCard, Screen, SectionTitle, Surface, TopBar } from '@/components/ui';
import { useAuth } from '@/contexts/auth-context';
import { useFramePilot } from '@/contexts/app-context';
import { scenarios } from '@/data/scenarios';
import { defaultContext, generateRecommendation } from '@/lib/recommendation-engine';
import { palette, radius, spacing } from '@/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { gear, saved, activeScenarioId } = useFramePilot();
  const active = scenarios.find((item) => item.id === activeScenarioId) ?? scenarios[0];
  const recommendation = generateRecommendation(active, defaultContext(active), gear);
  const featured = ['portrait-low-light', 'birds-in-flight', 'outdoor-sports', 'landscape-day', 'milky-way'].map((id) => scenarios.find((item) => item.id === id)!).filter(Boolean);
  const openScenario = (id: string) => router.push({ pathname: '/scenario/[id]', params: { id } });
  const firstName = session?.demo ? 'Photographer' : session?.user.email.split('@')[0] || 'Photographer';

  return <Screen>
    <TopBar eyebrow="FRAMEPILOT" title="Field dashboard" action={<View style={styles.accountDot}><Text style={styles.accountInitial}>{firstName[0].toUpperCase()}</Text></View>} />
    <View style={styles.hero}><Text style={styles.greeting}>Ready, {firstName}?</Text><Text style={styles.heroTitle}>Make the settings serve the photograph.</Text><Text style={styles.heroText}>Start from a scenario, then refine for the light, movement, gear, and result you actually have.</Text></View>

    <Pressable onPress={() => openScenario(active.id)} style={({ pressed }) => [styles.activeCard, pressed && { opacity: 0.8 }]}>
      <View style={styles.activeTop}><View><Text style={styles.activeKicker}>CURRENT FIELD SETUP</Text><Text style={styles.activeName}>{active.name}</Text></View><Text style={styles.activeIcon}>{active.icon}</Text></View>
      <View style={styles.metrics}><Metric label="Aperture" value={recommendation.aperture} accent /><Metric label="Shutter" value={recommendation.shutter} /><Metric label="ISO" value={`≈ ${recommendation.isoEstimate.toLocaleString()}`} /></View>
      <Text style={styles.openText}>Open complete setup  ›</Text>
    </Pressable>

    <Surface style={styles.gearStrip}><View style={styles.gearIcon}><Text>◎</Text></View><View style={styles.gearCopy}><Text style={styles.gearLabel}>ACTIVE GEAR PROFILE</Text><Text style={styles.gearName}>{gear.cameraName}</Text><Text style={styles.gearDetails}>{gear.lensName} · {gear.focalLength} mm · max f/{gear.maxAperture}</Text></View><Pressable onPress={() => router.push('/profile')}><Text style={styles.edit}>Edit</Text></Pressable></Surface>

    <View style={styles.statsRow}><Surface style={styles.stat}><Text style={styles.statValue}>{scenarios.length}</Text><Text style={styles.statLabel}>Field scenarios</Text></Surface><Surface style={styles.stat}><Text style={styles.statValue}>{recommendation.groups.reduce((count, group) => count + group.parameters.length, 0)}</Text><Text style={styles.statLabel}>Parameters checked</Text></Surface><Surface style={styles.stat}><Text style={styles.statValue}>{saved.length}</Text><Text style={styles.statLabel}>Saved setups</Text></Surface></View>

    <View style={styles.section}><SectionTitle kicker="QUICK START" title="Common situations" description="Choose a field case and tune it to your conditions." action={<Pressable onPress={() => router.push('/scenarios')}><Text style={styles.seeAll}>See all</Text></Pressable>} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow}>{featured.map((scenario) => <View style={styles.featuredCard} key={scenario.id}><ScenarioCard scenario={scenario} compact onPress={() => openScenario(scenario.id)} /></View>)}</ScrollView>
    </View>

    <View style={styles.section}><SectionTitle kicker="WORKFLOW" title="Three decisions first" /><View style={styles.workflow}><Surface style={styles.workflowItem}><Text style={styles.workflowIndex}>01</Text><Text style={styles.workflowTitle}>Protect the moment</Text><Text style={styles.workflowText}>Choose shutter speed from subject motion before worrying about low ISO.</Text></Surface><Surface style={styles.workflowItem}><Text style={styles.workflowIndex}>02</Text><Text style={styles.workflowTitle}>Shape depth</Text><Text style={styles.workflowText}>Use aperture for the story and focus tolerance, not only maximum blur.</Text></Surface><Surface style={styles.workflowItem}><Text style={styles.workflowIndex}>03</Text><Text style={styles.workflowTitle}>Verify, don’t guess</Text><Text style={styles.workflowText}>Read the histogram, inspect focus, then adapt the recommendation.</Text></Surface></View></View>
  </Screen>;
}

const styles = StyleSheet.create({
  accountDot: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: palette.surfaceSoft }, accountInitial: { color: palette.text, fontSize: 13, fontWeight: '800' },
  hero: { paddingVertical: spacing.md, gap: spacing.sm }, greeting: { color: palette.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1 }, heroTitle: { maxWidth: 540, color: palette.text, fontSize: 35, lineHeight: 41, fontWeight: '800', letterSpacing: -1.3 }, heroText: { maxWidth: 590, color: palette.textMuted, fontSize: 14, lineHeight: 21 },
  activeCard: { padding: spacing.xl, gap: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: '#6B3C2A', backgroundColor: palette.accentSoft }, activeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, activeKicker: { color: palette.accent, fontSize: 9, fontWeight: '800', letterSpacing: 1.4 }, activeName: { marginTop: 5, color: palette.text, fontSize: 24, fontWeight: '800' }, activeIcon: { color: palette.accent, fontSize: 36 }, metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, openText: { color: palette.accent, fontSize: 12, fontWeight: '800' },
  gearStrip: { flexDirection: 'row', alignItems: 'center' }, gearIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceSoft }, gearCopy: { flex: 1 }, gearLabel: { color: palette.textMuted, fontSize: 8, fontWeight: '800', letterSpacing: 1.1 }, gearName: { color: palette.text, fontSize: 14, fontWeight: '800' }, gearDetails: { color: palette.textMuted, fontSize: 11 }, edit: { color: palette.accent, fontSize: 12, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: spacing.sm }, stat: { flex: 1, minHeight: 95, justifyContent: 'space-between', padding: spacing.md }, statValue: { color: palette.text, fontSize: 24, fontWeight: '800' }, statLabel: { color: palette.textMuted, fontSize: 10, lineHeight: 14 },
  section: { gap: spacing.lg }, seeAll: { color: palette.accent, fontSize: 12, fontWeight: '800' }, featuredRow: { gap: spacing.md, paddingRight: spacing.lg }, featuredCard: { width: 290 }, workflow: { gap: spacing.md }, workflowItem: { position: 'relative', paddingLeft: 64 }, workflowIndex: { position: 'absolute', left: spacing.lg, top: spacing.lg, color: palette.accent, fontSize: 11, fontWeight: '800' }, workflowTitle: { color: palette.text, fontSize: 16, fontWeight: '800' }, workflowText: { color: palette.textMuted, fontSize: 12, lineHeight: 18 },
});
