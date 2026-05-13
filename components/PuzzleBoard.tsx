'use client';

import { useEffect, useRef, useState } from 'react';

interface PuzzleBoardProps {
  imageData:         string;
  difficulty:        number;          // 3, 6 or 12
  roundNumber:       number;          // 1, 2 or 3
  totalRounds:       number;          // 3
  initialElapsedSec: number;          // cumulative seconds from previous rounds
  totalTimeLimitSec: number;          // 600
  onComplete:  (roundTimeSec: number) => void;
  onProgress?: (pct: number) => void;
}

const SNAP = 25;
const BUF  = 0.45;

const ROUND_NAME: Record<number, string> = { 3: 'Fácil', 6: 'Normal', 12: 'Difícil' };

export function PuzzleBoard({
  imageData, difficulty, roundNumber, totalRounds,
  initialElapsedSec, totalTimeLimitSec,
  onComplete, onProgress,
}: PuzzleBoardProps) {
  const boardRef   = useRef<HTMLDivElement>(null);
  const poolRef    = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const guideRef   = useRef<HTMLCanvasElement>(null);
  const roundStartRef = useRef(Date.now());

  const gs = useRef({
    img: null as HTMLImageElement | null,
    cols: difficulty, rows: difficulty,
    pw: 0, ph: 0,
    completed: 0, total: difficulty * difficulty,
    moves: 0,
  });

  const [stats, setStats] = useState({ moves: 0, pct: 0, done: 0, total: difficulty * difficulty });
  const [won,       setWon]       = useState(false);
  const [finalTime, setFinalTime] = useState('');
  const [roundElapsed, setRoundElapsed] = useState(0);

  // Running timer for this round
  useEffect(() => {
    roundStartRef.current = Date.now();
    const id = setInterval(
      () => setRoundElapsed(Math.floor((Date.now() - roundStartRef.current) / 1000)),
      1000,
    );
    return () => clearInterval(id);
  }, []);

  // Bootstrap image
  useEffect(() => {
    if (!imageData) return;
    const img = new window.Image();
    img.onload = () => { gs.current.img = img; initGame(); };
    img.src = imageData;
  }, [imageData, difficulty]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Game init ──────────────────────────────────────────────────────────────
  function initGame() {
    const board = boardRef.current, pool = poolRef.current;
    const guide = guideRef.current, wrap = wrapperRef.current;
    const state = gs.current;
    if (!board || !pool || !guide || !wrap || !state.img) return;

    state.cols = difficulty; state.rows = difficulty;
    state.moves = 0; state.completed = 0;
    state.total = state.cols * state.rows;

    Array.from(board.children).forEach(c => { if (c !== guide) c.remove(); });
    pool.innerHTML = '';
    board.appendChild(guide);

    const mW = wrap.clientWidth - 24, mH = wrap.clientHeight - 24;
    const sc = Math.min(mW / state.img.width, mH / state.img.height, 1);
    const bW = state.img.width * sc, bH = state.img.height * sc;

    board.style.width  = `${bW}px`;
    board.style.height = `${bH}px`;
    state.pw = bW / state.cols;
    state.ph = bH / state.rows;

    // Guide canvas: faint image + grid + position numbers
    guide.width  = bW; guide.height = bH;
    const gc = guide.getContext('2d')!;
    gc.globalAlpha = 0.14;
    gc.drawImage(state.img, 0, 0, bW, bH);
    gc.globalAlpha = 1;
    gc.strokeStyle = 'rgba(255,255,255,0.3)'; gc.lineWidth = 1;
    gc.beginPath();
    for (let x = 1; x < state.cols; x++) { gc.moveTo(x * state.pw, 0); gc.lineTo(x * state.pw, bH); }
    for (let y = 1; y < state.rows; y++) { gc.moveTo(0, y * state.ph); gc.lineTo(bW, y * state.ph); }
    gc.stroke();
    if (state.cols <= 6) {
      gc.font = `bold ${Math.max(8, state.pw * 0.15)}px monospace`;
      gc.fillStyle = 'rgba(255,255,255,0.28)';
      gc.textAlign = 'right'; gc.textBaseline = 'bottom';
      for (let y = 0; y < state.rows; y++)
        for (let x = 0; x < state.cols; x++)
          gc.fillText(`${y+1},${x+1}`, (x+1)*state.pw - 3, (y+1)*state.ph - 3);
    }

    generatePieces(sc);
    setStats({ moves: 0, pct: 0, done: 0, total: state.total });
    setWon(false);
  }

  // ── Piece generation ───────────────────────────────────────────────────────
  function generatePieces(sc: number) {
    const state = gs.current;
    const pool  = poolRef.current!;
    const buf   = Math.max(state.pw, state.ph) * BUF;
    const cnvW  = state.pw + buf * 2;

    // Dynamic pool scale: fit 1 / 2 / 3 columns depending on difficulty
    const poolCols   = state.cols <= 3 ? 1 : state.cols <= 6 ? 2 : 3;
    const poolUsable = 244;  // sidebar 260px - padding 16px
    const cellW      = poolUsable / poolCols - 8;
    const poolScale  = Math.min(0.9, Math.max(0.22, cellW / cnvW));

    // Pool header
    const hdr = document.createElement('div');
    hdr.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px 12px;font-size:11px;color:#64748b;background:rgba(0,0,0,0.25);border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0;';
    hdr.innerHTML = `<span>🧩 <b style="color:#94a3b8" id="pool-total-count">${state.total}</b> piezas</span><span style="font-size:9px;color:#475569;font-style:italic">Click → lleva al tablero</span>`;
    pool.appendChild(hdr);

    // Shape table — build entire grid before creating pieces
    const shapes: { top:number; right:number; bottom:number; left:number }[][] = [];
    for (let y = 0; y < state.rows; y++) {
      const row: { top:number; right:number; bottom:number; left:number }[] = [];
      for (let x = 0; x < state.cols; x++) {
        row.push({
          top:    y === 0             ? 0 : -shapes[y-1][x].bottom,
          right:  x === state.cols-1 ? 0 : (Math.random() > 0.5 ? 1 : -1),
          bottom: y === state.rows-1 ? 0 : (Math.random() > 0.5 ? 1 : -1),
          left:   x === 0            ? 0 : -row[x-1].right,
        });
      }
      shapes.push(row);
    }

    // Flat grid — all pieces shuffled globally so row position is never revealed
    const piecesEl = document.createElement('div');
    piecesEl.style.cssText = `display:grid;grid-template-columns:repeat(${poolCols},1fr);gap:6px;padding:8px 10px;align-items:start;justify-items:center;`;
    pool.appendChild(piecesEl);

    const allPieces: HTMLElement[] = [];
    for (let y = 0; y < state.rows; y++)
      for (let x = 0; x < state.cols; x++)
        allPieces.push(makePiece(x, y, shapes[y][x], sc, poolScale));
    allPieces.sort(() => Math.random() - 0.5);
    allPieces.forEach(p => piecesEl.appendChild(p));
  }

  function makePiece(
    col: number, row: number,
    shape: { top: number; right: number; bottom: number; left: number },
    sc: number, poolScale: number,
  ): HTMLElement {
    const state    = gs.current;
    const { pw, ph } = state;
    const buf      = Math.max(pw, ph) * BUF;
    const cnv      = document.createElement('canvas');
    cnv.width  = pw + buf * 2;
    cnv.height = ph + buf * 2;
    const ctx = cnv.getContext('2d')!;

    ctx.translate(buf, buf);
    drawPath(ctx, pw, ph, shape);
    ctx.save(); ctx.clip();
    ctx.drawImage(
      state.img!,
      (col * pw - buf) / sc, (row * ph - buf) / sc,
      cnv.width / sc, cnv.height / sc,
      -buf, -buf, cnv.width, cnv.height,
    );
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';        ctx.lineWidth = 1; ctx.stroke();

    const imgData = cnv.toDataURL();
    const fullW   = cnv.width, fullH = cnv.height;
    const pW      = Math.round(fullW * poolScale);
    const pH      = Math.round(fullH * poolScale);

    const div = document.createElement('div');
    div.className = 'puzzle-piece in-pool';
    div.style.cssText = `width:${pW}px;height:${pH}px;background:url(${imgData}) 100% 100%;position:relative;cursor:pointer;filter:drop-shadow(1px 2px 2px rgba(0,0,0,0.45));transition:filter .12s,transform .1s;box-sizing:border-box;`;
    div.dataset.tx   = String(col * pw - buf);
    div.dataset.ty   = String(row * ph - buf);

    // Hover highlight
    div.addEventListener('mouseenter', () => { if (div.classList.contains('in-pool')) div.style.transform = 'scale(1.1)'; });
    div.addEventListener('mouseleave', () => { if (div.classList.contains('in-pool')) div.style.transform = ''; });

    // ── Drag / click logic (closure over imgData, fullW, fullH) ──────────────
    let startX = 0, startY = 0, wasDrag = false;
    let initLeft = 0, initTop = 0;

    function restoreForBoard() {
      div.style.width           = fullW + 'px';
      div.style.height          = fullH + 'px';
      div.style.backgroundImage = `url(${imgData})`;
      div.style.backgroundSize  = '100% 100%';
      div.style.transform       = '';
      div.style.transition      = '';
      div.style.filter          = 'drop-shadow(2px 3px 3px rgba(0,0,0,0.5))';
    }

    function placeOnBoard(left: number, top: number) {
      const board = boardRef.current!;
      restoreForBoard();
      div.classList.remove('in-pool');
      div.style.position = 'absolute';
      div.style.cursor   = 'grab';
      div.style.left     = left + 'px';
      div.style.top      = top  + 'px';
      div.style.zIndex   = '50';
      board.appendChild(div);
      reducePoolCount();
    }

    function onMouseDown(e: MouseEvent) {
      if (div.dataset.snapped) return;
      e.preventDefault();
      startX = e.clientX; startY = e.clientY;
      wasDrag = false;

      function onMove(ev: MouseEvent) {
        const dist = Math.hypot(ev.clientX - startX, ev.clientY - startY);
        if (!wasDrag && dist > 4) {
          wasDrag = true;
          const board = boardRef.current!;
          const br    = board.getBoundingClientRect();
          if (div.classList.contains('in-pool')) {
            placeOnBoard(startX - br.left - fullW / 2, startY - br.top - fullH / 2);
          }
          initLeft = div.offsetLeft; initTop = div.offsetTop;
          div.style.zIndex = '100'; div.style.cursor = 'grabbing';
        }
        if (wasDrag) {
          div.style.left = (initLeft + ev.clientX - startX) + 'px';
          div.style.top  = (initTop  + ev.clientY - startY) + 'px';
        }
      }

      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup',   onUp);
        if (!wasDrag && div.classList.contains('in-pool')) {
          // Simple click → teleport near target
          const board  = boardRef.current!;
          const tx     = parseFloat(div.dataset.tx!);
          const ty     = parseFloat(div.dataset.ty!);
          const { pw: cpw, ph: cph } = gs.current;
          const ox = (Math.random() - 0.5) * cpw * 2.5;
          const oy = (Math.random() - 0.5) * cph * 2.5;
          const br = board.getBoundingClientRect();
          placeOnBoard(
            Math.max(0, Math.min(board.clientWidth  - fullW, tx + ox)),
            Math.max(0, Math.min(board.clientHeight - fullH, ty + oy)),
          );
          void br; // suppress lint
        } else if (wasDrag) {
          div.style.zIndex = ''; div.style.cursor = 'grab';
          gs.current.moves++;
          snap(div);
        }
      }

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup',   onUp);
    }

    function onTouchStart(e: TouchEvent) {
      if (div.dataset.snapped) return;
      e.preventDefault();
      const board = boardRef.current!;
      const br    = board.getBoundingClientRect();
      const cx    = e.touches[0].clientX;
      const cy    = e.touches[0].clientY;
      if (div.classList.contains('in-pool')) {
        placeOnBoard(cx - br.left - fullW / 2, cy - br.top - fullH / 2);
      }
      div.style.zIndex = '100'; div.style.cursor = 'grabbing';
      const sl = div.offsetLeft, st = div.offsetTop;

      function move(ev: TouchEvent) {
        div.style.left = (sl + ev.touches[0].clientX - cx) + 'px';
        div.style.top  = (st + ev.touches[0].clientY - cy) + 'px';
      }
      function end() {
        document.removeEventListener('touchmove', move as EventListener);
        document.removeEventListener('touchend',  end);
        div.style.zIndex = ''; div.style.cursor = 'grab';
        gs.current.moves++;
        snap(div);
      }
      document.addEventListener('touchmove', move as EventListener, { passive: false });
      document.addEventListener('touchend',  end);
    }

    div.addEventListener('mousedown',  onMouseDown);
    div.addEventListener('touchstart', onTouchStart as EventListener, { passive: false });

    return div;
  }

  function reducePoolCount() {
    const pool = poolRef.current;
    if (!pool) return;
    const totalEl = pool.querySelector('#pool-total-count') as HTMLElement;
    if (totalEl) {
      const current = parseInt(totalEl.textContent ?? '0');
      if (!isNaN(current)) totalEl.textContent = String(Math.max(0, current - 1));
    }
  }

  // ── Path drawing ───────────────────────────────────────────────────────────
  function drawPath(
    ctx: CanvasRenderingContext2D, w: number, h: number,
    s: { top: number; right: number; bottom: number; left: number },
  ) {
    ctx.beginPath(); ctx.moveTo(0, 0);
    edge(ctx, w, s.top);
    edge(ctx, h, s.right,  w, 0, 90);
    edge(ctx, w, s.bottom, w, h, 180);
    edge(ctx, h, s.left,   0, h, 270);
    ctx.closePath();
  }

  function edge(ctx: CanvasRenderingContext2D, len: number, type: number, dx = 0, dy = 0, rot = 0) {
    const a = rot * Math.PI / 180, cos = Math.cos(a), sin = Math.sin(a);
    const t = (x: number, y: number) => ({ x: dx + x*cos - y*sin, y: dy + x*sin + y*cos });
    if (type === 0) { const p = t(len, 0); ctx.lineTo(p.x, p.y); return; }
    const nW = len*.2, hW = len*.35, tH = len*.25*type;
    const x1 = (len-nW)/2, x2 = (len+nW)/2;
    ctx.lineTo(t(x1,0).x, t(x1,0).y);
    ctx.bezierCurveTo(t(x1,-tH*.5).x,t(x1,-tH*.5).y, t(len/2-hW/1.5,-tH).x,t(len/2-hW/1.5,-tH).y, t(len/2,-tH).x,t(len/2,-tH).y);
    ctx.bezierCurveTo(t(len/2+hW/1.5,-tH).x,t(len/2+hW/1.5,-tH).y, t(x2,-tH*.5).x,t(x2,-tH*.5).y, t(x2,0).x,t(x2,0).y);
    ctx.lineTo(t(len,0).x, t(len,0).y);
  }

  // ── Snap ───────────────────────────────────────────────────────────────────
  function snap(el: HTMLElement) {
    const state = gs.current;
    const tx = parseFloat(el.dataset.tx!), ty = parseFloat(el.dataset.ty!);
    if (Math.hypot(el.offsetLeft - tx, el.offsetTop - ty) < SNAP) {
      el.style.left   = tx + 'px'; el.style.top = ty + 'px';
      el.style.cursor = 'default'; el.style.zIndex = '1';
      el.style.filter = 'none';
      el.dataset.snapped = 'true';
      try {
        const ac = new AudioContext(), o = ac.createOscillator(), g = ac.createGain();
        o.type = 'sine'; o.frequency.value = 800;
        g.gain.setValueAtTime(0.1, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);
        o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.1);
      } catch { /* AudioContext may be blocked */ }
      state.completed++;
      const pct = Math.floor((state.completed / state.total) * 100);
      setStats({ moves: state.moves, pct, done: state.completed, total: state.total });
      onProgress?.(pct);
      if (state.completed === state.total) {
        const sec = Math.floor((Date.now() - roundStartRef.current) / 1000);
        const fm  = Math.floor(sec / 60).toString().padStart(2, '0');
        const fs  = (sec % 60).toString().padStart(2, '0');
        setFinalTime(`${fm}:${fs}`);
        setWon(true);
        onComplete(sec);
        if (guideRef.current && state.img) {
          const gc = guideRef.current.getContext('2d')!;
          gc.clearRect(0, 0, guideRef.current.width, guideRef.current.height);
          gc.drawImage(state.img, 0, 0, guideRef.current.width, guideRef.current.height);
          guideRef.current.style.opacity = '1';
        }
      }
    } else {
      setStats(p => ({ ...p, moves: state.moves }));
    }
  }

  // ── Timer display ──────────────────────────────────────────────────────────
  const totalElapsed = initialElapsedSec + roundElapsed;
  const remaining    = Math.max(0, totalTimeLimitSec - totalElapsed);
  const rm  = Math.floor(remaining / 60).toString().padStart(2, '0');
  const rs  = (remaining % 60).toString().padStart(2, '0');
  const urgent = remaining <= 60;

  return (
    <div className="flex flex-col h-full select-none relative"
      style={{ background: 'repeating-linear-gradient(45deg,rgba(255,255,255,.01) 0px,rgba(255,255,255,.01) 2px,transparent 2px,transparent 8px),linear-gradient(to bottom,#1a1510,#12100e)' }}>

      {/* HUD */}
      <div className="flex items-center justify-between px-5 py-2.5 shrink-0"
        style={{ background: 'rgba(18,18,30,0.97)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-5 text-sm" style={{ color: '#94a3b8' }}>
          <span style={{ color: '#f8fafc', fontWeight: 700 }}>
            Ronda {roundNumber}/{totalRounds} · {ROUND_NAME[difficulty] ?? difficulty} {difficulty}×{difficulty}
          </span>
          <span>🧩 <b style={{ color: '#f8fafc' }}>{stats.done}/{stats.total}</b></span>
          <div className="flex items-center gap-2">
            <div style={{ width: 80, height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${stats.pct}%`, background: 'linear-gradient(90deg,#4cc9f0,#4ade80)', borderRadius: 4, transition: 'width .3s' }} />
            </div>
            <span style={{ fontSize: 11 }}>{stats.pct}%</span>
          </div>
          <span style={{ fontSize: 11, color: '#64748b' }}>Movs: {stats.moves}</span>
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, letterSpacing: 2, color: urgent ? '#f87171' : '#fde68a' }}
          className={urgent ? 'animate-pulse' : ''}>
          ⏱ {rm}:{rs}
        </div>
      </div>

      {/* Layout: sidebar pool + board */}
      <div className="flex flex-1 overflow-hidden">

        {/* Pool sidebar */}
        <div style={{ width: 260, background: 'rgba(9,9,16,0.9)', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
          <div ref={poolRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }} />
        </div>

        {/* Board area */}
        <div ref={wrapperRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)' }}>
          <div ref={boardRef} style={{ position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', borderRadius: 4 }}>
            <canvas ref={guideRef} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', transition: 'opacity .5s' }} />
          </div>
        </div>
      </div>

      {/* Win overlay */}
      {won && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.87)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(25,25,38,0.98)', border: '1px solid rgba(255,255,255,0.1)', padding: '3rem', borderRadius: 20, textAlign: 'center', maxWidth: 380, boxShadow: '0 25px 50px rgba(0,0,0,0.7)' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
            <h2 style={{ color: '#4cc9f0', fontSize: 28, marginBottom: 10, fontWeight: 800 }}>
              ¡Ronda {roundNumber} completada!
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: 6 }}>
              Tiempo en ronda: <b style={{ color: '#f8fafc' }}>{finalTime}</b>
            </p>
            <p style={{ color: '#64748b', fontSize: 13 }}>
              Movimientos: <b style={{ color: '#cbd5e1' }}>{stats.moves}</b>
            </p>
            {roundNumber < totalRounds && (
              <p style={{ color: '#818cf8', marginTop: 20, fontSize: 14 }}>
                Preparando ronda {roundNumber + 1} de {totalRounds}…
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
