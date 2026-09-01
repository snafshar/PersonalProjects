import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { ChoiceChips, Screen, SecondaryButton, SectionTitle, Stepper, Surface, TopBar } from '@/components/ui';
import { useAuth } from '@/contexts/auth-context';
import { useFramePilot } from '@/contexts/app-context';
import { palette, radius, spacing } from '@/theme';
import type { SensorFormat } from '@/types/photography';

const glossary = [
  ['Exposure', 'Mode, aperture, shutter, ISO range/ceiling, minimum Auto ISO shutter, compensation, metering, histogram, zebras, bracketing.'],
  ['Focus', 'AF-S/AF-C/manual, area, tracking, subject recognition, eye priority, focus limiter, priority balance, magnification, peaking.'],
  ['Capture', 'Single/burst/timer, pre-capture, mechanical/electronic shutter, front curtain, anti-flicker, variable shutter, buffer and card speed.'],
  ['Colour & files', 'White balance, Kelvin/custom reference, RAW compression, bit depth, JPEG/HEIF, colour space, creative look, dynamic-range strategy.'],
  ['Lens & stability', 'Focal length, crop factor, handheld limit, IBIS/OSS modes, tripod behaviour, ND/polariser, corrections, diffraction and focus stacking.'],
  ['Light', 'Ambient balance, TTL/manual flash, compensation, native sync, HSS, slow/rear sync, bounce, diffusion, continuous light and reflector use.'],
  ['Video', 'Frame rate, 180° shutter, codec/bit depth, picture profile/log, ND, stabilisation, focus transition, audio level and monitoring.'],
  ['Field safety', 'Weather protection, condensation, battery, storage, dual-card backup, sensor/lens checks, legal/ethical restrictions and subject welfare.'],
] as const;

export default function ProfileScreen() {
  const { session, configured, signOut } = useAuth();
  const { gear, setGear } = useFramePilot();
  const [savedNotice, setSavedNotice] = useState('');

  async function leave() {
    const run = async () => { await signOut(); };
    if (session?.demo) { await run(); return; }
    Alert.alert('Sign out?', 'Your cloud setups remain attached to your account.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign out', style: 'destructive', onPress: () => void run() }]);
  }

  return <Screen>
    <TopBar eyebrow="ACCOUNT & GEAR" title="Profile" />
    <Surface style={styles.account}><View style={styles.avatar}><Text style={styles.avatarText}>{session?.user.email[0]?.toUpperCase() || 'P'}</Text></View><View style={styles.accountCopy}><Text style={styles.email}>{session?.user.email}</Text><Text style={styles.status}>{session?.demo ? 'Demo session · local saves only' : configured ? 'Authenticated · cloud sync enabled' : 'Local session'}</Text></View></Surface>

    <SectionTitle kicker="GEAR PROFILE" title="Your working setup" description="FramePilot uses this profile for crop factor, handheld shutter safety, aperture limits, stabilisation, and flash recommendations." />
    <Surface style={styles.form}>
      <View style={styles.field}><Text style={styles.label}>Camera name</Text><TextInput value={gear.cameraName} onChangeText={(cameraName) => setGear({ ...gear, cameraName })} placeholder="e.g. Full-frame mirrorless" placeholderTextColor="#687579" style={styles.input} /></View>
      <View style={styles.field}><Text style={styles.label}>Lens name</Text><TextInput value={gear.lensName} onChangeText={(lensName) => setGear({ ...gear, lensName })} placeholder="e.g. 70–200 mm f/2.8" placeholderTextColor="#687579" style={styles.input} /></View>
      <ChoiceChips<SensorFormat> label="Sensor" value={gear.sensor} options={[{ value: 'full-frame', label: 'Full frame' }, { value: 'aps-c', label: 'APS-C' }, { value: 'micro-four-thirds', label: 'Micro 4/3' }, { value: 'one-inch', label: '1 inch' }]} onChange={(sensor) => setGear({ ...gear, sensor })} />
      <Stepper label="Current focal length" value={gear.focalLength} suffix=" mm" min={12} max={1200} step={5} onChange={(focalLength) => setGear({ ...gear, focalLength })} />
      <Stepper label="Maximum aperture" value={gear.maxAperture} min={1.2} max={16} step={0.1} onChange={(maxAperture) => setGear({ ...gear, maxAperture })} />
      <Stepper label="Combined stabilisation" value={gear.stabilizationStops} suffix=" stops" min={0} max={8} step={1} onChange={(stabilizationStops) => setGear({ ...gear, stabilizationStops })} />
      <SecondaryButton label="Profile updates recommendations immediately" onPress={() => { setSavedNotice('Gear profile is active for this session.'); }} />{savedNotice ? <Text style={styles.notice}>{savedNotice}</Text> : null}
    </Surface>

    <SectionTitle kicker="COVERAGE" title="What the engine considers" description="The app deliberately goes beyond aperture, shutter, and ISO." />
    <View style={styles.glossary}>{glossary.map(([title, copy], index) => <Surface key={title} style={styles.glossaryItem}><Text style={styles.glossaryIndex}>{String(index + 1).padStart(2, '0')}</Text><View style={styles.glossaryCopy}><Text style={styles.glossaryTitle}>{title}</Text><Text style={styles.glossaryText}>{copy}</Text></View></Surface>)}</View>

    <Surface style={styles.privacy}><Text style={styles.privacyTitle}>Privacy and scope</Text><Text style={styles.privacyText}>Passwords are sent directly to the configured Supabase Auth endpoint and are not stored in this application. Authentication tokens stay in memory for the current session. Cloud setups are protected by row-level security. Recommendations are educational starting points, not camera control or a substitute for checking the scene.</Text></Surface>
    <SecondaryButton label="Sign out" danger onPress={() => void leave()} />
  </Screen>;
}

const styles = StyleSheet.create({
  account: { flexDirection: 'row', alignItems: 'center' }, avatar: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.accentSoft }, avatarText: { color: palette.accent, fontSize: 17, fontWeight: '800' }, accountCopy: { flex: 1 }, email: { color: palette.text, fontSize: 14, fontWeight: '800' }, status: { color: palette.textMuted, fontSize: 10 },
  form: { gap: spacing.xl }, field: { gap: spacing.sm }, label: { color: palette.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' }, input: { height: 50, paddingHorizontal: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.ink, color: palette.text }, notice: { color: palette.mint, fontSize: 11, textAlign: 'center' },
  glossary: { gap: spacing.md }, glossaryItem: { flexDirection: 'row', alignItems: 'flex-start' }, glossaryIndex: { width: 34, color: palette.accent, fontSize: 10, fontWeight: '800' }, glossaryCopy: { flex: 1, gap: 4 }, glossaryTitle: { color: palette.text, fontSize: 14, fontWeight: '800' }, glossaryText: { color: palette.textMuted, fontSize: 11, lineHeight: 17 },
  privacy: { backgroundColor: '#111A1D' }, privacyTitle: { color: palette.text, fontSize: 14, fontWeight: '800' }, privacyText: { color: palette.textMuted, fontSize: 11, lineHeight: 18 },
});
