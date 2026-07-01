import type { ActionDefinition } from '../types';

function icon(id: string): string {
  return `/icons/${id}.png`;
}

export const actions: ActionDefinition[] = [
  // ── Ranged Basic ──
  { id: 'PiercingShot', name: 'Piercing Shot', category: 'ranged:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('PiercingShot') },
  { id: 'BindingShot', name: 'Binding Shot', category: 'ranged:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('BindingShot') },
  { id: 'Galeshot', name: 'Galeshot', category: 'ranged:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('Galeshot') },
  { id: 'Ricochet', name: 'Ricochet', category: 'ranged:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('Ricochet') },
  { id: 'GreaterRicochet', name: 'Greater Ricochet', category: 'ranged:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('GreaterRicochet') },

  // ── Ranged Threshold ──
  { id: 'SnapShot', name: 'Snap Shot', category: 'ranged:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('SnapShot') },
  { id: 'Snipe', name: 'Snipe', category: 'ranged:threshold', durationTicks: 3, isChanneled: true, iconUrl: icon('Snipe') },
  { id: 'Bombardment', name: 'Bombardment', category: 'ranged:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('Bombardment') },
  { id: 'RapidFire', name: 'Rapid Fire', category: 'ranged:threshold', durationTicks: 8, isChanneled: true, iconUrl: icon('RapidFire') },
  { id: 'ShadowTendrils', name: 'Shadow Tendrils', category: 'ranged:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('ShadowTendrils') },
  { id: 'CorruptionShot', name: 'Corruption Shot', category: 'ranged:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('CorruptionShot') },
  { id: 'ImbueShadows', name: 'Imbue: Shadows', category: 'ranged:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('ImbueShadows') },

  // ── Ranged Ultimate ──
  { id: 'Deadshot', name: 'Deadshot', category: 'ranged:ultimate', durationTicks: 1, isChanneled: false, iconUrl: icon('Deadshot') },
  { id: 'DeathsSwiftness', name: "Death's Swiftness", category: 'ranged:ultimate', durationTicks: 1, isChanneled: false, iconUrl: icon('DeathsSwiftness') },
  { id: 'GreaterDeathsSwiftness', name: "Greater Death's Swiftness", category: 'ranged:ultimate', durationTicks: 1, isChanneled: false, iconUrl: icon('GreaterDeathsSwiftness') },

  // ── Ranged Utility ──
  { id: 'Escape', name: 'Escape', category: 'ranged:utility', durationTicks: 1, isChanneled: false, iconUrl: icon('Escape') },

  // ── Constitution Special ──
  { id: 'EOF', name: 'Essence of Finality', category: 'constitution:special', durationTicks: 1, isChanneled: false, iconUrl: icon('EOF') },
  { id: 'DarkBowSpec', name: 'Dark Bow Spec', category: 'constitution:special', durationTicks: 1, isChanneled: false, iconUrl: icon('DarkBowSpec') },
  { id: 'ZamorakBowSpec', name: 'Zamorak Bow Spec', category: 'constitution:special', durationTicks: 1, isChanneled: false, iconUrl: icon('ZamorakBowSpec') },
  { id: 'GloomfireBowSpec', name: 'Gloomfire Bow Spec', category: 'constitution:special', durationTicks: 1, isChanneled: false, iconUrl: icon('GloomfireBowSpec') },
  { id: 'SGBSpec', name: 'Seren Godbow Spec', category: 'constitution:special', durationTicks: 1, isChanneled: false, iconUrl: icon('SGBSpec') },
  { id: 'ECBSpec', name: 'Eldritch Crossbow Spec', category: 'constitution:special', durationTicks: 1, isChanneled: false, iconUrl: icon('ECBSpec') },
  { id: 'BOTLGSpec', name: 'Bow of the Last Guardian Spec', category: 'constitution:special', durationTicks: 1, isChanneled: false, iconUrl: icon('BOTLGSpec') },

  // ── Constitution Basic ──
  { id: 'Sacrifice', name: 'Sacrifice', category: 'constitution:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('Sacrifice') },
  { id: 'TuskasWrath', name: "Tuska's Wrath", category: 'constitution:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('TuskasWrath') },

  // ── Constitution Threshold ──
  { id: 'Reprisal', name: 'Reprisal', category: 'constitution:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('Reprisal') },
  { id: 'Shatter', name: 'Shatter', category: 'constitution:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('Shatter') },

  // ── Constitution Ultimate ──
  { id: 'GuthixsBlessing', name: "Guthix's Blessing", category: 'constitution:ultimate', durationTicks: 1, isChanneled: false, iconUrl: icon('GuthixsBlessing') },
  { id: 'IceAsylum', name: 'Ice Asylum', category: 'constitution:ultimate', durationTicks: 1, isChanneled: false, iconUrl: icon('IceAsylum') },
  { id: 'Onslaught', name: 'Onslaught', category: 'constitution:ultimate', durationTicks: 1, isChanneled: true, iconUrl: icon('Onslaught') },
  { id: 'Transfigure', name: 'Transfigure', category: 'constitution:ultimate', durationTicks: 1, isChanneled: false, iconUrl: icon('Transfigure') },

  // ── Defence Basic ──
  { id: 'Anticipate', name: 'Anticipate', category: 'defence:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('Anticipate') },
  { id: 'Bash', name: 'Bash', category: 'defence:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('Bash') },
  { id: 'Cease', name: 'Cease', category: 'defence:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('Cease') },
  { id: 'Divert', name: 'Divert', category: 'defence:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('Divert') },
  { id: 'Freedom', name: 'Freedom', category: 'defence:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('Freedom') },
  { id: 'Preparation', name: 'Preparation', category: 'defence:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('Preparation') },
  { id: 'Provoke', name: 'Provoke', category: 'defence:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('Provoke') },
  { id: 'Resonance', name: 'Resonance', category: 'defence:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('Resonance') },

  // ── Defence Threshold ──
  { id: 'Debilitate', name: 'Debilitate', category: 'defence:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('Debilitate') },
  { id: 'Devotion', name: 'Devotion', category: 'defence:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('Devotion') },
  { id: 'Reflect', name: 'Reflect', category: 'defence:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('Reflect') },
  { id: 'Revenge', name: 'Revenge', category: 'defence:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('Revenge') },

  // ── Defence Ultimate ──
  { id: 'Barricade', name: 'Barricade', category: 'defence:ultimate', durationTicks: 1, isChanneled: false, iconUrl: icon('Barricade') },
  { id: 'Immortality', name: 'Immortality', category: 'defence:ultimate', durationTicks: 1, isChanneled: false, iconUrl: icon('Immortality') },
  { id: 'NaturalInstinct', name: 'Natural Instinct', category: 'defence:ultimate', durationTicks: 1, isChanneled: false, iconUrl: icon('NaturalInstinct') },
  { id: 'Rejuvenate', name: 'Rejuvenate', category: 'defence:ultimate', durationTicks: 1, isChanneled: false, iconUrl: icon('Rejuvenate') },

  // ── Prayers ──
  { id: 'SoulSplit', name: 'Soul Split', category: 'prayer', durationTicks: 0, isChanneled: false, iconUrl: icon('SoulSplit') },
  { id: 'DeflectMagic', name: 'Deflect Magic', category: 'prayer', durationTicks: 0, isChanneled: false, iconUrl: icon('DeflectMagic') },
  { id: 'DeflectMissiles', name: 'Deflect Missiles', category: 'prayer', durationTicks: 0, isChanneled: false, iconUrl: icon('DeflectMissiles') },
  { id: 'DeflectMelee', name: 'Deflect Melee', category: 'prayer', durationTicks: 0, isChanneled: false, iconUrl: icon('DeflectMelee') },
  { id: 'ProtectMagic', name: 'Protect Magic', category: 'prayer', durationTicks: 0, isChanneled: false, iconUrl: icon('ProtectMagic') },
  { id: 'ProtectMissiles', name: 'Protect Missiles', category: 'prayer', durationTicks: 0, isChanneled: false, iconUrl: icon('ProtectMissiles') },
  { id: 'ProtectMelee', name: 'Protect Melee', category: 'prayer', durationTicks: 0, isChanneled: false, iconUrl: icon('ProtectMelee') },
];

export function getActionById(id: string): ActionDefinition | undefined {
  return actions.find((a) => a.id === id);
}
