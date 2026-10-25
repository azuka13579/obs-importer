import { useEffect, useId, useState } from 'react';
import { FILTERS, MONITOR_LABEL, clampDb } from '../lib/rundown.js';

export default function AudioControls({ value, onChange, hideMonitor = false }) {
  const id = useId();
  const [draft, setDraft] = useState(String(value.volume));
  useEffect(() => { setDraft(String(value.volume)); }, [value.volume]);

  const set = patch => onChange({ ...value, ...patch });
  const commitDraft = () => {
    const v = parseFloat(draft);
    const volume = isNaN(v) ? 0 : clampDb(v);
    setDraft(String(volume));
    if (volume !== value.volume) set({ volume });
  };
  const toggleFilter = fid => set({
    filters: value.filters.includes(fid) ? value.filters.filter(f => f !== fid) : FILTERS.map(f => f.id).filter(f => f === fid || value.filters.includes(f)),
  });

  return (
    <div className="audio">
      <div className="vol">
        <label htmlFor={id}>Volume</label>
        <input
          type="range" id={id} min="-60" max="20" step="0.5"
          value={Math.max(-60, Math.min(20, value.volume))}
          onChange={e => set({ volume: parseFloat(e.target.value) })}
        />
        <div className="vol-num">
          <input
            type="number" min="-100" max="26" step="0.5" aria-label="Volume dalam dB"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commitDraft}
            onKeyDown={e => { if (e.key === 'Enter') commitDraft(); }}
          />
          <span>dB</span>
        </div>
      </div>
      <div className="line">
        <label className="chk">
          <input type="checkbox" checked={value.muted} onChange={e => set({ muted: e.target.checked })} /> Mute
        </label>
        {!hideMonitor && (
          <label className="sel">
            Monitoring
            <select value={value.monitor} onChange={e => set({ monitor: e.target.value })}>
              {Object.entries(MONITOR_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
        )}
      </div>
      <div className="line">
        <span className="lbl">Filter</span>
        {FILTERS.map(f => (
          <label className="chk" key={f.id}>
            <input type="checkbox" checked={value.filters.includes(f.id)} onChange={() => toggleFilter(f.id)} /> {f.label}
          </label>
        ))}
      </div>
    </div>
  );
}
