function NetworkHelp({ onTutorial }) {
  const origin = window.location.origin;
  const insecureWs = window.location.protocol === 'https:';
  return (
    <div className="help-box" role="note">
      <p className="help-title">Cek hal berikut</p>
      <ol>
        <li>OBS sudah terbuka dan <b>Tools → WebSocket Server Settings → Enable WebSocket server</b> dicentang. Port default <code>4455</code>.</li>
        <li>
          Jika Chrome menampilkan pertanyaan <b>akses jaringan lokal</b>, pilih <b>Izinkan</b>, lalu klik Sambungkan lagi.
        </li>
        <li>
          Jika pernah terlanjur memblokir: klik ikon di kiri address bar → <b>Site settings</b> → ubah
          <b> Local network access</b> menjadi <b>Allow</b> untuk <code>{origin}</code>, lalu muat ulang halaman.
        </li>
        {insecureWs && (
          <li>Halaman ini dibuka lewat https. Alamat OBS selain <code>127.0.0.1</code>/<code>localhost</code> harus memakai <code>wss://</code>.</li>
        )}
      </ol>
      <button type="button" className="link" onClick={onTutorial}>Buka tutorial langkah demi langkah</button>
    </div>
  );
}

export default function ConnectionCard({ conn, onConn, status, connected, busy, onToggle, onTutorial }) {
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
            type="text" id="addr" value={conn.addr} spellCheck={false} disabled={connected || busy}
            onChange={e => onConn({ addr: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="pass">Password</label>
          <input
            type="password" id="pass" value={conn.password} placeholder="Kosongkan jika tanpa password"
            autoComplete="off" disabled={connected || busy}
            onChange={e => onConn({ password: e.target.value })}
          />
        </div>
        <div className="opts compact">
          <label className="chk">
            <input type="checkbox" checked={conn.remember} onChange={e => onConn({ remember: e.target.checked })} />
            Ingat password di browser ini
          </label>
          <label className="chk">
            <input type="checkbox" checked={conn.autoConnect} onChange={e => onConn({ autoConnect: e.target.checked })} />
            Sambungkan otomatis saat halaman dibuka
          </label>
        </div>
        <button type="submit" className={connected ? '' : 'primary'} disabled={busy}>
          {busy ? 'Menyambungkan…' : connected ? 'Putuskan' : 'Sambungkan'}
        </button>
      </form>
      <p className={'status ' + status.level}>{status.text}</p>
      {status.kind === 'network' && !connected && <NetworkHelp onTutorial={onTutorial} />}
    </section>
  );
}
