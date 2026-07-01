import type { ActionDefinition } from '../types';

function icon(id: string): string {
  return `/icons/${id}.png`;
}

export const actions: ActionDefinition[] = [
  // Ranged Basic Abilities
  { id: 'NeedleStrike', name: 'Needle Strike', category: 'ranged:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('NeedleStrike') },
  { id: 'DazingShot', name: 'Dazing Shot', category: 'ranged:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('DazingShot') },
  { id: 'Snipe', name: 'Snipe', category: 'ranged:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('Snipe') },
  { id: 'Ricochet', name: 'Ricochet', category: 'ranged:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('Ricochet') },
  { id: 'FragmentationShot', name: 'Fragmentation Shot', category: 'ranged:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('FragmentationShot') },
  { id: 'BindingShot', name: 'Binding Shot', category: 'ranged:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('BindingShot') },
  { id: 'TuskasWrath', name: "Tuksa's Wrath", category: 'ranged:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('TuskasWrath') },
  { id: 'Sacrifice', name: 'Sacrifice', category: 'ranged:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('Sacrifice') },

  // Ranged Threshold Abilities
  { id: 'RapidFire', name: 'Rapid Fire', category: 'ranged:threshold', durationTicks: 8, isChanneled: true, iconUrl: icon('RapidFire') },
  { id: 'SnapShot', name: 'Snap Shot', category: 'ranged:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('SnapShot') },
  { id: 'TightBindings', name: 'Tight Bindings', category: 'ranged:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('TightBindings') },
  { id: 'ShadowTendrils', name: 'Shadow Tendrils', category: 'ranged:threshold', durationTicks: 4, isChanneled: true, iconUrl: icon('ShadowTendrils') },
  { id: 'Bombardment', name: 'Bombardment', category: 'ranged:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('Bombardment') },

  // Ranged Ultimate Abilities
  { id: 'DeathsSwiftness', name: "Death's Swiftness", category: 'ranged:ultimate', durationTicks: 1, isChanneled: false, iconUrl: icon('DeathsSwiftness') },
  { id: 'IncendiaryShot', name: 'Incendiary Shot', category: 'ranged:ultimate', durationTicks: 1, isChanneled: false, iconUrl: icon('IncendiaryShot') },
  { id: 'Deadshot', name: 'Deadshot', category: 'ranged:ultimate', durationTicks: 1, isChanneled: false, iconUrl: icon('Deadshot') },

  // EOF Activation
  { id: 'EOF', name: 'EOF', category: 'eof', durationTicks: 1, isChanneled: false, iconUrl: icon('EOF') },

  // Weapon Special Attacks
  { id: 'DarkBowSpec', name: 'Dark Bow Spec', category: 'special', durationTicks: 1, isChanneled: false, iconUrl: icon('DarkBowSpec') },
  { id: 'ECBSpec', name: 'ECB Spec', category: 'special', durationTicks: 1, isChanneled: false, iconUrl: icon('ECBSpec') },
  { id: 'SGBSpec', name: 'SGB Spec', category: 'special', durationTicks: 1, isChanneled: false, iconUrl: icon('SGBSpec') },
  { id: 'BOTLGSpec', name: 'BOTLG Spec', category: 'special', durationTicks: 1, isChanneled: false, iconUrl: icon('BOTLGSpec') },

  // Prayers — instant (no GCD)
  { id: 'DeflectMagic', name: 'Deflect Magic', category: 'prayer', durationTicks: 0, isChanneled: false, iconUrl: icon('DeflectMagic') },
  { id: 'DeflectMissiles', name: 'Deflect Missiles', category: 'prayer', durationTicks: 0, isChanneled: false, iconUrl: icon('DeflectMissiles') },
  { id: 'DeflectMelee', name: 'Deflect Melee', category: 'prayer', durationTicks: 0, isChanneled: false, iconUrl: icon('DeflectMelee') },
  { id: 'ProtectMagic', name: 'Protect Magic', category: 'prayer', durationTicks: 0, isChanneled: false, iconUrl: icon('ProtectMagic') },
  { id: 'ProtectMissiles', name: 'Protect Missiles', category: 'prayer', durationTicks: 0, isChanneled: false, iconUrl: icon('ProtectMissiles') },
  { id: 'ProtectMelee', name: 'Protect Melee', category: 'prayer', durationTicks: 0, isChanneled: false, iconUrl: icon('ProtectMelee') },
  { id: 'SoulSplit', name: 'Soul Split', category: 'prayer', durationTicks: 0, isChanneled: false, iconUrl: icon('SoulSplit') },
];

export function getActionById(id: string): ActionDefinition | undefined {
  return actions.find((a) => a.id === id);
}
