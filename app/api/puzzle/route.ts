import { NextRequest, NextResponse } from 'next/server';
import { scriptWrite } from '@/lib/eval-script-write';

declare global {
  var _puzzleStates: Map<string, PuzzleState> | undefined;
}

interface PuzzleState {
  status: 'idle' | 'ready' | 'round_active' | 'between_rounds' | 'completed' | 'timeout';
  easyImage:   string | null;   // round 0 — 3×3
  normalImage: string | null;   // round 1 — 6×6
  hardImage:   string | null;   // round 2 — 12×12
  currentRound:        0 | 1 | 2;
  elapsedSec:          number;   // cumulative active play time (pauses excluded)
  roundStartTime:      number | null;   // wall-clock ms when current round began
  betweenRoundsUntil:  number | null;   // wall-clock ms when 40s pause ends
  completedRounds:     number;
  progressPct:         number;    // 0-100: pieces placed in the current active round
  roundTimings:        number[];  // seconds taken per completed round
}

const DIFFICULTIES   = [3, 6, 12] as const;
const ROUND_LABELS   = ['Fácil 3×3', 'Normal 6×6', 'Difícil 12×12'];
const PAUSE_SECS     = 40;
const TIME_LIMIT_SEC = 600;

function store(): Map<string, PuzzleState> {
  if (!global._puzzleStates) global._puzzleStates = new Map();
  return global._puzzleStates;
}

function blank(): PuzzleState {
  return {
    status: 'idle',
    easyImage: null, normalImage: null, hardImage: null,
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

function imageForRound(state: PuzzleState, round: 0 | 1 | 2): string | null {
  return [state.easyImage, state.normalImage, state.hardImage][round];
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.toUpperCase().trim();
  if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 });

  const s     = store();
  const state = s.get(code) ?? blank();
  const now   = Date.now();

  // Auto-timeout
  if (state.status === 'round_active' && liveElapsed(state, now) > TIME_LIMIT_SEC) {
    state.elapsedSec    = liveElapsed(state, now);
    state.roundStartTime = null;
    state.status        = 'timeout';
    s.set(code, state);
    // Persist to Sheets in background
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
    state.currentRound        = (state.currentRound + 1) as 0 | 1 | 2;
    state.roundStartTime      = now;
    state.betweenRoundsUntil  = null;
    state.status              = 'round_active';
    s.set(code, state);
  }

  const elapsed         = Math.floor(liveElapsed(state, now));
  const betweenCountdown = state.betweenRoundsUntil
    ? Math.max(0, Math.ceil((state.betweenRoundsUntil - now) / 1000))
    : null;

  const resp: Record<string, unknown> = {
    status:                state.status,
    currentRound:          state.currentRound,
    difficulty:            DIFFICULTIES[state.currentRound],
    roundLabel:            ROUND_LABELS[state.currentRound],
    elapsedSec:            elapsed,
    previousRoundsElapsed: Math.floor(state.elapsedSec), // stable during active round
    timeLimitSec:          TIME_LIMIT_SEC,
    completedRounds:       state.completedRounds,
    betweenCountdown,
    totalRounds:           3,
    progressPct:           state.progressPct,
    roundTimings:          state.roundTimings,
  };

  // Only deliver imageData while the candidate is actively playing
  if (state.status === 'round_active') {
    resp.imageData = imageForRound(state, state.currentRound);
  }

  return NextResponse.json(resp);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { code, action } = body;
  if (!code || !action) return NextResponse.json({ error: 'missing fields' }, { status: 400 });

  const s     = store();
  const state = s.get(code) ?? blank();
  const now   = Date.now();

  switch (action) {
    case 'setup':
      state.easyImage   = body.easyImage   ?? null;
      state.normalImage = body.normalImage ?? null;
      state.hardImage   = body.hardImage   ?? null;
      state.currentRound       = 0;
      state.elapsedSec         = 0;
      state.roundStartTime     = null;
      state.betweenRoundsUntil = null;
      state.completedRounds    = 0;
      state.progressPct        = 0;
      state.roundTimings       = [];
      state.status = (state.easyImage && state.normalImage && state.hardImage) ? 'ready' : 'idle';
      break;

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
      state.progressPct = 0; // reset for next round
      state.completedRounds++;
      if (state.completedRounds >= 3) {
        state.status = 'completed';
        // Persist to Sheets in background
        scriptWrite({
          action: 'savePuzzleResult', code,
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
      state.status             = (state.easyImage && state.normalImage && state.hardImage) ? 'ready' : 'idle';
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

  s.set(code, state);
  return NextResponse.json({
    ok:        true,
    status:    state.status,
    elapsedSec: Math.floor(liveElapsed(state, now)),
  });
}
