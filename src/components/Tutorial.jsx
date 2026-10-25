import { useEffect, useRef } from 'react';

export const STEPS = [
  {
    title: 'Aktifkan WebSocket di OBS',
    body: (
      <ol>
        <li>Buka OBS Studio (versi 28 ke atas sudah membawa WebSocket).</li>
        <li>Pilih menu <b>Tools → WebSocket Server Settings</b>.</li>
        <li>Centang <b>Enable WebSocket server</b>. Port bawaan <code>4455</code>.</li>
        <li>Jika <b>Enable Authentication</b> dicentang, klik <b>Show Connect Info</b> untuk melihat password-nya.</li>
      </ol>
    ),
  },
  {
    title: 'Izinkan akses jaringan lokal di Chrome',
    body: (
      <>
        <p>Halaman ini tersambung ke OBS di komputermu, jadi Chrome akan meminta izin sekali untuk setiap alamat website.</p>
        <ol>
          <li>Saat muncul pertanyaan <b>akses ke perangkat di jaringan lokal</b>, pilih <b>Izinkan</b>.</li>
          <li>Jika terlanjur memilih Blokir: klik ikon di kiri address bar → <b>Site settings</b>.</li>
          <li>Ubah <b>Local network access</b> menjadi <b>Allow</b>, lalu muat ulang halaman.</li>
        </ol>
        <p className="muted">Jika aplikasi dibuka dari <code>localhost</code> di komputer yang sama dengan OBS, izin ini tidak diminta.</p>
      </>
    ),
  },
  {
    title: 'Sambungkan ke OBS',
    body: (
      <ol>
        <li>Di kartu <b>Koneksi OBS</b>, biarkan alamat <code>ws://127.0.0.1:4455</code> jika OBS ada di komputer yang sama.</li>
        <li>Isi password jika OBS memintanya.</li>
        <li>Klik <b>Sambungkan</b>. Penanda di pojok kanan atas berubah menjadi <b>Tersambung</b>.</li>
      </ol>
    ),
  },
  {
    title: 'Tambahkan scene',
    body: (
      <>
        <ol>
          <li>Seret file video, gambar, atau audio ke area unggah. Setiap file menjadi satu scene, diurutkan berdasarkan nama.</li>
          <li>Atau seret daftar scene berformat <code>.txt</code>, <code>.csv</code>, atau <code>.json</code>. Contohnya ada di <b>Contoh format daftar scene</b>.</li>
          <li>Klik <b>+ Scene kosong</b> untuk menambah scene tanpa source.</li>
        </ol>
      </>
    ),
  },
  {
    title: 'Atur urutan, transisi, dan audio',
    body: (
      <ol>
        <li>Ubah nama scene langsung di kolomnya. Seret pegangan <b>⠿</b> di kiri scene untuk mengatur urutan.</li>
        <li>Klik ikon <b>speaker</b> untuk menyalakan atau mematikan monitoring (monitor dan output), dan ikon <b>loop</b> untuk mengulang video.</li>
        <li>Klik ikon <b>pengaturan</b> di kanan scene untuk memilih transisi masuk, serta mengatur volume, mute, monitoring, filter, atau menyembunyikan source.</li>
        <li>Di kartu <b>Bawaan file baru</b>, nyalakan loop atau suara otomatis untuk file yang akan ditambahkan. Pengaturan ini tersimpan di browser.</li>
      </ol>
    ),
  },
  {
    title: 'Buat scene di OBS',
    body: (
      <ol>
        <li>Jika file diseret dari komputer, isi <b>Folder file media</b> (Shift + klik kanan folder → Copy as path).</li>
        <li>Pilih opsi hasil, misalnya membuat scene collection baru agar daftar lama tidak tersentuh.</li>
        <li>Klik <b>Buat scene di OBS</b> dan pantau prosesnya di <b>Log</b>.</li>
      </ol>
    ),
  },
];

export function TutorialCard({ onOpen }) {
  return (
    <section className="card tutorial-card">
      <div>
        <h2>Panduan</h2>
        <p>Baru pertama kali? Ikuti {STEPS.length} langkah singkat dari menyalakan WebSocket OBS sampai semua scene jadi.</p>
      </div>
      <button type="button" className="primary" onClick={() => onOpen(0)}>Lihat tutorial</button>
    </section>
  );
}

export function TutorialModal({ step, onStep, onClose }) {
  const dialog = useRef(null);
  const last = STEPS.length - 1;

  useEffect(() => {
    dialog.current?.focus();
    const key = e => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && step < last) onStep(step + 1);
      if (e.key === 'ArrowLeft' && step > 0) onStep(step - 1);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [step, last, onStep, onClose]);

  const s = STEPS[step];
  return (
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="card modal" role="dialog" aria-modal="true" aria-labelledby="tut-title" tabIndex={-1} ref={dialog}>
        <div className="modal-head">
          <span className="step-count">Langkah {step + 1} dari {STEPS.length}</span>
          <button type="button" className="icon" onClick={onClose} aria-label="Tutup tutorial">✕</button>
        </div>
        <div className="step-body" key={step}>
          <span className="step-num">{String(step + 1).padStart(2, '0')}</span>
          <h3 id="tut-title" className="step-title">{s.title}</h3>
          <div className="step-text">{s.body}</div>
        </div>
        <div className="modal-foot">
          <div className="dots">
            {STEPS.map((x, i) => (
              <button
                type="button" key={i} className={'dot-btn' + (i === step ? ' on' : '')}
                onClick={() => onStep(i)} aria-label={`Langkah ${i + 1}: ${x.title}`} aria-current={i === step}
              />
            ))}
          </div>
          <div className="modal-nav">
            <button type="button" disabled={step === 0} onClick={() => onStep(step - 1)}>Sebelumnya</button>
            {step < last
              ? <button type="button" className="primary" onClick={() => onStep(step + 1)}>Berikutnya</button>
              : <button type="button" className="primary" onClick={onClose}>Selesai</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
