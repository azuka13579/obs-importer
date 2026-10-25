import SourceRow from './SourceRow.jsx';

function SceneCard({ scene, index, total, transitions, disabled, onChange, onMove, onRemove }) {
  const opts = ['', ...transitions];
  if (scene.transition && !opts.includes(scene.transition)) opts.push(scene.transition);

  const updateSource = next => onChange({ ...scene, sources: scene.sources.map(s => (s.id === next.id ? next : s)) });

  return (
    <li className="scene">
      <span className="num">{String(index + 1).padStart(2, '0')}</span>
      <div className="scene-main">
        <div className="scene-head">
          <input
            type="text" className="scene-name" value={scene.name} disabled={disabled}
            aria-label={`Nama scene ${index + 1}`}
            onChange={e => onChange({ ...scene, name: e.target.value })}
          />
          <div className="actions">
            <button type="button" className="icon" disabled={disabled || index === 0} onClick={() => onMove(-1)} aria-label="Naikkan">↑</button>
            <button type="button" className="icon" disabled={disabled || index === total - 1} onClick={() => onMove(1)} aria-label="Turunkan">↓</button>
            <button type="button" className="icon" disabled={disabled} onClick={onRemove} aria-label="Hapus scene">✕</button>
          </div>
        </div>
        <div className="trans">
          <label className="sel">
            Transisi masuk
            <select value={scene.transition} disabled={disabled} onChange={e => onChange({ ...scene, transition: e.target.value })}>
              {opts.map(o => <option key={o} value={o}>{o || 'Ikuti OBS'}</option>)}
            </select>
          </label>
          <label className="sel">
            Durasi
            <input
              type="number" min="50" max="20000" step="50" placeholder="ms" disabled={disabled}
              defaultValue={scene.duration}
              onBlur={e => {
                const v = parseInt(e.target.value, 10) || '';
                e.target.value = v;
                if (v !== scene.duration) onChange({ ...scene, duration: v });
              }}
            />
            ms
          </label>
        </div>
        <div className="srcs">
          {scene.sources.length
            ? scene.sources.map(src => <SourceRow key={src.id} src={src} disabled={disabled} onChange={updateSource} />)
            : <span className="ghost">Scene kosong</span>}
        </div>
      </div>
    </li>
  );
}

export default function SceneList({ scenes, transitions, disabled, onChange, onAddEmpty }) {
  const move = (i, dir) => {
    const next = [...scenes];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };

  return (
    <section className="card">
      <div className="card-head">
        <h2>Urutan scene</h2>
        <span className="count">{scenes.length ? `${scenes.length} scene` : ''}</span>
        <button type="button" className="ghost-btn" disabled={disabled} onClick={onAddEmpty}>+ Scene kosong</button>
      </div>
      {scenes.length === 0
        ? <p className="empty">Belum ada scene. Seret file ke area di atas untuk mulai.</p>
        : (
          <ol className="list">
            {scenes.map((s, i) => (
              <SceneCard
                key={s.id} scene={s} index={i} total={scenes.length} transitions={transitions} disabled={disabled}
                onChange={next => onChange(scenes.map(x => (x.id === next.id ? next : x)))}
                onMove={dir => move(i, dir)}
                onRemove={() => onChange(scenes.filter(x => x.id !== s.id))}
              />
            ))}
          </ol>
        )}
    </section>
  );
}
