import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, TextInput, View } from 'react-native';

import { Pill, ScenarioCard, Screen, SectionTitle, TopBar } from '@/components/ui';
import { categoryLabels, scenarios } from '@/data/scenarios';
import { palette, radius, spacing } from '@/theme';
import type { ScenarioCategory } from '@/types/photography';

type Filter = 'all' | ScenarioCategory;

export default function ScenariosScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const matches = useMemo(() => scenarios.filter((scenario) => (filter === 'all' || scenario.category === filter) && `${scenario.name} ${scenario.shortDescription} ${scenario.category}`.toLowerCase().includes(query.toLowerCase().trim())), [filter, query]);

  return <Screen>
    <TopBar eyebrow="LIBRARY" title="Scenarios" />
    <SectionTitle title="Start with the photograph, not the dial." description="Every preset is a reasoned starting point. Open one to account for your actual light, subject movement, gear, and creative intent." />
    <TextInput accessibilityLabel="Search scenarios" value={query} onChangeText={setQuery} placeholder="Search portrait, moon, indoor sport…" placeholderTextColor="#667478" style={styles.search} />
    <View style={styles.filters}>{(Object.keys(categoryLabels) as Filter[]).map((item) => <Pill key={item} label={categoryLabels[item]} selected={filter === item} onPress={() => setFilter(item)} />)}</View>
    <View style={styles.results}>{matches.map((scenario) => <ScenarioCard key={scenario.id} scenario={scenario} onPress={() => router.push({ pathname: '/scenario/[id]', params: { id: scenario.id } })} />)}</View>
  </Screen>;
}

const styles = StyleSheet.create({
  search: { height: 52, paddingHorizontal: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, color: palette.text, fontSize: 14 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, results: { gap: spacing.md },
});
