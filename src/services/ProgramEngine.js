// ProgramEngine.js - 프로그램 자동 생성 + 난이도 조절 엔진

import {
    GOAL_REGION_MAP,
    getExercisesForGoal,
    guessExerciseCategory,
    difficultyToNumber,
    getAllRegionKeys,
    getRawExercises,
} from '../anatomy/BodyData.js';

// ═══ 프로그램 자동 생성 ═══

const DAY_TEMPLATES = {
    3: [
        { focus: 'stability_mobility', label: '안정화+가동성', purposeFilter: ['mobility', 'stability', 'breathing'] },
        { focus: 'strength',           label: '근력 강화',     purposeFilter: ['strength', 'stability'] },
        { focus: 'recovery',           label: '회복/스트레칭', purposeFilter: ['mobility', 'breathing'] },
    ],
    4: [
        { focus: 'stability_mobility', label: '안정화+가동성', purposeFilter: ['mobility', 'stability', 'breathing'] },
        { focus: 'lower_strength',     label: '하체 강화',     purposeFilter: ['strength', 'stability'] },
        { focus: 'upper_strength',     label: '상체 강화',     purposeFilter: ['strength', 'stability'] },
        { focus: 'recovery',           label: '회복/스트레칭', purposeFilter: ['mobility', 'breathing'] },
    ],
    5: [
        { focus: 'stability_mobility', label: '안정화+가동성', purposeFilter: ['mobility', 'stability', 'breathing'] },
        { focus: 'lower_strength',     label: '하체 강화',     purposeFilter: ['strength', 'stability'] },
        { focus: 'recovery',           label: '회복',          purposeFilter: ['mobility', 'breathing'] },
        { focus: 'upper_strength',     label: '상체 강화',     purposeFilter: ['strength', 'stability'] },
        { focus: 'stability_mobility', label: '전신 안정화',   purposeFilter: ['mobility', 'stability'] },
    ],
};

const WEEKDAY_MAP = {
    3: [1, 3, 5],       // 월, 수, 금
    4: [1, 2, 4, 5],    // 월, 화, 목, 금
    5: [1, 2, 3, 4, 5], // 월~금
};

// 운동 1개 기본 예상 시간 (초)
const DEFAULT_EXERCISE_SECONDS = 90; // 약 1.5분

/**
 * 프로그램 자동 생성
 * @param {string[]} goals - 목표 ID 배열 (예: ['lower_back', 'shoulder'])
 * @param {Array<{regionKey, intensity, restrictions?}>} painRegions - 통증 부위
 * @param {{timePerDay: number, equipment: string[], daysPerWeek: number}} preferences
 * @returns {object} program data (weeklyPlan, goals, preferences 등)
 */
export function generateProgram(goals, painRegions = [], preferences = {}) {
    const {
        timePerDay = 15,
        equipment = ['none'],
        daysPerWeek = 3,
    } = preferences;

    // 1. 타겟 리전 수집
    const targetRegions = new Set();
    for (const g of goals) {
        const regions = GOAL_REGION_MAP[g] || [];
        regions.forEach(r => targetRegions.add(r));
    }
    // 통증 부위도 타겟에 포함
    for (const p of painRegions) {
        targetRegions.add(p.regionKey);
    }

    // 2. 운동 풀 수집 (중복 제거)
    const seen = new Set();
    let exercisePool = [];
    for (const rk of targetRegions) {
        const exercises = getRawExercises(rk);
        for (const ex of exercises) {
            const key = ex.name + '|' + (ex.videoId || '');
            if (seen.has(key)) continue;
            seen.add(key);
            exercisePool.push({ ...ex, regionKey: rk });
        }
    }

    // 3. 장비 필터
    exercisePool = exercisePool.filter(ex => {
        const exEquip = ex.equipment || ['none'];
        return exEquip.some(e => equipment.includes(e));
    });

    // 4. 통증 강도별 필터
    const painMap = new Map();
    for (const p of painRegions) {
        painMap.set(p.regionKey, p.intensity || 0);
    }

    exercisePool = exercisePool.filter(ex => {
        const pain = painMap.get(ex.regionKey) || 0;
        const purposes = ex.purpose || [];
        if (pain >= 7) {
            return purposes.some(p => ['mobility', 'breathing'].includes(p));
        }
        if (pain >= 4) {
            return !purposes.includes('strength');
        }
        return true;
    });

    // 5. 일일 템플릿에 운동 배정
    const templates = DAY_TEMPLATES[daysPerWeek] || DAY_TEMPLATES[3];
    const dayIndices = WEEKDAY_MAP[daysPerWeek] || WEEKDAY_MAP[3];
    const targetSeconds = timePerDay * 60;

    const weeklyPlan = templates.map((tmpl, i) => {
        const dayExercises = selectDayExercises(exercisePool, tmpl, targetSeconds);
        const estMinutes = Math.round(dayExercises.reduce((s, e) => s + (e.estimatedSeconds || DEFAULT_EXERCISE_SECONDS), 0) / 60);

        return {
            dayIndex: dayIndices[i],
            focus: tmpl.focus,
            label: tmpl.label,
            exercises: dayExercises.map(ex => ({
                name: ex.name,
                videoId: ex.videoId || '',
                sets: ex.difficulty === '어려움' ? 2 : 3,
                reps: ex.difficulty === '어려움' ? 8 : 10,
                restSeconds: 30,
                difficultyLevel: difficultyToNumber(ex.difficulty),
                regionKey: ex.regionKey,
                purpose: ex.purpose || [],
                pattern: ex.pattern || [],
            })),
            estimatedMinutes: estMinutes || timePerDay,
        };
    });

    // 6. 초기 난이도
    const avgPain = painRegions.length > 0
        ? painRegions.reduce((s, p) => s + (p.intensity || 0), 0) / painRegions.length
        : 0;
    let difficultyMultiplier = 1.0;
    if (avgPain >= 7) difficultyMultiplier = 0.8;
    else if (avgPain >= 4) difficultyMultiplier = 0.9;

    return {
        name: '내 프로그램',
        goals,
        painRegions,
        preferences: { timePerDay, equipment, daysPerWeek },
        weeklyPlan,
        difficultyMultiplier,
        isActive: true,
    };
}

function selectDayExercises(pool, template, targetSeconds) {
    const { purposeFilter } = template;

    // 카테고리 분류
    const warmups = [];
    const mains = [];
    const cooldowns = [];

    for (const ex of pool) {
        const cat = guessExerciseCategory(ex);
        const purposes = ex.purpose || [];
        const matchesPurpose = purposeFilter.some(pf => purposes.includes(pf));

        if (!matchesPurpose && purposes.length > 0) continue;

        if (cat === 'warmup') warmups.push(ex);
        else mains.push(ex);
    }

    // 쿨다운 = warmup 풀에서 스트레칭/마사지 우선
    for (const ex of warmups) {
        const pat = ex.pattern || [];
        if (pat.includes('stretch') || pat.includes('massage')) {
            cooldowns.push(ex);
        }
    }

    // 셔플
    shuffle(warmups);
    shuffle(mains);
    shuffle(cooldowns);

    // 시간 배분: 워밍업 20%, 본운동 60%, 쿨다운 20%
    const warmupTime = targetSeconds * 0.2;
    const mainTime = targetSeconds * 0.6;
    const cooldownTime = targetSeconds * 0.2;

    const selected = [
        ...pickByTime(warmups, warmupTime),
        ...pickByTime(mains, mainTime),
        ...pickByTime(cooldowns.length > 0 ? cooldowns : warmups, cooldownTime),
    ];

    return selected.length > 0 ? selected : pool.slice(0, 3);
}

function pickByTime(exercises, targetSeconds) {
    const result = [];
    let total = 0;
    for (const ex of exercises) {
        const dur = ex.estimatedSeconds || DEFAULT_EXERCISE_SECONDS;
        if (total + dur > targetSeconds && result.length >= 1) break;
        result.push(ex);
        total += dur;
    }
    return result;
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

// ═══ 오늘의 루틴 생성 ═══

/**
 * 프로그램에서 오늘 해당하는 루틴 반환
 * @param {object} program - 저장된 프로그램
 * @returns {object|null} { focus, label, exercises[], estimatedMinutes } 또는 null (오늘 운동 없음)
 */
export function generateDailyRoutine(program) {
    if (!program || !program.weeklyPlan || program.weeklyPlan.length === 0) return null;

    const today = new Date().getDay(); // 0=Sun, 1=Mon, ... 6=Sat
    const dayPlan = program.weeklyPlan.find(d => d.dayIndex === today);

    if (!dayPlan) return null;

    // difficultyMultiplier 적용
    const mult = program.difficultyMultiplier || 1.0;
    const adjustedExercises = dayPlan.exercises.map(ex => ({
        ...ex,
        sets: Math.max(1, Math.round((ex.sets || 3) * mult)),
        reps: Math.max(3, Math.round((ex.reps || 10) * mult)),
    }));

    return {
        focus: dayPlan.focus,
        label: dayPlan.label,
        exercises: adjustedExercises,
        estimatedMinutes: dayPlan.estimatedMinutes || 15,
    };
}

// ═══ 난이도 자동 조절 ═══

/**
 * 운동 후 피드백 기반 난이도 자동 조절
 * @param {object} program - 현재 프로그램
 * @param {{prePainScore, postPainScore, rpe}} feedback - 오늘 피드백
 * @param {Array} recentCheckins - 최근 5개 체크인 기록
 * @returns {{program, messages[]}} 수정된 프로그램 + 사용자 메시지
 */
export function adjustDifficulty(program, feedback, recentCheckins = []) {
    const messages = [];
    let mult = program.difficultyMultiplier || 1.0;

    const painDelta = (feedback.postPainScore || 0) - (feedback.prePainScore || 0);

    // 규칙 1: 통증 +2 이상 → 난이도 감소
    if (painDelta >= 2) {
        mult = Math.max(0.7, mult - 0.1);
        messages.push('통증이 증가하여 난이도를 낮추었습니다. 무리하지 마세요.');
    }

    // 규칙 2: RPE "쉬움" 연속 2회 → 난이도 증가
    const recentRPEs = recentCheckins
        .filter(c => c.rpe)
        .slice(0, 2)
        .map(c => c.rpe);
    if (feedback.rpe === 'easy' && recentRPEs.length >= 1 && recentRPEs[0] === 'easy') {
        mult = Math.min(1.3, mult + 0.05);
        messages.push('운동이 수월하시네요! 조금 더 도전해볼게요.');
    }

    // 규칙 3: 수행률 50% 미만 → 루틴 단축
    const completedCount = recentCheckins.filter(c => c.routineCompleted).length;
    const totalCount = recentCheckins.length;
    if (totalCount >= 4 && completedCount / totalCount < 0.5) {
        if (program.preferences && program.preferences.timePerDay > 10) {
            program.preferences.timePerDay = Math.max(10, program.preferences.timePerDay - 5);
            messages.push('루틴을 짧게 조정했습니다. 꾸준함이 중요해요!');
        }
    }

    program.difficultyMultiplier = mult;
    return { program, messages };
}

// ═══ 완화 루틴 생성 (Flow C) ═══

/**
 * 통증 부위에 맞는 5-8분 완화 루틴 생성
 * @param {string} regionKey - 통증 부위
 * @param {number} painLevel - 현재 통증 수준 (0-10)
 * @returns {{exercises[], estimatedMinutes, safetyNote?}}
 */
export function getReliefRoutine(regionKey, painLevel = 5) {
    const exercises = getRawExercises(regionKey);
    if (exercises.length === 0) {
        // 관련 부위 그룹에서 찾기
        const base = regionKey.replace(/_[lr]$/, '');
        const altKey = regionKey.endsWith('_l') ? base + '_r' : base + '_l';
        const altExercises = getRawExercises(altKey);
        if (altExercises.length === 0) return { exercises: [], estimatedMinutes: 0 };
        return buildReliefRoutine(altExercises, painLevel);
    }

    return buildReliefRoutine(exercises, painLevel);
}

function buildReliefRoutine(exercises, painLevel) {
    // 고통증: mobility/breathing만, 저통증: stability도 포함
    let filtered = exercises.filter(ex => {
        const purposes = ex.purpose || [];
        if (painLevel >= 7) {
            return purposes.some(p => ['mobility', 'breathing'].includes(p));
        }
        return !purposes.includes('strength');
    });

    if (filtered.length === 0) filtered = exercises;

    // 쉬운 것 우선
    filtered.sort((a, b) => difficultyToNumber(a.difficulty) - difficultyToNumber(b.difficulty));

    // 5-8분 분량 (3-5개 운동)
    const targetSeconds = (painLevel >= 7 ? 5 : 8) * 60;
    const selected = pickByTime(filtered, targetSeconds);

    const estMinutes = Math.round(selected.reduce((s, e) => s + (e.estimatedSeconds || DEFAULT_EXERCISE_SECONDS), 0) / 60);

    const result = {
        exercises: selected.map(ex => ({
            name: ex.name,
            videoId: ex.videoId || '',
            sets: painLevel >= 7 ? 1 : 2,
            reps: painLevel >= 7 ? 5 : 8,
            restSeconds: 20,
            purpose: ex.purpose || [],
            precautions: ex.precautions || '',
        })),
        estimatedMinutes: estMinutes || 5,
    };

    if (painLevel >= 8) {
        result.safetyNote = '통증이 심한 경우 전문의 상담을 권장합니다. 운동 중 통증이 악화되면 즉시 중단하세요.';
    }

    return result;
}
