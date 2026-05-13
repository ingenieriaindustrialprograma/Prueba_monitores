'use client';

import { useEffect, useRef, useState } from 'react';

export function AnalogClock({ size = 72 }: { size?: number }) {
  const [deg, setDeg] = useState({ h: 0, m: 0, s: 0 });
  const loop = useRef({ s: 0, m: 0, h: 0, ps: -1, pm: -1, ph: -1 });

  useEffect(() => {
    function tick() {
      const L = loop.current;
      const d = new Date();
      const s = d.getSeconds(), m = d.getMinutes(), h = d.getHours();
      if (L.ps !== -1 && s < L.ps) L.s++;
      if (L.pm !== -1 && m < L.pm) L.m++;
      if (L.ph !== -1 && h < L.ph) L.h++;
      L.ps = s; L.pm = m; L.ph = h;
      setDeg({
        s: s * 6 + L.s * 360,
        m: m * 6 + L.m * 360,
        h: h * 30 + m * 0.5 + L.h * 360,
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const r = size / 2;

  return (
    <div
      style={{ width: size, height: size, position: 'relative', borderRadius: '50%', flexShrink: 0 }}
      className="bg-[#12112a] ring-2 ring-cyan-400/40 shadow-lg shadow-blue-900/40"
    >
      {/* Glow */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{ inset: -2, background: 'linear-gradient(135deg, #00ccff55, #d400d455)', filter: 'blur(6px)', borderRadius: '50%', zIndex: 0 }}
      />

      {/* Hour markers */}
      {[12, 3, 6, 9].map(n => {
        const a = ((n / 12) * 2 * Math.PI) - Math.PI / 2;
        const nr = r * 0.72;
        return (
          <span key={n} style={{
            position: 'absolute', fontSize: 8, fontWeight: 800, color: '#93c5fd',
            left: r + nr * Math.cos(a) - 5, top: r + nr * Math.sin(a) - 6, zIndex: 2,
          }}>{n}</span>
        );
      })}

      {/* Hour hand */}
      <div style={{
        position: 'absolute', zIndex: 3,
        width: 4, height: r * 0.48, left: r - 2, top: r - r * 0.48,
        background: '#f43f5e', borderRadius: 4, transformOrigin: 'bottom center',
        transform: `rotate(${deg.h}deg)`,
      }} />
      {/* Minute hand */}
      <div style={{
        position: 'absolute', zIndex: 4,
        width: 3, height: r * 0.68, left: r - 1.5, top: r - r * 0.68,
        background: '#e2e8f0', borderRadius: 4, transformOrigin: 'bottom center',
        transform: `rotate(${deg.m}deg)`,
      }} />
      {/* Second hand */}
      <div style={{
        position: 'absolute', zIndex: 5,
        width: 1.5, height: r * 0.78, left: r - 0.75, top: r - r * 0.78,
        background: '#00ccff', borderRadius: 4, transformOrigin: 'bottom center',
        transform: `rotate(${deg.s}deg)`, transition: 'transform 0.08s linear',
      }} />
      {/* Center dot */}
      <div style={{
        position: 'absolute', zIndex: 10,
        width: 7, height: 7, left: r - 3.5, top: r - 3.5,
        background: '#f43f5e', borderRadius: '50%', border: '2px solid #fff',
      }} />
    </div>
  );
}

export function SectionTimer({ startMs, className }: { startMs: number; className?: string }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startMs) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startMs]);
  const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const s = (elapsed % 60).toString().padStart(2, '0');
  return <span className={className}>{m}:{s}</span>;
}
