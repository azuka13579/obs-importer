import AudioControls from './AudioControls.jsx';
import { TYPE_LABEL, TYPE_SHORT, baseName } from '../lib/rundown.js';

export const sourceTitle = src => (src.type === 'text' ? src.text : src.file);
export const sourceShort = src => {
  const full = sourceTitle(src);
  return src.type === 'text' ? (full.length > 40 ? full.slice(0, 40) + '…' : full) : baseName(full);
};

export function SourceChip({ src }) {
  return (
    <span className="chip" title={`${TYPE_LABEL[src.type]}: ${sourceTitle(src)}`}>
      <span className="tag">{TYPE_SHORT[src.type]}</span>
      <span className="chip-name">{sourceShort(src)}</span>
    </span>
  );
}

/* Pengaturan satu source, tampil di dalam panel pengaturan scene. */
export default function SourceSettings({ src, onChange, disabled }) {
  return (
    <div className="src-settings">
      <div className="src-settings-head">
        <span className="tag">{TYPE_SHORT[src.type]}</span>
        <span className="srcname" title={sourceTitle(src)}>{sourceShort(src)}</span>
      </div>
      <label className="chk">
        <input
          type="checkbox" checked={src.hidden} disabled={disabled}
          onChange={e => onChange({ ...src, hidden: e.target.checked })}
        />
        Sembunyikan saat dibuat (source ada, tapi tidak tampil)
      </label>
      {src.type === 'video' && (
        <label className="chk">
          <input
            type="checkbox" checked={!!src.loop} disabled={disabled}
            onChange={e => onChange({ ...src, loop: e.target.checked })}
          />
          Ulangi video (loop)
        </label>
      )}
      {src.audio && (
        <div className="src-audio">
          <AudioControls value={src.audio} onChange={audio => onChange({ ...src, audio })} />
        </div>
      )}
    </div>
  );
}
