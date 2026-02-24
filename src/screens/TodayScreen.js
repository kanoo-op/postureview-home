// TodayScreen.js - 오늘 운동: 체크인 → 루틴 수행(영상+포즈) → 피드백

import { getActiveProgram, getTodayCheckin, addDailyCheckin, updateDailyCheckin, getStreak, addWorkoutSession, updateStreak, getDailyCheckins } from '../services/Storage.js';
import { generateDailyRoutine, adjustDifficulty } from '../services/ProgramEngine.js';
import { initRealtimePose, getVideoLandmarker } from '../pose/RealtimePose.js';
import { EXERCISE_PRESETS, JOINT_LABELS, getPresetKey, evaluateFormForPreset, calcOverallScore, drawSkeleton } from '../pose/ExerciseMode.js';

let initialized = false;

// Pose tracking state
let poseActive = false;
let poseStream = null;
let poseAnimFrame = null;
let poseScores = [];

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
        if (noProgram) {
            noProgram.style.display = '';
            noProgram.innerHTML = '프로그램이 없습니다. <a href="#" id="link-go-program">내 프로그램</a>에서 만들거나, <a href="#" id="link-go-settings">설정</a>에서 병원과 연결해보세요.';
            document.getElementById('link-go-program')?.addEventListener('click', (e) => { e.preventDefault(); window._navigate?.('program'); });
            document.getElementById('link-go-settings')?.addEventListener('click', (e) => { e.preventDefault(); window._navigate?.('settings'); });
        }
        if (restDay) restDay.style.display = 'none';
        return;
    }

    const routine = generateDailyRoutine(program);
    if (!routine) {
        if (noProgram) noProgram.style.display = 'none';
        if (restDay) restDay.style.display = '';
        return;
    }

    if (noProgram) noProgram.style.display = 'none';
    if (restDay) restDay.style.display = 'none';
    container.style.display = 'none';
    list.style.display = '';
    if (actions) actions.style.display = '';

    const isPrescribed = program._prescribed || program.name?.startsWith('[처방]');
    list.innerHTML = `
        <div class="routine-info">
            ${isPrescribed ? '<span class="routine-prescribed-badge">병원 처방</span>' : ''}
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
                ${ex.videoId ? `<button class="routine-ex-video" data-video="${ex.videoId}" data-name="${esc(ex.name)}">영상</button>` : ''}
            </div>
        `).join('')}
    `;

    // 영상 버튼
    list.querySelectorAll('.routine-ex-video').forEach(btn => {
        btn.addEventListener('click', () => {
            window.openExerciseVideo?.(btn.dataset.name, btn.dataset.video);
        });
    });

    window._currentRoutine = routine;
}

function bindCheckinUI() {
    const slider = document.getElementById('checkin-pain');
    const value = document.getElementById('checkin-pain-value');
    if (slider && value) {
        slider.addEventListener('input', () => { value.textContent = slider.value; });
    }

    document.querySelectorAll('.feeling-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.feeling-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
        });
    });

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

    document.getElementById('link-go-program')?.addEventListener('click', (e) => {
        e.preventDefault();
        window._navigate?.('program');
    });

    document.getElementById('btn-start-routine')?.addEventListener('click', () => {
        startRoutineExecution();
    });
}

function bindFeedbackUI() {
    const slider = document.getElementById('feedback-pain');
    const value = document.getElementById('feedback-pain-value');
    if (slider && value) {
        slider.addEventListener('input', () => { value.textContent = slider.value; });
    }

    document.querySelectorAll('.rpe-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.rpe-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
        });
    });

    document.getElementById('btn-feedback-save')?.addEventListener('click', async () => {
        const postPain = parseInt(document.getElementById('feedback-pain')?.value || '3');
        const rpe = document.querySelector('.rpe-chip.active')?.dataset.rpe || 'moderate';

        const checkin = await getTodayCheckin();
        if (checkin) {
            checkin.postPainScore = postPain;
            checkin.rpe = rpe;
            checkin.routineCompleted = true;
            await updateDailyCheckin(checkin);
        }

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

// ═══ 포즈 트래킹 ═══

function stopPoseTracking() {
    poseActive = false;
    if (poseAnimFrame) {
        cancelAnimationFrame(poseAnimFrame);
        poseAnimFrame = null;
    }
    if (poseStream) {
        poseStream.getTracks().forEach(t => t.stop());
        poseStream = null;
    }
    const videoEl = document.getElementById('workout-webcam');
    if (videoEl) videoEl.srcObject = null;
    poseScores = [];
}

async function startPoseTracking(exerciseName) {
    const presetKey = getPresetKey(exerciseName);
    const preset = EXERCISE_PRESETS[presetKey];
    if (!preset) return;

    const videoEl = document.getElementById('workout-webcam');
    const canvasEl = document.getElementById('workout-pose-canvas');
    const statusEl = document.getElementById('workout-pose-status');
    if (!videoEl || !canvasEl) return;

    const ctx = canvasEl.getContext('2d');

    try {
        const alreadyLoaded = !!getVideoLandmarker();
        if (!alreadyLoaded && statusEl) {
            statusEl.textContent = '카메라 연결 중...';
            statusEl.style.display = 'flex';
        }

        poseStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false,
        });
        videoEl.srcObject = poseStream;
        await videoEl.play();

        if (!alreadyLoaded) {
            if (statusEl) statusEl.textContent = 'AI 모델 로딩 중...';
            await initRealtimePose();
        }

        const landmarker = getVideoLandmarker();
        if (!landmarker) {
            if (statusEl) statusEl.textContent = 'AI 모델 초기화 실패';
            return;
        }

        if (statusEl) statusEl.style.display = 'none';

        // Init feedback panel
        initInlineFeedbackPanel(preset);

        poseActive = true;
        poseScores = [];
        let frameCount = 0;
        const poseStartTime = Date.now();

        function processFrame() {
            if (!poseActive) return;
            poseAnimFrame = requestAnimationFrame(processFrame);

            frameCount++;
            if (frameCount % 3 !== 0) return;
            if (videoEl.readyState < 2) return;

            if (canvasEl.width !== videoEl.videoWidth || canvasEl.height !== videoEl.videoHeight) {
                canvasEl.width = videoEl.videoWidth;
                canvasEl.height = videoEl.videoHeight;
            }

            try {
                const result = landmarker.detectForVideo(videoEl, performance.now());
                ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

                if (result?.landmarks?.[0]) {
                    const landmarks = result.landmarks[0];
                    const worldLandmarks = result.worldLandmarks?.[0];

                    const jointResults = evaluateFormForPreset(worldLandmarks || landmarks, preset);
                    drawSkeleton(ctx, landmarks, jointResults, canvasEl.width, canvasEl.height);

                    const score = calcOverallScore(jointResults);
                    poseScores.push(score);
                    if (poseScores.length > 30) poseScores.shift();
                    const avgScore = Math.round(poseScores.reduce((a, b) => a + b, 0) / poseScores.length);

                    updateInlineFeedback(jointResults, avgScore);
                }

                const elapsed = Math.floor((Date.now() - poseStartTime) / 1000);
                const timerEl = document.getElementById('workout-pose-timer');
                if (timerEl) {
                    const min = Math.floor(elapsed / 60);
                    const sec = elapsed % 60;
                    timerEl.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
                }
            } catch {
                // skip frame
            }
        }

        processFrame();
    } catch (err) {
        console.error('Pose tracking error:', err);
        if (statusEl) {
            statusEl.textContent = '카메라를 사용할 수 없습니다';
            statusEl.style.display = 'flex';
        }
    }
}

function initInlineFeedbackPanel(preset) {
    const panel = document.getElementById('workout-pose-joints');
    if (!panel) return;

    let html = '';
    for (const [jointId, range] of Object.entries(preset.joints)) {
        html += `
            <div class="wpose-joint-row" id="wpose-joint-${jointId}">
                <span class="wpose-joint-dot"></span>
                <span class="wpose-joint-label">${JOINT_LABELS[jointId] || jointId}</span>
                <span class="wpose-joint-angle" id="wpose-angle-${jointId}">-</span>
                <span class="wpose-joint-range">${range[0]}°~${range[1]}°</span>
            </div>
        `;
    }
    panel.innerHTML = html;
}

function updateInlineFeedback(jointResults, score) {
    for (const [jointId, result] of Object.entries(jointResults)) {
        const row = document.getElementById(`wpose-joint-${jointId}`);
        if (!row) continue;
        row.className = `wpose-joint-row wpose-status-${result.status}`;

        const angleEl = document.getElementById(`wpose-angle-${jointId}`);
        if (angleEl) angleEl.textContent = result.angle !== null ? `${result.angle}°` : '-';
    }

    const valueEl = document.getElementById('workout-score-value');
    const circleEl = document.getElementById('workout-score-circle');
    if (valueEl) valueEl.textContent = score;
    if (circleEl) {
        const circumference = 2 * Math.PI * 40;
        const offset = circumference - (score / 100) * circumference;
        circleEl.style.strokeDashoffset = offset;
        circleEl.style.stroke = score >= 80 ? '#2ecc71' : score >= 50 ? '#f1c40f' : '#e74c3c';
    }
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
        stopPoseTracking();

        const ex = routine.exercises[currentIdx];
        const progress = Math.round(((currentIdx) / routine.exercises.length) * 100);
        const hasVideo = !!ex.videoId;

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

                <div class="workout-tabs">
                    <button class="workout-tab active" data-wtab="video">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        영상 보기
                    </button>
                    <button class="workout-tab" data-wtab="pose">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="3"/><path d="M12 8v8m-4-4h8m-6 4l-2 4m4-4l2 4"/></svg>
                        직접 해보기
                    </button>
                </div>

                <div class="workout-tab-content" id="wtab-video">
                    ${hasVideo ? `
                        <div class="workout-video">
                            <iframe src="https://www.youtube.com/embed/${ex.videoId}?rel=0&modestbranding=1&playsinline=1"
                                frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
                        </div>
                    ` : `
                        <div class="workout-no-video">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            <p>등록된 영상이 없습니다</p>
                        </div>
                    `}
                </div>

                <div class="workout-tab-content" id="wtab-pose" style="display:none;">
                    <div class="workout-pose-area">
                        <div class="workout-pose-webcam">
                            <video id="workout-webcam" autoplay playsinline muted></video>
                            <canvas id="workout-pose-canvas"></canvas>
                            <div class="workout-pose-status" id="workout-pose-status" style="display:none;">카메라 연결 중...</div>
                        </div>
                        <div class="workout-pose-sidebar">
                            <div class="workout-pose-score-wrap">
                                <svg viewBox="0 0 100 100" class="workout-score-svg">
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border-light)" stroke-width="6"/>
                                    <circle id="workout-score-circle" cx="50" cy="50" r="40" fill="none" stroke="#2ecc71" stroke-width="6"
                                        stroke-dasharray="251.2" stroke-dashoffset="251.2" stroke-linecap="round"
                                        transform="rotate(-90 50 50)"/>
                                </svg>
                                <span class="workout-score-text" id="workout-score-value">0</span>
                                <span class="workout-score-label">폼 점수</span>
                            </div>
                            <div class="workout-pose-timer" id="workout-pose-timer">00:00</div>
                            <div class="workout-pose-joints" id="workout-pose-joints"></div>
                        </div>
                    </div>
                </div>

                <div class="workout-actions">
                    <button class="btn-primary" id="btn-add-rep">+1 반복</button>
                    <button class="btn-secondary" id="btn-next-set">다음 세트</button>
                    <button class="btn-secondary" id="btn-next-exercise">다음 운동 →</button>
                </div>
            </div>
        `;

        // Tab switching
        container.querySelectorAll('.workout-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.wtab;
                container.querySelectorAll('.workout-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                document.getElementById('wtab-video').style.display = target === 'video' ? '' : 'none';
                document.getElementById('wtab-pose').style.display = target === 'pose' ? '' : 'none';

                if (target === 'pose' && !poseActive) {
                    startPoseTracking(ex.name);
                } else if (target === 'video') {
                    stopPoseTracking();
                }
            });
        });

        // Rep tracking
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
        stopPoseTracking();

        const duration = Math.round((Date.now() - startTime) / 1000);
        window._workoutDuration = duration;

        container.style.display = 'none';
        if (routineSection) routineSection.style.display = '';
        if (checkinSection) checkinSection.style.display = '';

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
