/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║           SAFEENAH — HADITH SEMANTIC VECTOR GENERATOR           ║
 * ║  Run this locally before pushing to GitHub to enable AI Search  ║
 * ║                                                                  ║
 * ║  Usage:  node generate-vectors.js                               ║
 * ║  Output: data/vectors/hadith-vectors.json                       ║
 * ║                                                                  ║
 * ║  Model:  paraphrase-multilingual-MiniLM-L12-v2                  ║
 * ║  Supports Bengali, Arabic, English — no backend required        ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Dependencies:  npm install @xenova/transformers --ignore-scripts
 *
 * How it works:
 *   1. Scans data/hadith/*.json for all hadith files
 *   2. Extracts text segments (title, subTitle, bangla_script paragraphs, details <p> blocks)
 *   3. Embeds each segment into a 384-dim float32 vector using a multilingual model
 *   4. Saves all vectors + metadata to data/vectors/hadith-vectors.json
 *   5. Uses a cache (.vector-cache.json) to skip already-vectorized files
 *
 * The output JSON is loaded by hadith.html in the browser for cosine-similarity search.
 */

import { pipeline } from '@xenova/transformers';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

// ──────────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────────
const HADITH_DIR   = 'data/hadith';
const OUTPUT_FILE  = 'data/vectors/hadith-vectors.json';
const CACHE_FILE   = '.vector-cache.json';
const MODEL_NAME   = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
const BATCH_SIZE   = 8;   // segments per model batch (tune to your RAM)
const MAX_CHARS    = 800; // max chars per text segment before trimming

// ──────────────────────────────────────────────
// TERMINAL COLOURS
// ──────────────────────────────────────────────
const C = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  gold:  '\x1b[33m', blue: '\x1b[36m', green: '\x1b[32m',
  red:   '\x1b[31m', yellow: '\x1b[93m', gray: '\x1b[90m',
};
const log  = (msg)  => console.log(`${C.gold}◆${C.reset} ${msg}`);
const info = (msg)  => console.log(`  ${C.blue}→${C.reset} ${msg}`);
const ok   = (msg)  => console.log(`  ${C.green}✓${C.reset} ${msg}`);
const warn = (msg)  => console.log(`  ${C.yellow}⚠${C.reset} ${msg}`);
const err  = (msg)  => console.log(`  ${C.red}✗${C.reset} ${msg}`);
const dim  = (msg)  => process.stdout.write(`${C.gray}${msg}${C.reset}`);

// ──────────────────────────────────────────────
// CACHE
// ──────────────────────────────────────────────
function loadCache() {
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); }
  catch { return { files: {}, modelName: '' }; }
}
function saveCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
}

// ──────────────────────────────────────────────
// HTML STRIPPING
// ──────────────────────────────────────────────
function stripHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

// ──────────────────────────────────────────────
// EXTRACT <p> BLOCKS from HTML details field
// ──────────────────────────────────────────────
function extractParagraphs(html) {
  if (!html) return [];
  const paragraphs = [];
  // Match <p ...>...</p> blocks
  const re = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const text = stripHtml(m[1]).trim();
    if (text.length > 20) paragraphs.push(text);
  }
  // If no <p> tags, split by newlines
  if (!paragraphs.length) {
    const plain = stripHtml(html);
    plain.split(/\n{2,}/).forEach(seg => {
      const t = seg.trim();
      if (t.length > 20) paragraphs.push(t);
    });
  }
  return paragraphs;
}

// ──────────────────────────────────────────────
// SPLIT LONG TEXT into overlapping windows
// ──────────────────────────────────────────────
function splitIntoWindows(text, maxChars = MAX_CHARS, overlap = 100) {
  if (text.length <= maxChars) return [text];
  const segments = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + maxChars, text.length);
    segments.push(text.slice(start, end).trim());
    if (end >= text.length) break;
    start += maxChars - overlap;
  }
  return segments;
}

// ──────────────────────────────────────────────
// EXTRACT ALL SEGMENTS from a hadith JSON object
// Each segment gets: { segId, type, text, hadithSlug, hadithTitle }
// ──────────────────────────────────────────────
function extractSegments(hadith, slug) {
  const segs = [];
  const add = (type, text) => {
    if (!text || text.trim().length < 10) return;
    const chunks = splitIntoWindows(text.trim());
    chunks.forEach((chunk, ci) => {
      segs.push({
        segId:       `${slug}::${type}::${ci}`,
        type,
        text:        chunk,
        hadithSlug:  slug,
        hadithTitle: hadith.title || slug,
      });
    });
  };

  // Title & subTitle
  add('title',    hadith.title);
  add('subtitle', hadith.subTitle);

  // Bangla script — split by double newline (natural paragraph breaks)
  if (hadith.bangla_script) {
    const bParas = hadith.bangla_script.split(/\n{2,}/);
    bParas.forEach((p, i) => {
      const t = p.trim();
      if (t.length > 10) add(`bangla_para_${i}`, t);
    });
    // Also add the whole bangla text (truncated) as one segment for overall matching
    if (hadith.bangla_script.length > 50) {
      add('bangla_full', hadith.bangla_script.slice(0, MAX_CHARS));
    }
  }

  // Arabic script
  if (hadith.arabic_script) {
    add('arabic', hadith.arabic_script.slice(0, MAX_CHARS));
  }

  // Details (HTML) — extract <p> blocks
  if (hadith.details) {
    const paras = extractParagraphs(hadith.details);
    paras.forEach((p, i) => add(`details_p_${i}`, p));
    if (!paras.length) add('details', stripHtml(hadith.details).slice(0, MAX_CHARS));
  }

  // Book meta (useful for "which book says X")
  const bookMeta = [hadith.book_name, hadith.book_author, hadith.publication].filter(Boolean).join(' — ');
  if (bookMeta) add('book_meta', bookMeta);

  // Tags combined
  const tags = Array.isArray(hadith.tags) ? hadith.tags.join(', ') : (hadith.tags || '');
  if (tags) add('tags', tags);

  // Images text descriptions
  if (Array.isArray(hadith.images)) {
    const imgTexts = hadith.images.map(img => img.text || '').filter(Boolean).join('. ');
    if (imgTexts) add('image_desc', imgTexts);
  }

  return segs;
}

// ──────────────────────────────────────────────
// PROGRESS BAR
// ──────────────────────────────────────────────
function progressBar(done, total, width = 28) {
  const pct  = total ? Math.round((done / total) * 100) : 0;
  const fill = Math.round((done / total) * width);
  const bar  = '█'.repeat(fill) + '░'.repeat(width - fill);
  return `${C.gold}[${bar}]${C.reset} ${pct}% (${done}/${total})`;
}

// ──────────────────────────────────────────────
// EMBED TEXT BATCH using @xenova/transformers
// Returns Float32Array[] (one per text)
// ──────────────────────────────────────────────
async function embedBatch(pipe, texts) {
  const output = await pipe(texts, { pooling: 'mean', normalize: true });
  // output.tolist() returns Array<number[]>
  const vecs = output.tolist ? output.tolist() : Array.from({ length: texts.length }, (_, i) => Array.from(output.data.slice(i * 384, (i + 1) * 384)));
  return vecs;
}

// ──────────────────────────────────────────────
// FILE HASH — simple content hash for cache
// ──────────────────────────────────────────────
function fileHash(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let h = 0;
  for (let i = 0; i < content.length; i++) {
    h = ((h << 5) - h + content.charCodeAt(i)) | 0;
  }
  return h.toString(16);
}

// ──────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────
(async () => {
  console.log(`\n${C.bold}${C.gold}╔══════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}${C.gold}║   SAFEENAH HADITH VECTOR GENERATOR      ║${C.reset}`);
  console.log(`${C.bold}${C.gold}╚══════════════════════════════════════════╝${C.reset}\n`);

  // Ensure output directory exists
  const outDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outDir)) { fs.mkdirSync(outDir, { recursive: true }); ok(`Created ${outDir}`); }

  // Load cache
  const cache = loadCache();
  if (cache.modelName && cache.modelName !== MODEL_NAME) {
    warn('Model changed — rebuilding all vectors from scratch.');
    cache.files = {};
  }
  cache.modelName = MODEL_NAME;

  // Scan hadith files
  if (!fs.existsSync(HADITH_DIR)) { err(`Directory not found: ${HADITH_DIR}`); process.exit(1); }
  const jsonFiles = fs.readdirSync(HADITH_DIR)
    .filter(f => f.endsWith('.json'))
    .sort()
    .map(f => path.join(HADITH_DIR, f));

  if (!jsonFiles.length) { warn('No JSON files found in data/hadith/'); process.exit(0); }
  log(`Found ${jsonFiles.length} hadith JSON files`);

  // Load existing output (for merging)
  let existingOutput = { segments: [], generatedAt: '', model: MODEL_NAME };
  if (fs.existsSync(OUTPUT_FILE)) {
    try { existingOutput = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8')); }
    catch { warn('Could not parse existing output — rebuilding.'); }
  }
  // Index existing segments by segId for quick lookup
  const existingMap = new Map((existingOutput.segments || []).map(s => [s.segId, s]));

  // Determine which files need (re)processing
  const toProcess = [];
  const upToDate  = [];
  for (const fpath of jsonFiles) {
    const hash = fileHash(fpath);
    if (cache.files[fpath] && cache.files[fpath].hash === hash) {
      upToDate.push(fpath);
    } else {
      toProcess.push({ fpath, hash });
    }
  }

  if (upToDate.length) info(`${upToDate.length} file(s) up-to-date (skipped)`);
  if (!toProcess.length) {
    ok('All files are up-to-date. Nothing to do.');
    // Still write output in case it was missing
    if (!fs.existsSync(OUTPUT_FILE)) {
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(existingOutput, null, 2), 'utf8');
      ok(`Written: ${OUTPUT_FILE}`);
    }
    process.exit(0);
  }

  log(`${toProcess.length} file(s) need vectorization`);

  // Load model
  log(`Loading model: ${C.blue}${MODEL_NAME}${C.reset}`);
  info('This downloads ~120 MB on first run, then caches locally.');
  const pipe = await pipeline('feature-extraction', MODEL_NAME, {
    progress_callback: (progress) => {
      if (progress.status === 'downloading') {
        process.stdout.write(`\r  ${C.gray}Downloading model: ${Math.round((progress.loaded / progress.total) * 100)}%   ${C.reset}`);
      }
    },
  });
  process.stdout.write('\n');
  ok('Model ready');

  // Process each new/changed file
  let totalNewSegments = 0;

  for (let fi = 0; fi < toProcess.length; fi++) {
    const { fpath, hash } = toProcess[fi];
    const fname = path.basename(fpath);

    console.log(`\n  ${C.bold}[${fi + 1}/${toProcess.length}]${C.reset} ${C.gold}${fname}${C.reset}`);

    // Parse JSON
    let raw;
    try { raw = JSON.parse(fs.readFileSync(fpath, 'utf8')); }
    catch (e) { err(`JSON parse error: ${e.message}`); continue; }

    const hadithArray = Array.isArray(raw) ? raw : [raw];
    const slug = path.basename(fname, '.json');

    // Remove old segments for this file from existingMap
    for (const [key] of existingMap) {
      if (key.startsWith(slug + '::')) existingMap.delete(key);
    }

    // Extract segments
    let allSegs = [];
    for (const hadith of hadithArray) {
      const hslug = hadith.slug || slug;
      const segs = extractSegments(hadith, hslug);
      allSegs = allSegs.concat(segs);
    }

    info(`  ${allSegs.length} text segments extracted`);

    // Embed in batches
    for (let bi = 0; bi < allSegs.length; bi += BATCH_SIZE) {
      const batch = allSegs.slice(bi, bi + BATCH_SIZE);
      const texts = batch.map(s => s.text);
      try {
        const vecs = await embedBatch(pipe, texts);
        batch.forEach((seg, idx) => {
          existingMap.set(seg.segId, { ...seg, vector: vecs[idx] });
        });
        totalNewSegments += batch.length;
        process.stdout.write(`\r    ${progressBar(Math.min(bi + BATCH_SIZE, allSegs.length), allSegs.length)}`);
      } catch (e) {
        err(`\n  Embedding failed for batch ${bi}: ${e.message}`);
      }
    }
    process.stdout.write('\n');

    // Update cache
    cache.files[fpath] = { hash, segments: allSegs.length, processedAt: new Date().toISOString() };
    ok(`  Done — ${allSegs.length} segments embedded`);
  }

  // Compile output — filter to only keep segments from files we still have
  const validSlugs = new Set(jsonFiles.map(f => path.basename(f, '.json')));
  const allSegments = [];
  for (const [segId, seg] of existingMap) {
    const hadithSlug = seg.hadithSlug;
    if (validSlugs.has(hadithSlug) || jsonFiles.some(f => f.includes(hadithSlug))) {
      allSegments.push(seg);
    }
  }

  // Group by hadithSlug for statistics
  const bySlug = {};
  for (const seg of allSegments) {
    (bySlug[seg.hadithSlug] = bySlug[seg.hadithSlug] || []).push(seg);
  }

  // Build output JSON
  const output = {
    model:        MODEL_NAME,
    generatedAt:  new Date().toISOString(),
    vectorDim:    384,
    totalHadith:  Object.keys(bySlug).length,
    totalSegments: allSegments.length,
    hadithFiles:  jsonFiles.map(f => path.basename(f)),
    // Per-hadith index (for browser to know which hadith each segment belongs to)
    hadithIndex:  Object.fromEntries(
      Object.entries(bySlug).map(([slug, segs]) => [
        slug,
        { title: segs[0]?.hadithTitle || slug, segmentCount: segs.length }
      ])
    ),
    segments: allSegments,
  };

  // Write output
  const outJson = JSON.stringify(output);
  fs.writeFileSync(OUTPUT_FILE, outJson, 'utf8');
  const sizeKB = Math.round(fs.statSync(OUTPUT_FILE).size / 1024);
  saveCache(cache);

  // Summary
  console.log(`\n${C.bold}${C.gold}══════════════════════════════════════════${C.reset}`);
  console.log(`${C.bold} SUMMARY${C.reset}`);
  console.log(`${C.gold}══════════════════════════════════════════${C.reset}`);
  ok(`Model        : ${MODEL_NAME}`);
  ok(`Hadith files : ${jsonFiles.length}`);
  ok(`Total segs   : ${allSegments.length}`);
  ok(`New segs     : ${totalNewSegments}`);
  ok(`Output size  : ${sizeKB} KB`);
  ok(`Output file  : ${OUTPUT_FILE}`);
  console.log(`\n${C.green}${C.bold}✓ Done. Commit ${OUTPUT_FILE} to GitHub.${C.reset}\n`);
})();