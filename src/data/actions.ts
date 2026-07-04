import type { ActionDefinition } from '../types';

function icon(id: string): string {
  return `${import.meta.env.BASE_URL}icons/${id}.png`;
}

function sound(id: string): string {
  return `${import.meta.env.BASE_URL}sounds/${id}.ogg`;
}

export const actions: ActionDefinition[] = [
  // ── Magic Basic ──
  { id: 'GreaterSonicWave', name: 'Greater Sonic Wave', category: 'magic:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('GreaterSonicWave'), soundUrl: sound('GreaterSonicWave') },
  { id: 'DragonBreath', name: 'Dragon Breath', category: 'magic:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('DragonBreath'), soundUrl: sound('DragonBreath') },
  { id: 'GreaterChain', name: 'Greater Chain', category: 'magic:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('GreaterChain'), soundUrl: sound('GreaterChain') },
  { id: 'Combust', name: 'Combust', category: 'magic:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('Combust'), soundUrl: sound('Combust') },
  { id: 'Impact', name: 'Impact', category: 'magic:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('Impact'), soundUrl: sound('Impact') },
  { id: 'MagicBasic', name: 'Magic Basic', category: 'magic:basic', durationTicks: 1, isChanneled: false, isAuto: true, iconUrl: icon('MagicBasic'), soundUrl: sound('MagicBasic') },

  // ── Magic Threshold ──
  { id: 'Asphyxiate', name: 'Asphyxiate', category: 'magic:threshold', durationTicks: 7, isChanneled: true, iconUrl: icon('Asphyxiate'), soundUrl: sound('Asphyxiate') },
  { id: 'WildMagic', name: 'Wild Magic', category: 'magic:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('WildMagic'), soundUrl: sound('WildMagic') },
  { id: 'SmokeTendrils', name: 'Smoke Tendrils', category: 'magic:threshold', durationTicks: 7, isChanneled: true, iconUrl: icon('SmokeTendrils'), soundUrl: sound('SmokeTendrils') },
  { id: 'MagmaTempest', name: 'Magma Tempest', category: 'magic:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('MagmaTempest'), soundUrl: sound('MagmaTempest') },
  { id: 'CorruptionBlast', name: 'Corruption Blast', category: 'magic:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('CorruptionBlast'), soundUrl: sound('CorruptionBlast') },

  // ── Magic Ultimate ──
  { id: 'Omnipower', name: 'Omnipower', category: 'magic:ultimate', durationTicks: 1, isChanneled: false, iconUrl: icon('Omnipower'), soundUrl: sound('Omnipower') },
  { id: 'Tsunami', name: 'Tsunami', category: 'magic:ultimate', durationTicks: 1, isChanneled: false, iconUrl: icon('Tsunami'), soundUrl: sound('Tsunami') },
  { id: 'GreaterSunshine', name: 'Greater Sunshine', category: 'magic:ultimate', durationTicks: 1, isChanneled: false, iconUrl: icon('GreaterSunshine'), soundUrl: sound('GreaterSunshine') },

  // ── Ranged Basic ──
  { id: 'PiercingShot', name: 'Piercing Shot', category: 'ranged:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('PiercingShot'), soundUrl: sound('PiercingShot') },
  { id: 'BindingShot', name: 'Binding Shot', category: 'ranged:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('BindingShot'), soundUrl: sound('BindingShot') },
  { id: 'Galeshot', name: 'Galeshot', category: 'ranged:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('Galeshot'), soundUrl: sound('Galeshot') },
  { id: 'Ricochet', name: 'Ricochet', category: 'ranged:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('Ricochet'), soundUrl: sound('Ricochet') },
  { id: 'GreaterRicochet', name: 'Greater Ricochet', category: 'ranged:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('GreaterRicochet'), soundUrl: sound('GreaterRicochet') },
  { id: 'RangedBasic', name: 'Ranged Basic', category: 'ranged:basic', durationTicks: 1, isChanneled: false, isAuto: true, iconUrl: icon('RangedBasic'), soundUrl: sound('RangedBasic') },

  // ── Ranged Threshold ──
  { id: 'SnapShot', name: 'Snap Shot', category: 'ranged:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('SnapShot'), soundUrl: sound('SnapShot') },
  { id: 'Snipe', name: 'Snipe', category: 'ranged:threshold', durationTicks: 3, isChanneled: true, iconUrl: icon('Snipe'), soundUrl: sound('Snipe') },
  { id: 'Bombardment', name: 'Bombardment', category: 'ranged:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('Bombardment'), soundUrl: sound('Bombardment') },
  { id: 'RapidFire', name: 'Rapid Fire', category: 'ranged:threshold', durationTicks: 8, isChanneled: true, iconUrl: icon('RapidFire'), soundUrl: sound('RapidFire') },
  { id: 'ShadowTendrils', name: 'Shadow Tendrils', category: 'ranged:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('ShadowTendrils'), soundUrl: sound('ShadowTendrils') },
  { id: 'CorruptionShot', name: 'Corruption Shot', category: 'ranged:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('CorruptionShot'), soundUrl: sound('CorruptionShot') },
  { id: 'ImbueShadows', name: 'Imbue: Shadows', category: 'ranged:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('ImbueShadows'), soundUrl: sound('ImbueShadows') },

  // ── Ranged Ultimate ──
  { id: 'Deadshot', name: 'Deadshot', category: 'ranged:ultimate', durationTicks: 1, isChanneled: false, iconUrl: icon('Deadshot'), soundUrl: sound('Deadshot') },
  { id: 'GreaterDeathsSwiftness', name: "Greater Death's Swiftness", category: 'ranged:ultimate', durationTicks: 1, isChanneled: false, iconUrl: icon('GreaterDeathsSwiftness'), soundUrl: sound('GreaterDeathsSwiftness') },

  // ── Melee Basic ──
  { id: 'GreaterBarge', name: 'Greater Barge', category: 'melee:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('GreaterBarge'), soundUrl: sound('GreaterBarge') },
  { id: 'Rend', name: 'Rend', category: 'melee:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('Rend'), soundUrl: sound('Rend') },
  { id: 'ChaosRoar', name: 'Chaos Roar', category: 'melee:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('ChaosRoar'), soundUrl: sound('ChaosRoar') },
  { id: 'Punish', name: 'Punish', category: 'melee:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('Punish'), soundUrl: sound('Punish') },
  { id: 'GreaterFury', name: 'Greater Fury', category: 'melee:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('GreaterFury'), soundUrl: sound('GreaterFury') },
  { id: 'AdaptiveStrike', name: 'Adaptive Strike', category: 'melee:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('AdaptiveStrike'), soundUrl: sound('AdaptiveStrike') },
  { id: 'Backhand', name: 'Backhand', category: 'melee:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('Backhand'), soundUrl: sound('Backhand') },
  { id: 'BladedDive', name: 'Bladed Dive', category: 'melee:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('BladedDive'), soundUrl: sound('BladedDive') },
  { id: 'MeleeBasic', name: 'Melee Basic', category: 'melee:basic', durationTicks: 1, isChanneled: false, isAuto: true, iconUrl: icon('MeleeBasic'), soundUrl: sound('MeleeBasic') },

  // ── Melee Threshold ──
  { id: 'GreaterFlurry', name: 'Greater Flurry', category: 'melee:threshold', durationTicks: 8, isChanneled: true, iconUrl: icon('GreaterFlurry'), soundUrl: sound('GreaterFlurry') },
  { id: 'Assault', name: 'Assault', category: 'melee:threshold', durationTicks: 7, isChanneled: true, iconUrl: icon('Assault'), soundUrl: sound('Assault') },
  { id: 'Hurricane', name: 'Hurricane', category: 'melee:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('Hurricane'), soundUrl: sound('Hurricane') },
  { id: 'Dismember', name: 'Dismember', category: 'melee:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('Dismember'), soundUrl: sound('Dismember') },
  { id: 'Slaughter', name: 'Slaughter', category: 'melee:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('Slaughter'), soundUrl: sound('Slaughter') },
  { id: 'Massacre', name: 'Massacre', category: 'melee:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('Massacre'), soundUrl: sound('Massacre') },

  // ── Melee Ultimate ──
  { id: 'Overpower', name: 'Overpower', category: 'melee:ultimate', durationTicks: 1, isChanneled: false, iconUrl: icon('Overpower'), soundUrl: sound('Overpower') },
  { id: 'MeteorStrike', name: 'Meteor Strike', category: 'melee:ultimate', durationTicks: 1, isChanneled: false, iconUrl: icon('MeteorStrike'), soundUrl: sound('MeteorStrike') },
  { id: 'Pulverise', name: 'Pulverise', category: 'melee:ultimate', durationTicks: 1, isChanneled: false, iconUrl: icon('Pulverise'), soundUrl: sound('Pulverise') },
  { id: 'Berserk', name: 'Berserk', category: 'melee:ultimate', durationTicks: 1, isChanneled: false, iconUrl: icon('Berserk'), soundUrl: sound('Berserk') },

  // ── Necromancy Basic ──
  { id: 'TouchOfDeath', name: 'Touch of Death', category: 'necro:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('TouchOfDeath'), soundUrl: sound('TouchOfDeath') },
  { id: 'SoulSap', name: 'Soul Sap', category: 'necro:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('SoulSap'), soundUrl: sound('SoulSap') },
  { id: 'NecroBasic', name: 'Necro Basic', category: 'necro:basic', durationTicks: 1, isChanneled: false, isAuto: true, iconUrl: icon('NecroBasic'), soundUrl: sound('NecroBasic') },

  // ── Necromancy Threshold ──
  { id: 'FingerOfDeath', name: 'Finger of Death', category: 'necro:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('FingerOfDeath'), soundUrl: sound('FingerOfDeath') },
  { id: 'Bloat', name: 'Bloat', category: 'necro:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('Bloat'), soundUrl: sound('Bloat') },
  { id: 'SpectralScythe', name: 'Spectral Scythe', category: 'necro:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('SpectralScythe3'), soundUrl: sound('SpectralScythe') },
  { id: 'SoulStrike', name: 'Soul Strike', category: 'necro:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('SoulStrike'), soundUrl: sound('SoulStrike') },
  { id: 'VolleyOfSouls', name: 'Volley of Souls', category: 'necro:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('VolleyOfSouls'), soundUrl: sound('VolleyOfSouls') },
  { id: 'BloodSiphon', name: 'Blood Siphon', category: 'necro:threshold', durationTicks: 8, isChanneled: true, iconUrl: icon('BloodSiphon'), soundUrl: sound('BloodSiphon') },

  // ── Necromancy Ultimate ──
  { id: 'DeathSkulls', name: 'Death Skulls', category: 'necro:ultimate', durationTicks: 1, isChanneled: false, iconUrl: icon('DeathSkulls'), soundUrl: sound('DeathSkulls') },
  { id: 'LivingDeath', name: 'Living Death', category: 'necro:ultimate', durationTicks: 1, isChanneled: false, iconUrl: icon('LivingDeath'), soundUrl: sound('LivingDeath') },

  // ── Utility ──
  { id: 'Surge', name: 'Surge', category: 'utility', durationTicks: 0, isChanneled: false, iconUrl: icon('Surge'), soundUrl: sound('Surge') },
  { id: 'Escape', name: 'Escape', category: 'utility', durationTicks: 0, isChanneled: false, iconUrl: icon('Escape'), soundUrl: sound('Escape') },

  // ── Constitution Special ──
  { id: 'EOF', name: 'Essence of Finality', category: 'constitution:special', durationTicks: 1, isChanneled: false, iconUrl: icon('EOF'), soundUrl: sound('EOF') },
  { id: 'WeaponSpecialAttack', name: 'Weapon Spec', category: 'constitution:special', durationTicks: 1, isChanneled: false, iconUrl: icon('WeaponSpecialAttack'), soundUrl: sound('WeaponSpecialAttack') },

  // ── Constitution Basic ──
  { id: 'Sacrifice', name: 'Sacrifice', category: 'constitution:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('Sacrifice'), soundUrl: sound('Sacrifice') },
  { id: 'TuskasWrath', name: "Tuska's Wrath", category: 'constitution:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('TuskasWrath'), soundUrl: sound('TuskasWrath') },

  // ── Constitution Threshold ──
  { id: 'Reprisal', name: 'Reprisal', category: 'constitution:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('Reprisal'), soundUrl: sound('Reprisal') },
  { id: 'Shatter', name: 'Shatter', category: 'constitution:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('Shatter'), soundUrl: sound('Shatter') },

  // ── Constitution Ultimate ──
  { id: 'GuthixsBlessing', name: "Guthix's Blessing", category: 'constitution:ultimate', durationTicks: 1, isChanneled: false, iconUrl: icon('GuthixsBlessing'), soundUrl: sound('GuthixsBlessing') },
  { id: 'IceAsylum', name: 'Ice Asylum', category: 'constitution:ultimate', durationTicks: 1, isChanneled: false, iconUrl: icon('IceAsylum'), soundUrl: sound('IceAsylum') },
  { id: 'Onslaught', name: 'Onslaught', category: 'constitution:ultimate', durationTicks: 1, isChanneled: true, iconUrl: icon('Onslaught'), soundUrl: sound('Onslaught') },
  { id: 'Transfigure', name: 'Transfigure', category: 'constitution:ultimate', durationTicks: 1, isChanneled: false, iconUrl: icon('Transfigure'), soundUrl: sound('Transfigure') },

  // ── Defence Basic ──
  { id: 'Anticipate', name: 'Anticipate', category: 'defence:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('Anticipate'), soundUrl: sound('Anticipate') },
  { id: 'Bash', name: 'Bash', category: 'defence:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('Bash'), soundUrl: sound('Bash') },
  { id: 'Cease', name: 'Cease', category: 'defence:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('Cease'), soundUrl: sound('Cease') },
  { id: 'Divert', name: 'Divert', category: 'defence:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('Divert'), soundUrl: sound('Divert') },
  { id: 'Freedom', name: 'Freedom', category: 'defence:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('Freedom'), soundUrl: sound('Freedom') },
  { id: 'Preparation', name: 'Preparation', category: 'defence:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('Preparation'), soundUrl: sound('Preparation') },
  { id: 'Provoke', name: 'Provoke', category: 'defence:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('Provoke'), soundUrl: sound('Provoke') },
  { id: 'Resonance', name: 'Resonance', category: 'defence:basic', durationTicks: 1, isChanneled: false, iconUrl: icon('Resonance'), soundUrl: sound('Resonance') },

  // ── Defence Threshold ──
  { id: 'Debilitate', name: 'Debilitate', category: 'defence:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('Debilitate'), soundUrl: sound('Debilitate') },
  { id: 'Devotion', name: 'Devotion', category: 'defence:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('Devotion'), soundUrl: sound('Devotion') },
  { id: 'Reflect', name: 'Reflect', category: 'defence:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('Reflect'), soundUrl: sound('Reflect') },
  { id: 'Revenge', name: 'Revenge', category: 'defence:threshold', durationTicks: 1, isChanneled: false, iconUrl: icon('Revenge'), soundUrl: sound('Revenge') },

  // ── Defence Ultimate ──
  { id: 'Barricade', name: 'Barricade', category: 'defence:ultimate', durationTicks: 1, isChanneled: false, iconUrl: icon('Barricade'), soundUrl: sound('Barricade') },
  { id: 'Immortality', name: 'Immortality', category: 'defence:ultimate', durationTicks: 1, isChanneled: false, iconUrl: icon('Immortality'), soundUrl: sound('Immortality') },
  { id: 'NaturalInstinct', name: 'Natural Instinct', category: 'defence:ultimate', durationTicks: 1, isChanneled: false, iconUrl: icon('NaturalInstinct'), soundUrl: sound('NaturalInstinct') },
  { id: 'Rejuvenate', name: 'Rejuvenate', category: 'defence:ultimate', durationTicks: 1, isChanneled: false, iconUrl: icon('Rejuvenate'), soundUrl: sound('Rejuvenate') },

  // ── Prayers ──
  { id: 'SoulSplit', name: 'Soul Split', category: 'prayer', durationTicks: 0, isChanneled: false, iconUrl: icon('SoulSplit'), soundUrl: sound('SoulSplit') },
  { id: 'DeflectMagic', name: 'Deflect Magic', category: 'prayer', durationTicks: 0, isChanneled: false, iconUrl: icon('DeflectMagic'), soundUrl: sound('DeflectMagic') },
  { id: 'DeflectMissiles', name: 'Deflect Missiles', category: 'prayer', durationTicks: 0, isChanneled: false, iconUrl: icon('DeflectMissiles'), soundUrl: sound('DeflectMissiles') },
  { id: 'DeflectMelee', name: 'Deflect Melee', category: 'prayer', durationTicks: 0, isChanneled: false, iconUrl: icon('DeflectMelee'), soundUrl: sound('DeflectMelee') },
  { id: 'DeflectNecromancy', name: 'Deflect Necromancy', category: 'prayer', durationTicks: 0, isChanneled: false, iconUrl: icon('DeflectNecromancy'), soundUrl: sound('DeflectNecromancy') },

  // ── Items: Consumables ──
  { id: 'VulnBomb', name: 'Vuln Bomb', category: 'items:consume', durationTicks: 0, isChanneled: false, iconUrl: icon('VulnBomb') },
  { id: 'AdrenalineRenewal', name: 'Adrenaline Renewal', category: 'items:consume', durationTicks: 0, isChanneled: false, iconUrl: icon('AdrenalineRenewal') },

  // ── Items: Equipment ──
  { id: 'EofSwap', name: 'EOF Swap', category: 'items:equipment', durationTicks: 0, isChanneled: false },
  { id: 'AmmoSwap', name: 'Ammo Swap', category: 'items:equipment', durationTicks: 0, isChanneled: false },

  // ── Utility extras ──
  { id: 'TargetCycle', name: 'Target Cycle', category: 'utility', durationTicks: 0, isChanneled: false, iconUrl: icon('tc') },
];

export function getActionById(id: string): ActionDefinition | undefined {
  return actions.find((a) => a.id === id);
}
