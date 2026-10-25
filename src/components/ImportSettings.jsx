export default function ImportSettings({
  options, onOptions, showFolder, folder, onFolder,
  canImport, canClear, importing, progress, onImport, onClear,
}) {
  const set = patch => onOptions({ ...options, ...patch });

  return (
    <section className="card">
      <div className="card-head"><h2>Pengaturan import</h2></div>

      {showFolder && (
        <div className="field">
          <label htmlFor="folder">Folder file media di komputer</label>
          <input
            type="text" id="folder" value={folder} spellCheck={false} placeholder="C:\Users\Nama\Videos\Acara"
            onChange={e => onFolder(e.target.value)}
          />
          <p className="hint">Browser tidak memberi lokasi asli file yang diseret, jadi tulis folder tempat file-file itu berada. Di Windows: Shift + klik kanan folder → Copy as path, lalu tempel di sini.</p>
        </div>
      )}

      <h3>Hasil di OBS</h3>
      <div className="opts">
        <label className="chk">
          <input
            type="checkbox" checked={options.newCollection}
            onChange={e => set({
              newCollection: e.target.checked,
              collectionName: e.target.checked && !options.collectionName
                ? 'Import ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                : options.collectionName,
            })}
          />
          Buat scene collection baru
        </label>
        {options.newCollection && (
          <input
            type="text" className="indent" aria-label="Nama scene collection baru"
            value={options.collectionName} onChange={e => set({ collectionName: e.target.value })}
          />
        )}
        <label className="chk">
          <input type="checkbox" checked={options.fit} onChange={e => set({ fit: e.target.checked })} />
          Sesuaikan video dan gambar ke layar
        </label>
        <label className="chk">
          <input type="checkbox" checked={options.switchFirst} onChange={e => set({ switchFirst: e.target.checked })} />
          Pindah ke scene pertama setelah selesai
        </label>
      </div>

      <div className="bar">
        <button type="button" className="primary grow" disabled={!canImport} onClick={onImport}>
          {importing ? 'Mengimport…' : 'Buat scene di OBS'}
        </button>
        <button type="button" disabled={!canClear} onClick={onClear}>Kosongkan</button>
      </div>
      {progress && <p className="progress">{progress}</p>}
    </section>
  );
}
