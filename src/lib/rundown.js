/* ---------- Konstanta & utilitas ---------- */
export const extOf = n => (n.match(/\.([^.\\/]+)$/) || [, ''])[1].toLowerCase();
export const baseName = p => String(p).split(/[\\/]/).pop();
export const stripExt = n => baseName(n).replace(/\.[^.]+$/, '');
export const isAbs = p => /^([a-zA-Z]:[\\/]|\\\\|\/|~)/.test(p);

const VIDEO = ['mp4', 'mov', 'mkv', 'webm', 'avi', 'flv', 'm4v', 'ts', 'mpg', 'mpeg', 'wmv'];
const AUDIO = ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'opus'];
const IMAGE = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'tga', 'psd'];
export const RUNDOWN_EXT = ['txt', 'csv', 'json'];

export const TYPE_LABEL = { video: 'Video', image: 'Gambar', audio: 'Audio', text: 'Teks' };
export const TYPE_SHORT = { video: 'VID', image: 'IMG', audio: 'AUD', text: 'TXT' };
export const MONITOR = {
  none: 'OBS_MONITORING_TYPE_NONE',
  monitor: 'OBS_MONITORING_TYPE_MONITOR_ONLY',
  both: 'OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT',
};
export const MONITOR_LABEL = { none: 'Monitor mati', monitor: 'Monitor saja', both: 'Monitor dan output' };
export const FILTERS = [
  { id: 'noise', label: 'Noise suppression', prefix: 'noise_suppress_filter', fallback: 'noise_suppress_filter_v2', alias: ['noise', 'ns', 'noise suppression', 'noisesuppression', 'noise_suppression', 'suppression'] },
  { id: 'gate', label: 'Noise gate', prefix: 'noise_gate_filter', fallback: 'noise_gate_filter', alias: ['gate', 'noise gate', 'noisegate', 'noise_gate'] },
  { id: 'comp', label: 'Compressor', prefix: 'compressor_filter', fallback: 'compressor_filter', alias: ['comp', 'compressor', 'kompresor'] },
  { id: 'limit', label: 'Limiter', prefix: 'limiter_filter', fallback: 'limiter_filter', alias: ['limit', 'limiter'] },
];
export const DEFAULT_AUDIO = { volume: 0, muted: false, monitor: 'none', filters: [] };

export const hasAudio = t => t === 'video' || t === 'audio';
export const cloneAudio = a => ({ volume: a.volume, muted: a.muted, monitor: a.monitor, filters: [...a.filters] });
export const clampDb = v => Math.max(-100, Math.min(26, v));
export const fmtDb = v => (v > 0 ? '+' : '') + v + ' dB';

export function typeFromExt(ext) {
  if (VIDEO.includes(ext)) return 'video';
  if (AUDIO.includes(ext)) return 'audio';
  if (IMAGE.includes(ext)) return 'image';
  return null;
}

function normType(t, value) {
  t = String(t || '').trim().toLowerCase();
  const map = {
    video: 'video', vid: 'video', media: 'video', image: 'image', img: 'image', gambar: 'image', foto: 'image',
    audio: 'audio', musik: 'audio', sound: 'audio', text: 'text', teks: 'text', txt: 'text',
  };
  if (map[t]) return map[t];
  if (!value) return null;
  return typeFromExt(extOf(value)) || (t === '' ? 'text' : null);
}

function parseBool(v) {
  if (typeof v === 'boolean') return v;
  return ['ya', 'y', 'yes', 'true', '1', 'on', 'iya'].includes(String(v ?? '').trim().toLowerCase());
}

function parseVolume(v) {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v === 'number') return clampDb(v);
  const s = String(v).trim().toLowerCase().replace(',', '.');
  if (s.endsWith('%')) {
    const p = parseFloat(s);
    if (isNaN(p)) return null;
    if (p <= 0) return -100;
    return clampDb(Math.round(20 * Math.log10(p / 100) * 10) / 10);
  }
  const n = parseFloat(s.replace('db', ''));
  return isNaN(n) ? null : clampDb(n);
}

function normMonitor(v) {
  const s = String(v ?? '').trim().toLowerCase();
  if (!s || ['off', 'none', 'mati', 'tidak', 'no', '0'].includes(s)) return 'none';
  if (/both|output|keduanya|dan|and|\+/.test(s)) return 'both';
  return 'monitor';
}

function parseFilters(v) {
  const items = Array.isArray(v) ? v : String(v ?? '').split(/[|;+,]/);
  const ids = [];
  for (const raw of items) {
    const s = String(raw).trim().toLowerCase();
    if (!s) continue;
    const f = FILTERS.find(f => f.id === s || f.alias.includes(s));
    if (f && !ids.includes(f.id)) ids.push(f.id);
  }
  return ids;
}

/* ---------- Model ---------- */
let uid = 0;
export const nextId = () => ++uid;

export const mkScene = (name, sources = [], extra = {}) => ({
  id: nextId(),
  name: String(name).trim(),
  sources,
  transition: extra.transition || '',
  duration: extra.duration || '',
});

export function makeSource(type, value, defaults, opts = {}) {
  if (!type || !value) return null;
  const src = type === 'text'
    ? { id: nextId(), type, text: String(value) }
    : { id: nextId(), type, file: String(value).trim().replace(/^"|"$/g, '') };
  src.hidden = !!opts.hidden;
  if (hasAudio(type)) {
    src.audio = {
      volume: opts.volume ?? defaults.volume,
      muted: opts.muted ?? defaults.muted,
      monitor: opts.monitor ?? defaults.monitor,
      filters: opts.filters ?? [...defaults.filters],
    };
  }
  return src;
}

/* ---------- Parser daftar scene ---------- */
function parseCSV(text) {
  const first = text.split(/\r?\n/)[0] || '';
  const delim = (first.split(';').length > first.split(',').length) ? ';' : ',';
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === delim) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.map(r => r.map(c => c.trim())).filter(r => r.some(c => c !== ''));
}

const CSV_COLS = {
  scene: ['scene', 'nama scene', 'nama', 'name', 'adegan'], type: ['type', 'tipe', 'jenis'],
  value: ['value', 'file', 'path', 'isi', 'nilai'], volume: ['volume', 'vol'], mute: ['mute', 'muted', 'bisu'],
  monitor: ['monitor', 'monitoring'], filters: ['filters', 'filter'], hidden: ['hidden', 'sembunyi', 'sembunyikan'],
  transition: ['transition', 'transisi'], duration: ['duration', 'durasi'],
};

export function parseRundown(text, ext, defaults) {
  text = text.replace(/^﻿/, '');
  if (ext === 'txt') {
    return text.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#')).map(l => mkScene(l));
  }
  if (ext === 'csv') {
    const rows = parseCSV(text);
    const idx = {};
    Object.keys(CSV_COLS).forEach((k, i) => { idx[k] = i; });
    if (rows.length && CSV_COLS.scene.includes(rows[0][0].toLowerCase())) {
      const header = rows.shift().map(h => h.toLowerCase());
      Object.keys(CSV_COLS).forEach(k => {
        const i = header.findIndex(h => CSV_COLS[k].includes(h));
        idx[k] = i >= 0 ? i : null;
      });
    }
    const out = [];
    for (const row of rows) {
      const get = k => (idx[k] == null ? '' : (row[idx[k]] || '').trim());
      const name = get('scene');
      if (!name) continue;
      let sc = out[out.length - 1];
      if (!sc || sc.name !== name) { sc = mkScene(name); out.push(sc); }
      if (get('transition') && !sc.transition) sc.transition = get('transition');
      if (get('duration') && !sc.duration) sc.duration = parseInt(get('duration'), 10) || '';
      const value = get('value');
      const src = makeSource(normType(get('type'), value), value, defaults, {
        volume: parseVolume(get('volume')),
        muted: get('mute') ? parseBool(get('mute')) : undefined,
        monitor: get('monitor') ? normMonitor(get('monitor')) : undefined,
        filters: get('filters') ? parseFilters(get('filters')) : undefined,
        hidden: parseBool(get('hidden')),
      });
      if (src) sc.sources.push(src);
    }
    return out;
  }
  if (ext === 'json') {
    let data;
    try { data = JSON.parse(text); } catch (e) { throw new Error('JSON tidak valid: ' + e.message); }
    if (data && data.scene_order && data.sources) {
      throw new Error('Ini file scene collection OBS. Untuk file seperti ini, pakai menu Scene Collection → Import di OBS.');
    }
    const arr = Array.isArray(data) ? data : (data && Array.isArray(data.scenes) ? data.scenes : null);
    if (!arr) throw new Error('Format JSON harus berupa array scene atau objek { "scenes": [...] }.');
    return arr.map((item, i) => {
      if (typeof item === 'string') return mkScene(item);
      const sc = mkScene(item.name || item.scene || ('Scene ' + (i + 1)), [], {
        transition: item.transition || '',
        duration: parseInt(item.transitionDuration ?? item.duration, 10) || '',
      });
      for (const s of (item.sources || [])) {
        const value = s.file || s.path || s.text || s.value || '';
        const muteVal = s.mute ?? s.muted;
        const monVal = s.monitor ?? s.monitoring;
        const src = makeSource(normType(s.type, value), value, defaults, {
          volume: parseVolume(s.volume),
          muted: muteVal !== undefined ? parseBool(muteVal) : undefined,
          monitor: monVal !== undefined ? normMonitor(monVal) : undefined,
          filters: s.filters !== undefined ? parseFilters(s.filters) : undefined,
          hidden: parseBool(s.hidden),
        });
        if (src) sc.sources.push(src);
      }
      return sc;
    });
  }
  return [];
}

export function sourceSummary(src) {
  const parts = [];
  if (src.audio) {
    const a = src.audio;
    if (a.volume !== 0) parts.push(fmtDb(a.volume));
    if (a.muted) parts.push('Mute');
    if (a.monitor !== 'none') parts.push(MONITOR_LABEL[a.monitor]);
    a.filters.forEach(f => parts.push(FILTERS.find(x => x.id === f).label));
  }
  if (src.hidden) parts.push('Disembunyikan');
  return parts.join(' · ');
}

export const needsFolder = scenes => scenes.some(s => s.sources.some(x => x.file && !isAbs(x.file)));
