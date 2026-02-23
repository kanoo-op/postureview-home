// Storage.js - IndexedDB persistence for PostureView Home (consumer app)
// v2: Added programs, dailyCheckins, reliefSessions stores

const DB_NAME = 'PostureViewHomeDB';
const DB_VERSION = 2;

const STORES = {
    APP_DATA: 'appData',
    PAIN_LOGS: 'painLogs',
    WORKOUT_SESSIONS: 'workoutSessions',
    WORKOUT_PLANS: 'workoutPlans',
    POSTURE_CHECKS: 'postureChecks',
    PHOTOS: 'photos',
    // v2
    PROGRAMS: 'programs',
    DAILY_CHECKINS: 'dailyCheckins',
    RELIEF_SESSIONS: 'reliefSessions',
};

let db = null;

// ===== DB Initialization =====

function openDB() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            reject(new Error('IndexedDB not supported'));
            return;
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const database = e.target.result;
            const oldVersion = e.oldVersion;

            // --- v1 stores ---
            if (oldVersion < 1) {
                database.createObjectStore(STORES.APP_DATA, { keyPath: 'key' });

                const painLogs = database.createObjectStore(STORES.PAIN_LOGS, { keyPath: 'id' });
                painLogs.createIndex('date', 'date');
                painLogs.createIndex('regionKey', 'regionKey');

                const sessions = database.createObjectStore(STORES.WORKOUT_SESSIONS, { keyPath: 'id' });
                sessions.createIndex('date', 'date');

                database.createObjectStore(STORES.WORKOUT_PLANS, { keyPath: 'id' });

                const posture = database.createObjectStore(STORES.POSTURE_CHECKS, { keyPath: 'id' });
                posture.createIndex('date', 'date');

                database.createObjectStore(STORES.PHOTOS, { keyPath: 'id' });
            }

            // --- v2 stores ---
            if (oldVersion < 2) {
                const programs = database.createObjectStore(STORES.PROGRAMS, { keyPath: 'id' });
                programs.createIndex('isActive', 'isActive');

                const checkins = database.createObjectStore(STORES.DAILY_CHECKINS, { keyPath: 'id' });
                checkins.createIndex('date', 'date');

                const relief = database.createObjectStore(STORES.RELIEF_SESSIONS, { keyPath: 'id' });
                relief.createIndex('date', 'date');
                relief.createIndex('regionKey', 'regionKey');
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

async function getDB() {
    if (!db) {
        db = await openDB();
    }
    return db;
}

// ===== Generic CRUD Helpers =====

function genId() {
    return Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

async function idbPut(storeName, data) {
    const database = await getDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).put(data);
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
    });
}

async function idbGet(storeName, key) {
    const database = await getDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = (e) => reject(e.target.error);
    });
}

async function idbGetAll(storeName) {
    const database = await getDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = (e) => reject(e.target.error);
    });
}

async function idbDelete(storeName, key) {
    const database = await getDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
    });
}

async function idbGetByIndex(storeName, indexName, value) {
    const database = await getDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction(storeName, 'readonly');
        const index = tx.objectStore(storeName).index(indexName);
        const req = index.getAll(value);
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = (e) => reject(e.target.error);
    });
}

// ===== App Data (profile, settings, gamification) =====

export async function getAppData(key) {
    const result = await idbGet(STORES.APP_DATA, key);
    return result ? result.value : null;
}

export async function setAppData(key, value) {
    await idbPut(STORES.APP_DATA, { key, value });
}

// ===== Pain Logs =====

export async function addPainLog(log) {
    const record = { id: genId(), date: new Date().toISOString(), ...log };
    await idbPut(STORES.PAIN_LOGS, record);
    return record;
}

export async function getAllPainLogs() {
    return idbGetAll(STORES.PAIN_LOGS);
}

export async function getPainLogsByRegion(regionKey) {
    return idbGetByIndex(STORES.PAIN_LOGS, 'regionKey', regionKey);
}

export async function deletePainLog(id) {
    return idbDelete(STORES.PAIN_LOGS, id);
}

// ===== Workout Sessions =====

export async function addWorkoutSession(session) {
    const record = { id: genId(), date: new Date().toISOString(), ...session };
    await idbPut(STORES.WORKOUT_SESSIONS, record);
    return record;
}

export async function getAllWorkoutSessions() {
    return idbGetAll(STORES.WORKOUT_SESSIONS);
}

export async function deleteWorkoutSession(id) {
    return idbDelete(STORES.WORKOUT_SESSIONS, id);
}

// ===== Workout Plans (v1 legacy, kept for migration) =====

export async function addWorkoutPlan(plan) {
    const record = { id: genId(), ...plan };
    await idbPut(STORES.WORKOUT_PLANS, record);
    return record;
}

export async function getAllWorkoutPlans() {
    return idbGetAll(STORES.WORKOUT_PLANS);
}

export async function updateWorkoutPlan(plan) {
    await idbPut(STORES.WORKOUT_PLANS, plan);
}

export async function deleteWorkoutPlan(id) {
    return idbDelete(STORES.WORKOUT_PLANS, id);
}

// ===== Programs (v2 — replaces workoutPlans) =====

export async function addProgram(program) {
    const record = {
        id: genId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        difficultyMultiplier: 1.0,
        currentWeek: 1,
        isActive: true,
        ...program,
    };
    await idbPut(STORES.PROGRAMS, record);
    return record;
}

export async function getActiveProgram() {
    const all = await idbGetAll(STORES.PROGRAMS);
    return all.find(p => p.isActive) || null;
}

export async function getAllPrograms() {
    return idbGetAll(STORES.PROGRAMS);
}

export async function updateProgram(program) {
    program.updatedAt = new Date().toISOString();
    await idbPut(STORES.PROGRAMS, program);
}

export async function deleteProgram(id) {
    return idbDelete(STORES.PROGRAMS, id);
}

// ===== Daily Check-ins (v2) =====

export async function addDailyCheckin(checkin) {
    const now = new Date();
    const record = {
        id: genId(),
        date: now.toISOString().split('T')[0],
        timestamp: now.toISOString(),
        routineCompleted: false,
        exercisesCompleted: [],
        totalDuration: 0,
        ...checkin,
    };
    await idbPut(STORES.DAILY_CHECKINS, record);
    return record;
}

export async function getTodayCheckin() {
    const today = new Date().toISOString().split('T')[0];
    const all = await idbGetByIndex(STORES.DAILY_CHECKINS, 'date', today);
    return all.length > 0 ? all[all.length - 1] : null;
}

export async function updateDailyCheckin(checkin) {
    await idbPut(STORES.DAILY_CHECKINS, checkin);
}

export async function getDailyCheckins(limit = 30) {
    const all = await idbGetAll(STORES.DAILY_CHECKINS);
    return all.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

// ===== Relief Sessions (v2) =====

export async function addReliefSession(session) {
    const record = {
        id: genId(),
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        completed: false,
        ...session,
    };
    await idbPut(STORES.RELIEF_SESSIONS, record);
    return record;
}

export async function getReliefSessionsByRegion(regionKey) {
    return idbGetByIndex(STORES.RELIEF_SESSIONS, 'regionKey', regionKey);
}

export async function getAllReliefSessions() {
    return idbGetAll(STORES.RELIEF_SESSIONS);
}

export async function updateReliefSession(session) {
    await idbPut(STORES.RELIEF_SESSIONS, session);
}

// ===== Posture Checks =====

export async function addPostureCheck(check) {
    const record = { id: genId(), date: new Date().toISOString(), ...check };
    await idbPut(STORES.POSTURE_CHECKS, record);
    return record;
}

export async function getAllPostureChecks() {
    return idbGetAll(STORES.POSTURE_CHECKS);
}

export async function deletePostureCheck(id) {
    return idbDelete(STORES.POSTURE_CHECKS, id);
}

// ===== Photos =====

export async function savePhoto(id, blob, mimeType = 'image/jpeg') {
    await idbPut(STORES.PHOTOS, { id, blob, mimeType });
}

export async function getPhoto(id) {
    return idbGet(STORES.PHOTOS, id);
}

export async function deletePhoto(id) {
    return idbDelete(STORES.PHOTOS, id);
}

// ===== Gamification Helpers =====

export async function getStreak() {
    const streak = await getAppData('streak');
    return streak || { count: 0, lastDate: null };
}

export async function updateStreak() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const streak = await getStreak();

    if (streak.lastDate === today) return streak;

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (streak.lastDate === yesterdayStr) {
        streak.count += 1;
    } else {
        streak.count = 1;
    }
    streak.lastDate = today;
    await setAppData('streak', streak);
    return streak;
}

// ===== Migration: v1 workoutPlans → v2 programs =====

export async function migrateV1Plans() {
    const migrated = await getAppData('v1PlansMigrated');
    if (migrated) return;

    try {
        const plans = await getAllWorkoutPlans();
        const active = plans.find(p => p.isActive);
        if (active && active.exercises && active.exercises.length > 0) {
            await addProgram({
                name: active.name || '내 프로그램',
                goals: [],
                painRegions: [],
                preferences: { timePerDay: 15, equipment: ['none'], daysPerWeek: 3 },
                weeklyPlan: [{
                    dayIndex: 0,
                    focus: 'general',
                    exercises: active.exercises.map(ex => ({
                        name: ex.name,
                        videoId: ex.videoId || '',
                        sets: ex.sets || 3,
                        reps: ex.reps || 10,
                        restSeconds: 30,
                        difficultyLevel: 3,
                    })),
                    estimatedMinutes: 15,
                }],
            });
        }
        await setAppData('v1PlansMigrated', true);
    } catch (e) {
        console.warn('v1 plan migration error:', e);
    }
}

// ===== Migration from localStorage =====

export async function migrateFromLocalStorage() {
    const raw = localStorage.getItem('pvh_painLogs');
    if (!raw) return;
    try {
        const logs = JSON.parse(raw);
        for (const log of logs) {
            await idbPut(STORES.PAIN_LOGS, log);
        }
        localStorage.removeItem('pvh_painLogs');
    } catch (e) {
        console.warn('localStorage migration error:', e);
    }
}

migrateFromLocalStorage().catch(() => {});
