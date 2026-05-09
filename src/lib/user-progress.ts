export type UserProgress = {
  solved: number; // total solved across all types (derived)
  mcqSolved: number;
  codingSolved: number;
  streak: number; // answer streak
  bestStreak: number; // best answer streak
  dayStreak: number;
  bestDayStreak: number;
  lastActiveDay: string | null; // yyyy-mm-dd in local time
  lastActiveAt: number | null;
  perTopic: Record<
    string,
    {
      mcqDone: number;
      mcqTotal: number;
      codingDone: number;
      codingTotal: number;
      completed: boolean;
      updatedAt: number;
    }
  >;
};

const STORAGE_PREFIX = 'code-recall:progress:v1:';

function dayKeyLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function yesterdayKeyLocal() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayKeyLocal(d);
}

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function getProgressStorageKey(userId?: string | null) {
  return `${STORAGE_PREFIX}${userId || 'guest'}`;
}

export function loadUserProgress(userId?: string | null): UserProgress {
  if (typeof window === 'undefined') {
    return {
      solved: 0,
      mcqSolved: 0,
      codingSolved: 0,
      streak: 0,
      bestStreak: 0,
      dayStreak: 0,
      bestDayStreak: 0,
      lastActiveDay: null,
      lastActiveAt: null,
      perTopic: {},
    };
  }

  const key = getProgressStorageKey(userId);
  const existing = safeParse<Partial<UserProgress>>(window.localStorage.getItem(key));
  if (existing) {
    // Backward-compatible hydration
    const perTopic = existing.perTopic || {};
    const derived = Object.values(perTopic).reduce(
      (acc, t) => {
        acc.mcq += t.mcqDone || 0;
        acc.coding += t.codingDone || 0;
        return acc;
      },
      { mcq: 0, coding: 0 },
    );

    const mcqSolved = typeof existing.mcqSolved === 'number' ? existing.mcqSolved : derived.mcq;
    const codingSolved = typeof existing.codingSolved === 'number' ? existing.codingSolved : derived.coding;
    const solved = mcqSolved + codingSolved;

    return {
      solved,
      mcqSolved,
      codingSolved,
      streak: existing.streak ?? 0,
      bestStreak: existing.bestStreak ?? 0,
      dayStreak: (existing as UserProgress).dayStreak ?? 0,
      bestDayStreak: (existing as UserProgress).bestDayStreak ?? 0,
      lastActiveDay: (existing as UserProgress).lastActiveDay ?? null,
      lastActiveAt: existing.lastActiveAt ?? null,
      perTopic,
    };
  }

  return {
    solved: 0,
    mcqSolved: 0,
    codingSolved: 0,
    streak: 0,
    bestStreak: 0,
    dayStreak: 0,
    bestDayStreak: 0,
    lastActiveDay: null,
    lastActiveAt: null,
    perTopic: {},
  };
}

export function saveUserProgress(userId: string | null | undefined, value: UserProgress) {
  if (typeof window === 'undefined') return;
  const key = getProgressStorageKey(userId);
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function bumpSolved(params: {
  userId?: string | null;
  topicId: string;
  kind: 'mcq' | 'coding';
  questionIndex: number;
  mcqTotal: number;
  codingTotal: number;
  streak: number;
}) {
  const { userId, topicId, kind, questionIndex, mcqTotal, codingTotal, streak } = params;
  const p = loadUserProgress(userId);

  const now = Date.now();
  const topic = p.perTopic[topicId] || {
    mcqDone: 0,
    mcqTotal,
    codingDone: 0,
    codingTotal,
    completed: false,
    updatedAt: now,
  };

  topic.mcqTotal = mcqTotal;
  topic.codingTotal = codingTotal;
  // Advance only when this exact question is newly solved.
  let didAdvance = false;
  if (kind === 'mcq' && questionIndex === topic.mcqDone) {
    topic.mcqDone = Math.min(mcqTotal, topic.mcqDone + 1);
    didAdvance = true;
  }
  if (kind === 'coding' && questionIndex === topic.codingDone) {
    topic.codingDone = Math.min(codingTotal, topic.codingDone + 1);
    didAdvance = true;
  }
  topic.updatedAt = now;
  topic.completed = topic.mcqDone >= topic.mcqTotal && topic.codingDone >= topic.codingTotal;

  if (didAdvance && kind === 'mcq') p.mcqSolved = (p.mcqSolved || 0) + 1;
  if (didAdvance && kind === 'coding') p.codingSolved = (p.codingSolved || 0) + 1;
  p.solved = (p.mcqSolved || 0) + (p.codingSolved || 0);
  p.streak = streak;
  p.bestStreak = Math.max(p.bestStreak, streak);
  const today = dayKeyLocal(new Date());
  if (p.lastActiveDay !== today) {
    p.dayStreak = p.lastActiveDay === yesterdayKeyLocal() ? (p.dayStreak || 0) + 1 : 1;
    p.bestDayStreak = Math.max(p.bestDayStreak || 0, p.dayStreak);
    p.lastActiveDay = today;
  }
  p.lastActiveAt = now;
  p.perTopic[topicId] = topic;

  saveUserProgress(userId, p);
  return { progress: p, topic, didAdvance };
}

export function resetStreak(userId?: string | null) {
  const p = loadUserProgress(userId);
  p.streak = 0;
  saveUserProgress(userId, p);
  return p;
}

export function getTopicResume(
  userId: string | null | undefined,
  topicId: string,
  mcqTotal: number,
  codingTotal: number,
) {
  const p = loadUserProgress(userId);
  const t = p.perTopic[topicId];
  return {
    mcqDone: Math.min(t?.mcqDone ?? 0, mcqTotal),
    codingDone: Math.min(t?.codingDone ?? 0, codingTotal),
  };
}

export function formatLastActive(ts: number | null) {
  if (!ts) return 'Not started';
  const diffMs = Date.now() - ts;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

