import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

interface IconMapping {
  actionId: string;
  fileName: string;
  fallback?: string;
}

const WIKI_API = 'https://runescape.wiki/api.php?action=query&prop=imageinfo&iiprop=url&format=json&origin=*&titles=';

const mappings: IconMapping[] = [
  { actionId: 'NeedleStrike',       fileName: 'Needle_Strike.png' },
  { actionId: 'DazingShot',         fileName: 'Dazing_Shot.png' },
  { actionId: 'Snipe',              fileName: 'Snipe.png' },
  { actionId: 'Ricochet',           fileName: 'Ricochet.png' },
  { actionId: 'FragmentationShot',  fileName: 'Fragmentation_Shot.png' },
  { actionId: 'BindingShot',        fileName: 'Binding_Shot.png' },
  { actionId: 'TuskasWrath',        fileName: "Tuska's_Wrath.png", fallback: 'Tuska%27s_Wrath.png' },
  { actionId: 'Sacrifice',          fileName: 'Sacrifice.png' },
  { actionId: 'RapidFire',          fileName: 'Rapid_Fire.png' },
  { actionId: 'SnapShot',           fileName: 'Snap_Shot.png' },
  { actionId: 'TightBindings',      fileName: 'Tight_Bindings.png' },
  { actionId: 'ShadowTendrils',     fileName: 'Shadow_Tendrils.png' },
  { actionId: 'Bombardment',        fileName: 'Bombardment.png' },
  { actionId: 'DeathsSwiftness',    fileName: "Death's_Swiftness.png", fallback: 'Death%27s_Swiftness.png' },
  { actionId: 'IncendiaryShot',     fileName: 'Incendiary_Shot.png' },
  { actionId: 'Deadshot',           fileName: 'Deadshot.png' },
  { actionId: 'EOF',                fileName: 'Essence_of_Finality_amulet.png' },
  { actionId: 'DarkBowSpec',        fileName: 'Dark_bow.png' },
  { actionId: 'ECBSpec',            fileName: 'Eldritch_crossbow.png' },
  { actionId: 'SGBSpec',            fileName: 'Seren_godbow.png' },
  { actionId: 'BOTLGSpec',          fileName: 'Bow_of_the_Last_Guardian.png' },
  { actionId: 'SoulSplit',          fileName: 'Soul_Split.png' },
  { actionId: 'DeflectMagic',       fileName: 'Deflect_Magic.png' },
  { actionId: 'DeflectMissiles',    fileName: 'Deflect_Missiles.png' },
  { actionId: 'DeflectMelee',       fileName: 'Deflect_Melee.png' },
  { actionId: 'ProtectMagic',       fileName: 'Protect_from_Magic.png' },
  { actionId: 'ProtectMissiles',    fileName: 'Protect_from_Missiles.png' },
  { actionId: 'ProtectMelee',       fileName: 'Protect_from_Melee.png' },
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
    process.stdout.write(`${m.actionId.padEnd(20)} `);

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

    await new Promise((r) => setTimeout(r, 250));
  }

  console.log(`\n${ok} succeeded, ${fail} failed`);
}

main();
