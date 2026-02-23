// gamification.js - 스트릭/업적 로직

import { getStreak, getAllWorkoutSessions, getAllPainLogs, getAllPostureChecks, getAppData, setAppData, getAllPrograms, getDailyCheckins, getAllReliefSessions } from '../services/Storage.js';

const ACHIEVEMENTS = [
    { id: 'first_workout', name: '첫 운동', desc: '첫 번째 운동을 완료했습니다', icon: '🏃' },
    { id: 'streak_3', name: '3일 연속', desc: '3일 연속 운동을 달성했습니다', icon: '🔥' },
    { id: 'streak_7', name: '일주일 연속', desc: '7일 연속 운동을 달성했습니다', icon: '⚡' },
    { id: 'streak_30', name: '한 달 연속', desc: '30일 연속 운동을 달성했습니다', icon: '🏆' },
    { id: 'pain_log_10', name: '꾸준한 기록', desc: '통증 기록을 10회 이상 남겼습니다', icon: '📝' },
    { id: 'posture_check_5', name: '자세 관리자', desc: '자세 분석을 5회 이상 수행했습니다', icon: '📸' },
    { id: 'workout_10', name: '운동 마니아', desc: '운동을 10회 이상 완료했습니다', icon: '💪' },
    { id: 'workout_hour', name: '1시간 돌파', desc: '총 운동 시간이 1시간을 넘었습니다', icon: '⏱️' },
    { id: 'program_created', name: '첫 프로그램', desc: '첫 번째 프로그램을 만들었습니다', icon: '📋' },
    { id: 'daily_checkin_7', name: '7일 체크인', desc: '7일 연속 체크인을 완료했습니다', icon: '📅' },
    { id: 'relief_routine_5', name: '완화 마스터', desc: '완화 루틴을 5회 완료했습니다', icon: '🧘' },
    { id: 'pain_improved', name: '통증 개선', desc: '2주간 통증 점수가 3점 이상 감소했습니다', icon: '📉' },
];

export function getAchievementList() {
    return ACHIEVEMENTS;
}

export async function checkAchievements() {
    const unlocked = (await getAppData('achievements')) || [];
    const newlyUnlocked = [];

    const streak = await getStreak();
    const sessions = await getAllWorkoutSessions();
    const painLogs = await getAllPainLogs();
    const postureChecks = await getAllPostureChecks();

    const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);

    const programs = await getAllPrograms();
    const checkins = await getDailyCheckins(7);
    const reliefSessions = await getAllReliefSessions();

    // pain_improved: compare first week avg vs second week avg (need 14+ checkins)
    let painImproved = false;
    const checkins14 = await getDailyCheckins(14);
    if (checkins14.length >= 14) {
        const firstWeek = checkins14.slice(0, 7);
        const secondWeek = checkins14.slice(7, 14);
        const firstAvg = firstWeek.reduce((sum, c) => sum + (c.prePainScore || 0), 0) / firstWeek.length;
        const secondAvg = secondWeek.reduce((sum, c) => sum + (c.prePainScore || 0), 0) / secondWeek.length;
        painImproved = (firstAvg - secondAvg) >= 3;
    }

    const checks = [
        { id: 'first_workout', condition: sessions.length >= 1 },
        { id: 'streak_3', condition: streak.count >= 3 },
        { id: 'streak_7', condition: streak.count >= 7 },
        { id: 'streak_30', condition: streak.count >= 30 },
        { id: 'pain_log_10', condition: painLogs.length >= 10 },
        { id: 'posture_check_5', condition: postureChecks.length >= 5 },
        { id: 'workout_10', condition: sessions.length >= 10 },
        { id: 'workout_hour', condition: totalDuration >= 3600 },
        { id: 'program_created', condition: programs.length >= 1 },
        { id: 'daily_checkin_7', condition: checkins.length >= 7 && checkins.every(c => c.prePainScore != null) },
        { id: 'relief_routine_5', condition: reliefSessions.filter(s => s.completed).length >= 5 },
        { id: 'pain_improved', condition: painImproved },
    ];

    for (const { id, condition } of checks) {
        if (condition && !unlocked.includes(id)) {
            unlocked.push(id);
            newlyUnlocked.push(id);
        }
    }

    if (newlyUnlocked.length > 0) {
        await setAppData('achievements', unlocked);

        for (const id of newlyUnlocked) {
            const ach = ACHIEVEMENTS.find(a => a.id === id);
            if (ach) {
                window.showToast?.(`${ach.icon} 업적 달성: ${ach.name}`, 'success');
            }
        }
    }

    return { unlocked, newlyUnlocked };
}

export async function getUnlockedAchievements() {
    const unlocked = (await getAppData('achievements')) || [];
    return ACHIEVEMENTS.filter(a => unlocked.includes(a.id));
}
