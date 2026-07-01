import type { Rotation } from '../types';

export const rotations: Rotation[] = [
  {
    id: 'prayer-flick-basics',
    name: 'Prayer Flick Basics',
    steps: [
      { step: 1, actions: ['SoulSplit'] },
      { step: 2, actions: ['DeflectMagic'] },
      { step: 3, actions: ['SoulSplit'] },
      { step: 4, actions: ['DeflectMagic'] },
      { step: 5, actions: ['SoulSplit'] },
      { step: 6, actions: ['DeflectMissiles'] },
      { step: 7, actions: ['SoulSplit'] },
      { step: 8, actions: ['DeflectMissiles'] },
      { step: 9, actions: ['SoulSplit'] },
      { step: 10, actions: ['DeflectMelee'] },
      { step: 11, actions: ['SoulSplit'] },
      { step: 12, actions: ['DeflectMelee'] },
    ],
  },
];

export function getRotationById(id: string): Rotation | undefined {
  return rotations.find((r) => r.id === id);
}
