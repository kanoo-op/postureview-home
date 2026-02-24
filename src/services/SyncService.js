// SyncService.js - 백그라운드 동기화 (환자 앱 ↔ 서버)

import { apiFetch, isLoggedIn } from './ApiClient.js';
import {
    getAllWorkoutSessions, getAllPainLogs,
    getActiveProgram, addProgram, updateProgram, getAllPrograms,
    setAppData, getAppData,
} from './Storage.js';

let syncInterval = null;
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5분

// ═══ Public API ═══

export function startAutoSync() {
    if (syncInterval) return;
    // 초기 동기화 (약간의 지연)
    setTimeout(() => syncAll(), 3000);
    syncInterval = setInterval(() => syncAll(), SYNC_INTERVAL_MS);
}

export function stopAutoSync() {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
    }
}

export async function syncNow() {
    return syncAll();
}

export async function getLastSyncTime() {
    return getAppData('lastSyncTime');
}

// ═══ Core Sync ═══

async function syncAll() {
    if (!isLoggedIn()) return;

    try {
        await uploadCheckins();
        await uploadWorkouts();
        await uploadPainLogs();
        await downloadPrograms();

        await setAppData('lastSyncTime', new Date().toISOString());
        window.dispatchEvent(new CustomEvent('pvh:synced'));
    } catch (e) {
        console.warn('[Sync] 동기화 실패:', e.message);
    }
}

// ═══ Upload: Checkins ═══

async function uploadCheckins() {
    const all = await getAllDailyCheckins();
    const unsynced = all.filter(c => !c._synced);
    if (unsynced.length === 0) return;

    const items = unsynced.map(c => ({
        local_id: c.id,
        date: c.date,
        timestamp: c.timestamp,
        pre_pain_score: c.prePainScore ?? null,
        post_pain_score: c.postPainScore ?? null,
        rpe: c.rpe ?? null,
        routine_completed: c.routineCompleted || false,
        exercises_completed: c.exercisesCompleted || [],
        total_duration: c.totalDuration || 0,
    }));

    const result = await apiFetch('/portal/sync/checkins', {
        method: 'POST',
        body: JSON.stringify(items),
    });

    // Mark as synced locally
    if (result.synced > 0 || result.duplicates > 0) {
        for (const c of unsynced) {
            c._synced = true;
            await updateCheckinSynced(c);
        }
    }
}

// ═══ Upload: Workouts ═══

async function uploadWorkouts() {
    const all = await getAllWorkoutSessions();
    const unsynced = all.filter(w => !w._synced);
    if (unsynced.length === 0) return;

    const items = unsynced.map(w => ({
        local_id: w.id,
        date: w.date,
        duration: w.duration || 0,
        rpe: w.rpe ?? null,
        exercises: w.exercises || [],
    }));

    const result = await apiFetch('/portal/sync/workouts', {
        method: 'POST',
        body: JSON.stringify(items),
    });

    if (result.synced > 0 || result.duplicates > 0) {
        for (const w of unsynced) {
            w._synced = true;
            await updateWorkoutSynced(w);
        }
    }
}

// ═══ Upload: Pain Logs ═══

async function uploadPainLogs() {
    const all = await getAllPainLogs();
    const unsynced = all.filter(p => !p._synced);
    if (unsynced.length === 0) return;

    const items = unsynced.map(p => ({
        local_id: p.id,
        date: p.date,
        region_key: p.regionKey,
        pain_level: p.painLevel,
        note: p.note ?? null,
    }));

    const result = await apiFetch('/portal/sync/painlogs', {
        method: 'POST',
        body: JSON.stringify(items),
    });

    if (result.synced > 0 || result.duplicates > 0) {
        for (const p of unsynced) {
            p._synced = true;
            await updatePainLogSynced(p);
        }
    }
}

// ═══ Download: Programs ═══

async function downloadPrograms() {
    try {
        const serverPrograms = await apiFetch('/portal/programs');
        if (!serverPrograms || serverPrograms.length === 0) return;

        const localPrograms = await getAllPrograms();
        const prescribedIds = new Set(localPrograms.filter(p => p._prescribed).map(p => p._serverId));

        for (const sp of serverPrograms) {
            if (prescribedIds.has(sp.id)) continue;

            // Add as new local program marked as prescribed
            await addProgram({
                name: `[처방] ${sp.name}`,
                weeklyPlan: sp.weekly_plan,
                goals: [],
                painRegions: [],
                preferences: { timePerDay: 15, equipment: ['none'], daysPerWeek: 3 },
                _prescribed: true,
                _serverId: sp.id,
                isActive: true,
            });
        }
    } catch (e) {
        console.warn('[Sync] 프로그램 다운로드 실패:', e.message);
    }
}

// ═══ Local DB helpers (mark synced) ═══

async function updateCheckinSynced(checkin) {
    // Re-use Storage's idbPut via dynamic import
    const { updateDailyCheckin } = await import('./Storage.js');
    await updateDailyCheckin(checkin);
}

async function updateWorkoutSynced(workout) {
    const db = await getIDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('workoutSessions', 'readwrite');
        tx.objectStore('workoutSessions').put(workout);
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
    });
}

async function updatePainLogSynced(painLog) {
    const db = await getIDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('painLogs', 'readwrite');
        tx.objectStore('painLogs').put(painLog);
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
    });
}

// Direct IndexedDB access for _synced flag updates
function getIDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('PostureViewHomeDB');
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

async function getAllDailyCheckins() {
    const db = await getIDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('dailyCheckins', 'readonly');
        const req = tx.objectStore('dailyCheckins').getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = (e) => reject(e.target.error);
    });
}
