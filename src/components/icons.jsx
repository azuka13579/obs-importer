export const SpeakerIcon = ({ on }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" />
    {on
      ? <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5M18 7a7 7 0 0 1 0 10" />
      : <path d="M16 10l4 4M20 10l-4 4" />}
  </svg>
);

export const LoopIcon = ({ on }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M17 3l3 3-3 3M20 6H8a4 4 0 0 0-4 4v1M7 21l-3-3 3-3M4 18h12a4 4 0 0 0 4-4v-1" />
    {!on && <path d="M3 3l18 18" />}
  </svg>
);
