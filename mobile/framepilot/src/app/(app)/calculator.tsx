import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { ChoiceChips, Metric, Pill, PrimaryButton, Screen, SectionTitle, Stepper, Surface, TopBar } from '@/components/ui';
import { useFramePilot } from '@/contexts/app-context';
import { scenarios } from '@/data/scenarios';
import { defaultContext, generateRecommendation } from '@/lib/recommendation-engine';
import { palette, spacing } from '@/theme';
import type { CreativeIntent, LightLevel, MotionLevel, SensorFormat } from '@/types/photography';

export default function CalculatorScreen() {
  const router = useRouter();
  const { gear, setGear, activeScenarioId, setActiveScenarioId } = useFramePilot();
  const scenario = scenarios.find((item) => item.id === activeScenarioId) ?? scenarios[0];
  const [context, setContext] = useState(() => defaultContext(scenario));
  const recommendation = useMemo(() => generateRecommendation(scenario, context, gear), [context, gear, scenario]);

  function chooseScenario(id: string) {
    const next = scenarios.find((item) => item.id === id) ?? scenarios[0];
    setActiveScenarioId(next.id); setContext(defaultContext(next));
  }

  return <Screen>
    <TopBar eyebrow="LIVE ENGINE" title="Adjust" />
    <SectionTitle title="Tune the recommendation" description="Change the variables that matter in the field. The engine continuously recalculates exposure and supporting camera choices." />

    <View style={styles.block}><Text style={styles.label}>SCENARIO</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scenarios}>{scenarios.map((item) => <Pill key={item.id} label={`${item.icon} ${item.name}`} selected={scenario.id === item.id} onPress={() => chooseScenario(item.id)} />)}</ScrollView></View>

    <Surface style={styles.controls}>
      <ChoiceChips<LightLevel> label="Light" value={context.light} options={[{ value: 'bright', label: 'Bright' }, { value: 'overcast', label: 'Overcast' }, { value: 'golden', label: 'Golden' }, { value: 'indoor', label: 'Indoor' }, { value: 'low', label: 'Low' }, { value: 'night', label: 'Night' }]} onChange={(light) => setContext({ ...context, light })} />
      <ChoiceChips<MotionLevel> label="Movement" value={context.motion} options={[{ value: 'still', label: 'Still' }, { value: 'slow', label: 'Slow' }, { value: 'fast', label: 'Fast' }, { value: 'erratic', label: 'Erratic' }]} onChange={(motion) => setContext({ ...context, motion })} />
      <ChoiceChips<CreativeIntent> label="Intent" value={context.intent} options={[{ value: 'freeze', label: 'Freeze' }, { value: 'balanced', label: 'Balanced' }, { value: 'motion', label: 'Show motion' }]} onChange={(intent) => setContext({ ...context, intent })} />
    </Surface>

    <Surface style={styles.controls}>
      <Text style={styles.surfaceTitle}>Gear and support</Text>
      <ChoiceChips<SensorFormat> label="Sensor format" value={gear.sensor} options={[{ value: 'full-frame', label: 'Full frame' }, { value: 'aps-c', label: 'APS-C' }, { value: 'micro-four-thirds', label: 'Micro 4/3' }, { value: 'one-inch', label: '1 inch' }]} onChange={(sensor) => setGear({ ...gear, sensor })} />
      <View style={styles.steppers}><Stepper label="Focal length" value={gear.focalLength} suffix=" mm" min={12} max={1200} step={5} onChange={(focalLength) => setGear({ ...gear, focalLength })} /><Stepper label="Maximum aperture" value={gear.maxAperture} suffix="" min={1.2} max={16} step={0.1} onChange={(maxAperture) => setGear({ ...gear, maxAperture })} /><Stepper label="Stabilisation" value={gear.stabilizationStops} suffix=" stops" min={0} max={8} step={1} onChange={(stabilizationStops) => setGear({ ...gear, stabilizationStops })} /></View>
      <View style={styles.switchRow}><View><Text style={styles.switchLabel}>Handheld</Text><Text style={styles.switchHint}>Applies crop and stabilisation to the minimum safe shutter.</Text></View><Switch value={context.handheld} onValueChange={(handheld) => setContext({ ...context, handheld })} trackColor={{ false: palette.line, true: '#6B3C2A' }} thumbColor={context.handheld ? palette.accent : palette.textMuted} /></View>
      <View style={styles.switchRow}><View><Text style={styles.switchLabel}>Flash available</Text><Text style={styles.switchHint}>Enables fill, bounce, HSS, and sync guidance where appropriate.</Text></View><Switch value={gear.flashAvailable} onValueChange={(flashAvailable) => setGear({ ...gear, flashAvailable })} trackColor={{ false: palette.line, true: '#6B3C2A' }} thumbColor={gear.flashAvailable ? palette.accent : palette.textMuted} /></View>
    </Surface>

    <View style={styles.output}><Text style={styles.outputKicker}>LIVE STARTING POINT</Text><Text style={styles.outputName}>{scenario.name}</Text><View style={styles.metrics}><Metric label="Aperture" value={recommendation.aperture} accent /><Metric label="Shutter" value={recommendation.shutter} /><Metric label="ISO target" value={recommendation.isoEstimate.toLocaleString()} /></View><Text style={styles.headline}>{recommendation.headline}</Text></View>

    <Surface><Text style={styles.surfaceTitle}>Why it changed</Text>{recommendation.groups[0].parameters.slice(0, 5).map((parameter) => <View style={styles.reason} key={parameter.label}><Text style={styles.reasonLabel}>{parameter.label}</Text><View style={styles.reasonCopy}><Text style={styles.reasonValue}>{parameter.value}</Text><Text style={styles.reasonText}>{parameter.reason}</Text></View></View>)}</Surface>
    <PrimaryButton label="Open all parameters" icon="◎" onPress={() => router.push({ pathname: '/scenario/[id]', params: { id: scenario.id } })} />
  </Screen>;
}

const styles = StyleSheet.create({
  block: { gap: spacing.sm }, label: { color: palette.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1.4 }, scenarios: { gap: spacing.sm, paddingRight: spacing.lg }, controls: { gap: spacing.xl }, surfaceTitle: { color: palette.text, fontSize: 17, fontWeight: '800' },
  steppers: { gap: spacing.lg }, switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.lg }, switchLabel: { color: palette.text, fontSize: 13, fontWeight: '700' }, switchHint: { maxWidth: 285, color: palette.textMuted, fontSize: 10, lineHeight: 15 },
  output: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md }, outputKicker: { color: palette.accent, fontSize: 9, fontWeight: '800', letterSpacing: 1.4 }, outputName: { color: palette.text, fontSize: 27, fontWeight: '800' }, metrics: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginVertical: spacing.md }, headline: { color: palette.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  reason: { paddingVertical: spacing.md, flexDirection: 'row', gap: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.line }, reasonLabel: { width: 90, color: palette.textMuted, fontSize: 11, fontWeight: '700' }, reasonCopy: { flex: 1, gap: 3 }, reasonValue: { color: palette.text, fontSize: 12, fontWeight: '800' }, reasonText: { color: '#788689', fontSize: 10, lineHeight: 15 },
});
