import type { Rotation } from '../types';

export const rotations: Rotation[] = [
  {
    id: 'ranged-dps-basic',
    name: 'Ranged DPS Basic',
    steps: [
      { step: 1, actions: ['DeathsSwiftness'], targetTimeMs: 0 },
      { step: 2, actions: ['EOF'], targetTimeMs: 1800 },
      { step: 3, actions: ['SnapShot'], targetTimeMs: 3600 },
      { step: 4, actions: ['CorruptionShot'], targetTimeMs: 5400 },
      { step: 5, actions: ['Snipe'], targetTimeMs: 7200 },
      { step: 6, actions: ['RapidFire'], targetTimeMs: 9000 },
      { step: 7, actions: ['Bombardment'], targetTimeMs: 10800 },
      { step: 8, actions: ['ShadowTendrils'], targetTimeMs: 12600 },
      { step: 9, actions: ['PiercingShot'], targetTimeMs: 14400 },
      { step: 10, actions: ['Ricochet'], targetTimeMs: 16200 },
    ],
  },
  {
    id: 'prayer-flick-basics',
    name: 'Prayer Flick Basics',
    steps: [
      { step: 1,  actions: ['SoulSplit'],     targetTimeMs: 0 },
      { step: 2,  actions: ['DeflectMagic'],   targetTimeMs: 600 },
      { step: 3,  actions: ['SoulSplit'],      targetTimeMs: 1200 },
      { step: 4,  actions: ['ProtectMagic'],   targetTimeMs: 1800 },
      { step: 5,  actions: ['SoulSplit'],      targetTimeMs: 2400 },
      { step: 6,  actions: ['DeflectMissiles'], targetTimeMs: 3000 },
      { step: 7,  actions: ['SoulSplit'],      targetTimeMs: 3600 },
      { step: 8,  actions: ['ProtectMissiles'], targetTimeMs: 4200 },
      { step: 9,  actions: ['SoulSplit'],      targetTimeMs: 4800 },
      { step: 10, actions: ['DeflectMelee'],   targetTimeMs: 5400 },
      { step: 11, actions: ['SoulSplit'],      targetTimeMs: 6000 },
      { step: 12, actions: ['ProtectMelee'],   targetTimeMs: 6600 },
    ],
  },
];

export function getRotationById(id: string): Rotation | undefined {
  return rotations.find((r) => r.id === id);
}
