import { getPainLogsByRegion, getAllPainLogs } from '../services/Storage.js';

/**
 * 제한 사항별 회피 운동 패턴 매핑
 */
const RESTRICTION_MAP = {
  '쪼그려 앉기 힘듦': ['squat', 'lunge'],
  '팔을 위로 들기 어려움': ['reach'],
  '오래 서있기 힘듦': [], // duration-based, handled separately
  '오래 앉아있기 힘듦': ['isometric'],
  '계단 오르기 어려움': ['lunge', 'squat'],
  '무거운 것 들기 어려움': ['hinge'],
};

const LONG_DURATION_RESTRICTION = '오래 서있기 힘듦';
const LONG_DURATION_THRESHOLD = 120; // seconds

/**
 * 특정 부위의 통증 추세를 분석한다.
 * 최근 5개 로그를 기준으로 악화/개선/유지 여부를 판단.
 *
 * @param {string} regionKey - 신체 부위 키
 * @returns {Promise<{ trend: string, message: string }>}
 */
export async function checkPainTrend(regionKey) {
  const logs = await getPainLogsByRegion(regionKey);

  if (!logs || logs.length < 3) {
    return { trend: 'unknown', message: '' };
  }

  const sorted = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
  const recent = sorted.slice(0, 5);

  const oldest = recent[recent.length - 1];
  const newest = recent[0];
  const diff = (newest.painLevel || 0) - (oldest.painLevel || 0);

  if (diff >= 2) {
    return { trend: 'worsening', message: '이 부위의 통증이 악화 추세입니다.' };
  }
  if (diff <= -2) {
    return { trend: 'improving', message: '통증이 개선되고 있어요!' };
  }
  return { trend: 'stable', message: '통증 수준이 유지되고 있습니다.' };
}

/**
 * 해당 부위에 경고를 표시해야 하는지 판단한다.
 *
 * @param {string} regionKey - 신체 부위 키
 * @param {number} currentPain - 현재 통증 수준 (0-10)
 * @returns {Promise<boolean>}
 */
export async function shouldShowWarning(regionKey, currentPain) {
  if (currentPain >= 8) {
    return true;
  }

  const trend = await checkPainTrend(regionKey);
  if (trend.trend === 'worsening') {
    return true;
  }

  const logs = await getPainLogsByRegion(regionKey);
  if (logs && logs.length >= 3) {
    const sorted = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastThree = sorted.slice(0, 3);
    if (lastThree.every((log) => (log.painLevel || 0) >= 7)) {
      return true;
    }
  }

  return false;
}

/**
 * 제한 사항 목록을 바탕으로 피해야 할 운동 패턴을 반환한다.
 *
 * @param {string[]} restrictions - 제한 사항 문자열 배열 (한국어)
 * @returns {{ avoidPatterns: string[], avoidLongDuration: boolean }}
 */
export function getContraindicatedExercises(restrictions) {
  const patternSet = new Set();
  let avoidLongDuration = false;

  for (const restriction of restrictions) {
    if (restriction === LONG_DURATION_RESTRICTION) {
      avoidLongDuration = true;
    }

    const patterns = RESTRICTION_MAP[restriction];
    if (patterns) {
      for (const p of patterns) {
        patternSet.add(p);
      }
    }
  }

  return {
    avoidPatterns: [...patternSet],
    avoidLongDuration,
  };
}

/**
 * 운동 루틴을 검증하여 안전한 운동과 제외된 운동을 분류한다.
 *
 * @param {Array<{ name: string, purpose: string, pattern: string, regionKey: string, duration?: number }>} exercises
 * @param {Array<{ regionKey: string, intensity: number, restrictions: string[] }>} painRegions
 * @returns {{ safe: Array, removed: Array, warnings: string[] }}
 */
export function validateRoutine(exercises, painRegions) {
  const allRestrictions = painRegions.flatMap((r) => r.restrictions || []);
  const { avoidPatterns, avoidLongDuration } = getContraindicatedExercises(allRestrictions);

  const safe = [];
  const removed = [];
  const warnings = [];

  for (const exercise of exercises) {
    let dominated = false;

    const exPatterns = exercise.pattern || [];
    if (exPatterns.some(p => avoidPatterns.includes(p))) {
      removed.push(exercise);
      warnings.push(`'${exercise.name}' 운동은 현재 제한 사항과 맞지 않아 제외되었습니다.`);
      dominated = true;
    }

    if (!dominated && avoidLongDuration && (exercise.estimatedSeconds || exercise.duration || 0) > LONG_DURATION_THRESHOLD) {
      removed.push(exercise);
      warnings.push(`'${exercise.name}' 운동은 장시간 수행이 필요하여 제외되었습니다.`);
      dominated = true;
    }

    if (!dominated) {
      safe.push(exercise);
    }
  }

  return { safe, removed, warnings };
}
