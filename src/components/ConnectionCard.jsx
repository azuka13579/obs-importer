export default function ConnectionCard({ addr, password, status, connected, busy, onAddr, onPassword, onToggle }) {
  return (
    <section className="card">
      <div className="card-head">
        <h2>Koneksi OBS</h2>
        <span className="hint-inline">Tools → WebSocket Server Settings</span>
      </div>
      <form
        className="stack"
        onSubmit={e => { e.preventDefault(); onToggle(); }}
      >
        <div>
          <label htmlFor="addr">Alamat server</label>
          <input
            type="text" id="addr" value={addr} spellCheck={false} disabled={connected || busy}
            onChange={e => onAddr(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="pass">Password</label>
          <input
            type="password" id="pass" value={password} placeholder="Kosongkan jika tanpa password"
            autoComplete="off" disabled={connected || busy}
            onChange={e => onPassword(e.target.value)}
          />
        </div>
        <button type="submit" className={connected ? '' : 'primary'} disabled={busy}>
          {busy ? 'Menyambungkan…' : connected ? 'Putuskan' : 'Sambungkan'}
        </button>
      </form>
      <p className={'status ' + status.level}>{status.text}</p>
    </section>
  );
}
