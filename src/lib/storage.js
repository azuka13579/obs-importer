/* Simpan pengaturan di localStorage browser. Semua akses dibungkus try/catch karena
   penyimpanan bisa diblokir (mode privat, data situs diblokir). */
const PREFIX = 'obsImporter.';

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    const value = JSON.parse(raw);
    if (fallback && typeof fallback === 'object' && !Array.isArray(fallback)) return { ...fallback, ...value };
    return value;
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* penyimpanan tidak tersedia */ }
}
