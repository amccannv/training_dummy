import { create } from 'zustand';
import type { Rotation, TickEvent, PrayerFlickSettings, PrayerAttack, AttackStyle } from '../types';
import { abilityDuration, compileEndTick } from '../utils/compiler';
import { setItem } from '../utils/storage';
import { keybindEquals } from '../utils/keybindFormat';

export type KeypressResult =
  | { type: 'hit'; actionId: string }
  | { type: 'miss'; reason: 'wrong-action' | 'wrong-timing' | 'gcd-locked' }
  | { type: 'ignored' }
  | { type: 'prayer-change'; actionId: string };

const PRAYER_IDS = ['SoulSplit', 'DeflectMelee', 'DeflectMagic', 'DeflectMissiles', 'DeflectNecromancy'];
const DEFAULT_FLICK: PrayerFlickSettings = {
  enabled: false,
  attackRate: 5,
  telegraphTicks: 2,
  styles: ['melee', 'magic', 'ranged', 'necromancy'],
};
const WARMUP_TICKS = 10;

function styleToDeflectId(style: AttackStyle): string {
  switch (style) {
    case 'melee': return 'DeflectMelee';
    case 'magic': return 'DeflectMagic';
    case 'ranged': return 'DeflectMissiles';
    case 'necromancy': return 'DeflectNecromancy';
  }
}

interface PracticeStore {
  rotation: Rotation | null;
  events: TickEvent[];
  sessionActive: boolean;
  startTimeMs: number;
  hits: number;
  misses: number;
  wrongPresses: number;

  flickSettings: PrayerFlickSettings;
  prayerAttacks: PrayerAttack[];
  activePrayer: string;
  prayerHits: number;
  prayerMisses: number;
  ssTicks: number;
  totalPrayerTicks: number;
  lastCountedTick: number;

  startPractice: (rotation: Rotation) => void;
  handleKeypress: (
    pressed: { code: string; ctrl: boolean; shift: boolean; alt: boolean; meta: boolean },
    getBinding: (actionId: string) => { code: string; ctrl: boolean; shift: boolean; alt: boolean; meta: boolean } | null,
  ) => KeypressResult;
  tick: () => void;
  finishSession: () => void;
  reset: () => void;
  setFlickSettings: (settings: PrayerFlickSettings) => void;
}

const TICK_MS = 600;

function currentTick(startTimeMs: number): number {
  return Math.floor((performance.now() - startTimeMs) / TICK_MS);
}

function matchKeybind(
  actionId: string,
  pressed: { code: string; ctrl: boolean; shift: boolean; alt: boolean; meta: boolean },
  getBinding: (actionId: string) => { code: string; ctrl: boolean; shift: boolean; alt: boolean; meta: boolean } | null,
): boolean {
  const binding = getBinding(actionId);
  if (!binding) return false;
  return keybindEquals(binding, pressed);
}

function checkAllDone(events: TickEvent[]): boolean {
  return events.every((e) => e.resolved);
}

function checkSessionDone(events: TickEvent[], prayerAttacks: PrayerAttack[], flickEnabled: boolean): boolean {
  if (!checkAllDone(events)) return false;
  if (flickEnabled) return prayerAttacks.every((a) => a.resolved);
  return true;
}

export function compileEventData(
  rotation: Rotation,
): { tick: number; duration: number; gcdEndTick: number }[] {
  const result: { tick: number; duration: number; gcdEndTick: number }[] = [];
  let nextTick = 3;

  for (const abilityId of rotation.abilities) {
    const dur = abilityDuration(abilityId);
    result.push({ tick: nextTick, duration: dur, gcdEndTick: Math.max(nextTick, nextTick + dur - 1) });
    if (dur > 0) nextTick = nextTick + dur;
  }

  return result;
}

function generateAttacks(rotation: Rotation, settings: PrayerFlickSettings): PrayerAttack[] {
  const endTick = compileEndTick(rotation);
  const attacks: PrayerAttack[] = [];
  let nextAttack = WARMUP_TICKS;

  while (nextAttack <= endTick) {
    const styleIdx = Math.floor(Math.random() * settings.styles.length);
    attacks.push({
      tick: nextAttack,
      style: settings.styles[styleIdx],
      resolved: false,
    });
    nextAttack += settings.attackRate;
  }

  return attacks;
}

export const usePracticeStore = create<PracticeStore>()((set, get) => ({
  rotation: null,
  events: [],
  sessionActive: false,
  startTimeMs: 0,
  hits: 0,
  misses: 0,
  wrongPresses: 0,

  flickSettings: { ...DEFAULT_FLICK },
  prayerAttacks: [],
  activePrayer: 'SoulSplit',
  prayerHits: 0,
  prayerMisses: 0,
  ssTicks: 0,
  totalPrayerTicks: 0,
  lastCountedTick: -1,

  setFlickSettings: (settings) => {
    set({ flickSettings: settings });
  },

  startPractice: (rotation) => {
    const eventData = compileEventData(rotation);
    const events: TickEvent[] = eventData.map((d, i) => ({
      tick: d.tick,
      abilityId: rotation.abilities[i],
      resolved: false,
      duration: d.duration,
      gcdEndTick: d.gcdEndTick,
    }));

    const flick = get().flickSettings;
    const prayerAttacks = flick.enabled ? generateAttacks(rotation, flick) : [];

    set({
      rotation,
      events,
      sessionActive: true,
      startTimeMs: performance.now(),
      hits: 0,
      misses: 0,
      wrongPresses: 0,
      prayerAttacks,
      activePrayer: 'SoulSplit',
      prayerHits: 0,
      prayerMisses: 0,
      ssTicks: 0,
      totalPrayerTicks: 0,
      lastCountedTick: -1,
    });
  },

  handleKeypress: (pressed, getBinding) => {
    const state = get();
    if (!state.sessionActive || state.events.length === 0) return { type: 'ignored' };

    if (state.flickSettings.enabled) {
      for (const prayerId of PRAYER_IDS) {
        if (matchKeybind(prayerId, pressed, getBinding)) {
          set({ activePrayer: prayerId });
          return { type: 'prayer-change', actionId: prayerId };
        }
      }
    }

    for (const prayerId of PRAYER_IDS) {
      if (matchKeybind(prayerId, pressed, getBinding)) {
        return { type: 'ignored' };
      }
    }

    const ci = state.events.findIndex((e) => !e.resolved);
    if (ci === -1) return { type: 'ignored' };

    const event = state.events[ci];
    const tick = currentTick(state.startTimeMs);

    const isGcdLocked = ci > 0 && tick <= state.events[ci - 1].gcdEndTick;

    if (matchKeybind(event.abilityId, pressed, getBinding)) {
      if (tick === event.tick) {
        const events = [...state.events];
        events[ci] = { ...event, resolved: true, result: 'hit' };
        const hits = state.hits + 1;

        if (checkSessionDone(events, state.prayerAttacks, state.flickSettings.enabled)) {
          set({ events, hits, sessionActive: false });
          setTimeout(() => get().finishSession(), 50);
        } else {
          set({ events, hits });
        }

        return { type: 'hit', actionId: event.abilityId };
      }

      const reason = isGcdLocked ? 'gcd-locked' : 'wrong-timing';
      const events = [...state.events];
      events[ci] = { ...event, resolved: true, result: 'miss' };
      const misses = state.misses + 1;
      const wrongPresses = state.wrongPresses + 1;

      if (checkSessionDone(events, state.prayerAttacks, state.flickSettings.enabled)) {
        set({ events, misses, wrongPresses, sessionActive: false });
        setTimeout(() => get().finishSession(), 50);
      } else {
        set({ events, misses, wrongPresses });
      }

      return { type: 'miss', reason };
    }

    for (const aId of state.rotation?.abilities ?? []) {
      if (matchKeybind(aId, pressed, getBinding)) {
        const reason = isGcdLocked ? 'gcd-locked' : 'wrong-timing';
        set({ wrongPresses: state.wrongPresses + 1 });
        return { type: 'miss', reason };
      }
    }

    set({ wrongPresses: state.wrongPresses + 1 });
    return { type: 'miss', reason: 'wrong-action' };
  },

  tick: () => {
    const state = get();
    if (!state.sessionActive || state.events.length === 0) return;

    const tick = currentTick(state.startTimeMs);

    let events = [...state.events];
    let abilityChanged = false;

    for (let i = 0; i < events.length; i++) {
      if (events[i].resolved) continue;
      if (tick > events[i].tick) {
        events[i] = { ...events[i], resolved: true, result: 'miss' };
        abilityChanged = true;
      }
    }

    let prayerChanged = false;
    let prayerAttacks = state.prayerAttacks;
    let prayerHits = state.prayerHits;
    let prayerMisses = state.prayerMisses;
    let ssTicks = state.ssTicks;
    let totalPrayerTicks = state.totalPrayerTicks;
    let lastCounted = state.lastCountedTick;

    if (state.flickSettings.enabled) {
      if (lastCounted === -1) {
        lastCounted = tick - 1;
      }
      while (lastCounted < tick) {
        lastCounted++;
        totalPrayerTicks++;
        if (state.activePrayer === 'SoulSplit') {
          ssTicks++;
        }
      }

      prayerAttacks = [...prayerAttacks];
      for (let i = 0; i < prayerAttacks.length; i++) {
        if (prayerAttacks[i].resolved) continue;
        const attack = prayerAttacks[i];
        if (tick >= attack.tick) {
          const needed = styleToDeflectId(attack.style);
          if (state.activePrayer === needed) {
            prayerAttacks[i] = { ...attack, resolved: true, result: 'hit' };
            prayerHits++;
            prayerChanged = true;
          } else if (tick > attack.tick) {
            prayerAttacks[i] = { ...attack, resolved: true, result: 'miss' };
            prayerMisses++;
            prayerChanged = true;
          }
        }
      }
    }

    if (!abilityChanged && !prayerChanged) return;

    const hits = events.filter((e) => e.result === 'hit').length;
    const misses = events.filter((e) => e.result === 'miss').length;

    set({
      events,
      hits,
      misses,
      prayerAttacks,
      prayerHits,
      prayerMisses,
      ssTicks,
      totalPrayerTicks,
      lastCountedTick: lastCounted,
    });

    const allAbilityDone = checkAllDone(events);
    const allPrayerDone = state.flickSettings.enabled
      ? prayerAttacks.every((a) => a.resolved)
      : true;

    if (allAbilityDone && allPrayerDone) {
      set({ sessionActive: false });
      setTimeout(() => get().finishSession(), 50);
    }
  },

  finishSession: () => {
    const state = get();
    if (!state.rotation) return;

    const session = {
      rotationId: state.rotation.id,
      date: new Date().toISOString(),
      hits: state.events.filter((e) => e.result === 'hit').length,
      misses: state.events.filter((e) => e.result === 'miss').length,
      wrongPresses: state.wrongPresses,
      events: state.events.map((e) => ({
        actionId: e.abilityId,
        tick: e.tick,
        result: (e.result || 'miss') as 'hit' | 'miss',
      })),
      ...(state.flickSettings.enabled && state.prayerAttacks.length > 0
        ? {
            prayerStats: {
              hits: state.prayerHits,
              misses: state.prayerMisses,
              ssUptimeTicks: state.ssTicks,
              totalTicks: state.totalPrayerTicks,
              attacks: state.prayerAttacks.map((a) => ({
                tick: a.tick,
                style: a.style,
                result: (a.result || 'miss') as 'hit' | 'miss',
              })),
            },
          }
        : {}),
    };

    const raw = localStorage.getItem('rs3-sessions');
    const sessions = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(sessions)) return;
    sessions.push(session);
    setItem('sessions', sessions);
  },

  reset: () => {
    set({
      rotation: null,
      events: [],
      sessionActive: false,
      startTimeMs: 0,
      hits: 0,
      misses: 0,
      wrongPresses: 0,
      prayerAttacks: [],
      activePrayer: 'SoulSplit',
      prayerHits: 0,
      prayerMisses: 0,
      ssTicks: 0,
      totalPrayerTicks: 0,
      lastCountedTick: -1,
    });
  },
}));
