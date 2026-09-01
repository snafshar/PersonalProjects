import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/ui';
import { useAuth } from '@/contexts/auth-context';
import { palette, radius, spacing } from '@/theme';

export default function SignInScreen() {
  const { configured, busy, signIn, signUp, useDemo } = useAuth();
  const [mode, setMode] = useState<'sign-in' | 'create'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit() {
    setError(''); setMessage('');
    if (!email.includes('@')) { setError('Enter a valid email address.'); return; }
    if (password.length < 8) { setError('Use at least 8 characters for your password.'); return; }
    try {
      if (mode === 'sign-in') await signIn(email, password);
      else {
        const result = await signUp(email, password);
        if (result === 'verify-email') setMessage('Account created. Check your inbox, verify the address, then sign in.');
      }
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : 'Could not continue.'); }
  }

  return <SafeAreaView style={styles.safe}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={styles.intro}><BrandMark /><Text style={styles.kicker}>FIELD-READY PHOTOGRAPHY</Text><Text style={styles.title}>FramePilot</Text><Text style={styles.lede}>Turn a scene into a complete camera setup—exposure, autofocus, colour, flash, stabilisation, files, and field checks.</Text></View>

        <View style={styles.authCard}>
          <View style={styles.modeRow}>{(['sign-in', 'create'] as const).map((item) => <Pressable key={item} onPress={() => { setMode(item); setError(''); setMessage(''); }} style={[styles.modeButton, mode === item && styles.modeButtonActive]}><Text style={[styles.modeText, mode === item && styles.modeTextActive]}>{item === 'sign-in' ? 'Sign in' : 'Create account'}</Text></Pressable>)}</View>
          <View style={styles.field}><Text style={styles.label}>Email address</Text><TextInput accessibilityLabel="Email address" autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="you@example.com" placeholderTextColor="#627074" value={email} onChangeText={setEmail} style={styles.input} /></View>
          <View style={styles.field}><Text style={styles.label}>Password</Text><TextInput accessibilityLabel="Password" autoCapitalize="none" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} secureTextEntry placeholder="At least 8 characters" placeholderTextColor="#627074" value={password} onChangeText={setPassword} style={styles.input} /></View>
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}{message ? <Text style={styles.success}>{message}</Text> : null}
          <Pressable disabled={busy || !configured} onPress={submit} style={({ pressed }) => [styles.submit, (!configured || busy) && styles.disabled, pressed && styles.pressed]}>{busy ? <ActivityIndicator color={palette.ink} /> : <Text style={styles.submitText}>{mode === 'sign-in' ? 'Open my dashboard' : 'Create secure account'}</Text>}</Pressable>
          {!configured ? <View style={styles.configNotice}><Text style={styles.configTitle}>Backend setup required for live accounts</Text><Text style={styles.configText}>Add the Supabase environment values from `.env.example`. Demo mode keeps everything local to this session.</Text></View> : null}
          <Pressable onPress={useDemo} style={({ pressed }) => [styles.demoButton, pressed && styles.pressed]}><Text style={styles.demoButtonText}>Explore the demo dashboard</Text></Pressable>
        </View>

        <View style={styles.trustRow}><Text style={styles.trustText}>✓ No passwords stored by the app</Text><Text style={styles.trustText}>✓ Private account dashboard</Text><Text style={styles.trustText}>✓ iOS & Android</Text></View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.ink }, flex: { flex: 1 }, content: { minHeight: '100%', width: '100%', maxWidth: 620, alignSelf: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.xxl },
  intro: { alignItems: 'center', gap: spacing.sm }, kicker: { marginTop: spacing.md, color: palette.accent, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  title: { color: palette.text, fontSize: 47, lineHeight: 52, fontWeight: '800', letterSpacing: -2 }, lede: { maxWidth: 480, color: palette.textMuted, fontSize: 15, lineHeight: 23, textAlign: 'center' },
  authCard: { padding: spacing.xl, gap: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface },
  modeRow: { padding: 4, flexDirection: 'row', borderRadius: radius.md, backgroundColor: palette.ink }, modeButton: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  modeButtonActive: { backgroundColor: palette.surfaceSoft }, modeText: { color: palette.textMuted, fontSize: 12, fontWeight: '700' }, modeTextActive: { color: palette.text },
  field: { gap: spacing.sm }, label: { color: palette.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.7, textTransform: 'uppercase' },
  input: { height: 52, paddingHorizontal: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.ink, color: palette.text, fontSize: 15 },
  submit: { height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: palette.accent }, submitText: { color: palette.ink, fontSize: 14, fontWeight: '800' },
  demoButton: { height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: palette.line }, demoButtonText: { color: palette.text, fontSize: 13, fontWeight: '700' },
  disabled: { opacity: 0.45 }, pressed: { opacity: 0.72 }, error: { color: palette.error, fontSize: 12, lineHeight: 18 }, success: { color: palette.mint, fontSize: 12, lineHeight: 18 },
  configNotice: { padding: spacing.md, borderRadius: radius.md, backgroundColor: palette.accentSoft, gap: 4 }, configTitle: { color: palette.accent, fontSize: 12, fontWeight: '800' }, configText: { color: '#D9B7A7', fontSize: 11, lineHeight: 17 },
  trustRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.md }, trustText: { color: palette.textMuted, fontSize: 10 },
});
