import type { Rotation } from '../types';
import { getActionById } from '../data/actions';

const GCD = 3;

export function abilityDuration(abilityId: string): number {
  const def = getActionById(abilityId);
  if (!def) return GCD;
  if (def.durationTicks === 0) return 0;
  if (def.isChanneled) return def.durationTicks;
  return GCD;
}

export function compileTicks(rotation: Rotation): number[] {
  const result: number[] = [];
  let nextTick = GCD;

  for (const abilityId of rotation.abilities) {
    result.push(nextTick);
    const dur = abilityDuration(abilityId);
    if (dur > 0) nextTick = nextTick + dur;
  }

  return result;
}

export function compileEndTick(rotation: Rotation): number {
  let nextTick = GCD;

  for (const abilityId of rotation.abilities) {
    const dur = abilityDuration(abilityId);
    nextTick = nextTick + dur;
  }

  return nextTick;
}
