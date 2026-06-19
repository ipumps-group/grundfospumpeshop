const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs/promises');

const envRaw = require('fs').readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
const env = Object.fromEntries(
  envRaw.split('\n')
    .filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.substring(0, i).trim(), l.substring(i + 1).trim().replace(/^["']|["']$/g, '')] })
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('ERROR: Missing env vars in .env.local (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const BUCKET_NAME = 'products';
const OLD_DOMAIN_PART = 'outline.ee';
const LOG_FILE = 'migration-log-v24.json';

const TEST_MODE = false;     // Muuda false'iks täieliku migreerimise jaoks
const TEST_LIMIT = 5;       // Kui TEST_MODE = true

async function main() {
  console.log('=== Piltide migreerimine (Node v24 native fetch) ===');
  console.log('TEST_MODE:', TEST_MODE ? `Ainult ${TEST_LIMIT} toodet` : 'KÕIK');

  let migrated = [];
  let failed = [];

  try {
    // Lae tooted
    let query = supabase
      .from('products')
      .select('id, sku, name, image_url')
      .ilike('image_url', `%${OLD_DOMAIN_PART}%`)
      .order('id');

    if (TEST_MODE) query = query.limit(TEST_LIMIT);

    const { data: products, error } = await query;

    if (error) throw new Error(`Tooted ei laadinud: ${error.message}`);
    if (!products?.length) {
      console.log('Sobivaid tooteid ei leitud.');
      return;
    }

    console.log(`Leitud ${products.length} toodet vana pildiga`);

    for (const p of products) {
      const oldUrl = p.image_url?.trim();
      if (!oldUrl) continue;

      console.log(`\nTöötlen: ID ${p.id} | ${p.sku || '–'} | ${p.name}`);
      console.log('    Laen alla:', oldUrl);

      try {
        const res = await fetch(oldUrl, {
          redirect: 'follow',
          signal: AbortSignal.timeout(30000) // 30s timeout
        });

        if (!res.ok) {
          throw new Error(`Allalaadimine: ${res.status} ${res.statusText}`);
        }

        const buffer = await res.arrayBuffer();

        let ext = path.extname(oldUrl.split('?')[0]) || '.jpg';
        const safeName = (p.sku || `prod-${p.id}`).replace(/[^a-z0-9-]/gi, '_');
        const filePath = `images/${safeName}${ext}`;

        console.log('    Laadin üles:', filePath);

        const { error: uploadErr } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, buffer, {
            contentType: res.headers.get('content-type') || 'image/jpeg',
            upsert: true,
            cacheControl: '31536000'
          });

        if (uploadErr) throw new Error(`Üleslaadimine: ${uploadErr.message}`);

        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath);

        const newUrl = urlData.publicUrl;

        if (!newUrl) throw new Error('Public URL puudub');

        console.log('    Uuendan tabelit:', newUrl);

        const { error: updateErr } = await supabase
          .from('products')
          .update({ image_url: newUrl })
          .eq('id', p.id);

        if (updateErr) throw new Error(`Tabeli uuendus: ${updateErr.message}`);

        console.log('    EDU!');
        migrated.push({ id: p.id, sku: p.sku, old: oldUrl, new: newUrl });

      } catch (err) {
        console.error('    VIGA:', err.message || err);
        console.error('    URL oli:', oldUrl);
        failed.push({ id: p.id, error: err.message || 'Tundmatu viga' });
      }
    }

    await fs.writeFile(LOG_FILE, JSON.stringify({ migrated, failed }, null, 2));
    console.log(`\nLogi salvestatud: ${LOG_FILE}`);

  } catch (err) {
    console.error('Kriitiline viga:', err);
  } finally {
    console.log('\n=== TULEMUS ===');
    console.log(`Edukaid: ${migrated.length}`);
    console.log(`Ebaõnnestunud: ${failed.length}`);
    if (failed.length) {
      console.log('Esimene viga:', failed[0]?.error);
      console.log('Detailid:', failed[0]);
    }
  }
}

main();