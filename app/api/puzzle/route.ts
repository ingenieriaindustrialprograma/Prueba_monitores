import { NextRequest, NextResponse } from 'next/server';
import { scriptWrite } from '@/lib/eval-script-write';
import { kvGet, kvSet } from '@/lib/kv';

// State stored in KV — no images (stored separately as puzzle:CODE:img:easy/normal/hard)
interface PuzzleState {
  status: 'idle' | 'ready' | 'round_active' | 'between_rounds' | 'completed' | 'timeout';
  hasImages: boolean;
  currentRound:        0 | 1 | 2;
  elapsedSec:          number;
  roundStartTime:      number | null;
  betweenRoundsUntil:  number | null;
  completedRounds:     number;
  progressPct:         number;
  roundTimings:        number[];
}

const DIFFICULTIES   = [3, 6, 12] as const;
const ROUND_LABELS   = ['Fácil 3×3', 'Normal 6×6', 'Difícil 12×12'];
const IMG_KEYS       = ['easy', 'normal', 'hard'] as const;
const PAUSE_SECS     = 40;
const TIME_LIMIT_SEC = 600;
const STATE_TTL      = 86400;    // 24h
const IMG_TTL        = 86400;    // 24h

function blank(): PuzzleState {
  return {
    status: 'idle',
    hasImages: false,
    currentRound: 0, elapsedSec: 0,
    roundStartTime: null, betweenRoundsUntil: null,
    completedRounds: 0,
    progressPct: 0, roundTimings: [],
  };
}

function liveElapsed(state: PuzzleState, now = Date.now()): number {
  if (state.status === 'round_active' && state.roundStartTime) {
    return state.elapsedSec + (now - state.roundStartTime) / 1000;
  }
  return state.elapsedSec;
}

function stateKey(code: string) { return `puzzle:${code}`; }
function imgKey(code: string, slot: typeof IMG_KEYS[number]) { return `puzzle:${code}:img:${slot}`; }

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.toUpperCase().trim();
  if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 });

  let state = (await kvGet<PuzzleState>(stateKey(code))) ?? blank();
  const now = Date.now();
  let dirty = false;

  // Auto-timeout
  if (state.status === 'round_active' && liveElapsed(state, now) > TIME_LIMIT_SEC) {
    state.elapsedSec     = liveElapsed(state, now);
    state.roundStartTime = null;
    state.status         = 'timeout';
    dirty = true;
    scriptWrite({
      action: 'savePuzzleResult', code,
      status: 'timeout',
      completedRounds: state.completedRounds,
      elapsedSec: Math.floor(state.elapsedSec),
      roundTimings: state.roundTimings,
      progressPct: state.progressPct,
    }).catch(() => {});
  }

  // Auto-advance after 40s pause
  if (state.status === 'between_rounds' && state.betweenRoundsUntil && now >= state.betweenRoundsUntil) {
    state.currentRound       = (state.currentRound + 1) as 0 | 1 | 2;
    state.roundStartTime     = now;
    state.betweenRoundsUntil = null;
    state.status             = 'round_active';
    dirty = true;
  }

  if (dirty) {
    await kvSet(stateKey(code), state, STATE_TTL);
  }

  const elapsed          = Math.floor(liveElapsed(state, now));
  const betweenCountdown = state.betweenRoundsUntil
    ? Math.max(0, Math.ceil((state.betweenRoundsUntil - now) / 1000))
    : null;

  const resp: Record<string, unknown> = {
    status:                state.status,
    currentRound:          state.currentRound,
    difficulty:            DIFFICULTIES[state.currentRound],
    roundLabel:            ROUND_LABELS[state.currentRound],
    elapsedSec:            elapsed,
    previousRoundsElapsed: Math.floor(state.elapsedSec),
    timeLimitSec:          TIME_LIMIT_SEC,
    completedRounds:       state.completedRounds,
    betweenCountdown,
    totalRounds:           3,
    progressPct:           state.progressPct,
    roundTimings:          state.roundTimings,
  };

  // Deliver image only while candidate is actively playing
  if (state.status === 'round_active') {
    resp.imageData = await kvGet<string>(imgKey(code, IMG_KEYS[state.currentRound]));
  }

  return NextResponse.json(resp);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { code, action } = body;
  if (!code || !action) return NextResponse.json({ error: 'missing fields' }, { status: 400 });

  const upperCode = (code as string).toUpperCase().trim();
  let state = (await kvGet<PuzzleState>(stateKey(upperCode))) ?? blank();
  const now = Date.now();

  switch (action) {
    case 'setup': {
      // Store images as separate keys to keep main state small
      const imgs: [string, string | null][] = [
        [imgKey(upperCode, 'easy'),   body.easyImage   ?? null],
        [imgKey(upperCode, 'normal'), body.normalImage ?? null],
        [imgKey(upperCode, 'hard'),   body.hardImage   ?? null],
      ];
      await Promise.all(
        imgs.map(([k, v]) => v ? kvSet(k, v, IMG_TTL) : Promise.resolve())
      );
      const hasImages = !!(body.easyImage && body.normalImage && body.hardImage);
      state = {
        ...blank(),
        hasImages,
        status: hasImages ? 'ready' : 'idle',
      };
      break;
    }

    case 'start':
      if (state.status === 'ready') {
        state.status         = 'round_active';
        state.currentRound   = 0;
        state.roundStartTime = now;
        state.elapsedSec     = 0;
        state.progressPct    = 0;
        state.roundTimings   = [];
      }
      break;

    case 'complete_round': {
      const roundSec = state.roundStartTime ? Math.floor((now - state.roundStartTime) / 1000) : 0;
      if (state.roundStartTime) {
        state.elapsedSec    += (now - state.roundStartTime) / 1000;
        state.roundStartTime = null;
      }
      state.roundTimings.push(roundSec);
      state.progressPct = 0;
      state.completedRounds++;
      if (state.completedRounds >= 3) {
        state.status = 'completed';
        scriptWrite({
          action: 'savePuzzleResult', code: upperCode,
          status: 'completed',
          completedRounds: state.completedRounds,
          elapsedSec: Math.floor(state.elapsedSec),
          roundTimings: state.roundTimings,
          progressPct: 100,
        }).catch(() => {});
      } else {
        state.status             = 'between_rounds';
        state.betweenRoundsUntil = now + PAUSE_SECS * 1000;
      }
      break;
    }

    case 'update_progress':
      if (state.status === 'round_active') {
        state.progressPct = Math.min(100, Math.max(0, Math.round(body.pct ?? 0)));
      }
      break;

    case 'reset':
      state.status             = state.hasImages ? 'ready' : 'idle';
      state.currentRound       = 0;
      state.elapsedSec         = 0;
      state.roundStartTime     = null;
      state.betweenRoundsUntil = null;
      state.completedRounds    = 0;
      state.progressPct        = 0;
      state.roundTimings       = [];
      break;

    default:
      return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  }

  await kvSet(stateKey(upperCode), state, STATE_TTL);

  return NextResponse.json({
    ok:         true,
    status:     state.status,
    elapsedSec: Math.floor(liveElapsed(state, now)),
  });
}
