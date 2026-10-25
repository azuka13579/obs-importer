import { useEffect, useRef, useState } from 'react';
import { LoopIcon, SpeakerIcon } from './icons.jsx';
import SourceSettings, { SourceChip, sourceShort } from './SourceSettings.jsx';
import { sourceSummary } from '../lib/rundown.js';

const GripIcon = () => (
  <svg viewBox="0 0 12 18" aria-hidden="true">
    {[3, 9, 15].flatMap(y => [3, 9].map(x => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" />))}
  </svg>
);

const GearIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </svg>
);

function SceneCard({ scene, index, transitions, disabled, dragging, style, handleProps, onChange, onRemove }) {
  const [open, setOpen] = useState(false);
  const opts = ['', ...transitions];
  if (scene.transition && !opts.includes(scene.transition)) opts.push(scene.transition);

  const many = scene.sources.length > 1;
  const meta = [
    scene.transition && `Transisi ${scene.transition}`,
    scene.duration && `${scene.duration} ms`,
    ...scene.sources.map(src => {
      const sum = sourceSummary(src);
      return sum && (many ? `${sourceShort(src)}: ${sum}` : sum);
    }),
  ].filter(Boolean).join(' · ');

  const audioSources = scene.sources.filter(s => s.audio);
  const monitorOn = audioSources.length > 0 && audioSources.every(s => s.audio.monitor !== 'none');
  const toggleMonitor = () => onChange({
    ...scene,
    sources: scene.sources.map(s => (s.audio ? { ...s, audio: { ...s.audio, monitor: monitorOn ? 'none' : 'both' } } : s)),
  });

  const videoSources = scene.sources.filter(s => s.type === 'video');
  const loopOn = videoSources.length > 0 && videoSources.every(s => s.loop);
  const toggleLoop = () => onChange({
    ...scene,
    sources: scene.sources.map(s => (s.type === 'video' ? { ...s, loop: !loopOn } : s)),
  });

  const updateSource = next => onChange({ ...scene, sources: scene.sources.map(s => (s.id === next.id ? next : s)) });

  return (
    <li className={'scene' + (dragging ? ' dragging' : '')} style={style}>
      <button
        type="button" className="handle" disabled={disabled}
        aria-label={`Pindahkan scene ${index + 1}. Seret, atau tekan panah atas/bawah.`}
        {...handleProps}
      >
        <GripIcon />
      </button>
      <span className="num">{String(index + 1).padStart(2, '0')}</span>
      <div className="scene-main">
        <div className="scene-head">
          <input
            type="text" className="scene-name" value={scene.name} disabled={disabled}
            aria-label={`Nama scene ${index + 1}`}
            onChange={e => onChange({ ...scene, name: e.target.value })}
          />
          <div className="chips">
            {scene.sources.length
              ? scene.sources.map(src => <SourceChip key={src.id} src={src} />)
              : <span className="ghost">Scene kosong</span>}
          </div>
          <div className="actions">
            {videoSources.length > 0
              ? (
                <button
                  type="button" className={'icon' + (loopOn ? ' on' : '')} aria-pressed={loopOn} disabled={disabled}
                  aria-label="Ulangi video (loop)"
                  title={loopOn ? 'Loop nyala' : 'Loop mati'}
                  onClick={toggleLoop}
                >
                  <LoopIcon on={loopOn} />
                </button>
              )
              : <span className="icon-spacer" aria-hidden="true" />}
            {audioSources.length > 0
              ? (
                <button
                  type="button" className={'icon' + (monitorOn ? ' on' : '')} aria-pressed={monitorOn} disabled={disabled}
                  aria-label="Monitoring audio (monitor dan output)"
                  title={monitorOn ? 'Monitoring nyala: monitor dan output' : 'Monitoring mati'}
                  onClick={toggleMonitor}
                >
                  <SpeakerIcon on={monitorOn} />
                </button>
              )
              : <span className="icon-spacer" aria-hidden="true" />}
            <button
              type="button" className={'icon' + (open ? ' open' : '')} aria-expanded={open}
              aria-label="Pengaturan scene" title="Pengaturan scene" onClick={() => setOpen(o => !o)}
            >
              <GearIcon />
            </button>
            <button type="button" className="icon" disabled={disabled} onClick={onRemove} aria-label="Hapus scene" title="Hapus scene">✕</button>
          </div>
        </div>

        {!open && meta && <p className="scene-meta">{meta}</p>}
        {open && (
          <div className="panel scene-panel">
            <p className="panel-title">Transisi masuk</p>
            <div className="trans">
              <label className="sel">
                Transisi
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
            {scene.sources.length > 0 && (
              <>
                <p className="panel-title sep">Source</p>
                {scene.sources.map(src => <SourceSettings key={src.id} src={src} disabled={disabled} onChange={updateSource} />)}
              </>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

/* Urutan scene diatur dengan menyeret pegangan (pointer events, jadi jalan di mouse dan layar sentuh). */
function useSortable(items, onReorder, disabled) {
  const listRef = useRef(null);
  const drag = useRef(null);
  const [view, setView] = useState(null);

  const scroller = () => {
    const col = listRef.current?.closest('.col-main');
    return col && getComputedStyle(col).overflowY === 'auto' ? col : null;
  };
  const scrollPos = sc => (sc ? sc.scrollTop : window.scrollY);

  const tick = () => {
    const d = drag.current;
    if (!d) return;
    // Gulir otomatis saat pointer mendekati tepi area scroll.
    const b = d.sc ? d.sc.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
    const zone = 60;
    let v = 0;
    if (d.y < b.top + zone) v = -Math.ceil((b.top + zone - d.y) / 4);
    else if (d.y > b.bottom - zone) v = Math.ceil((d.y - (b.bottom - zone)) / 4);
    if (v) { if (d.sc) d.sc.scrollTop += v; else window.scrollBy(0, v); }

    const y = d.y + scrollPos(d.sc);
    let to = 0;
    d.mids.forEach((m, i) => { if (i !== d.from && m < y) to++; });
    const dy = y - d.startY;
    if (to !== d.to || dy !== d.dy) {
      d.to = to; d.dy = dy;
      setView({ from: d.from, to, dy, h: d.h });
    }
    d.raf = requestAnimationFrame(tick);
  };

  const finish = commit => {
    const d = drag.current;
    if (!d) return;
    cancelAnimationFrame(d.raf);
    drag.current = null;
    document.body.classList.remove('is-sorting');
    setView(null);
    if (commit && d.to !== d.from) {
      const next = [...items];
      const [moved] = next.splice(d.from, 1);
      next.splice(d.to, 0, moved);
      onReorder(next);
    }
  };

  useEffect(() => () => {
    if (drag.current) cancelAnimationFrame(drag.current.raf);
    document.body.classList.remove('is-sorting');
  }, []);

  const handleProps = index => ({
    onPointerDown: e => {
      if (disabled || e.button !== 0 || items.length < 2) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      const sc = scroller();
      const s0 = scrollPos(sc);
      const els = [...listRef.current.children];
      const mids = els.map(el => { const r = el.getBoundingClientRect(); return r.top + r.height / 2 + s0; });
      drag.current = {
        from: index, to: index, y: e.clientY, startY: e.clientY + s0, sc, mids,
        h: els[index].getBoundingClientRect().height,
      };
      document.body.classList.add('is-sorting');
      tick();
    },
    onPointerMove: e => { if (drag.current) drag.current.y = e.clientY; },
    onPointerUp: () => finish(true),
    onPointerCancel: () => finish(false),
    onKeyDown: e => {
      const dir = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0;
      if (!dir || disabled) return;
      e.preventDefault();
      const to = index + dir;
      if (to < 0 || to >= items.length) return;
      const next = [...items];
      [next[index], next[to]] = [next[to], next[index]];
      onReorder(next);
    },
  });

  const styleFor = i => {
    if (!view) return undefined;
    const { from, to, dy, h } = view;
    if (i === from) return { transform: `translateY(${dy}px)` };
    if (from < to && i > from && i <= to) return { transform: `translateY(${-h}px)` };
    if (to < from && i >= to && i < from) return { transform: `translateY(${h}px)` };
    return undefined;
  };

  return { listRef, handleProps, styleFor, draggingIndex: view?.from ?? null, sorting: !!view };
}

export default function SceneList({ scenes, transitions, disabled, onChange, onAddEmpty }) {
  const { listRef, handleProps, styleFor, draggingIndex, sorting } = useSortable(scenes, onChange, disabled);

  return (
    <section className="card">
      <div className="card-head">
        <h2>Urutan scene</h2>
        <span className="count">{scenes.length ? `${scenes.length} scene · seret ⠿ untuk memindah` : ''}</span>
        <button type="button" className="ghost-btn" disabled={disabled} onClick={onAddEmpty}>+ Scene kosong</button>
      </div>
      {scenes.length === 0
        ? <p className="empty">Belum ada scene. Seret file ke area di atas untuk mulai.</p>
        : (
          <ol className={'list' + (sorting ? ' sorting' : '')} ref={listRef}>
            {scenes.map((s, i) => (
              <SceneCard
                key={s.id} scene={s} index={i} transitions={transitions} disabled={disabled}
                dragging={draggingIndex === i} style={styleFor(i)} handleProps={handleProps(i)}
                onChange={next => onChange(scenes.map(x => (x.id === next.id ? next : x)))}
                onRemove={() => onChange(scenes.filter(x => x.id !== s.id))}
              />
            ))}
          </ol>
        )}
    </section>
  );
}
