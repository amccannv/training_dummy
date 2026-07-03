import type { Rotation } from '../types';

export const rotations: Rotation[] = [
  {
    id: 'one-minute-ranged-drill',
    name: 'One Minute Ranged Drill',
    abilities: [
      'ImbueShadows',
      'Ricochet',
      'PiercingShot',
      'GreaterDeathsSwiftness',
      'PiercingShot',
      'Galeshot',
      'RapidFire',
      'Ricochet',
      'Deadshot',
      'SnapShot',
      'ShadowTendrils',
      'SnapShot',
      'Snipe',
      'Ricochet',
      'PiercingShot',
      'Galeshot',
      'RapidFire',
      'SnapShot',
      'Ricochet',
      'SnapShot',
      'PiercingShot',
      'RangedBasic',
      'PiercingShot',
      'RangedBasic',
      'PiercingShot',
      'Galeshot',
      'RapidFire',
      'PiercingShot',
      'RangedBasic',
      'ImbueShadows',
      'Ricochet',
      'PiercingShot',
      'GreaterDeathsSwiftness',
    ],
  },
];

export function getRotationById(id: string): Rotation | undefined {
  return rotations.find((r) => r.id === id);
}
