// PainScreen.js - 통증/불편 관리: 3D 바디맵 + 그림판 오버레이 + 완화 루틴

import { onSelect, onDeselect } from '../core/SelectionService.js';
import { getRegionDisplayName, getExercisesForRegion, getCameraPreset } from '../anatomy/BodyData.js';
import { getMeshRegionKey } from '../anatomy/Regions.js';
import { addPainLog, getPainLogsByRegion, addReliefSession, updateReliefSession } from '../services/Storage.js';
import { getReliefRoutine } from '../services/ProgramEngine.js';
import { renderer, camera, scene } from '../core/SceneManager.js';
import { setOrbitEnabled } from '../core/Controls.js';

let initialized = false;
let currentRegionKey = null;

/** 화면 전환 시 그리기 모드 정리 */
export function cleanupPainScreen() {
    if (drawState.active) {
        drawState.active = false;
        const btn = document.getElementById('btn-draw-mode');
        const toolbar = document.getElementById('draw-toolbar');
        const viewer = document.getElementById('viewer-container');
        if (btn) {
            const label = btn.querySelector('span');
            if (label) label.textContent = '그리기';
            btn.classList.remove('active');
        }
        if (toolbar) toolbar.style.display = 'none';
        if (drawCanvas) {
            drawCanvas.style.pointerEvents = 'none';
            drawCanvas.style.cursor = '';
        }
        viewer?.classList.remove('draw-active');
        if (cursorEl) cursorEl.style.display = 'none';
        setOrbitEnabled(true);
    }
}

export function initPainScreen() {
    if (initialized) return;
    initialized = true;

    // 3D 선택 이벤트
    onSelect(({ mesh, info }) => {
        if (!mesh || !info) return;
        if (drawState.active) return; // 그림판 모드일 때는 3D 선택 무시
        const regionKey = info.regionKey || getMeshRegionKey(mesh.name);
        if (regionKey) showPainPanel(regionKey);
    });

    onDeselect(() => {
        if (drawState.active) return;
        hidePainPanel();
    });

    // 통증 슬라이더
    const slider = document.getElementById('pain-slider');
    const value = document.getElementById('pain-slider-value');
    if (slider && value) {
        slider.addEventListener('input', () => { value.textContent = slider.value; });
    }

    // 통증 유형 칩
    document.querySelectorAll('.pain-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.pain-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
        });
    });

    // 저장 / 완화 루틴 버튼
    document.getElementById('btn-save-pain')?.addEventListener('click', handleSavePain);
    document.getElementById('btn-relief-routine')?.addEventListener('click', handleReliefRoutine);

    // 그림판 초기화
    initDrawingCanvas();
}

// ═══ 통증 패널 ═══

async function showPainPanel(regionKey) {
    currentRegionKey = regionKey;
    const selection = document.getElementById('pain-selection');
    const regionName = document.getElementById('pain-region-name');
    if (selection) selection.style.display = '';
    if (regionName) regionName.textContent = getRegionDisplayName(regionKey);
    renderExercises(regionKey);
    checkSafetyWarning(regionKey);
    const relief = document.getElementById('relief-routine-container');
    if (relief) relief.style.display = 'none';

    const preset = getCameraPreset(regionKey);
    if (preset) {
        try {
            const Controls = await import('../core/Controls.js');
            Controls.animateCameraTo?.(preset.position, preset.yOffset);
        } catch (e) {}
    }
}

function hidePainPanel() {
    currentRegionKey = null;
    const selection = document.getElementById('pain-selection');
    if (selection) selection.style.display = 'none';
}

async function handleSavePain() {
    if (!currentRegionKey) return;
    const painLevel = parseInt(document.getElementById('pain-slider')?.value || '5');
    const painType = document.querySelector('.pain-chip.active')?.dataset.type || 'dull';
    const note = document.getElementById('pain-note')?.value || '';

    await addPainLog({ regionKey: currentRegionKey, painLevel, painType, note, feeling: painType });

    const slider = document.getElementById('pain-slider');
    const value = document.getElementById('pain-slider-value');
    const noteInput = document.getElementById('pain-note');
    if (slider) slider.value = 5;
    if (value) value.textContent = '5';
    if (noteInput) noteInput.value = '';
    window.showToast?.('통증 기록이 저장되었습니다.', 'success');
}

async function handleReliefRoutine() {
    if (!currentRegionKey) return;
    const painLevel = parseInt(document.getElementById('pain-slider')?.value || '5');
    const relief = getReliefRoutine(currentRegionKey, painLevel);
    const container = document.getElementById('relief-routine-container');
    if (!container) return;

    if (relief.exercises.length === 0) {
        container.innerHTML = '<p class="empty-state">이 부위에 맞는 완화 루틴을 찾지 못했습니다.</p>';
        container.style.display = '';
        return;
    }

    const session = await addReliefSession({
        regionKey: currentRegionKey, painScoreBefore: painLevel,
        exercises: relief.exercises.map(e => ({ name: e.name, duration: 90 })),
    });

    container.innerHTML = `
        <div class="relief-routine">
            <div class="relief-header"><h4>완화 루틴 (${relief.estimatedMinutes}분)</h4></div>
            ${relief.safetyNote ? `<div class="safety-warning">${esc(relief.safetyNote)}</div>` : ''}
            <div class="relief-exercises">
                ${relief.exercises.map((ex, i) => `
                    <div class="relief-exercise-card">
                        <span class="relief-ex-num">${i + 1}</span>
                        <div class="relief-ex-info">
                            <span class="relief-ex-name">${esc(ex.name)}</span>
                            <span class="relief-ex-detail">${ex.sets}세트 × ${ex.reps}회</span>
                        </div>
                        ${ex.videoId ? `<button class="relief-ex-video" data-video="${ex.videoId}">영상</button>` : ''}
                    </div>
                `).join('')}
            </div>
            <button class="btn-primary" id="btn-relief-done">완화 루틴 완료</button>
        </div>
    `;
    container.style.display = '';

    container.querySelectorAll('.relief-ex-video').forEach(btn => {
        btn.addEventListener('click', () => window.openVideoModal?.(btn.dataset.video));
    });
    document.getElementById('btn-relief-done')?.addEventListener('click', async () => {
        session.completed = true;
        await updateReliefSession(session);
        container.style.display = 'none';
        window.showToast?.('완화 루틴 완료!', 'success');
    });
}

async function checkSafetyWarning(regionKey) {
    const warning = document.getElementById('pain-safety-warning');
    if (!warning) return;
    try {
        const logs = await getPainLogsByRegion(regionKey);
        if (logs.length < 3) { warning.style.display = 'none'; return; }
        const recent = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
        const increasing = recent.every((log, i) => i === 0 || log.painLevel >= recent[i - 1].painLevel);
        if (increasing && recent[0].painLevel >= 7) {
            warning.style.display = '';
            warning.innerHTML = '⚠️ 이 부위의 통증이 지속적으로 높습니다. 전문의 상담을 권장합니다.';
        } else { warning.style.display = 'none'; }
    } catch (e) { warning.style.display = 'none'; }
}

function renderExercises(regionKey) {
    const list = document.getElementById('bodymap-exercise-list');
    if (!list) return;
    const exercises = getExercisesForRegion(regionKey);
    if (exercises.length === 0) { list.innerHTML = '<p class="empty-state">추천 운동이 없습니다.</p>'; return; }
    list.innerHTML = exercises.slice(0, 5).map(ex => `
        <div class="bodymap-ex-card">
            <div class="bodymap-ex-info">
                <span class="bodymap-ex-name">${esc(ex.name)}</span>
                <span class="bodymap-ex-diff difficulty-${diffClass(ex.difficulty)}">${esc(ex.difficulty)}</span>
            </div>
            <div class="bodymap-ex-tags">${ex.purpose.join(' · ')}</div>
            ${ex.videoId ? `<button class="bodymap-ex-video" onclick="window.openVideoModal?.('${ex.videoId}')">영상</button>` : ''}
        </div>
    `).join('');
}

function diffClass(d) {
    if (d === '쉬움') return 'easy';
    if (d === '보통') return 'medium';
    if (d === '어려움') return 'hard';
    return 'medium';
}

function esc(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ═══════════════════════════════════════════════════════
// 그림판 오버레이 (프로급: 커스텀커서 + 곡선보간 + 딤)
// ═══════════════════════════════════════════════════════

const drawState = {
    active: false,
    tool: 'pen',
    color: '#F44336',
    lineWidth: 4,
    opacity: 0.8,
    drawing: false,
    lastX: 0, lastY: 0,
    points: [],            // 펜 스무딩용 포인트 버퍼
    circleStart: null,
    history: [],
    maxHistory: 30,
};

let drawCanvas = null;
let drawCtx = null;
let cursorEl = null;       // 커스텀 커서 DIV

function initDrawingCanvas() {
    drawCanvas = document.getElementById('pain-marker-canvas');
    if (!drawCanvas) return;
    drawCtx = drawCanvas.getContext('2d');

    // 커스텀 커서 생성
    createCursorOverlay();

    // 버튼 바인딩
    document.getElementById('btn-draw-mode')?.addEventListener('click', toggleDrawMode);
    document.getElementById('btn-draw-save')?.addEventListener('click', saveDrawingImage);
    document.getElementById('btn-draw-clear')?.addEventListener('click', clearDrawing);
    document.getElementById('btn-draw-undo')?.addEventListener('click', undoDrawing);

    // 도구 선택
    document.querySelectorAll('.draw-tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            drawState.tool = btn.dataset.tool;
            document.querySelectorAll('.draw-tool-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateCursorStyle();
        });
    });

    // 색상 선택
    document.querySelectorAll('.draw-color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            drawState.color = btn.dataset.color;
            document.querySelectorAll('.draw-color-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateCursorStyle();
        });
    });

    // 굵기 선택
    document.getElementById('draw-size')?.addEventListener('input', (e) => {
        drawState.lineWidth = parseInt(e.target.value);
        updateCursorStyle();
    });

    // 포인터 이벤트
    drawCanvas.addEventListener('pointerdown', onPointerDown);
    drawCanvas.addEventListener('pointermove', onPointerMove);
    drawCanvas.addEventListener('pointerup', onPointerUp);
    drawCanvas.addEventListener('pointerleave', onPointerLeave);
    drawCanvas.addEventListener('pointerenter', () => {
        if (cursorEl && drawState.active) cursorEl.style.opacity = '1';
    });
}

// ── 커스텀 커서 ──

function createCursorOverlay() {
    cursorEl = document.createElement('div');
    cursorEl.className = 'draw-cursor';
    cursorEl.innerHTML = '<div class="draw-cursor-ring"></div><div class="draw-cursor-dot"></div>';
    const viewer = document.getElementById('viewer-container');
    if (viewer) viewer.appendChild(cursorEl);
}

function updateCursorStyle() {
    if (!cursorEl) return;
    const ring = cursorEl.querySelector('.draw-cursor-ring');
    const dot = cursorEl.querySelector('.draw-cursor-dot');
    if (!ring || !dot) return;

    // 최소 크기 보장 (브러시 크기 + 여유)
    const brushPx = drawState.tool === 'eraser'
        ? drawState.lineWidth * 3
        : drawState.lineWidth;
    const size = Math.max(brushPx + 8, 22);

    ring.style.width = size + 'px';
    ring.style.height = size + 'px';

    if (drawState.tool === 'eraser') {
        ring.style.borderColor = 'rgba(255,255,255,0.8)';
        ring.style.background = 'rgba(255,255,255,0.06)';
        dot.style.background = 'rgba(255,255,255,0.8)';
        cursorEl.classList.add('eraser-mode');
    } else {
        ring.style.borderColor = drawState.color;
        ring.style.background = 'transparent';
        dot.style.background = drawState.color;
        cursorEl.classList.remove('eraser-mode');
    }
}

function moveCursor(clientX, clientY) {
    if (!cursorEl) return;
    const viewer = document.getElementById('viewer-container');
    if (!viewer) return;
    const rect = viewer.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    cursorEl.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
}

// ── 캔버스 사이즈 동기화 ──

function syncCanvasSize() {
    if (!drawCanvas) return false;
    const threeCanvas = document.getElementById('three-canvas');
    if (!threeCanvas) return false;

    const w = threeCanvas.clientWidth;
    const h = threeCanvas.clientHeight;
    if (w === 0 || h === 0) return false;

    const dpr = window.devicePixelRatio || 1;
    const needW = Math.round(w * dpr);
    const needH = Math.round(h * dpr);

    if (drawCanvas.width !== needW || drawCanvas.height !== needH) {
        const imgData = drawCtx ? drawCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height) : null;
        drawCanvas.width = needW;
        drawCanvas.height = needH;
        drawCanvas.style.width = w + 'px';
        drawCanvas.style.height = h + 'px';
        if (imgData && drawCtx) drawCtx.putImageData(imgData, 0, 0);
    }
    return true;
}

// ── 모드 토글 ──

function toggleDrawMode() {
    drawState.active = !drawState.active;
    const btn = document.getElementById('btn-draw-mode');
    const toolbar = document.getElementById('draw-toolbar');
    const viewer = document.getElementById('viewer-container');

    if (btn) {
        const label = btn.querySelector('span');
        if (label) label.textContent = drawState.active ? '그리기 ON' : '그리기';
        btn.classList.toggle('active', drawState.active);
    }
    if (toolbar) toolbar.style.display = drawState.active ? '' : 'none';

    if (drawState.active) {
        syncCanvasSize();
        drawCanvas.style.pointerEvents = 'auto';
        drawCanvas.style.cursor = 'crosshair';      // 시스템 크로스헤어 커서
        setOrbitEnabled(false);
        viewer?.classList.add('draw-active');        // 3D 딤 효과
        if (cursorEl) {
            cursorEl.style.display = '';
            cursorEl.style.opacity = '1';
        }
        updateCursorStyle();
    } else {
        drawCanvas.style.pointerEvents = 'none';
        drawCanvas.style.cursor = '';
        setOrbitEnabled(true);
        viewer?.classList.remove('draw-active');
        if (cursorEl) cursorEl.style.display = 'none';
    }
}

// ── 좌표 변환 ──

function getCanvasPos(e) {
    const rect = drawCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    return {
        x: (e.clientX - rect.left) * dpr,
        y: (e.clientY - rect.top) * dpr,
    };
}

// ── 히스토리 ──

function saveHistory() {
    if (!drawCtx) return;
    if (drawState.history.length >= drawState.maxHistory) drawState.history.shift();
    drawState.history.push(drawCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height));
}

// ── 포인터 이벤트 ──

function onPointerDown(e) {
    if (!drawState.active) return;
    e.preventDefault();
    e.stopPropagation();
    drawState.drawing = true;
    const pos = getCanvasPos(e);
    drawState.lastX = pos.x;
    drawState.lastY = pos.y;
    drawState.points = [pos];
    saveHistory();

    if (drawState.tool === 'circle') {
        drawState.circleStart = { x: pos.x, y: pos.y };
    }

    // 펜: 시작점에 점 찍기
    if (drawState.tool === 'pen') {
        const dpr = window.devicePixelRatio || 1;
        drawCtx.globalAlpha = drawState.opacity;
        drawCtx.globalCompositeOperation = 'source-over';
        drawCtx.fillStyle = drawState.color;
        drawCtx.beginPath();
        drawCtx.arc(pos.x, pos.y, (drawState.lineWidth * dpr) / 2, 0, Math.PI * 2);
        drawCtx.fill();
    }

    // 커서 누름 효과
    if (cursorEl) cursorEl.classList.add('pressing');
}

function onPointerMove(e) {
    if (!drawState.active) return;
    e.stopPropagation();
    moveCursor(e.clientX, e.clientY);

    if (!drawState.drawing) return;
    e.preventDefault();

    const pos = getCanvasPos(e);
    const dpr = window.devicePixelRatio || 1;

    if (drawState.tool === 'pen') {
        // 부드러운 곡선: quadratic bezier 보간
        drawState.points.push(pos);
        drawCtx.globalAlpha = drawState.opacity;
        drawCtx.globalCompositeOperation = 'source-over';
        drawCtx.strokeStyle = drawState.color;
        drawCtx.lineWidth = drawState.lineWidth * dpr;
        drawCtx.lineCap = 'round';
        drawCtx.lineJoin = 'round';

        if (drawState.points.length >= 3) {
            const pts = drawState.points;
            const len = pts.length;
            // 마지막 3개 점 기준 곡선
            const p0 = pts[len - 3];
            const p1 = pts[len - 2];
            const p2 = pts[len - 1];
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;

            drawCtx.beginPath();
            drawCtx.moveTo((p0.x + p1.x) / 2, (p0.y + p1.y) / 2);
            drawCtx.quadraticCurveTo(p1.x, p1.y, midX, midY);
            drawCtx.stroke();
        } else {
            drawCtx.beginPath();
            drawCtx.moveTo(drawState.lastX, drawState.lastY);
            drawCtx.lineTo(pos.x, pos.y);
            drawCtx.stroke();
        }
    } else if (drawState.tool === 'eraser') {
        drawCtx.globalAlpha = 1;
        drawCtx.globalCompositeOperation = 'destination-out';
        drawCtx.lineWidth = drawState.lineWidth * dpr * 3;
        drawCtx.lineCap = 'round';
        drawCtx.beginPath();
        drawCtx.moveTo(drawState.lastX, drawState.lastY);
        drawCtx.lineTo(pos.x, pos.y);
        drawCtx.stroke();
        drawCtx.globalCompositeOperation = 'source-over';
    } else if (drawState.tool === 'circle' && drawState.circleStart) {
        // 점선 원 미리보기
        const last = drawState.history[drawState.history.length - 1];
        if (last) drawCtx.putImageData(last, 0, 0);

        const dx = pos.x - drawState.circleStart.x;
        const dy = pos.y - drawState.circleStart.y;
        const radius = Math.sqrt(dx * dx + dy * dy);

        // 반투명 채우기
        drawCtx.globalAlpha = drawState.opacity * 0.12;
        drawCtx.fillStyle = drawState.color;
        drawCtx.beginPath();
        drawCtx.arc(drawState.circleStart.x, drawState.circleStart.y, radius, 0, Math.PI * 2);
        drawCtx.fill();

        // 외곽선
        drawCtx.globalAlpha = drawState.opacity;
        drawCtx.strokeStyle = drawState.color;
        drawCtx.lineWidth = drawState.lineWidth * dpr;
        drawCtx.setLineDash([6 * dpr, 4 * dpr]);
        drawCtx.beginPath();
        drawCtx.arc(drawState.circleStart.x, drawState.circleStart.y, radius, 0, Math.PI * 2);
        drawCtx.stroke();
        drawCtx.setLineDash([]);
    }

    drawState.lastX = pos.x;
    drawState.lastY = pos.y;
}

function onPointerUp(e) {
    if (!drawState.active || !drawState.drawing) return;
    e.stopPropagation();

    // 원 그리기 확정: 점선→실선 전환
    if (drawState.tool === 'circle' && drawState.circleStart) {
        const pos = getCanvasPos(e);
        const dpr = window.devicePixelRatio || 1;
        const last = drawState.history[drawState.history.length - 1];
        if (last) drawCtx.putImageData(last, 0, 0);

        const dx = pos.x - drawState.circleStart.x;
        const dy = pos.y - drawState.circleStart.y;
        const radius = Math.sqrt(dx * dx + dy * dy);

        if (radius > 3) {
            // 반투명 채우기
            drawCtx.globalAlpha = drawState.opacity * 0.15;
            drawCtx.fillStyle = drawState.color;
            drawCtx.beginPath();
            drawCtx.arc(drawState.circleStart.x, drawState.circleStart.y, radius, 0, Math.PI * 2);
            drawCtx.fill();

            // 실선 외곽
            drawCtx.globalAlpha = drawState.opacity;
            drawCtx.strokeStyle = drawState.color;
            drawCtx.lineWidth = drawState.lineWidth * dpr;
            drawCtx.setLineDash([]);
            drawCtx.beginPath();
            drawCtx.arc(drawState.circleStart.x, drawState.circleStart.y, radius, 0, Math.PI * 2);
            drawCtx.stroke();
        }
    }

    drawState.drawing = false;
    drawState.circleStart = null;
    drawState.points = [];
    drawCtx.globalAlpha = 1;
    drawCtx.globalCompositeOperation = 'source-over';
    drawCtx.setLineDash([]);
    if (cursorEl) cursorEl.classList.remove('pressing');
}

function onPointerLeave(e) {
    if (cursorEl && drawState.active) cursorEl.style.opacity = '0';
    if (drawState.drawing) onPointerUp(e);
}

// ── 되돌리기 / 지우기 ──

function undoDrawing() {
    if (!drawCtx || drawState.history.length === 0) return;
    const prev = drawState.history.pop();
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    drawCtx.putImageData(prev, 0, 0);
}

function clearDrawing() {
    if (!drawCtx) return;
    saveHistory();
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    window.showToast?.('그림이 지워졌습니다.', 'info');
}

// ── 이미지 저장 ──

async function saveDrawingImage() {
    if (!renderer) return;

    try {
        renderer.render(scene, camera);
        const threeCanvas = renderer.domElement;

        const out = document.createElement('canvas');
        out.width = threeCanvas.width;
        out.height = threeCanvas.height;
        const ctx = out.getContext('2d');

        // 3D 장면
        ctx.drawImage(threeCanvas, 0, 0);

        // 그림판 오버레이
        if (drawCanvas && drawCanvas.width > 0) {
            ctx.drawImage(drawCanvas, 0, 0, drawCanvas.width, drawCanvas.height,
                          0, 0, out.width, out.height);
        }

        // 하단 워터마크 바
        const dpr = window.devicePixelRatio || 1;
        const barH = 32 * dpr;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, out.height - barH, out.width, barH);
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = `${12 * dpr}px Pretendard, sans-serif`;
        ctx.textBaseline = 'middle';
        const now = new Date();
        const dateStr = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
        ctx.textAlign = 'left';
        ctx.fillText(`PostureView  |  ${dateStr}`, 12 * dpr, out.height - barH / 2);

        out.toBlob((blob) => {
            if (!blob) { window.showToast?.('이미지 생성 실패', 'error'); return; }
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `통증기록_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            window.showToast?.('이미지가 저장되었습니다.', 'success');
        }, 'image/png');
    } catch (e) {
        console.error('이미지 저장 실패:', e);
        window.showToast?.('이미지 저장에 실패했습니다.', 'error');
    }
}
