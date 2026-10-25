import { useState } from 'react';
import AudioControls from './AudioControls.jsx';
import { TYPE_LABEL, TYPE_SHORT, baseName, sourceSummary } from '../lib/rundown.js';

export default function SourceRow({ src, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const full = src.type === 'text' ? src.text : src.file;
  const short = src.type === 'text' ? (full.length > 50 ? full.slice(0, 50) + '…' : full) : baseName(full);
  const summary = sourceSummary(src);

  return (
    <div className="src">
      <div className="src-head">
        <span className="tag" title={TYPE_LABEL[src.type]}>{TYPE_SHORT[src.type]}</span>
        <span className="srcname" title={full}>{short}</span>
        {summary && <span className="summary">{summary}</span>}
        <button type="button" className="link" aria-expanded={open} onClick={() => setOpen(o => !o)}>
          {open ? 'Tutup' : 'Atur'}
        </button>
      </div>
      {open && (
        <div className="panel">
          <label className="chk">
            <input
              type="checkbox" checked={src.hidden} disabled={disabled}
              onChange={e => onChange({ ...src, hidden: e.target.checked })}
            />
            Sembunyikan saat dibuat (source ada, tapi tidak tampil)
          </label>
          {src.audio && (
            <div className="panel-sep">
              <AudioControls value={src.audio} onChange={audio => onChange({ ...src, audio })} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
