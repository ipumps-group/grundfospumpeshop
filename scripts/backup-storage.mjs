#!/usr/bin/env node
/**
 * Backup all objects from Supabase Storage buckets recursively.
 * Intended for GitHub Actions backup workflow.
 *
 * Required env vars:
 *   SUPABASE_URL  (or NEXT_PUBLIC_SUPABASE_URL as fallback)
 *   SUPABASE_SERVICE_ROLE_KEY
 * Optional:
 *   BACKUP_BUCKETS   comma-separated bucket names (default: products)
 *   OUTPUT_DIR       base directory for downloads (default: images)
 *   CONCURRENCY      parallel downloads (default: 10)
 */

import fs from 'fs';
import path from 'path';

function loadEnvLocal() {
  try {
    const text = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf-8');
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      let value = m[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (process.env[m[1]] === undefined) {
        process.env[m[1]] = value;
      }
    }
  } catch {
    // ignore – env vars should be set in CI
  }
}

if (!process.env.SUPABASE_URL) loadEnvLocal();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKETS = (process.env.BACKUP_BUCKETS || 'products')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const OUTPUT_DIR = process.env.OUTPUT_DIR || 'images';
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '10', 10);

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function apiPost(pathname, body) {
  const res = await fetch(`${SUPABASE_URL}${pathname}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${pathname}: ${text.slice(0, 500)}`);
  }
  return res.json();
}

async function listAllObjects(bucket, prefix) {
  const items = [];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const page = await apiPost(`/storage/v1/object/list/${bucket}`, { prefix, limit, offset });
    items.push(...page);
    if (page.length < limit) break;
    offset += limit;
  }
  return items;
}

async function collectObjectPaths(bucket) {
  const paths = [];

  async function walk(prefix) {
    const items = await listAllObjects(bucket, prefix);
    const folders = items.filter(i => i.id === null).map(i => i.name);
    const files = items.filter(i => i.id !== null);

    for (const folder of folders) {
      const subPrefix = prefix ? `${prefix}/${folder}` : folder;
      await walk(subPrefix);
    }

    for (const file of files) {
      paths.push(prefix ? `${prefix}/${file.name}` : file.name);
    }
  }

  await walk('');
  return paths;
}

async function downloadObject(bucket, objectPath, destPath) {
  const encodedPath = objectPath.split('/').map(encodeURIComponent).join('/');
  const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${encodedPath}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${url}: ${text.slice(0, 500)}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, buffer);
}

async function runWithLimit(items, limit, handler) {
  let index = 0;
  const workers = [];
  for (let i = 0; i < limit; i++) {
    workers.push(
      (async () => {
        while (index < items.length) {
          const idx = index++;
          await handler(items[idx], idx);
        }
      })()
    );
  }
  await Promise.all(workers);
}

async function backupBucket(bucket) {
  console.log(`\nListing objects in bucket: ${bucket}`);
  const objectPaths = await collectObjectPaths(bucket);
  console.log(`  Found ${objectPaths.length} objects`);

  let downloaded = 0;
  let skipped = 0;
  const destPaths = objectPaths.map(p => path.join(OUTPUT_DIR, bucket, p));

  await runWithLimit(objectPaths, CONCURRENCY, async (objectPath) => {
    const destPath = path.join(OUTPUT_DIR, bucket, objectPath);
    if (fs.existsSync(destPath)) {
      skipped++;
      return;
    }
    await downloadObject(bucket, objectPath, destPath);
    downloaded++;
  });

  console.log(`  Downloaded: ${downloaded}, skipped: ${skipped}`);
  return { bucket, total: objectPaths.length, downloaded, skipped };
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const stats = [];
  for (const bucket of BUCKETS) {
    stats.push(await backupBucket(bucket));
  }
  const total = stats.reduce((sum, s) => sum + s.total, 0);
  console.log(`\nTotal objects backed up: ${total}`);
}

main().catch((err) => {
  console.error('Backup failed:', err.message);
  process.exit(1);
});
