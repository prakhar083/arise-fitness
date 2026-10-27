import { useEffect, useState } from 'react';

/** Current time, re-rendering every `ms` (default 1 s) — drives live countdowns and timers. */
export const useNow = (ms = 1000) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(iv);
  }, [ms]);
  return now;
};

export const pad2 = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, '0');
export const mmss = (sec: number) => `${pad2(sec / 60)}:${pad2(sec % 60)}`;
export const hhmmss = (ms: number) => `${pad2(ms / 36e5)}:${pad2((ms % 36e5) / 6e4)}:${pad2((ms % 6e4) / 1000)}`;
