import { useCallback, useEffect, useRef, useState } from 'react';
import { OBSClient } from './lib/obs.js';
import {
  DEFAULT_AUDIO, RUNDOWN_EXT, cloneAudio, extOf, makeSource, mkScene, needsFolder, parseRundown, stripExt, typeFromExt,
} from './lib/rundown.js';
import { runImport } from './lib/importer.js';
import ConnectionCard from './components/ConnectionCard.jsx';
import DropZone from './components/DropZone.jsx';
import SceneList from './components/SceneList.jsx';
import ImportSettings from './components/ImportSettings.jsx';
import LogPanel from './components/LogPanel.jsx';

const ADDR_KEY = 'obsImporter.addr';
const DEFAULT_ADDR = 'ws://127.0.0.1:4455';

const readAddr = () => {
  try { return localStorage.getItem(ADDR_KEY) || DEFAULT_ADDR; } catch { return DEFAULT_ADDR; }
};
const now = () => new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

let logId = 0;

export default function App() {
  const obsRef = useRef(null);
  if (!obsRef.current) obsRef.current = new OBSClient();
  const obs = obsRef.current;
  const manualClose = useRef(false);

  const [addr, setAddr] = useState(readAddr);
  const [password, setPassword] = useState('');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [status, setStatus] = useState({ text: 'Belum tersambung.', level: '' });
  const [transitions, setTransitions] = useState([]);

  const [scenes, setScenes] = useState([]);
  const [globalAudio, setGlobalAudio] = useState(DEFAULT_AUDIO);
  const [options, setOptions] = useState({ newCollection: false, collectionName: '', fit: true, loop: false, switchFirst: true });
  const [folder, setFolder] = useState('');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState('');
  const [logs, setLogs] = useState(() => [{ id: ++logId, time: now(), msg: 'Siap.', level: '' }]);

  const log = useCallback((msg, level = '') => {
    setLogs(l => [...l, { id: ++logId, time: now(), msg, level }]);
  }, []);

  useEffect(() => {
    obs.onClose = () => {
      setConnected(false);
      if (manualClose.current) {
        manualClose.current = false;
        setStatus({ text: 'Koneksi diputus.', level: '' });
        log('Koneksi diputus.');
      } else {
        setStatus({ text: 'Koneksi ke OBS terputus.', level: 'err' });
        log('Koneksi ke OBS terputus.', 'err');
      }
    };
    return () => { obs.onClose = null; };
  }, [obs, log]);

  const toggleConnection = async () => {
    if (obs.connected) { manualClose.current = true; obs.disconnect(); return; }
    const url = addr.trim();
    try { localStorage.setItem(ADDR_KEY, url); } catch { /* penyimpanan tidak tersedia */ }
    setConnecting(true);
    setStatus({ text: 'Menyambungkan…', level: '' });
    try {
      await obs.connect(url, password);
      const v = await obs.call('GetVersion');
      setStatus({ text: `Tersambung ke OBS ${v.obsVersion} (obs-websocket ${v.obsWebSocketVersion}).`, level: 'ok' });
      log('Tersambung ke OBS.', 'ok');
      try {
        setTransitions((await obs.call('GetSceneTransitionList')).transitions.map(t => t.transitionName));
      } catch { setTransitions([]); }
      setConnected(true);
    } catch (e) {
      setStatus({ text: e.message, level: 'err' });
      log(e.message, 'err');
      setConnected(false);
    } finally {
      setConnecting(false);
    }
  };

  const handleFiles = async fileList => {
    const files = [...fileList];
    const media = [];
    const added = [];
    for (const f of files) {
      const ext = extOf(f.name);
      if (RUNDOWN_EXT.includes(ext)) {
        try {
          const res = parseRundown(await f.text(), ext, globalAudio);
          added.push(...res);
          log(`${f.name}: ${res.length} scene dibaca.`, res.length ? 'ok' : 'warn');
        } catch (e) { log(`${f.name}: ${e.message}`, 'err'); }
      } else if (typeFromExt(ext)) media.push(f);
      else log(`${f.name}: jenis file tidak dikenali, dilewati.`, 'warn');
    }
    media.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    for (const f of media) added.push(mkScene(stripExt(f.name), [makeSource(typeFromExt(extOf(f.name)), f.name, globalAudio)]));
    if (media.length) log(`${media.length} file media ditambahkan, diurutkan berdasarkan nama file.`, 'ok');
    if (added.length) setScenes(s => [...s, ...added]);
  };

  const applyAudioToAll = () => {
    let n = 0;
    const next = scenes.map(s => ({
      ...s,
      sources: s.sources.map(src => {
        if (!src.audio) return src;
        n++;
        return { ...src, audio: cloneAudio(globalAudio) };
      }),
    }));
    setScenes(next);
    log(n ? `Audio bawaan diterapkan ke ${n} source.` : 'Belum ada video atau audio di daftar.', n ? 'ok' : 'warn');
  };

  const showFolder = needsFolder(scenes);

  const startImport = async () => {
    if (showFolder && !folder.trim()) {
      log('Isi dulu folder file media, supaya OBS tahu lokasi file-nya.', 'err');
      document.getElementById('folder')?.focus();
      return;
    }
    setImporting(true);
    try {
      await runImport({ obs, scenes, folder, options, transitions, log, onProgress: setProgress });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="logo" aria-hidden="true" />
            <div>
              <h1>OBS Scene Importer</h1>
              <p>Seret file, atur urutan dan audionya, lalu buat semua scene di OBS sekaligus.</p>
            </div>
          </div>
          <span className={'pill' + (connected ? ' on' : '')}>
            <span className="dot" aria-hidden="true" />
            {connected ? 'Tersambung' : connecting ? 'Menyambungkan' : 'Offline'}
          </span>
        </div>
      </header>

      <main className="layout">
        <div className="col-main">
          <DropZone disabled={importing} onFiles={handleFiles} />
          <SceneList
            scenes={scenes} transitions={transitions} disabled={importing}
            onChange={setScenes}
            onAddEmpty={() => setScenes(s => [...s, mkScene(`Scene ${s.length + 1}`)])}
          />
        </div>
        <aside className="col-side">
          <ConnectionCard
            addr={addr} password={password} status={status} connected={connected} busy={connecting}
            onAddr={setAddr} onPassword={setPassword} onToggle={toggleConnection}
          />
          <ImportSettings
            options={options} onOptions={setOptions}
            showFolder={showFolder} folder={folder} onFolder={setFolder}
            globalAudio={globalAudio} onGlobalAudio={setGlobalAudio} onApplyAll={applyAudioToAll}
            canImport={!importing && connected && scenes.length > 0}
            canClear={!importing && scenes.length > 0}
            importing={importing} progress={progress}
            onImport={startImport} onClear={() => setScenes([])}
          />
          <LogPanel entries={logs} />
        </aside>
      </main>
    </div>
  );
}
