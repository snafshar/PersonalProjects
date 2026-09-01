import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { backendConfig, isAuthConfigured } from '@/lib/auth-api';
import { defaultGear } from '@/lib/recommendation-engine';
import type { GearProfile, SavedSetup, ShootingContext, Recommendation } from '@/types/photography';

type AppContextValue = {
  gear: GearProfile;
  setGear: (gear: GearProfile) => void;
  saved: SavedSetup[];
  savedLoading: boolean;
  activeScenarioId: string;
  setActiveScenarioId: (id: string) => void;
  saveSetup: (name: string, recommendation: Recommendation, context: ShootingContext) => Promise<void>;
  deleteSetup: (id: string) => Promise<void>;
};

type SavedRow = {
  id: string; user_id: string; name: string; scenario_id: string; recommendation: Recommendation;
  shooting_context: ShootingContext; gear: GearProfile; created_at: string;
};

const AppContext = createContext<AppContextValue | null>(null);

function fromRow(row: SavedRow): SavedSetup {
  return { id: row.id, userId: row.user_id, name: row.name, scenarioId: row.scenario_id, recommendation: row.recommendation, context: row.shooting_context, gear: row.gear, createdAt: row.created_at };
}

export function AppProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const [gear, setGear] = useState(defaultGear);
  const [saved, setSaved] = useState<SavedSetup[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [activeScenarioId, setActiveScenarioId] = useState('portrait-daylight');

  const request = useCallback(async (path: string, init?: RequestInit) => {
    if (!session || session.demo || !isAuthConfigured) return null;
    const response = await fetch(`${backendConfig.url}/rest/v1/${path}`, {
      ...init,
      headers: { apikey: backendConfig.key, authorization: `Bearer ${session.accessToken}`, 'content-type': 'application/json', ...(init?.headers ?? {}) },
    });
    if (!response.ok) throw new Error('Your saved setups could not be synchronized.');
    if (response.status === 204) return null;
    return response.json();
  }, [session]);

  useEffect(() => {
    if (!session || session.demo) { setSaved([]); return; }
    setSavedLoading(true);
    request('saved_setups?select=*&order=created_at.desc')
      .then((rows) => setSaved(Array.isArray(rows) ? (rows as SavedRow[]).map(fromRow) : []))
      .catch(() => setSaved([]))
      .finally(() => setSavedLoading(false));
  }, [request, session]);

  const value = useMemo<AppContextValue>(() => ({
    gear, setGear, saved, savedLoading, activeScenarioId, setActiveScenarioId,
    async saveSetup(name, recommendation, context) {
      if (!session) return;
      const local: SavedSetup = { id: `local-${Date.now()}`, userId: session.user.id, name, scenarioId: recommendation.scenarioId, recommendation, context, gear, createdAt: new Date().toISOString() };
      if (session.demo || !isAuthConfigured) { setSaved((items) => [local, ...items]); return; }
      const rows = await request('saved_setups', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ user_id: session.user.id, name, scenario_id: recommendation.scenarioId, recommendation, shooting_context: context, gear }) });
      if (Array.isArray(rows) && rows[0]) setSaved((items) => [fromRow(rows[0] as SavedRow), ...items]);
    },
    async deleteSetup(id) {
      setSaved((items) => items.filter((item) => item.id !== id));
      if (!id.startsWith('local-')) await request(`saved_setups?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
    },
  }), [activeScenarioId, gear, request, saved, savedLoading, session]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useFramePilot() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useFramePilot must be used inside AppProvider.');
  return value;
}
