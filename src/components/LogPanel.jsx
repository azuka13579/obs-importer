import { useEffect, useRef } from 'react';

const LEVEL_LABEL = { ok: 'OK', warn: 'WARN', err: 'ERR', '': 'INFO' };

export default function LogPanel({ entries }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [entries]);

  return (
    <section className="card">
      <div className="card-head"><h2>Log</h2></div>
      <ul className="log" ref={ref}>
        {entries.map(e => (
          <li key={e.id} className={e.level}>
            <time>{e.time}</time>
            <span className="lvl">{LEVEL_LABEL[e.level]}</span>
            <span className="msg">{e.msg}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
