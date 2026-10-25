import AudioControls from './AudioControls.jsx';
import { LoopIcon, SpeakerIcon } from './icons.jsx';

function SwitchRow({ icon, title, desc, checked, onChange }) {
  return (
    <div className="switch-row">
      <span className={'switch-ico' + (checked ? ' on' : '')}>{icon}</span>
      <div className="switch-text">
        <strong>{title}</strong>
        <span>{desc}</span>
      </div>
      <button
        type="button" role="switch" aria-checked={checked} aria-label={title}
        className={'switch' + (checked ? ' on' : '')} onClick={() => onChange(!checked)}
      >
        <span className="knob" />
      </button>
    </div>
  );
}

export default function DefaultsCard({ defaults, onChange, onApplyAll, disabled }) {
  const monitorOn = defaults.audio.monitor !== 'none';
  const setAudio = audio => onChange(d => ({ ...d, audio }));

  return (
    <section className="card">
      <div className="card-head">
        <h2>Bawaan file baru</h2>
        <span className="hint-inline">Tersimpan di browser ini</span>
      </div>

      <SwitchRow
        icon={<LoopIcon on={defaults.loop} />}
        title="Loop video otomatis"
        desc="Video yang baru ditambahkan langsung diulang."
        checked={defaults.loop}
        onChange={loop => onChange(d => ({ ...d, loop }))}
      />
      <SwitchRow
        icon={<SpeakerIcon on={monitorOn} />}
        title="Suara langsung nyala"
        desc="Monitoring video dan audio baru: monitor dan output."
        checked={monitorOn}
        onChange={on => onChange(d => ({ ...d, audio: { ...d.audio, monitor: on ? 'both' : 'none' } }))}
      />

      <details className="more">
        <summary>Audio lanjutan (volume, mute, filter)</summary>
        <div className="panel">
          <AudioControls value={defaults.audio} onChange={setAudio} hideMonitor />
        </div>
      </details>

      <button type="button" className="block" onClick={onApplyAll} disabled={disabled}>
        Terapkan ke semua scene yang sudah ada
      </button>
    </section>
  );
}
