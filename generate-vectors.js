
/**
 * generate-vectors.js — Safeenah Semantic Search Preprocessor
 *
 * Usage:
 *   node generate-vectors.js
 *
 * What it does:
 *   1. Reads all JSON files from data/hadith/ and data/events/
 *   2. Extracts all text content (Bengali, Arabic, English)
 *   3. Builds TF-IDF term-weight vectors for each document
 *   4. Saves the vectors to:
 *        data/vectors/hadith-vectors.json
 *        data/vectors/event-vectors.json
 *
 * Run this script locally whenever you add new JSON files and
 * commit the resulting vector files to GitHub alongside your data.
 *
 * Requirements: Node.js ≥ 14  (no npm packages needed)
 */

'use strict';

const fs   = require('fs');
const path = require('path');

/* ─── Config ─────────────────────────────────────────────── */
const CONFIG = {
  hadith: {
    folder : 'data/hadith',
    output : 'data/vectors/hadith-vectors.json',
  },
  events: {
    folder : 'data/events',
    output : 'data/vectors/event-vectors.json',
  },
};

/* ─── Helpers ────────────────────────────────────────────── */

/** Strip HTML tags from a string */
function stripHtml(str) {
  return String(str || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ');
}

/** Normalize + tokenize any script (Bengali, Arabic, Latin) into unigrams + bigrams */
function tokenize(text) {
  if (!text) return [];

  const cleaned = stripHtml(text)
    // keep Bengali Unicode range (U+0980–U+09FF), Arabic (U+0600–U+06FF),
    // Urdu extended, Latin letters, digits; replace everything else with space
    .replace(/[^\u0980-\u09FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FFa-zA-Z0-9]+/g, ' ')
    .toLowerCase()
    .trim();

  const words = cleaned.split(/\s+/).filter(w => w.length > 1);

  // Unigrams
  const tokens = [...words];

  // Bigrams (adjacent word pairs) — crucial for Bengali phrase matching
  for (let i = 0; i < words.length - 1; i++) {
    tokens.push(words[i] + '_' + words[i + 1]);
  }

  return tokens;
}

/** Compute term frequency map for a token list */
function termFrequency(tokens) {
  const tf = {};
  for (const t of tokens) {
    tf[t] = (tf[t] || 0) + 1;
  }
  const total = tokens.length || 1;
  for (const t in tf) tf[t] /= total;
  return tf;
}

/** Extract all searchable text from a hadith JSON object */
function extractHadithText(h) {
  const parts = [
    h.title        || '',
    h.subTitle     || '',
    h.bangla_script || '',
    h.arabic_script || '',
    stripHtml(h.details || ''),
    h.book_name    || '',
    h.book_author  || '',
    h.publication  || '',
    h.edition      || '',
    h.enlist_author || '',
    Array.isArray(h.tags) ? h.tags.join(' ') : (h.tags || ''),
    h.author_manhaj || '',
    Array.isArray(h.chain_of_narrator)
      ? h.chain_of_narrator.map(n => n.name || '').join(' ')
      : '',
    // image alt text
    Array.isArray(h.images) ? h.images.map(img => img.text || '').join(' ') : '',
  ];
  return parts.join(' ');
}

/** Extract all searchable text from an event JSON object */
function extractEventText(e) {
  const parts = [
    e.title        || '',
    e.subTitle     || e.subtitle || '',
    e.description  || '',
    stripHtml(e.details || e.content || ''),
    e.location     || '',
    e.year         || '',
    Array.isArray(e.tags) ? e.tags.join(' ') : (e.tags || ''),
    e.category     || '',
    e.source       || '',
    e.book         || '',
  ];
  return parts.join(' ');
}

/** Compute IDF across a corpus (array of token lists) */
function computeIDF(allTokenSets) {
  const docCount = allTokenSets.length;
  const df = {};   // document frequency per term

  for (const tokenSet of allTokenSets) {
    const seen = new Set(tokenSet);
    for (const t of seen) {
      df[t] = (df[t] || 0) + 1;
    }
  }

  const idf = {};
  for (const t in df) {
    idf[t] = Math.log((docCount + 1) / (df[t] + 1)) + 1;  // smoothed IDF
  }
  return idf;
}

/** Multiply TF × IDF and keep only top-N terms by weight to save space */
function tfidfVector(tf, idf, topN = 200) {
  const vec = {};
  for (const t in tf) {
    if (idf[t]) vec[t] = tf[t] * idf[t];
  }

  // Keep only topN highest-weight terms
  const sorted = Object.entries(vec).sort((a, b) => b[1] - a[1]);
  const trimmed = {};
  for (let i = 0; i < Math.min(topN, sorted.length); i++) {
    trimmed[sorted[i][0]] = +sorted[i][1].toFixed(6);
  }
  return trimmed;
}

/** Parse a JSON file: handles single object or array */
function readJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [parsed];
}

/** Process one corpus (hadith or events) */
function processCorpus(folderPath, outputPath, extractFn, label) {
  console.log(`\n${'═'.repeat(52)}`);
  console.log(` Processing: ${label}`);
  console.log(`${'═'.repeat(52)}`);

  if (!fs.existsSync(folderPath)) {
    console.error(`  ✗  Folder not found: ${folderPath}`);
    return;
  }

  const jsonFiles = fs.readdirSync(folderPath)
    .filter(f => f.endsWith('.json'))
    .sort();

  if (!jsonFiles.length) {
    console.warn(`  ⚠  No JSON files found in ${folderPath}`);
    return;
  }

  console.log(`  Source Folder : ${folderPath}`);
  console.log(`  Files Found   : ${jsonFiles.length}`);

  // Step 1: load all docs and extract text
  const docs = [];
  for (const fname of jsonFiles) {
    const filePath = path.join(folderPath, fname);
    try {
      const items = readJsonFile(filePath);
      for (const item of items) {
        const text   = extractFn(item);
        const tokens = tokenize(text);
        docs.push({
          slug    : item.slug || fname.replace('.json', ''),
          title   : item.title || item.name || fname,
          file    : fname,
          tokens,
          rawText : text,
        });
      }
    } catch (err) {
      console.error(`  ✗  Failed to parse ${fname}: ${err.message}`);
    }
  }

  console.log(`  Documents     : ${docs.length}`);

  // Step 2: compute IDF
  const idf = computeIDF(docs.map(d => d.tokens));

  // Step 3: compute TF-IDF vectors
  const vectors = docs.map(doc => {
    const tf  = termFrequency(doc.tokens);
    const vec = tfidfVector(tf, idf, 250);
    console.log(`  ✓  ${doc.slug} (${Object.keys(vec).length} terms)`);
    return {
      slug  : doc.slug,
      title : doc.title,
      file  : doc.file,
      vector: vec,
    };
  });

  // Step 4: also store the global IDF so browser can vectorize queries the same way
  const output = {
    generated: new Date().toISOString(),
    docCount : docs.length,
    idf,          // global IDF table — browser uses this to vectorize the query
    documents: vectors,
  };

  // Ensure output directory exists
  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(outputPath, JSON.stringify(output));

  const sizeKb = (fs.statSync(outputPath).size / 1024).toFixed(1);
  console.log(`\n  Output → ${outputPath}  (${sizeKb} KB)`);
  console.log(`  ✓  Done — ${vectors.length} document vectors saved.`);
}


/* ─── Main ───────────────────────────────────────────────── */
console.log('\n╔══════════════════════════════════════════════════════╗');
console.log('║        SAFEENAH — Semantic Vector Generator         ║');
console.log('╚══════════════════════════════════════════════════════╝');
console.log(`  Run at: ${new Date().toLocaleString()}`);

processCorpus(
  CONFIG.hadith.folder,
  CONFIG.hadith.output,
  extractHadithText,
  'HADITH'
);

processCorpus(
  CONFIG.events.folder,
  CONFIG.events.output,
  extractEventText,
  'EVENTS'
);

console.log('\n╔══════════════════════════════════════════════════════╗');
console.log('║                    SUMMARY                          ║');
console.log('╚══════════════════════════════════════════════════════╝');
console.log('  Vector files written to data/vectors/');
console.log('  Commit these files to GitHub alongside your JSON data.');
console.log('  Run this script again after adding any new JSON files.\n');