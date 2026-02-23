// TodayScreen.js - 오늘 운동: 체크인 → 루틴 수행 → 피드백
// Phase 2에서 구현 예정

import { getActiveProgram, getTodayCheckin, addDailyCheckin, updateDailyCheckin, getStreak, addWorkoutSession, updateStreak, getDailyCheckins } from '../services/Storage.js';
import { generateDailyRoutine, adjustDifficulty } from '../services/ProgramEngine.js';

let initialized = false;

export async function initTodayScreen() {
    if (!initialized) {
        initialized = true;
        bindCheckinUI();
        bindFeedbackUI();
    }
    await refreshTodayScreen();
}

async function refreshTodayScreen() {
    await updateStreakBadge();
    await checkExistingCheckin();
    await loadTodayRoutine();
}

async function updateStreakBadge() {
    const badge = document.getElementById('streak-badge');
    if (!badge) return;
    try {
        const streak = await getStreak();
        badge.textContent = `${streak.count}일 연속`;
    } catch (e) {
        badge.textContent = '0일 연속';
    }
}

async function checkExistingCheckin() {
    const checkin = await getTodayCheckin();
    const card = document.getElementById('checkin-card');
    const done = document.getElementById('checkin-done');
    if (checkin && card && done) {
        card.style.display = 'none';
        done.style.display = '';
    }
}

async function loadTodayRoutine() {
    const container = document.getElementById('today-routine-container');
    const list = document.getElementById('today-routine-list');
    const actions = document.getElementById('today-routine-actions');
    const noProgram = document.getElementById('today-no-program');
    const restDay = document.getElementById('today-rest-day');
    if (!container || !list) return;

    const program = await getActiveProgram();
    if (!program) {
        if (noProgram) noProgram.style.display = '';
        if (restDay) restDay.style.display = 'none';
        return;
    }

    const routine = generateDailyRoutine(program);
    if (!routine) {
        if (noProgram) noProgram.style.display = 'none';
        if (restDay) restDay.style.display = '';
        return;
    }

    // 루틴이 있음
    if (noProgram) noProgram.style.display = 'none';
    if (restDay) restDay.style.display = 'none';
    container.style.display = 'none';
    list.style.display = '';
    if (actions) actions.style.display = '';

    list.innerHTML = `
        <div class="routine-info">
            <span class="routine-focus">${routine.label}</span>
            <span class="routine-time">${routine.estimatedMinutes}분</span>
        </div>
        ${routine.exercises.map((ex, i) => `
            <div class="routine-exercise-card" data-idx="${i}">
                <span class="routine-ex-num">${i + 1}</span>
                <div class="routine-ex-info">
                    <span class="routine-ex-name">${esc(ex.name)}</span>
                    <span class="routine-ex-detail">${ex.sets}세트 × ${ex.reps}회</span>
                </div>
                ${ex.videoId ? '<button class="routine-ex-video" data-video="' + ex.videoId + '">영상</button>' : ''}
            </div>
        `).join('')}
    `;

    // 영상 버튼
    list.querySelectorAll('.routine-ex-video').forEach(btn => {
        btn.addEventListener('click', () => {
            window.openVideoModal?.(btn.dataset.video);
        });
    });

    // 루틴 데이터 저장
    window._currentRoutine = routine;
}

function bindCheckinUI() {
    // 슬라이더
    const slider = document.getElementById('checkin-pain');
    const value = document.getElementById('checkin-pain-value');
    if (slider && value) {
        slider.addEventListener('input', () => { value.textContent = slider.value; });
    }

    // 느낌 칩
    document.querySelectorAll('.feeling-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.feeling-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
        });
    });

    // 저장
    document.getElementById('btn-checkin-save')?.addEventListener('click', async () => {
        const painScore = parseInt(document.getElementById('checkin-pain')?.value || '3');
        const feeling = document.querySelector('.feeling-chip.active')?.dataset.feeling || 'stiff';

        await addDailyCheckin({
            prePainScore: painScore,
            prePainFeeling: feeling,
        });

        const card = document.getElementById('checkin-card');
        const done = document.getElementById('checkin-done');
        if (card) card.style.display = 'none';
        if (done) done.style.display = '';
        window.showToast?.('체크인 완료!', 'success');
    });

    // 프로그램 링크
    document.getElementById('link-go-program')?.addEventListener('click', (e) => {
        e.preventDefault();
        window._navigate?.('program');
    });

    // 루틴 시작
    document.getElementById('btn-start-routine')?.addEventListener('click', () => {
        startRoutineExecution();
    });
}

function bindFeedbackUI() {
    // 슬라이더
    const slider = document.getElementById('feedback-pain');
    const value = document.getElementById('feedback-pain-value');
    if (slider && value) {
        slider.addEventListener('input', () => { value.textContent = slider.value; });
    }

    // RPE 칩
    document.querySelectorAll('.rpe-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.rpe-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
        });
    });

    // 피드백 저장
    document.getElementById('btn-feedback-save')?.addEventListener('click', async () => {
        const postPain = parseInt(document.getElementById('feedback-pain')?.value || '3');
        const rpe = document.querySelector('.rpe-chip.active')?.dataset.rpe || 'moderate';

        // 체크인 업데이트
        const checkin = await getTodayCheckin();
        if (checkin) {
            checkin.postPainScore = postPain;
            checkin.rpe = rpe;
            checkin.routineCompleted = true;
            await updateDailyCheckin(checkin);
        }

        // 워크아웃 세션 저장
        const routine = window._currentRoutine;
        if (routine) {
            await addWorkoutSession({
                duration: window._workoutDuration || 0,
                exercises: routine.exercises.map(e => ({ name: e.name, sets: e.sets, reps: e.reps })),
                rpe,
                prePainScore: checkin?.prePainScore || 0,
                postPainScore: postPain,
            });
            await updateStreak();
        }

        // 난이도 자동 조절
        const program = await getActiveProgram();
        if (program && checkin) {
            const recentCheckins = await getDailyCheckins(5);
            const { program: updated, messages } = adjustDifficulty(program, { prePainScore: checkin.prePainScore, postPainScore: postPain, rpe }, recentCheckins);
            const { updateProgram } = await import('../services/Storage.js');
            await updateProgram(updated);
            for (const msg of messages) {
                window.showToast?.(msg, 'info');
            }
        }

        document.getElementById('today-feedback-section').style.display = 'none';
        window.showToast?.('피드백 저장 완료!', 'success');
        await updateStreakBadge();
    });
}

// ═══ 루틴 실행 ═══

function startRoutineExecution() {
    const routine = window._currentRoutine;
    if (!routine || !routine.exercises.length) return;

    const container = document.getElementById('today-active-workout');
    const routineSection = document.getElementById('today-routine-section');
    const checkinSection = document.getElementById('today-checkin-section');
    if (!container) return;

    if (routineSection) routineSection.style.display = 'none';
    if (checkinSection) checkinSection.style.display = 'none';
    container.style.display = '';

    let currentIdx = 0;
    let currentSet = 1;
    let currentRep = 0;
    const startTime = Date.now();

    function renderExercise() {
        const ex = routine.exercises[currentIdx];
        const progress = Math.round(((currentIdx) / routine.exercises.length) * 100);

        container.innerHTML = `
            <div class="active-workout">
                <div class="workout-progress-bar">
                    <div class="workout-progress-fill" style="width:${progress}%"></div>
                </div>
                <div class="workout-header">
                    <span class="workout-step">${currentIdx + 1} / ${routine.exercises.length}</span>
                    <button class="btn-secondary workout-stop" id="btn-workout-stop">종료</button>
                </div>
                <h3 class="workout-exercise-name">${esc(ex.name)}</h3>
                ${ex.videoId ? `<div class="workout-video"><iframe src="https://www.youtube.com/embed/${ex.videoId}" frameborder="0" allowfullscreen></iframe></div>` : ''}
                <div class="workout-counters">
                    <div class="workout-counter">
                        <span class="counter-label">세트</span>
                        <span class="counter-value">${currentSet} / ${ex.sets}</span>
                    </div>
                    <div class="workout-counter">
                        <span class="counter-label">반복</span>
                        <span class="counter-value" id="rep-display">${currentRep}</span>
                    </div>
                </div>
                <div class="workout-actions">
                    <button class="btn-primary" id="btn-add-rep">+1 반복</button>
                    <button class="btn-secondary" id="btn-next-set">다음 세트</button>
                    <button class="btn-secondary" id="btn-next-exercise">다음 운동 →</button>
                </div>
            </div>
        `;

        document.getElementById('btn-add-rep')?.addEventListener('click', () => {
            currentRep++;
            const repEl = document.getElementById('rep-display');
            if (repEl) repEl.textContent = currentRep;
        });

        document.getElementById('btn-next-set')?.addEventListener('click', () => {
            if (currentSet < ex.sets) {
                currentSet++;
                currentRep = 0;
                renderExercise();
            }
        });

        document.getElementById('btn-next-exercise')?.addEventListener('click', () => {
            currentIdx++;
            currentSet = 1;
            currentRep = 0;
            if (currentIdx < routine.exercises.length) {
                renderExercise();
            } else {
                finishWorkout();
            }
        });

        document.getElementById('btn-workout-stop')?.addEventListener('click', () => {
            finishWorkout();
        });
    }

    function finishWorkout() {
        const duration = Math.round((Date.now() - startTime) / 1000);
        window._workoutDuration = duration;

        container.style.display = 'none';
        if (routineSection) routineSection.style.display = '';
        if (checkinSection) checkinSection.style.display = '';

        // 피드백 섹션 표시
        const feedback = document.getElementById('today-feedback-section');
        if (feedback) feedback.style.display = '';

        const mins = Math.floor(duration / 60);
        const secs = duration % 60;
        window.showToast?.(`운동 완료! (${mins}분 ${secs}초)`, 'success');
    }

    renderExercise();
}

function esc(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
