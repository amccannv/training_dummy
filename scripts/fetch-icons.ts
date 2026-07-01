import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

interface IconMapping {
  actionId: string;
  fileName: string;
  fallback?: string;
}

const WIKI_API = 'https://runescape.wiki/api.php?action=query&prop=imageinfo&iiprop=url&format=json&origin=*&titles=';

const mappings: IconMapping[] = [
  // Ranged Basic
  { actionId: 'PiercingShot',      fileName: 'Piercing_Shot.png' },
  { actionId: 'BindingShot',       fileName: 'Binding_Shot.png' },
  { actionId: 'Galeshot',          fileName: 'Galeshot.png' },
  { actionId: 'Ricochet',          fileName: 'Ricochet.png' },
  { actionId: 'GreaterRicochet',   fileName: 'Greater_Ricochet.png' },

  // Ranged Threshold
  { actionId: 'SnapShot',          fileName: 'Snap_Shot.png' },
  { actionId: 'Snipe',             fileName: 'Snipe.png' },
  { actionId: 'Bombardment',       fileName: 'Bombardment.png' },
  { actionId: 'RapidFire',         fileName: 'Rapid_Fire.png' },
  { actionId: 'ShadowTendrils',    fileName: 'Shadow_Tendrils.png' },
  { actionId: 'CorruptionShot',    fileName: 'Corruption_Shot.png' },
  { actionId: 'ImbueShadows',      fileName: 'Imbue_Shadows.png' },

  // Ranged Ultimate
  { actionId: 'Deadshot',               fileName: 'Deadshot.png' },
  { actionId: 'DeathsSwiftness',        fileName: "Death's_Swiftness.png", fallback: 'Death%27s_Swiftness.png' },
  { actionId: 'GreaterDeathsSwiftness', fileName: "Greater_Death's_Swiftness.png", fallback: 'Greater_Death%27s_Swiftness.png' },

  // Ranged Utility
  { actionId: 'Escape',            fileName: 'Escape.png' },

  // Constitution Special
  { actionId: 'EOF',               fileName: 'Essence_of_Finality_amulet.png' },
  { actionId: 'DarkBowSpec',       fileName: 'Dark_bow.png' },
  { actionId: 'ZamorakBowSpec',    fileName: 'Zamorak_bow.png' },
  { actionId: 'GloomfireBowSpec',  fileName: 'Gloomfire_bow.png' },
  { actionId: 'SGBSpec',           fileName: 'Seren_godbow.png' },
  { actionId: 'ECBSpec',           fileName: 'Eldritch_crossbow.png' },
  { actionId: 'BOTLGSpec',         fileName: 'Bow_of_the_Last_Guardian.png' },

  // Constitution Basic
  { actionId: 'Sacrifice',         fileName: 'Sacrifice.png' },
  { actionId: 'TuskasWrath',       fileName: "Tuska's_Wrath.png", fallback: 'Tuska%27s_Wrath.png' },

  // Constitution Threshold
  { actionId: 'Reprisal',          fileName: 'Reprisal.png' },
  { actionId: 'Shatter',           fileName: 'Shatter.png' },

  // Constitution Ultimate
  { actionId: 'GuthixsBlessing',   fileName: "Guthix's_Blessing.png", fallback: 'Guthix%27s_Blessing.png' },
  { actionId: 'IceAsylum',         fileName: 'Ice_Asylum.png' },
  { actionId: 'Onslaught',         fileName: 'Onslaught.png' },
  { actionId: 'Transfigure',       fileName: 'Transfigure.png' },

  // Defence Basic
  { actionId: 'Anticipate',        fileName: 'Anticipate.png' },
  { actionId: 'Bash',              fileName: 'Bash.png' },
  { actionId: 'Cease',             fileName: 'Cease.png' },
  { actionId: 'Divert',            fileName: 'Divert.png' },
  { actionId: 'Freedom',           fileName: 'Freedom.png' },
  { actionId: 'Preparation',       fileName: 'Preparation.png' },
  { actionId: 'Provoke',           fileName: 'Provoke.png' },
  { actionId: 'Resonance',         fileName: 'Resonance.png' },

  // Defence Threshold
  { actionId: 'Debilitate',        fileName: 'Debilitate.png' },
  { actionId: 'Devotion',          fileName: 'Devotion.png' },
  { actionId: 'Reflect',           fileName: 'Reflect.png' },
  { actionId: 'Revenge',           fileName: 'Revenge.png' },

  // Defence Ultimate
  { actionId: 'Barricade',         fileName: 'Barricade.png' },
  { actionId: 'Immortality',       fileName: 'Immortality.png' },
  { actionId: 'NaturalInstinct',   fileName: 'Natural_Instinct.png' },
  { actionId: 'Rejuvenate',        fileName: 'Rejuvenate.png' },

  // Prayers
  { actionId: 'SoulSplit',         fileName: 'Soul_Split.png' },
  { actionId: 'DeflectMagic',      fileName: 'Deflect_Magic.png' },
  { actionId: 'DeflectMissiles',   fileName: 'Deflect_Missiles.png' },
  { actionId: 'DeflectMelee',      fileName: 'Deflect_Melee.png' },
  { actionId: 'ProtectMagic',      fileName: 'Protect_from_Magic.png' },
  { actionId: 'ProtectMissiles',   fileName: 'Protect_from_Missiles.png' },
  { actionId: 'ProtectMelee',      fileName: 'Protect_from_Melee.png' },
];

async function fetchImageUrl(wikiFile: string): Promise<string | null> {
  const title = `File:${wikiFile}`;
  const url = `${WIKI_API}${encodeURIComponent(title)}`;
  try {
    const res = await fetch(url);
    const data = (await res.json()) as {
      query?: { pages?: Record<string, { imageinfo?: Array<{ url: string }> }> };
    };
    const pages = data.query?.pages;
    if (!pages) return null;
    for (const [, page] of Object.entries(pages)) {
      if (page.imageinfo?.[0]?.url) return page.imageinfo[0].url;
    }
    return null;
  } catch {
    return null;
  }
}

async function download(url: string, dest: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(dest, buf);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const iconDir = join(import.meta.dirname!, '..', 'public', 'icons');
  mkdirSync(iconDir, { recursive: true });

  let ok = 0;
  let fail = 0;

  for (const m of mappings) {
    const dest = join(iconDir, `${m.actionId}.png`);
    if (existsSync(dest)) continue;
    process.stdout.write(`${m.actionId.padEnd(22)} `);

    let imageUrl = await fetchImageUrl(m.fileName);
    if (!imageUrl && m.fallback) {
      imageUrl = await fetchImageUrl(m.fallback);
    }

    if (!imageUrl) {
      console.log('✗ not found');
      fail++;
      continue;
    }

    const saved = await download(imageUrl, dest);
    if (saved) {
      console.log('✓ downloaded');
      ok++;
    } else {
      console.log('✗ download failed');
      fail++;
    }

    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n${ok} succeeded, ${fail} failed`);
}

main();
