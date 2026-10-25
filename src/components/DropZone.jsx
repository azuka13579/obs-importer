import { useEffect, useRef, useState } from 'react';

export default function DropZone({ disabled, onFiles }) {
  const [active, setActive] = useState(false);
  const picker = useRef(null);
  const latest = useRef({ disabled, onFiles });
  latest.current = { disabled, onFiles };

  // Seluruh jendela menjadi area drop, supaya file tidak terbuka di tab browser.
  useEffect(() => {
    let depth = 0;
    const enter = e => { e.preventDefault(); depth++; setActive(true); };
    const leave = () => { if (--depth <= 0) { depth = 0; setActive(false); } };
    const over = e => e.preventDefault();
    const drop = e => {
      e.preventDefault(); depth = 0; setActive(false);
      const { disabled, onFiles } = latest.current;
      if (!disabled && e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
    };
    window.addEventListener('dragenter', enter);
    window.addEventListener('dragleave', leave);
    window.addEventListener('dragover', over);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragenter', enter);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('dragover', over);
      window.removeEventListener('drop', drop);
    };
  }, []);

  return (
    <section className="card">
      <div
        className={'drop' + (active ? ' active' : '')}
        tabIndex={0} role="button" aria-label="Pilih atau seret file"
        onClick={() => picker.current.click()}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); picker.current.click(); } }}
      >
        <svg className="drop-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <strong>Seret file ke sini atau klik untuk memilih</strong>
        <span>Video, gambar, dan audio menjadi satu scene per file. File .txt, .csv, atau .json dibaca sebagai daftar scene.</span>
      </div>
      <input
        ref={picker} type="file" multiple hidden
        onChange={e => { onFiles(e.target.files); e.target.value = ''; }}
      />
      <details className="help">
        <summary>Contoh format daftar scene</summary>
        <p><b>.txt</b>: satu nama scene per baris (scene kosong).</p>
        <pre>{`Opening
Sesi 1
Penutup`}</pre>
        <p><b>.csv</b>: baris berurutan dengan nama scene yang sama masuk ke scene yang sama. Selain <code>scene</code>, semua kolom boleh dikosongkan atau dihilangkan.</p>
        <pre>{`scene,type,value,volume,mute,monitor,filters,hidden,transition,duration
Opening,video,C:\\Acara\\intro.mp4,-6,,both,,,Fade,800
Opening,text,Selamat datang!,,,,,,,
Sesi 1,audio,C:\\Acara\\musik.mp3,30%,,,,,,
Sesi 1,video,kamera.mp4,,,monitor,noise|compressor,,Cut,
Penutup,image,C:\\Acara\\penutup.png,,,,,ya,,`}</pre>
        <p><b>.json</b>:</p>
        <pre>{`[
  { "name": "Opening", "transition": "Fade", "duration": 800, "sources": [
      { "type": "video", "file": "C:/Acara/intro.mp4", "volume": -6, "monitor": "both" },
      { "type": "text",  "text": "Selamat datang!" } ] },
  { "name": "Sesi 1", "sources": [
      { "type": "audio", "file": "musik.mp3", "volume": "30%", "filters": ["noise", "compressor"] } ] },
  "Penutup"
]`}</pre>
        <p>Isi kolom: <code>type</code> = video, image, audio, atau text. <code>volume</code> dalam dB (misalnya -6) atau persen (misalnya 30%). <code>monitor</code> = off, monitor, atau both. <code>filters</code> = noise, gate, compressor, limiter, dipisah dengan <code>|</code>. <code>mute</code> dan <code>hidden</code> diisi ya atau tidak. <code>transition</code> memakai nama transisi persis seperti di OBS, dan <code>duration</code> dalam milidetik.</p>
        <p>Kolom audio yang kosong mengikuti pengaturan audio bawaan. Path yang bukan path lengkap digabung dengan folder media. Source paling atas di daftar berada di lapisan paling bawah di OBS.</p>
      </details>
    </section>
  );
}
