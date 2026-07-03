import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

interface ActionDef {
  id: string;
  name: string;
}

function getActions(): ActionDef[] {
  const content = readFileSync(join(import.meta.dirname!, '..', 'src', 'data', 'actions.ts'), 'utf8');
  const regex = /{ id: '(\w+)', name: '(?:([^']*?)'|"([^"]*?)")/gs;
  const actions: ActionDef[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    const id = match[1];
    const name = match[2] || match[3];
    if (id && name) actions.push({ id, name });
  }
  return actions;
}

function wikiNameLower(name: string): string {
  return name.replace(/:/g, '').replace(/'/g, '%27').replace(/ /g, '_');
}

function wikiNameTitle(name: string): string {
  const small = new Set(['of', 'the', 'a', 'an', 'and', 'in', 'on', 'to', 'for']);
  return name
    .replace(/:/g, '')
    .replace(/'/g, '%27')
    .replace(/\b\w+/g, (w) => small.has(w.toLowerCase()) ? w : w.charAt(0).toUpperCase() + w.slice(1))
    .replace(/ /g, '_');
}

function baseName(name: string): string | null {
  if (name.startsWith('Greater ')) return name.slice(8);
  return null;
}

function candidateUrls(id: string, name: string): string[] {
  const urls: string[] = [];

  urls.push(`https://runescape.wiki/images/transcoded/Ability-${id}.wav/Ability-${id}.wav.ogg`);

  urls.push(`https://runescape.wiki/images/${wikiNameTitle(name)}.ogg`);

  const lower = wikiNameLower(name);
  const titled = wikiNameTitle(name);
  if (lower !== titled) {
    urls.push(`https://runescape.wiki/images/${lower}.ogg`);
  }

  if (titled !== id && lower !== id) {
    urls.push(`https://runescape.wiki/images/${id}.ogg`);
  }

  const base = baseName(name);
  if (base) {
    const baseTitled = wikiNameTitle(base);
    urls.push(`https://runescape.wiki/images/${baseTitled}.ogg`);
    urls.push(`https://runescape.wiki/images/transcoded/Ability-${wikiNameTitle(base).replace(/_/g, '')}.wav/Ability-${wikiNameTitle(base).replace(/_/g, '')}.wav.ogg`);
    urls.push(`https://runescape.wiki/images/transcoded/Ability-${wikiNameTitle(base).replace(/_/g, '')}.wav/Ability-${wikiNameTitle(base).replace(/_/g, '')}.wav.mp3`);
  }

  const override = OVERRIDES[id];
  if (override) {
    urls.push(...override);
  }

  return urls;
}

const OVERRIDES: Record<string, string[]> = {
  // case sensitivity
  Deadshot: [
    'https://runescape.wiki/images/transcoded/Ability-DeadShot.wav/Ability-DeadShot.wav.ogg',
  ],
  // uses base ability sound
  Divert: [
    'https://runescape.wiki/images/transcoded/Ability-Resonance.wav/Ability-Resonance.wav.ogg',
  ],
  // wiki uses "Anticipation" not "Anticipate"
  Anticipate: [
    'https://runescape.wiki/images/Anticipation.ogg',
  ],
  // wiki concatenates "VolleyofSouls" (no space)
  VolleyOfSouls: [
    'https://runescape.wiki/images/transcoded/Ability-VolleyofSouls.wav/Ability-VolleyofSouls.wav.ogg',
  ],
  GreaterChain: [
    'https://runescape.wiki/images/transcoded/Ability-Chain.wav/Ability-Chain.wav.mp3',
  ],
  GreaterBarge: [
    'https://runescape.wiki/images/transcoded/Ability-Barge.wav/Ability-Barge.wav.mp3',
  ],
  GreaterFlurry: [
    'https://runescape.wiki/images/transcoded/Ability-Flurry.wav/Ability-Flurry.wav.ogg',
  ],
  MagicBasic: [
    'https://runescape.wiki/images/Incite_Fear.ogg',
  ],
  MeleeBasic: [
    'https://runescape.wiki/images/Draconic_Blow.ogg',
  ],
  RangedBasic: [
    'https://runescape.wiki/images/Ranged_%28ability%29.ogg',
  ],
  NecroBasic: [
    'https://runescape.wiki/images/Necromancy_%28ability%29.ogg',
  ],
};

async function tryDownload(urls: string[], dest: string): Promise<boolean> {
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        writeFileSync(dest, buf);
        return true;
      }
    } catch {
      // try next
    }
  }
  return false;
}

async function main() {
  const soundDir = join(import.meta.dirname!, '..', 'public', 'sounds');
  mkdirSync(soundDir, { recursive: true });

  const actions = getActions();

  let ok = 0;
  let fail = 0;
  let skip = 0;

  for (const action of actions) {
    const dest = join(soundDir, `${action.id}.ogg`);
    if (existsSync(dest)) {
      skip++;
      continue;
    }

    const urls = candidateUrls(action.id, action.name);

    process.stdout.write(`${action.id.padEnd(24)} `);

    const success = await tryDownload(urls, dest);
    if (success) {
      console.log('✓');
      ok++;
    } else {
      console.log('✗');
      fail++;
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\n${ok} downloaded, ${skip} skipped, ${fail} failed`);
}

main();
