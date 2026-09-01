import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { ChoiceChips, Metric, ParameterRow, PrimaryButton, Screen, Surface } from '@/components/ui';
import { useFramePilot } from '@/contexts/app-context';
import { getScenario } from '@/data/scenarios';
import { defaultContext, generateRecommendation } from '@/lib/recommendation-engine';
import { palette, radius, spacing } from '@/theme';
import type { CreativeIntent, LightLevel, MotionLevel, ShootingContext } from '@/types/photography';

const lightOptions: Array<{ value: LightLevel; label: string }> = [
  { value: 'bright', label: 'Bright sun' }, { value: 'overcast', label: 'Overcast' }, { value: 'golden', label: 'Golden hour' },
  { value: 'indoor', label: 'Indoor' }, { value: 'low', label: 'Low light' }, { value: 'night', label: 'Night' },
];
const motionOptions: Array<{ value: MotionLevel; label: string }> = [{ value: 'still', label: 'Still' }, { value: 'slow', label: 'Slow' }, { value: 'fast', label: 'Fast' }, { value: 'erratic', label: 'Erratic' }];
const intentOptions: Array<{ value: CreativeIntent; label: string }> = [{ value: 'freeze', label: 'Freeze action' }, { value: 'balanced', label: 'Balanced' }, { value: 'motion', label: 'Show motion' }];

export default function ScenarioDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scenario = getScenario(params.id);
  const { gear, saveSetup, setActiveScenarioId } = useFramePilot();
  const [context, setContext] = useState<ShootingContext>(() => defaultContext(scenario));
  const [expanded, setExpanded] = useState<string[]>(['Exposure', 'Focus & capture']);
  const [saveName, setSaveName] = useState(`${scenario.name} setup`);
  const [savedMessage, setSavedMessage] = useState('');
  const recommendation = useMemo(() => generateRecommendation(scenario, context, gear), [context, gear, scenario]);

  useEffect(() => { setActiveScenarioId(scenario.id); }, [scenario.id, setActiveScenarioId]);

  async function save() {
    await saveSetup(saveName.trim() || `${scenario.name} setup`, recommendation, context);
    setSavedMessage('Saved to your private setup library.');
  }

  return <Screen>
    <View style={styles.nav}><Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.navTitle}>Field setup</Text><View style={styles.navSpacer} /></View>
    <View style={styles.hero}><View style={styles.heroIcon}><Text style={styles.heroIconText}>{scenario.icon}</Text></View><Text style={styles.kicker}>{scenario.category.replace('-', ' ').toUpperCase()}</Text><Text style={styles.title}>{scenario.name}</Text><Text style={styles.description}>{scenario.shortDescription}</Text></View>

    <Surface style={styles.adjustments}><Text style={styles.adjustmentTitle}>Match the real conditions</Text><Text style={styles.adjustmentCopy}>These controls recalculate exposure and supporting camera decisions.</Text>
      <ChoiceChips label="Available light" value={context.light} options={lightOptions} onChange={(light) => setContext({ ...context, light })} />
      <ChoiceChips label="Subject motion" value={context.motion} options={motionOptions} onChange={(motion) => setContext({ ...context, motion })} />
      <ChoiceChips label="Creative intent" value={context.intent} options={intentOptions} onChange={(intent) => setContext({ ...context, intent })} />
      <ChoiceChips label="Final output" value={context.output} options={[{ value: 'social', label: 'Social/web' }, { value: 'standard', label: 'General' }, { value: 'large-print', label: 'Large print' }]} onChange={(output) => setContext({ ...context, output })} />
      <View style={styles.switchRow}><View><Text style={styles.switchLabel}>Handheld shooting</Text><Text style={styles.switchHint}>Uses focal length, crop factor, and stabilisation.</Text></View><Switch value={context.handheld} onValueChange={(handheld) => setContext({ ...context, handheld })} trackColor={{ false: palette.line, true: '#6B3C2A' }} thumbColor={context.handheld ? palette.accent : palette.textMuted} /></View>
      <View style={styles.switchRow}><View><Text style={styles.switchLabel}>Flash is allowed</Text><Text style={styles.switchHint}>Recommendations still respect scenario conventions.</Text></View><Switch value={context.flashAllowed} onValueChange={(flashAllowed) => setContext({ ...context, flashAllowed })} trackColor={{ false: palette.line, true: '#6B3C2A' }} thumbColor={context.flashAllowed ? palette.accent : palette.textMuted} /></View>
    </Surface>

    <View style={styles.resultHeader}><Text style={styles.resultKicker}>RECOMMENDED STARTING POINT</Text><Text style={styles.resultHeadline}>{recommendation.headline}</Text></View>
    <View style={styles.metrics}><Metric label="Aperture" value={recommendation.aperture} accent /><Metric label="Shutter" value={recommendation.shutter} /><Metric label="ISO target" value={recommendation.isoEstimate.toLocaleString()} /></View>

    {recommendation.cautions.length ? <Surface style={styles.caution}><Text style={styles.cautionTitle}>Check before shooting</Text>{recommendation.cautions.map((item) => <Text style={styles.cautionText} key={item}>• {item}</Text>)}</Surface> : null}

    <View style={styles.groups}><Text style={styles.groupLabel}>COMPLETE CAMERA SETUP</Text>{recommendation.groups.map((group) => {
      const open = expanded.includes(group.title);
      return <Surface key={group.title} style={styles.groupCard}><Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setExpanded((items) => open ? items.filter((item) => item !== group.title) : [...items, group.title])} style={styles.groupHeader}><View style={styles.groupTitleRow}><Text style={styles.groupIcon}>{group.icon}</Text><View><Text style={styles.groupTitle}>{group.title}</Text><Text style={styles.groupCount}>{group.parameters.length} parameters</Text></View></View><Text style={styles.expand}>{open ? '−' : '+'}</Text></Pressable>{open ? <View>{group.parameters.map((parameter) => <ParameterRow key={`${group.title}-${parameter.label}`} {...parameter} />)}</View> : null}</Surface>;
    })}</View>

    <Surface><Text style={styles.groupTitle}>Field checklist</Text>{recommendation.checklist.map((item, index) => <View style={styles.checkRow} key={item}><View style={styles.checkNumber}><Text style={styles.checkNumberText}>{index + 1}</Text></View><Text style={styles.checkText}>{item}</Text></View>)}</Surface>

    <Surface style={styles.saveCard}><Text style={styles.groupTitle}>Save this setup</Text><Text style={styles.adjustmentCopy}>Keep the calculated settings and the exact conditions that produced them.</Text><TextInput accessibilityLabel="Setup name" value={saveName} onChangeText={setSaveName} style={styles.saveInput} placeholder="Setup name" placeholderTextColor="#687579" /><PrimaryButton label="Save to my library" icon="◇" onPress={() => void save()} />{savedMessage ? <Text style={styles.savedMessage}>{savedMessage}</Text> : null}</Surface>
    <Text style={styles.disclaimer}>Field guidance, not a guarantee. Light quality, camera behaviour, and the subject can require different settings. Verify exposure and focus on location.</Text>
  </Screen>;
}

const styles = StyleSheet.create({
  nav: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, back: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface }, backText: { marginTop: -3, color: palette.text, fontSize: 30, fontWeight: '300' }, navTitle: { color: palette.textMuted, fontSize: 12, fontWeight: '800', letterSpacing: 0.8 }, navSpacer: { width: 42 },
  hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md }, heroIcon: { width: 74, height: 74, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.accentSoft, borderWidth: 1, borderColor: '#6B3C2A' }, heroIconText: { color: palette.accent, fontSize: 34 }, kicker: { marginTop: spacing.sm, color: palette.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.6 }, title: { color: palette.text, fontSize: 36, lineHeight: 42, fontWeight: '800', letterSpacing: -1.2, textAlign: 'center' }, description: { maxWidth: 540, color: palette.textMuted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  adjustments: { gap: spacing.xl }, adjustmentTitle: { color: palette.text, fontSize: 19, fontWeight: '800' }, adjustmentCopy: { color: palette.textMuted, fontSize: 12, lineHeight: 18 }, switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.lg }, switchLabel: { color: palette.text, fontSize: 13, fontWeight: '700' }, switchHint: { maxWidth: 270, color: palette.textMuted, fontSize: 10, lineHeight: 15 },
  resultHeader: { alignItems: 'center', gap: spacing.sm }, resultKicker: { color: palette.accent, fontSize: 9, fontWeight: '800', letterSpacing: 1.4 }, resultHeadline: { maxWidth: 620, color: palette.text, fontSize: 20, lineHeight: 28, fontWeight: '800', textAlign: 'center' }, metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  caution: { borderColor: '#705C2E', backgroundColor: '#2C2719' }, cautionTitle: { color: palette.warning, fontSize: 13, fontWeight: '800' }, cautionText: { color: '#E6D5A8', fontSize: 11, lineHeight: 17 },
  groups: { gap: spacing.md }, groupLabel: { color: palette.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1.4 }, groupCard: { paddingVertical: spacing.md }, groupHeader: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, groupTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, groupIcon: { width: 30, color: palette.accent, fontSize: 20, textAlign: 'center' }, groupTitle: { color: palette.text, fontSize: 16, fontWeight: '800' }, groupCount: { color: palette.textMuted, fontSize: 10 }, expand: { color: palette.accent, fontSize: 23 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.sm }, checkNumber: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceSoft }, checkNumberText: { color: palette.accent, fontSize: 9, fontWeight: '800' }, checkText: { flex: 1, color: palette.textMuted, fontSize: 12, lineHeight: 18 },
  saveCard: { backgroundColor: '#151E21' }, saveInput: { height: 50, paddingHorizontal: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.ink, color: palette.text }, savedMessage: { color: palette.mint, fontSize: 11, textAlign: 'center' },
  disclaimer: { color: '#687579', fontSize: 10, lineHeight: 16, textAlign: 'center', paddingHorizontal: spacing.xl },
});
